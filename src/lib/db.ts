import { neon } from '@neondatabase/serverless'
import { debugLog } from './debug'

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
  // password_hash itself is never selected here — only whether one is set —
  // since this feeds the admin UI (via the API route) and a hash has no
  // business leaving the server for a page that just needs to show status.
  const rows = await sql`
    select id, email, display_name, cliniko_practitioner_id, last_seen_at, created_at,
      (password_hash is not null) as has_password,
      ${PG_IDENTITY_FRAGMENT}
    from allowed_emails
    order by created_at desc
  `
  debugLog(`[db:listAllowedEmails] ${dbIdentity()} count=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  return rows.map(stripPgIdentity)
}

// ── Password auth (replaces magic-link) ─────────────────────────────
//
// Credentials sign-in checks both of these: the row must exist (the
// allow-list gate, same as before) AND password_hash must be set and
// match. A row with no password_hash yet (freshly added, not invited)
// simply can't sign in — same as the old flow where an allow-listed but
// never-invited email could request a magic link but nothing had happened
// for them yet.
//
// must_change_password forces a one-time trip to /portal/account before
// the rest of the portal is reachable — set true whenever admin
// sets/resets a password (they know the temp password, so it needs
// rotating), cleared the moment the practitioner sets their own via
// self-service change-password.

export async function getAllowedEmailAuth(
  email: string
): Promise<{
  email: string
  password_hash: string | null
  display_name: string | null
  must_change_password: boolean
} | null> {
  const rows = await sql`
    select email, password_hash, display_name, must_change_password from allowed_emails
    where email = ${email.toLowerCase()} limit 1
  `
  return (
    (rows[0] as
      | { email: string; password_hash: string | null; display_name: string | null; must_change_password: boolean }
      | undefined) ?? null
  )
}

// Dedicated light read for middleware — called on (almost) every /portal
// and /admin request, so kept to the one column actually needed rather
// than reusing getAllowedEmailAuth (which also pulls password_hash, no
// business leaving the DB layer more often than it has to).
export async function getMustChangePassword(email: string): Promise<boolean> {
  const rows = await sql`
    select must_change_password from allowed_emails where email = ${email.toLowerCase()} limit 1
  `
  return (rows[0]?.must_change_password as boolean | undefined) ?? false
}

export async function setPasswordHash(
  email: string,
  passwordHash: string,
  mustChangePassword: boolean
): Promise<void> {
  const rows = await sql`
    update allowed_emails
    set password_hash = ${passwordHash}, must_change_password = ${mustChangePassword}
    where email = ${email.toLowerCase()}
    returning id
  `
  if (rows.length === 0) {
    // Setting a password only makes sense for an already allow-listed
    // email — same "no silent no-op" stance as the other write helpers
    // in this file.
    throw new Error(`setPasswordHash: no allowed_emails row for ${email}`)
  }
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
  debugLog(`[db:addAllowedEmail] ${dbIdentity()} email=${email.toLowerCase()} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
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
  debugLog(`[db:removeAllowedEmail] ${dbIdentity()} email=${email.toLowerCase()} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
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

// Batch cliniko_practitioner_id -> display_name lookup, for labelling a
// visit with the practitioner who actually attended it (from the linked
// appointment) rather than whoever authored the note. Same fallback shape
// as getDisplayNamesForEmails — a practitioner id with no matching row
// (or no display_name set) is just absent from the map.
export async function getDisplayNamesForPractitionerIds(practitionerIds: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(practitionerIds)).filter(Boolean)
  if (unique.length === 0) return {}
  const rows = await sql`
    select cliniko_practitioner_id, display_name from allowed_emails
    where cliniko_practitioner_id = any(${unique}) and display_name is not null
  `
  const map: Record<string, string> = {}
  for (const row of rows as { cliniko_practitioner_id: string; display_name: string }[]) {
    map[row.cliniko_practitioner_id] = row.display_name
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
  debugLog(`[db:listAllAssignments] ${dbIdentity()} count=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
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
  debugLog(`[db:addAssignment] ${dbIdentity()} email=${email.toLowerCase()} patientId=${patientId} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`addAssignment: insert/upsert affected 0 rows for ${email}/${patientId} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0])
}

