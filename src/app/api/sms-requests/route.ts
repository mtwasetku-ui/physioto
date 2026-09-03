import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, createSmsRequest, listSmsRequestsForPatient, writeAuditLog } from '@/lib/db'
import { getPatientInfo } from '@/lib/cliniko'
import { sendMail } from '@/lib/mail'

// This isn't a real SMS integration — Cliniko's API can't send SMS (only
// its own UI can, see lib/cliniko.ts notes), and a proper third-party
// provider isn't wired up yet since usage is low. This is a manual relay:
// the practitioner's request lands in the admin queue, Micheal sends it
// from his own phone, and pastes the reply back in.

async function requireAssignedSession(patientId: string) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return { error: NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 }) }
  return { email }
}

// GET /api/sms-requests?patientId=X — this patient's request/reply history
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  const auth = await requireAssignedSession(patientId)
  if ('error' in auth) return auth.error

  try {
    const requests = await listSmsRequestsForPatient(patientId)
    return NextResponse.json({ requests })
  } catch (err) {
    console.error('[api:sms-requests:GET] failed', err)
    return NextResponse.json({ error: 'Failed to load message history' }, { status: 500 })
  }
}

// POST /api/sms-requests — { patientId, message, appointmentId? }
export async function POST(req: Request) {
  const { patientId, message, appointmentId } = await req.json()
  if (!patientId || !message?.trim()) {
    return NextResponse.json({ error: 'patientId and message required' }, { status: 400 })
  }

  const auth = await requireAssignedSession(patientId)
  if ('error' in auth) return auth.error

  try {
    const patient = await getPatientInfo(patientId).catch(() => null)
    const request = await createSmsRequest({
      clinikoPatientId: patientId,
      appointmentId: appointmentId || null,
      requestedByEmail: auth.email!,
      patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() : null,
      patientPhone: patient?.phone ?? null,
      message: message.trim(),
    })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'sms_request_create',
      clinikoPatientId: patientId,
      detail: { requestId: request.id },
    })

    // Best-effort — a notification failure shouldn't undo an already-saved
    // request, so this is deliberately outside the try/catch that governs
    // the response. The queue itself (/admin/sms) is the source of truth
    // either way.
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const siteUrl = (process.env.NEXTAUTH_URL || 'https://www.physiotohome.com').replace(/\/$/, '')
      const queueUrl = `${siteUrl}/admin/sms`
      const patientLabel = request.patient_name || 'a patient'
      sendMail({
        to: adminEmail,
        subject: `SMS request: ${patientLabel}`,
        text: `${auth.email} asked for a text to be sent to ${patientLabel}${request.patient_phone ? ` (${request.patient_phone})` : ''}:\n\n"${request.message}"\n\nSend it and log it here: ${queueUrl}`,
        html: `<p><strong>${auth.email}</strong> asked for a text to be sent to <strong>${patientLabel}</strong>${request.patient_phone ? ` (${request.patient_phone})` : ''}:</p><p style="padding:10px;background:#f5f5f4;border-radius:6px">${request.message}</p><p><a href="${queueUrl}">Send it and log it here</a></p>`,
      }).catch((e) => console.error('[api:sms-requests:POST] notification email failed', e))
    }

    return NextResponse.json({ request })
  } catch (err) {
    console.error('[api:sms-requests:POST] failed', err)
    return NextResponse.json({ error: 'Failed to save — the database did not confirm the write. Nothing was sent.' }, { status: 500 })
  }
}
