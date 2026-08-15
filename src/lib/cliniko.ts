// All Cliniko API interaction lives here. Every call uses Micheal's own
// admin API key — that's how note authorship attributes to his practitioner
// account automatically (Cliniko infers the practitioner from the key,
// there is no practitioner_id param). The treating physio's email is
// carried separately in note.title, never in the clinical content.
//
// Cliniko docs: https://developer.cliniko.com/docs
// NOTE: shapes below are taken from the published API docs and have not
// yet been round-tripped against a live sandbox — see README "open next
// steps". The riskiest surface is the answer format for radio/checkbox
// questions inside content.sections[].questions[], and the exact field
// names in the S3 presigned-POST response.

const API_BASE = process.env.CLINIKO_API_BASE // e.g. https://api.au4.cliniko.com/v1
const API_KEY = process.env.CLINIKO_API_KEY
const USER_AGENT = process.env.CLINIKO_USER_AGENT || 'Physio to Home Staff Portal (info@physiotohome.com)'

// This Cliniko account has more than one business (Physio to Home,
// Summerdale Medical Centre, AlphaCare) sharing the one API key.
// Booking from the portal is hardcoded to the single Physio to Home
// business via env var — practitioner is per-logged-in-physio instead
// (see listAppointmentTypesForPractice / createIndividualAppointment
// below), resolved server-side from each physio's linked Cliniko
// practitioner ID so nobody can book under someone else's name or in
// one of the other businesses on the account.
const BUSINESS_ID = process.env.CLINIKO_BUSINESS_ID // Physio to Home's business id

function authHeader() {
  if (!API_KEY) throw new Error('CLINIKO_API_KEY is not set')
  return 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64')
}

