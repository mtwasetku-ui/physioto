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
// Booking from the portal is deliberately hardcoded to a single
// business + practitioner (Micheal's own) via env vars, rather than
// exposing a business/practitioner picker — contractors aren't meant to
// be creating appointments under Micheal's name in other businesses.
const BUSINESS_ID = process.env.CLINIKO_BUSINESS_ID // Physio to Home's business id
const PRACTITIONER_ID = process.env.CLINIKO_PRACTITIONER_ID // Micheal's own practitioner id

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
}) {
  const { noteId, template, sections, draft } = params
  return clinikoFetch(`/treatment_notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      draft,
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
export async function getNextAppointment(patientId: string) {
  const data = await clinikoFetch(
    `/patients/${patientId}/individual_appointments?q[]=starts_at:>${new Date().toISOString()}&sort=starts_at&per_page=1`
  )
  return data.individual_appointments?.[0] ?? null
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

// Only the appointment types actually offered by Physio to Home for
// Micheal's own practitioner record — not every type across every
// business on the account.
export async function listAppointmentTypesForPractice(): Promise<ClinikoAppointmentType[]> {
  if (!BUSINESS_ID || !PRACTITIONER_ID) {
    throw new Error('CLINIKO_BUSINESS_ID / CLINIKO_PRACTITIONER_ID are not set')
  }
  const data = await clinikoFetch(
    `/businesses/${BUSINESS_ID}/practitioners/${PRACTITIONER_ID}/appointment_types?per_page=100`
  )
  return data.appointment_types ?? []
}

// business_id and practitioner_id are never accepted as input here —
// they're always Physio to Home + Micheal, pulled from env, so this can
// never accidentally book an appointment under someone else's name or
// in one of the other businesses on the account.
export async function createIndividualAppointment(params: {
  patientId: string
  appointmentTypeId: string
  startsAt: string
  endsAt: string
  notes?: string
}) {
  if (!BUSINESS_ID || !PRACTITIONER_ID) {
    throw new Error('CLINIKO_BUSINESS_ID / CLINIKO_PRACTITIONER_ID are not set')
  }
  const { patientId, appointmentTypeId, startsAt, endsAt, notes } = params
  return clinikoFetch('/individual_appointments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      practitioner_id: PRACTITIONER_ID,
      business_id: BUSINESS_ID,
      appointment_type_id: appointmentTypeId,
      starts_at: startsAt,
      ends_at: endsAt,
      ...(notes ? { notes } : {}),
    }),
  })
}
// with the admin key and streams them through. Cliniko exposes this via
// the attachment's own `content.links.self`, not a bespoke /download
// route — worth confirming the exact response (redirect vs binary) once
// against a live sandbox.
export async function fetchAttachmentBytes(attachmentId: string) {
  if (!API_BASE) throw new Error('CLINIKO_API_BASE is not set')
  const res = await fetch(`${API_BASE}/patient_attachments/${attachmentId}/content`, {
    headers: { Authorization: authHeader(), 'User-Agent': USER_AGENT },
    cache: 'no-store',
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Cliniko attachment download failed: ${res.status}`)
  return res
}