export async function removeAssignment(id: number) {
  const rows = await sql`delete from patient_assignments where id = ${id} returning id, ${PG_IDENTITY_FRAGMENT}`
  debugLog(`[db:removeAssignment] ${dbIdentity()} id=${id} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
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
  debugLog(`[db:removeAssignmentForEmail] db=${dbIdentity()} email=${email.toLowerCase()} patientId=${patientId} affected=${rows.length}`)
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
  | 'appointment_unarrive'
  | 'appointment_dna'
  | 'appointment_undo_dna'
  | 'travel_block_create'
  | 'travel_block_update'
  | 'travel_block_delete'
  | 'admin_email_add'
  | 'admin_email_remove'
  | 'admin_password_reset'
  | 'admin_assignment_add'
  | 'admin_assignment_remove'
  | 'admin_practitioner_link'
  | 'portal_assignment_add'
  | 'portal_assignment_remove'
  | 'portal_login'
  | 'portal_password_change'
  | 'sms_request_create'
  | 'sms_request_mark_sent'
  | 'sms_request_reply'
  | 'sms_request_close'

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

// ── Appointment series ──────────────────────────────────────────
//
// Cliniko has no series concept — a repeat booking is just N independent
// individual_appointments (see lib/cliniko.ts buildRepeatDates). This is
// the only record of which appointments were booked together, so that
// cancelling one occurrence can later offer "cancel the rest of the
// series too".

export async function createAppointmentSeries(params: {
  email: string
  patientId: string
  frequency: string
  members: { clinikoAppointmentId: string; startsAt: string }[]
}): Promise<string> {
  const { email, patientId, frequency, members } = params
  const rows = await sql`
    insert into appointment_series (email, cliniko_patient_id, frequency)
    values (${email.toLowerCase()}, ${patientId}, ${frequency})
    returning id
  `
  const seriesId = rows[0].id as string
  for (const m of members) {
    await sql`
      insert into appointment_series_members (series_id, cliniko_appointment_id, starts_at)
      values (${seriesId}, ${m.clinikoAppointmentId}, ${m.startsAt})
      on conflict (cliniko_appointment_id) do nothing
    `
  }
  return seriesId
}

// Which series (if any) a single Cliniko appointment belongs to — used
// when deciding whether "cancel the rest of the series" is even an
// option for a given appointment.
export async function getSeriesForAppointment(
  clinikoAppointmentId: string
): Promise<{ seriesId: string; frequency: string } | null> {
  const rows = await sql`
    select s.id as series_id, s.frequency
    from appointment_series_members m
    join appointment_series s on s.id = m.series_id
    where m.cliniko_appointment_id = ${clinikoAppointmentId}
    limit 1
  `
  if (rows.length === 0) return null
  return { seriesId: rows[0].series_id as string, frequency: rows[0].frequency as string }
}

// Batch version of the above, for annotating a whole appointment list
// (e.g. the patient page's upcoming-appointments view) without one query
// per row.
export async function getSeriesIdsForAppointments(
  clinikoAppointmentIds: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(clinikoAppointmentIds)).filter(Boolean)
  if (unique.length === 0) return {}
  const rows = await sql`
    select cliniko_appointment_id, series_id
    from appointment_series_members
    where cliniko_appointment_id = any(${unique})
  `
  const map: Record<string, string> = {}
  for (const row of rows as { cliniko_appointment_id: string; series_id: string }[]) {
    map[row.cliniko_appointment_id] = row.series_id
  }
  return map
}

// Every member of a series starting at or after `fromISO` — used when
// cancelling "this and all future occurrences" so past/already-happened
// visits in the same series are left untouched.
export async function listFutureSeriesMembers(
  seriesId: string,
  fromISO: string
): Promise<{ clinikoAppointmentId: string; startsAt: string }[]> {
  const rows = await sql`
    select cliniko_appointment_id, starts_at
    from appointment_series_members
    where series_id = ${seriesId} and starts_at >= ${fromISO}
    order by starts_at asc
  `
  return (rows as { cliniko_appointment_id: string; starts_at: string }[]).map((r) => ({
    clinikoAppointmentId: r.cliniko_appointment_id,
    startsAt: r.starts_at,
  }))
}

// ── Travel blocks ────────────────────────────────────────────────
//
// Local-only diary markers (see schema.sql) — never touch Cliniko. Every
// function here is scoped by email so a physio can only see/move/delete
// their own travel time, mirroring the assignment-based scoping used for
// appointments elsewhere in this file.

export interface TravelBlockRow {
  id: string
  email: string
  starts_at: string
  ends_at: string
  label: string
  linked_appointment_id: string | null
  created_at: string
  updated_at: string
}

export async function listTravelBlocksForEmailInRange(
  email: string,
  fromISO: string,
  toISO: string
): Promise<TravelBlockRow[]> {
  const rows = await sql`
    select * from travel_blocks
    where email = ${email.toLowerCase()} and starts_at < ${toISO} and ends_at > ${fromISO}
    order by starts_at asc
  `
  return rows as TravelBlockRow[]
}

export async function createTravelBlock(params: {
  email: string
  startsAt: string
  endsAt: string
  label?: string
  linkedAppointmentId?: string | null
}): Promise<TravelBlockRow> {
  const rows = await sql`
    insert into travel_blocks (email, starts_at, ends_at, label, linked_appointment_id)
    values (
      ${params.email.toLowerCase()},
      ${params.startsAt},
      ${params.endsAt},
      ${params.label?.trim() || 'Travel'},
      ${params.linkedAppointmentId ?? null}
    )
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  debugLog(`[db:createTravelBlock] ${dbIdentity()} email=${params.email.toLowerCase()} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`createTravelBlock: insert affected 0 rows for ${params.email} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0]) as TravelBlockRow
}

