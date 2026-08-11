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

export type ClinikoQuestionType = 'text' | 'paragraph_text' | 'radio_buttons' | 'checkboxes'

export interface ClinikoTemplateQuestion {
  id: number
  name: string
  question_type: ClinikoQuestionType | string
  answer_options?: string[]
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

const SUPPORTED_QUESTION_TYPES: string[] = ['text', 'paragraph_text', 'radio_buttons', 'checkboxes']

export function unsupportedQuestionTypes(template: ClinikoTemplate): string[] {
  const found = new Set<string>()
  for (const section of template.content?.sections ?? []) {
    for (const q of section.questions ?? []) {
      if (!SUPPORTED_QUESTION_TYPES.includes(q.question_type)) found.add(q.question_type)
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
  questionId: number
  // text/paragraph_text -> string; radio_buttons -> string; checkboxes -> string[]
  value: string | string[]
}

export interface NoteSectionInput {
  name: string
  answers: NoteAnswer[]
}

// Builds the content.sections[].questions[] payload Cliniko expects,
// keyed against the live template so we never send a shape the template
// doesn't define.
function buildNoteContent(template: ClinikoTemplate, sections: NoteSectionInput[]) {
  return {
    sections: template.content.sections.map((templateSection) => {
      const input = sections.find((s) => s.name === templateSection.name)
      return {
        name: templateSection.name,
        questions: templateSection.questions.map((q) => {
          const answer = input?.answers.find((a) => a.questionId === q.id)
          return {
            id: q.id,
            name: q.name,
            question_type: q.question_type,
            answer: answer?.value ?? (q.question_type === 'checkboxes' ? [] : ''),
          }
        }),
      }
    }),
  }
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
  const data = await clinikoFetch(`/patients/${patientId}/treatment_notes?per_page=100&sort=-created_at`)
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

export async function listAttachments(patientId: string) {
  const data = await clinikoFetch(`/patients/${patientId}/attachments?per_page=100&sort=-created_at`)
  return data.attachments ?? []
}

// Step 1 of the 3-step upload handshake: ask Cliniko for a presigned S3
// POST. The browser uploads directly to S3 with this (step 2, done
// client-side) — the file never touches the portal's server, so there's
// no server-side size bottleneck for Cliniko's 500MB cap.
export async function getAttachmentPresignedPost(fileName: string, contentType: string) {
  return clinikoFetch('/attachments/presigned_post', {
    method: 'POST',
    body: JSON.stringify({ file_name: fileName, content_type: contentType }),
  })
}

// Step 3: register the now-uploaded S3 object as a real Cliniko patient
// attachment.
export async function finalizeAttachment(params: {
  patientId: string
  key: string
  fileName: string
  contentType: string
}) {
  const { patientId, key, fileName, contentType } = params
  return clinikoFetch('/attachments', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      key,
      file_name: fileName,
      content_type: contentType,
    }),
  })
}

// Physios never get a raw S3/Cliniko URL — the server fetches the bytes
// with the admin key and streams them through.
export async function fetchAttachmentBytes(attachmentId: string) {
  if (!API_BASE) throw new Error('CLINIKO_API_BASE is not set')
  const res = await fetch(`${API_BASE}/attachments/${attachmentId}/download`, {
    headers: { Authorization: authHeader(), 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Cliniko attachment download failed: ${res.status}`)
  return res
}
