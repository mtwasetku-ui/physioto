import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import {
  createTreatmentNote,
  updateTreatmentNote,
  listTreatmentNotesForPatient,
  getTemplateByExactName,
} from '@/lib/cliniko'

async function requireAssignedSession(patientId: string) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return { error: NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 }) }
  return { email }
}

// GET /api/notes?patientId=X — full timeline (or draftOnly=true, used by
// the note form to offer "continue draft").
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  const auth = await requireAssignedSession(patientId)
  if ('error' in auth) return auth.error

  try {
    let notes = await listTreatmentNotesForPatient(patientId)
    if (searchParams.get('draftOnly') === 'true') {
      notes = notes.filter((n: any) => n.draft === true)
    }
    return NextResponse.json({ notes })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load notes' }, { status: 502 })
  }
}

// POST — create a new note (draft or final)
export async function POST(req: Request) {
  const body = await req.json()
  const { patientId, templateName, sections, draft, bookingId } = body
  if (!patientId || !templateName || !sections) {
    return NextResponse.json({ error: 'patientId, templateName and sections required' }, { status: 400 })
  }

  const auth = await requireAssignedSession(patientId)
  if ('error' in auth) return auth.error

  try {
    const template = await getTemplateByExactName(templateName)
    const note = await createTreatmentNote({
      patientId,
      template,
      sections,
      draft: !!draft,
      authorEmail: auth.email!,
      bookingId,
    })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'note_create',
      clinikoPatientId: patientId,
      detail: { draft: !!draft, templateName },
    })
    return NextResponse.json({ note })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save note' }, { status: 502 })
  }
}

// PATCH — update an existing draft note. Cliniko itself rejects this if
// the note has already been finalised (draft:false) — no extra lock here.
export async function PATCH(req: Request) {
  const body = await req.json()
  const { patientId, noteId, templateName, sections, draft, bookingId } = body
  if (!patientId || !noteId || !templateName || !sections) {
    return NextResponse.json({ error: 'patientId, noteId, templateName and sections required' }, { status: 400 })
  }

  const auth = await requireAssignedSession(patientId)
  if ('error' in auth) return auth.error

  try {
    const template = await getTemplateByExactName(templateName)
    const note = await updateTreatmentNote({ noteId, template, sections, draft: !!draft, bookingId })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'note_update',
      clinikoPatientId: patientId,
      detail: { noteId, draft: !!draft, templateName },
    })
    return NextResponse.json({ note })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update note' }, { status: 502 })
  }
}