// Ownership is enforced with `where email = ...` on the update/delete
// itself (not a separate select-then-check) — a travel block belonging to
// someone else simply doesn't match and the update affects 0 rows, which
// the caller reports as a 404 rather than distinguishing "not found" from
// "not yours" (no reason to leak the difference).
export async function updateTravelBlock(
  id: string,
  email: string,
  params: { startsAt?: string; endsAt?: string; label?: string }
): Promise<TravelBlockRow | null> {
  const rows = await sql`
    update travel_blocks
    set
      starts_at = coalesce(${params.startsAt ?? null}, starts_at),
      ends_at = coalesce(${params.endsAt ?? null}, ends_at),
      label = coalesce(${params.label?.trim() || null}, label),
      updated_at = now()
    where id = ${id} and email = ${email.toLowerCase()}
    returning *
  `
  return (rows[0] as TravelBlockRow | undefined) ?? null
}

export async function deleteTravelBlock(id: string, email: string): Promise<boolean> {
  const rows = await sql`
    delete from travel_blocks
    where id = ${id} and email = ${email.toLowerCase()}
    returning id
  `
  return rows.length > 0
}

// ── SMS requests ─────────────────────────────────────────────────
//
// There's no real SMS provider wired up (Cliniko's API can't send SMS —
// only its own UI can). This is a manual relay instead: a practitioner
// asks for a text to go out, Micheal sees it on the admin queue and
// sends it from his own phone, then pastes the patient's reply back in
// so it shows up for the practitioner. Low-volume by design.

export type SmsRequestStatus = 'pending' | 'sent' | 'replied' | 'closed'

export interface SmsRequestRow {
  id: number
  cliniko_patient_id: string
  appointment_id: string | null
  requested_by_email: string
  patient_name: string | null
  patient_phone: string | null
  message: string
  status: SmsRequestStatus
  reply_body: string | null
  created_at: string
  sent_at: string | null
  replied_at: string | null
  closed_at: string | null
}

export async function createSmsRequest(params: {
  clinikoPatientId: string
  appointmentId?: string | null
  requestedByEmail: string
  patientName?: string | null
  patientPhone?: string | null
  message: string
}): Promise<SmsRequestRow> {
  const rows = await sql`
    insert into sms_requests
      (cliniko_patient_id, appointment_id, requested_by_email, patient_name, patient_phone, message)
    values (
      ${params.clinikoPatientId},
      ${params.appointmentId ?? null},
      ${params.requestedByEmail.toLowerCase()},
      ${params.patientName ?? null},
      ${params.patientPhone ?? null},
      ${params.message}
    )
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  debugLog(`[db:createSmsRequest] ${dbIdentity()} patientId=${params.clinikoPatientId} affected=${rows.length} id=${rows[0]?.id} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) {
    throw new Error(`createSmsRequest: insert affected 0 rows for patient ${params.clinikoPatientId} (db=${dbIdentity()})`)
  }
  return stripPgIdentity(rows[0]) as SmsRequestRow
}

