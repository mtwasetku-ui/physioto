import { neon } from '@neondatabase/serverless'

// ── DB connection: A/B toggle for the pooled-vs-direct diagnostic ──────
//
// Set DB_CONNECTION_MODE=direct in Vercel env vars to use
// POSTGRES_URL_NON_POOLING; anything else (including unset) uses the
// normal pooled POSTGRES_URL. This lets us flip between them for testing
// without a code change/redeploy each time.
//
// Why this is being tested at all: Vercel runtime logs showed a write
// confirmed committing via POSTGRES_URL (pooled) — affected=1, returning
// the new row's id — while listAllowedEmails() on that same pooled
// connection kept returning the pre-write row count for 20+ minutes
// afterward, across multiple separate requests, same deployment, same
// code. That's the anomaly under test here.
const CONNECTION_MODE = process.env.DB_CONNECTION_MODE === 'direct' ? 'direct' : 'pooled'
const rawConnectionString =
  CONNECTION_MODE === 'direct' ? process.env.POSTGRES_URL_NON_POOLING : process.env.POSTGRES_URL

if (!rawConnectionString) {
  // Fail loudly at startup rather than having a missing/misnamed env var
  // masquerade as a database consistency bug later.
  throw new Error(`Missing database connection string for DB_CONNECTION_MODE=${CONNECTION_MODE}`)
}

// Re-bound with an explicit type: TS narrowing from the guard above doesn't
// carry into dbIdentity() below since it's a separate function closing over
// this — this makes the "definitely a string" fact visible there too.
const connectionString: string = rawConnectionString

export const sql = neon(connectionString)

// Which connection string this instance is configured to use, without
// leaking credentials — just enough to confirm pooled vs direct and which
// Neon branch/database, from the URL alone.
function dbIdentity() {
  try {
    const url = new URL(connectionString)
    return `mode=${CONNECTION_MODE} ${url.hostname}${url.pathname}`
  } catch {
    return `mode=${CONNECTION_MODE} unknown`
  }
}

// Diagnostic columns appended to the SAME statement as the real
// INSERT/DELETE/SELECT (via extra RETURNING/select-list expressions), not
// a separate round-trip — a second query could land on a different pooled
// backend and tell us nothing about which backend actually ran the write.
// backend_pid + server_addr show whether pooled vs direct land on the same
// Postgres process; pg_is_in_recovery catches "silently landed on a
// replica" immediately.
const PG_IDENTITY_FRAGMENT = sql.unsafe(`
  pg_backend_pid() as _pg_pid,
  pg_is_in_recovery() as _pg_in_recovery,
  current_database() as _pg_db,
  current_user as _pg_usr,
  inet_server_addr()::text as _pg_addr,
  inet_server_port() as _pg_port
`)

function formatPgIdentity(row: any): string {
  if (!row) return 'no row returned'
  return `pid=${row._pg_pid} in_recovery=${row._pg_in_recovery} db=${row._pg_db} user=${row._pg_usr} addr=${row._pg_addr} port=${row._pg_port}`
}

// Strips the _pg_* diagnostic columns before rows go anywhere near an API
// response — they're for Vercel log lines only, never the client.
function stripPgIdentity<T extends Record<string, any>>(row: T): Omit<T, `_pg_${string}`> {
  const clean = { ...row }
  for (const key of Object.keys(clean)) {
    if (key.startsWith('_pg_')) delete (clean as any)[key]
  }
  return clean
}

// ── Allowed emails ──────────────────────────────────────────────

export async function isEmailAllowed(email: string): Promise<boolean> {
  const rows = await sql`
    select 1 from allowed_emails where email = ${email.toLowerCase()} limit 1
  `
  return rows.length > 0
}

