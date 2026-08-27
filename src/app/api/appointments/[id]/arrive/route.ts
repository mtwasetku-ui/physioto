import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { setPatientArrived } from '@/lib/cliniko'

// POST /api/appointments/[id]/arrive — mark the patient as arrived (or, with
// { arrived: false }, undo that) for this appointment. Gated like /api/notes
// and /api/appointments/for-patient (any physio assigned to the patient, not
// admin-only) — checking a patient in/out is a routine part of the visit for
// whichever physio is actually there, not a booking action.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { patientId, arrived = true } = await req.json().catch(() => ({}))
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const appointment = await setPatientArrived(params.id, !!arrived)
    await writeAuditLog({
      actorEmail: email,
      action: arrived ? 'appointment_arrive' : 'appointment_unarrive',
      clinikoPatientId: patientId,
      detail: { appointmentId: params.id },
    })
    return NextResponse.json({ appointment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update arrival status' }, { status: 502 })
  }
}