// Practitioner-facing: their own requests for one patient, newest first.
export async function listSmsRequestsForPatient(patientId: string): Promise<SmsRequestRow[]> {
  const rows = await sql`
    select * from sms_requests
    where cliniko_patient_id = ${patientId}
    order by created_at desc
  `
  return rows as SmsRequestRow[]
}

// Admin queue: anything not yet closed, oldest first so the longest-
// waiting request is handled first.
export async function listOpenSmsRequests(): Promise<SmsRequestRow[]> {
  const rows = await sql`
    select *, ${PG_IDENTITY_FRAGMENT} from sms_requests
    where status != 'closed'
    order by created_at asc
  `
  return rows.map(stripPgIdentity) as SmsRequestRow[]
}

// A short tail of recently closed requests, for context on the admin
// page without it growing forever.
export async function listRecentlyClosedSmsRequests(limit = 15): Promise<SmsRequestRow[]> {
  const rows = await sql`
    select * from sms_requests
    where status = 'closed'
    order by closed_at desc
    limit ${limit}
  `
  return rows as SmsRequestRow[]
}

export async function markSmsRequestSent(id: number): Promise<SmsRequestRow> {
  const rows = await sql`
    update sms_requests
    set status = 'sent', sent_at = now()
    where id = ${id}
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  debugLog(`[db:markSmsRequestSent] ${dbIdentity()} id=${id} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) throw new Error(`markSmsRequestSent: update affected 0 rows for id=${id} (db=${dbIdentity()})`)
  return stripPgIdentity(rows[0]) as SmsRequestRow
}

export async function addSmsReply(id: number, replyBody: string): Promise<SmsRequestRow> {
  const rows = await sql`
    update sms_requests
    set status = 'replied', reply_body = ${replyBody}, replied_at = now()
    where id = ${id}
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  debugLog(`[db:addSmsReply] ${dbIdentity()} id=${id} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) throw new Error(`addSmsReply: update affected 0 rows for id=${id} (db=${dbIdentity()})`)
  return stripPgIdentity(rows[0]) as SmsRequestRow
}

export async function closeSmsRequest(id: number): Promise<SmsRequestRow> {
  const rows = await sql`
    update sms_requests
    set status = 'closed', closed_at = now()
    where id = ${id}
    returning *, ${PG_IDENTITY_FRAGMENT}
  `
  debugLog(`[db:closeSmsRequest] ${dbIdentity()} id=${id} affected=${rows.length} pg=[${formatPgIdentity(rows[0])}]`)
  if (rows.length === 0) throw new Error(`closeSmsRequest: update affected 0 rows for id=${id} (db=${dbIdentity()})`)
  return stripPgIdentity(rows[0]) as SmsRequestRow
}

// ── Dashboard posts ─────────────────────────────────────────────
//
// Staff-facing notices shown at /portal/dashboard (table: announcements,
// see migrations/004_add_dashboard_posts.sql). Local-only — never touches
// Cliniko, so loading the dashboard, the nav badge and the calendar banner
// add zero Cliniko API calls.
//
// "Live" = not archived, publish_at has passed, and not past expires_at.
// "Unread" for a person = live and published after their
// allowed_emails.dashboard_last_seen_at (NULL = never opened, all unread).

export interface DashboardPostRow {
  id: string
  title: string
  body: string
  author_email: string
  author_name: string | null
  pinned: boolean
  publish_at: string
  expires_at: string | null
  archived: boolean
  created_at: string
  updated_at: string
  is_unread: boolean
}

// Staff view: live posts only, pinned first then newest first.
export async function listLiveDashboardPosts(email: string): Promise<DashboardPostRow[]> {
  const rows = await sql`
    select p.id::text as id, p.title, p.body, p.author_email, a.display_name as author_name,
      p.pinned, p.publish_at, p.expires_at, p.archived, p.created_at, p.updated_at,
      (p.publish_at > coalesce(me.dashboard_last_seen_at, 'epoch'::timestamptz)) as is_unread
    from announcements p
    left join allowed_emails a on a.email = p.author_email
    left join allowed_emails me on me.email = ${email.toLowerCase()}
    where p.archived = false
      and p.publish_at <= now()
      and (p.expires_at is null or p.expires_at > now())
    order by p.pinned desc, p.publish_at desc
    limit 100
  `
  return rows as DashboardPostRow[]
}