export async function listAllowedEmails() {
  const rows = await sql`
    select id, email, display_name, cliniko_practitioner_id, last_seen_at, created_at, ${PG_IDENTITY_FRAGMENT}
    from allowed_emails
    order by created_at desc
  `
  console.log(`[db:listAllowedEmails] ${dbIdentity()} count=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  return rows.map(stripPgIdentity)
}

// Called from middleware on every /portal/* request. Cheap single-column
// update, fire-and-forget from the caller's perspective — worth knowing
// "last active" per practitioner without logging every single page view
// to audit_log (that table is for accountable actions, not traffic).
export async function touchLastSeen(email: string) {
  await sql`
    update allowed_emails set last_seen_at = now() where email = ${email.toLowerCase()}
  `
}

export async function addAllowedEmail(email: string, displayName?: string) {
  const rows = await sql`
    insert into allowed_emails (email, display_name)
    values (${email.toLowerCase()}, ${displayName ?? null})
    on conflict (email) do update set display_name = excluded.display_name
    returning id, email, display_name, cliniko_practitioner_id, created_at, ${PG_IDENTITY_FRAGMENT}
  `
  console.log(`[db:addAllowedEmail] ${dbIdentity()} email=${email.toLowerCase()} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    // insert...on conflict do update should always return exactly one row;
    // zero means the write did not actually happen even though no error
    // was thrown. Surface this as a real failure instead of a false 200.
    throw new Error(`addAllowedEmail: insert/upsert affected 0 rows for ${email} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0])
}

export async function removeAllowedEmail(email: string) {
  const rows = await sql`
    delete from allowed_emails where email = ${email.toLowerCase()}
    returning id, ${PG_IDENTITY_FRAGMENT}
  `
  console.log(`[db:removeAllowedEmail] ${dbIdentity()} email=${email.toLowerCase()} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    // Nothing matched — either it was already gone, or this is the same
    // silent-failure pattern as above. Either way the caller should know,
    // rather than getting a blanket 200 as if the row was removed.
    throw new Error(`removeAllowedEmail: delete affected 0 rows for ${email} (db=${dbIdentity()})`)
  }
}


// Each physio's own Cliniko practitioner record, so bookings made from
// the portal go under the physio who actually did the visit rather than
// always under Micheal's. Resolved server-side from the logged-in
// session's email — never accepted from the client — so nobody can book
// under someone else's practitioner identity. null/not-yet-linked means
// that physio's account hasn't been matched to a Cliniko practitioner
// yet (admin does this once from the Staff page, using the real
// Cliniko practitioner list at /api/admin/cliniko-practitioners).
export async function getClinikoPractitionerIdForEmail(email: string): Promise<string | null> {
  const rows = await sql`
    select cliniko_practitioner_id from allowed_emails where email = ${email.toLowerCase()} limit 1
  `
  return (rows[0]?.cliniko_practitioner_id as string | null | undefined) ?? null
}

export async function setClinikoPractitionerId(email: string, practitionerId: string | null) {
  const rows = await sql`
    update allowed_emails
    set cliniko_practitioner_id = ${practitionerId}
    where email = ${email.toLowerCase()}
    returning id, email, display_name, cliniko_practitioner_id, created_at
  `
  return rows[0] ?? null
}

// Batch email -> display_name lookup, e.g. for labelling a treatment
// note's stored authorEmail (see note.title in lib/cliniko.ts) with a
// human name in the UI instead of the raw address. Emails with no
// display_name set (or no allowed_emails row at all, e.g. a legacy
// note authored before that physio was added) are simply absent from
// the returned map — callers fall back to the email itself.
export async function getDisplayNamesForEmails(emails: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(emails.map((e) => e.toLowerCase()))).filter(Boolean)
  if (unique.length === 0) return {}
  const rows = await sql`
    select email, display_name from allowed_emails
    where email = any(${unique}) and display_name is not null
  `
  const map: Record<string, string> = {}
  for (const row of rows as { email: string; display_name: string }[]) {
    map[row.email] = row.display_name
  }
  return map
}

// ── Patient assignments ─────────────────────────────────────────

export async function listAssignmentsForEmail(email: string) {
  const rows = await sql`
    select id, email, cliniko_patient_id, patient_label, created_at
    from patient_assignments
    where email = ${email.toLowerCase()}
    order by created_at desc
  `
  return rows
}

