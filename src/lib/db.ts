import { neon } from '@neondatabase/serverless'

// @vercel/postgres is deprecated — Vercel migrated existing Postgres
// databases to Neon and recommends their SDK directly for new setups.
// POSTGRES_URL is still the env var Vercel populates when you connect a
// Postgres store to the project, so no env var changes needed.
export const sql = neon(process.env.POSTGRES_URL!)

// ── Allowed emails ──────────────────────────────────────────────

export async function isEmailAllowed(email: string): Promise<boolean> {
  const rows = await sql`
    select 1 from allowed_emails where email = ${email.toLowerCase()} limit 1
  `
  return rows.length > 0
}

export async function listAllowedEmails() {
  const rows = await sql`
    select id, email, display_name, created_at
    from allowed_emails
    order by created_at desc
  `
  return rows
}

export async function addAllowedEmail(email: string, displayName?: string) {
  const rows = await sql`
    insert into allowed_emails (email, display_name)
    values (${email.toLowerCase()}, ${displayName ?? null})
    on conflict (email) do update set display_name = excluded.display_name
    returning id, email, display_name, created_at
  `
  return rows[0]
}

export async function removeAllowedEmail(email: string) {
  await sql`delete from allowed_emails where email = ${email.toLowerCase()}`
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
    select id, email, cliniko_patient_id, patient_label, created_at
    from patient_assignments
    order by email, created_at desc
  `
  return rows
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
    returning id, email, cliniko_patient_id, patient_label, created_at
  `
  return rows[0]
}

export async function removeAssignment(id: number) {
  await sql`delete from patient_assignments where id = ${id}`
}

// ── Audit log ────────────────────────────────────────────────────

type AuditAction =
  | 'note_create'
  | 'note_update'
  | 'attachment_upload'
  | 'attachment_view'
  | 'appointment_create'
  | 'admin_email_add'
  | 'admin_email_remove'
  | 'admin_assignment_add'
  | 'admin_assignment_remove'

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