// Admin view: everything not archived, including scheduled and expired
// posts (the UI labels them), so they can be edited or archived.
export async function listManageableDashboardPosts(email: string): Promise<DashboardPostRow[]> {
  const rows = await sql`
    select p.id::text as id, p.title, p.body, p.author_email, a.display_name as author_name,
      p.pinned, p.publish_at, p.expires_at, p.archived, p.created_at, p.updated_at,
      (p.publish_at > coalesce(me.dashboard_last_seen_at, 'epoch'::timestamptz)
        and p.publish_at <= now()
        and (p.expires_at is null or p.expires_at > now())) as is_unread
    from announcements p
    left join allowed_emails a on a.email = p.author_email
    left join allowed_emails me on me.email = ${email.toLowerCase()}
    where p.archived = false
    order by p.pinned desc, p.publish_at desc
    limit 200
  `
  return rows as DashboardPostRow[]
}

// Nav badge. Light single-row query.
export async function countUnreadDashboardPosts(email: string): Promise<number> {
  const rows = await sql`
    select count(*)::int as n
    from announcements p
    left join allowed_emails me on me.email = ${email.toLowerCase()}
    where p.archived = false
      and p.publish_at <= now()
      and (p.expires_at is null or p.expires_at > now())
      and p.publish_at > coalesce(me.dashboard_last_seen_at, 'epoch'::timestamptz)
  `
  return (rows[0]?.n as number | undefined) ?? 0
}

// Banner above the calendar: unread posts that are pinned.
export async function listUnreadPinnedDashboardPosts(
  email: string
): Promise<Pick<DashboardPostRow, 'id' | 'title'>[]> {
  const rows = await sql`
    select p.id::text as id, p.title
    from announcements p
    left join allowed_emails me on me.email = ${email.toLowerCase()}
    where p.archived = false
      and p.pinned = true
      and p.publish_at <= now()
      and (p.expires_at is null or p.expires_at > now())
      and p.publish_at > coalesce(me.dashboard_last_seen_at, 'epoch'::timestamptz)
    order by p.publish_at desc
    limit 3
  `
  return rows as Pick<DashboardPostRow, 'id' | 'title'>[]
}

export async function markDashboardSeen(email: string): Promise<void> {
  await sql`
    update allowed_emails set dashboard_last_seen_at = now() where email = ${email.toLowerCase()}
  `
}

export async function createDashboardPost(params: {
  authorEmail: string
  title: string
  body: string
  pinned: boolean
  publishAt: string | null
  expiresAt: string | null
}): Promise<{ id: string }> {
  const rows = await sql`
    insert into announcements (title, body, author_email, pinned, publish_at, expires_at)
    values (
      ${params.title},
      ${params.body},
      ${params.authorEmail.toLowerCase()},
      ${params.pinned},
      coalesce(${params.publishAt}::timestamptz, now()),
      ${params.expiresAt}::timestamptz
    )
    returning id::text as id
  `
  if (rows.length === 0) throw new Error('createDashboardPost: insert affected 0 rows')
  return { id: rows[0].id as string }
}

// Only the fields present in `params` change. expiresAt: null clears the
// expiry (undefined leaves it alone).
export async function updateDashboardPost(
  id: string,
  params: {
    title?: string
    body?: string
    pinned?: boolean
    publishAt?: string | null
    expiresAt?: string | null
    archived?: boolean
  }
): Promise<boolean> {
  const hasExpiry = params.expiresAt !== undefined
  const rows = await sql`
    update announcements
    set
      title = coalesce(${params.title ?? null}, title),
      body = coalesce(${params.body ?? null}, body),
      pinned = coalesce(${params.pinned ?? null}, pinned),
      publish_at = coalesce(${params.publishAt ?? null}::timestamptz, publish_at),
      expires_at = case when ${hasExpiry} then ${params.expiresAt ?? null}::timestamptz else expires_at end,
      archived = coalesce(${params.archived ?? null}, archived),
      updated_at = now()
    where id = ${id}::bigint
    returning id
  `
  return rows.length > 0
}