async function clinikoFetch(path: string, init: RequestInit = {}) {
  if (!API_BASE) throw new Error('CLINIKO_API_BASE is not set')
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cliniko ${init.method || 'GET'} ${path} failed: ${res.status} ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Treatment note templates ────────────────────────────────────

// Cliniko question types (real field is "type", not "question_type" —
// see https://github.com/redguava/cliniko-api/blob/main/sections/treatment_note_templates.md).
export type ClinikoQuestionType = 'text' | 'paragraph' | 'radiobuttons' | 'checkboxes' | 'date'

// IMPORTANT: Cliniko does NOT give questions a numeric id. A question is
// only ever identified by its (section name, question name) pair. Any
// code that keys off `question.id` is keying off `undefined` for every
// question, which collapses them all onto one slot.
export interface ClinikoTemplateQuestion {
  name: string
  type: ClinikoQuestionType | string
  // Default/available choices for radiobuttons & checkboxes. Text/paragraph
  // questions never have this.
  answers?: { value: string; selected?: boolean }[]
  required?: boolean
}

export interface ClinikoTemplateSection {
  name: string
  questions: ClinikoTemplateQuestion[]
}

export interface ClinikoTemplate {
  id: number
  name: string
  content: { sections: ClinikoTemplateSection[] }
}

const SUPPORTED_QUESTION_TYPES: string[] = ['text', 'paragraph', 'radiobuttons', 'checkboxes', 'date']

// Body chart questions can't be answered through this form (they need a
// drawing/markup surface Cliniko itself provides) — they're dropped
// entirely rather than flagged as "unsupported", since there's nothing
// to add for them in Cliniko afterwards other than opening the note
// there directly if a body chart is actually needed.
const DROPPED_QUESTION_TYPES: string[] = ['bodycharts']

export function visibleQuestions(section: ClinikoTemplateSection): ClinikoTemplateQuestion[] {
  return section.questions.filter((q) => !DROPPED_QUESTION_TYPES.includes(q.type))
}

export function unsupportedQuestionTypes(template: ClinikoTemplate): string[] {
  const found = new Set<string>()
  for (const section of template.content?.sections ?? []) {
    for (const q of visibleQuestions(section)) {
      if (!SUPPORTED_QUESTION_TYPES.includes(q.type)) found.add(q.type)
    }
  }
  return Array.from(found)
}

// Fetched live every time the note form loads — never cached — so editing
// a template in Cliniko (renaming a section, adding a question) shows up
// in the portal immediately with no redeploy.
export async function listTreatmentNoteTemplates(): Promise<ClinikoTemplate[]> {
  const data = await clinikoFetch('/treatment_note_templates?per_page=100')
  return data.treatment_note_templates ?? []
}

export async function getTemplateByExactName(name: string): Promise<ClinikoTemplate> {
  const templates = await listTreatmentNoteTemplates()
  const match = templates.find((t) => t.name === name)
  if (!match) {
    throw new Error(
      `No treatment note template named exactly "${name}" was found in Cliniko. Check the template name matches exactly (including capitalisation).`
    )
  }
  return match
}

// ── Treatment notes ─────────────────────────────────────────────

export interface NoteAnswer {
  // Questions have no id in Cliniko — name is the only identifier, and
  // only unique within its section, so both are needed to find the
  // matching question back in the template.
  questionName: string
  // text/paragraph/date -> string; radiobuttons -> single selected string; checkboxes -> string[]
  value: string | string[]
}

export interface NoteSectionInput {
  name: string
  answers: NoteAnswer[]
}

// Builds the content.sections[].questions[] payload Cliniko expects,
// keyed against the live template so we never send a shape the template
// doesn't define. Cliniko's own rules (see treatment_notes.md):
//  - text/paragraph/date: "answer" is a plain string; if there's no
//    answer, the property must be OMITTED (not sent as "").
//  - radiobuttons/checkboxes: "answers" is an array of {value, selected};
//    if nothing is selected, the property must be OMITTED (an empty
//    array is explicitly rejected as invalid).
function buildNoteContent(template: ClinikoTemplate, sections: NoteSectionInput[]) {
  const builtSections = template.content.sections
    .map((templateSection) => {
      const input = sections.find((s) => s.name === templateSection.name)
      const questions = visibleQuestions(templateSection)
      if (questions.length === 0) return null // e.g. a section that was only a body chart

      return {
        name: templateSection.name,
        questions: questions.map((q) => {
          const answer = input?.answers.find((a) => a.questionName === q.name)
          const base = { name: q.name, type: q.type }

          if (q.type === 'radiobuttons' || q.type === 'checkboxes') {
            const selected = new Set(
              Array.isArray(answer?.value) ? answer!.value : answer?.value ? [answer.value as string] : []
            )
            if (selected.size === 0) return base
            return {
              ...base,
              answers: (q.answers ?? Array.from(selected).map((value) => ({ value }))).map((opt) => ({
                value: opt.value,
                selected: selected.has(opt.value),
              })),
            }
          }

          // text / paragraph / date
          const value = typeof answer?.value === 'string' ? answer.value : ''
          if (!value) return base
          return { ...base, answer: value }
        }),
      }
    })
    .filter((s): s is { name: string; questions: any[] } => s !== null)

  return { sections: builtSections }
}

export async function createTreatmentNote(params: {
  patientId: string
  template: ClinikoTemplate
  sections: NoteSectionInput[]
  draft: boolean
  authorEmail: string
  bookingId?: string
}) {
  const { patientId, template, sections, draft, authorEmail, bookingId } = params
  return clinikoFetch('/treatment_notes', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      treatment_note_template_id: template.id,
      title: authorEmail, // treating physio identity, kept out of clinical content
      draft,
      ...(bookingId ? { booking_id: bookingId } : {}),
      content: buildNoteContent(template, sections),
    }),
  })
}