export async function listAllAssignments() {
  const rows = await sql`
    select id, email, cliniko_patient_id, patient_label, created_at, ${PG_IDENTITY_FRAGMENT}
    from patient_assignments
    order by email, created_at desc
  `
  console.log(`[db:listAllAssignments] ${dbIdentity()} count=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  return rows.map(stripPgIdentity)
}

export async function isPatientAssignedToEmail(email: string, patientId: string): Promise<boolean> {
  const rows = await sql`
    select 1 from patient_assignments
    where email = ${email.toLowerCase()} and cliniko_patient_id = ${patientId}
    limit 1
  `
  return rows.length > 0
}

export async function addAssignment(email: string, patientId: string, patientLabel?: string) {
  const rows = await sql`
    insert into patient_assignments (email, cliniko_patient_id, patient_label)
    values (${email.toLowerCase()}, ${patientId}, ${patientLabel ?? null})
    on conflict (email, cliniko_patient_id) do update set patient_label = excluded.patient_label
    returning id, email, cliniko_patient_id, patient_label, created_at, ${PG_IDENTITY_FRAGMENT}
  `
  console.log(`[db:addAssignment] ${dbIdentity()} email=${email.toLowerCase()} patientId=${patientId} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`addAssignment: insert/upsert affected 0 rows for ${email}/${patientId} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0])
}

export async function removeAssignment(id: number) {
  const rows = await sql`delete from patient_assignments where id = ${id} returning id, ${PG_IDENTITY_FRAGMENT}`
  console.log(`[db:removeAssignment] ${dbIdentity()} id=${id} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`removeAssignment: delete affected 0 rows for id=${id} (db=${dbIdentity()})`)
  }
}

// Self-service removal from the portal itself — a physio removing a
// patient from their own "My patients" list. Scoped to (email, patientId)
// rather than an assignment id, since the practitioner never sees/knows
// the numeric assignment id — only the admin UI does.
export async function removeAssignmentForEmail(email: string, patientId: string) {
  const rows = await sql`
    delete from patient_assignments
    where email = ${email.toLowerCase()} and cliniko_patient_id = ${patientId}
    returning id
  `
  console.log(`[db:removeAssignmentForEmail] db=${dbIdentity()} email=${email.toLowerCase()} patientId=${patientId} affected=${rows.length}`)
  if (rows.length === 0) {
    throw new Error(`removeAssignmentForEmail: delete affected 0 rows for ${email}/${patientId} (db=${dbIdentity()})`)
  }
}

// ── Audit log ────────────────────────────────────────────────────

type AuditAction =
  | 'note_create'
  | 'note_update'
  | 'attachment_upload'
  | 'attachment_view'
  | 'appointment_create'
  | 'appointment_update'
  | 'appointment_cancel'
  | 'appointment_arrive'
  | 'admin_email_add'
  | 'admin_email_remove'
  | 'admin_assignment_add'
  | 'admin_assignment_remove'
  | 'admin_practitioner_link'
  | 'portal_assignment_add'
  | 'portal_assignment_remove'
  | 'portal_login'

export async function writeAuditLog(params: {
  actorEmail: string
  action: AuditAction
  clinikoPatientId?: string
  detail?: Record<string, unknown>
}) {
  const { actorEmail, action, clinikoPatientId, detail } = params
  await sql`
    insert into audit_log (actor_email, action, cliniko_patient_id, detail)
    values (${actorEmail.toLowerCase()}, ${action}, ${clinikoPatientId ?? null}, ${detail ? JSON.stringify(detail) : null})
  `
}

export async function listAuditLogForPatient(patientId: string, limit = 100) {
  const rows = await sql`
    select id, actor_email, action, cliniko_patient_id, detail, created_at
    from audit_log
    where cliniko_patient_id = ${patientId}
    order by created_at desc
    limit ${limit}
  `
  return rows
}