// Only ever called on a note that is still draft:true. Cliniko itself
// rejects edits to a finalised (draft:false) note — the portal doesn't
// add its own lock, it just relies on that rejection.
export async function updateTreatmentNote(params: {
  noteId: string
  template: ClinikoTemplate
  sections: NoteSectionInput[]
  draft: boolean
  bookingId?: string
}) {
  const { noteId, template, sections, draft, bookingId } = params
  return clinikoFetch(`/treatment_notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      draft,
      ...(bookingId ? { booking_id: bookingId } : {}),
      content: buildNoteContent(template, sections),
    }),
  })
}

export async function listTreatmentNotesForPatient(patientId: string) {
  // Cliniko's sort syntax is "field:direction" (e.g. "created_at:desc"),
  // not the Rails/JSON:API leading-minus convention. The old "-created_at"
  // form is rejected by the API, which made this call fail silently
  // (the UI just showed "No visit notes yet").
  const data = await clinikoFetch(`/patients/${patientId}/treatment_notes?per_page=100&sort=created_at:desc`)
  return data.treatment_notes ?? []
}

export async function getMostRecentDraftForAuthor(patientId: string, authorEmail: string) {
  const notes = await listTreatmentNotesForPatient(patientId)
  return notes.find((n: any) => n.draft === true && n.title === authorEmail) ?? null
}

// ── Patient demographics (deliberately narrow) ──────────────────

export interface ClinikoPatientInfo {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  phone: string | null
  address: string | null
}

export async function getPatientInfo(patientId: string): Promise<ClinikoPatientInfo> {
  const p = await clinikoFetch(`/patients/${patientId}`)
  const addressParts = [p.address_1, p.address_2, p.city, p.state, p.post_code].filter(Boolean)
  const phone =
    (p.patient_phone_numbers ?? []).find((n: any) => n.phone_type === 'Mobile')?.number ??
    (p.patient_phone_numbers ?? [])[0]?.number ??
    null
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    dateOfBirth: p.date_of_birth ?? null,
    phone,
    address: addressParts.length ? addressParts.join(', ') : null,
  }
}

// Just this physio's next visit with this specific patient — not their
// full calendar and not other physios' bookings with the same patient.
//
// individual_appointments has no nested /patients/{id}/individual_appointments
// path (unlike treatment_notes and patient_attachments, which do) — Cliniko
// 404s on that shape. Has to be the flat endpoint filtered by patient_id.
// Cliniko also requires an explicit comparison operator even for exact
// match — a bare "patient_id:X" 400s, it must be "patient_id:=X".
export async function getNextAppointment(patientId: string) {
  const data = await clinikoFetch(
    `/individual_appointments?q[]=${encodeURIComponent(`patient_id:=${patientId}`)}&q[]=${encodeURIComponent(`starts_at:>${new Date().toISOString()}`)}&sort=starts_at&per_page=1`
  )
  return data.individual_appointments?.[0] ?? null
}

// ── Diary (a physio's own upcoming appointments, across all patients) ──
//
// Pulls straight from Cliniko rather than this app's own patient_assignments
// table — an assignment being added/removed doesn't retroactively change who
// a Cliniko appointment is actually booked under, and the diary should
// reflect Cliniko as source of truth for "what's on my schedule".
//
// individual_appointments already includes patient_name directly (no need
// for a second lookup per appointment) — see
// https://docs.api.cliniko.com/openapi/individual-appointment. The patient
// link, if present, is parsed out so the diary can link through to that
// patient's page.
export interface DiaryAppointment {
  id: string
  startsAt: string
  endsAt: string
  patientId: string | null
  patientName: string | null
  patientArrived: boolean
  didNotArrive: boolean
  cancelledAt: string | null
  notes: string | null
}

export function idFromLink(url?: string | null): string | null {
  if (!url) return null
  const match = url.match(/\/(\d+)(?:\?.*)?$/)
  return match ? match[1] : null
}

export async function listUpcomingAppointmentsForPractitioner(
  practitionerId: string,
  opts: { limit?: number } = {}
): Promise<DiaryAppointment[]> {
  const { limit = 50 } = opts
  const data = await clinikoFetch(
    `/individual_appointments?q[]=${encodeURIComponent(`practitioner_id:=${practitionerId}`)}&q[]=${encodeURIComponent(`starts_at:>${new Date().toISOString()}`)}&sort=starts_at:asc&per_page=${limit}`
  )
  const appointments = (data.individual_appointments ?? []) as any[]
  return appointments
    .filter((a) => !a.cancelled_at) // cancelled visits don't belong on the diary
    .map((a) => ({
      id: String(a.id),
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      patientId: idFromLink(a.patient?.links?.self),
      patientName: a.patient_name ?? null,
      patientArrived: !!a.patient_arrived,
      didNotArrive: !!a.did_not_arrive,
      cancelledAt: a.cancelled_at ?? null,
      notes: a.notes ?? null,
    }))
}

// ── Attachments ──────────────────────────────────────────────────

// The resource is "patient_attachments" throughout the real API, not
// "attachments" — see
// https://github.com/redguava/cliniko-api/blob/main/sections/patient_attachments.md
export async function listAttachments(patientId: string) {
  const data = await clinikoFetch(`/patients/${patientId}/patient_attachments?per_page=100&sort=created_at:desc`)
  return data.patient_attachments ?? []
}

// Step 1 of the 3-step upload handshake: ask Cliniko for a presigned S3
// POST. This is a GET against the patient, not a POST with a body —
// Cliniko generates the presign itself, it doesn't take a filename here.
// The browser uploads directly to S3 with the result (step 2, done
// client-side) — the file never touches the portal's server.
export async function getAttachmentPresignedPost(patientId: string) {
  return clinikoFetch(`/patients/${patientId}/attachment_presigned_post`)
}

// Step 3: register the now-uploaded S3 object as a real Cliniko patient
// attachment. Cliniko wants a single `upload_url` — the presign's `url`
// plus the actual S3 object Key returned in the S3 XML response after
// upload (the presign's fields.key still has an unresolved ${filename}
// placeholder, so it can't be used directly).
export async function finalizeAttachment(params: {
  patientId: string
  uploadUrl: string
  description?: string
}) {
  const { patientId, uploadUrl, description } = params
  return clinikoFetch('/patient_attachments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      upload_url: uploadUrl,
      ...(description ? { description } : {}),
    }),
  })
}

// ── Appointments (booking) ──────────────────────────────────────
//
// See https://github.com/redguava/cliniko-api/blob/main/sections/individual_appointments.md
// POST body: { starts_at, ends_at?, patient_id, practitioner_id, appointment_type_id, business_id, notes? }

export interface ClinikoAppointmentType {
  id: string
  name: string
  duration_in_minutes: number
}

// Appointment types for whichever practitioner is booking — every
// physio has their own Cliniko practitioner record and their own set of
// offered appointment types, so this is never hardcoded to Micheal.
// practitionerId is always resolved server-side from the logged-in
// physio's linked Cliniko practitioner ID (see lib/db.ts
// getClinikoPractitionerIdForEmail) — never accepted raw from the client.
export async function listAppointmentTypesForPractice(practitionerId: string): Promise<ClinikoAppointmentType[]> {
  if (!practitionerId) {
    throw new Error('practitionerId is required')
  }
  // Per Cliniko's API docs, appointment types are listed directly under the
  // practitioner — not nested under /businesses/{id}/practitioners/{id}.
  // That nested path only exists for a specific appointment type's
  // available_times/next_available_time sub-resources.
  const data = await clinikoFetch(`/practitioners/${practitionerId}/appointment_types?per_page=100`)
  return data.appointment_types ?? []
}

// business_id is never accepted as input — always Physio to Home, pulled
// from env, so this can never accidentally book into one of the other
// businesses on the account. practitioner_id *is* now a real input, but
// only ever the server-resolved value for the logged-in physio's own
// Cliniko practitioner record (see callers) — never taken raw from the
// client, so nobody can book under someone else's name.
export async function createIndividualAppointment(params: {
  patientId: string
  practitionerId: string
  appointmentTypeId: string
  startsAt: string
  endsAt: string
  notes?: string
}) {
  if (!BUSINESS_ID) {
    throw new Error('CLINIKO_BUSINESS_ID is not set')
  }
  const { patientId, practitionerId, appointmentTypeId, startsAt, endsAt, notes } = params
  if (!practitionerId) {
    throw new Error('practitionerId is required')
  }
  return clinikoFetch('/individual_appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      practitioner_id: practitionerId,
      business_id: BUSINESS_ID,
      appointment_type_id: appointmentTypeId,
      starts_at: startsAt,
      ends_at: endsAt,
      ...(notes ? { notes } : {}),
    }),
  })
}

// Fetch a single appointment — used to check who it actually belongs to
// (via practitioner.links.self) before allowing an edit or cancellation,
// so one physio's session can never touch another physio's booking. See
// requireOwnAppointment in lib/appointmentAuth.ts, the shared gate used
// by the update/cancel routes.
export async function getIndividualAppointment(appointmentId: string) {
  return clinikoFetch(`/individual_appointments/${appointmentId}`)
}

// Reschedule / edit an existing appointment. patient_id, practitioner_id
// and business_id are deliberately never accepted here — those are set
// once at booking time (see createIndividualAppointment) and this never
// hands the client a way to move an appointment onto a different patient,
// practitioner or business.
export async function updateIndividualAppointment(
  appointmentId: string,
  params: { appointmentTypeId?: string; startsAt?: string; endsAt?: string; notes?: string }
) {
  const body: Record<string, any> = {}
  if (params.appointmentTypeId) body.appointment_type_id = params.appointmentTypeId
  if (params.startsAt) body.starts_at = params.startsAt
  if (params.endsAt) body.ends_at = params.endsAt
  if (params.notes !== undefined) body.notes = params.notes
  return clinikoFetch(`/individual_appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

// Cliniko's fixed set of cancellation reason codes — cancellation_reason
// is a mandatory field on the cancel call, there's no free-text-only
// option. See https://docs.api.cliniko.com/openapi/individual-appointment/cancelindividualappointment-patch
export const CANCELLATION_REASONS = [
  { code: 10, label: 'Feeling better' },
  { code: 20, label: 'Condition worse' },
  { code: 30, label: 'Sick' },
  { code: 31, label: 'COVID-19 related' },
  { code: 40, label: 'Away' },
  { code: 60, label: 'Work' },
  { code: 50, label: 'Other' },
] as const

// Real cancel endpoint, not a DELETE — Cliniko keeps the appointment
// around (cancelled_at gets set) rather than deleting it, so history and
// invoicing stay intact.
export async function cancelIndividualAppointment(appointmentId: string, params: { reason: number; note?: string }) {
  return clinikoFetch(`/individual_appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({
      cancellation_reason: params.reason,
      ...(params.note ? { cancellation_note: params.note } : {}),
    }),
  })
}

// with the admin key and streams them through. Cliniko exposes this via
// the attachment's own `content.links.self`, which — confirmed against a
// live account — doesn't return the file directly. It 303-redirects to a
// presigned S3 URL. Node's automatic redirect-following isn't reliable
// for that cross-origin hop (it can come back as a raw 303 instead of
// actually following through), so the redirect is handled by hand here:
// read the Location header off Cliniko's response, then make a second,
// unauthenticated request to fetch the actual bytes. The S3 URL is
// presigned and doesn't want our Cliniko Authorization header on that
// second hop — sending it along could make S3 reject the request outright.
export async function fetchAttachmentBytes(attachmentId: string) {
  if (!API_BASE) throw new Error('CLINIKO_API_BASE is not set')
  const first = await fetch(`${API_BASE}/patient_attachments/${attachmentId}/content`, {
    headers: { Authorization: authHeader(), 'User-Agent': USER_AGENT },
    cache: 'no-store',
    redirect: 'manual',
  })

  if (first.status >= 300 && first.status < 400) {
    const location = first.headers.get('location')
    if (!location) {
      throw new Error(`Cliniko attachment download failed: ${first.status} redirect with no Location header`)
    }
    const final = await fetch(location, { cache: 'no-store' })
    if (!final.ok) {
      throw new Error(`Cliniko attachment download failed: ${final.status} fetching the redirected file`)
    }
    return final
  }

  if (!first.ok) throw new Error(`Cliniko attachment download failed: ${first.status}`)
  return first
}

// ── Patient search (admin: assigning a patient by name, not raw ID) ──

export interface ClinikoPatientSearchResult {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
}

// Cliniko's filter syntax supports "or" groups across fields — see
// https://developer.cliniko.com/api-docs#filtering — but this exact form
// (partial match "~" inside an "or[...]" group) hasn't been round-tripped
// against a live sandbox yet, same caveat as the rest of this file. If it
// ever comes back empty where results are expected, the fallback is two
// separate q[]=first_name:~:X / q[]=last_name:~:X calls merged client-side.
// Cliniko's q[] filters are ANDed together — there is no "or[...]" group
// syntax (that was never a real part of the API despite looking plausible;
// see https://docs.api.cliniko.com/ "Filtering Results"). So a name search
// has to be two separate requests — one matching first_name, one matching
// last_name — merged and de-duped by id, rather than one query with an OR.
export async function searchPatients(query: string, limit = 8): Promise<ClinikoPatientSearchResult[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const toResult = (p: any): ClinikoPatientSearchResult => ({
    id: String(p.id),
    firstName: p.first_name,
    lastName: p.last_name,
    dateOfBirth: p.date_of_birth ?? null,
  })

  const [byFirst, byLast] = await Promise.all([
    clinikoFetch(`/patients?q[]=${encodeURIComponent(`first_name:~${term}`)}&per_page=${limit}`),
    clinikoFetch(`/patients?q[]=${encodeURIComponent(`last_name:~${term}`)}&per_page=${limit}`),
  ])

  const merged = new Map<string, ClinikoPatientSearchResult>()
  for (const p of [...(byFirst.patients ?? []), ...(byLast.patients ?? [])]) {
    const r = toResult(p)
    if (!merged.has(r.id)) merged.set(r.id, r)
  }
  return Array.from(merged.values()).slice(0, limit)
}

// ── Appointments for a single patient (note-linking picker) ──────

// Recent past (default 30 days) plus all upcoming, ascending by time, so
// the note form can offer "which visit was this note written for" without
// pulling the patient's entire appointment history.
//
// Same nested-path issue as getNextAppointment above — individual_appointments
// only exists at the flat endpoint, filtered by patient_id.
export async function listAppointmentsForPatient(patientId: string, opts: { fromDaysAgo?: number; limit?: number } = {}) {
  const { fromDaysAgo = 30, limit = 20 } = opts
  const from = new Date(Date.now() - fromDaysAgo * 24 * 60 * 60 * 1000).toISOString()
  const data = await clinikoFetch(
    `/individual_appointments?q[]=${encodeURIComponent(`patient_id:=${patientId}`)}&q[]=${encodeURIComponent(`starts_at:>${from}`)}&sort=starts_at:asc&per_page=${limit}`
  )
  return data.individual_appointments ?? []
}

// ── Patient arrived ───────────────────────────────────────────────
//
// Cliniko models this as a plain boolean on the appointment itself
// (`patient_arrived`), not a timestamp or a separate endpoint — see
// https://docs.api.cliniko.com/openapi/individual-appointment. A normal
// PATCH is enough; there's no dedicated "check in" action in the API.
export async function markPatientArrived(appointmentId: string) {
  return clinikoFetch(`/individual_appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ patient_arrived: true }),
  })
}
