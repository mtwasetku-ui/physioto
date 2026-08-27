import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { setPatientDidNotArrive } from '@/lib/cliniko'

// POST /api/appointments/[id]/dna — mark the patient as "did not arrive"
// (or, with { didNotArrive: false }, undo that) for this appointment.
// Gated the same as /api/appointments/[id]/arrive — any physio assigned to
// the patient, not admin-only.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { patientId, didNotArrive = true } = await req.json().catch(() => ({}))
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const appointment = await setPatientDidNotArrive(params.id, !!didNotArrive)
    await writeAuditLog({
      actorEmail: email,
      action: didNotArrive ? 'appointment_dna' : 'appointment_undo_dna',
      clinikoPatientId: patientId,
      detail: { appointmentId: params.id },
    })
    return NextResponse.json({ appointment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update did-not-arrive status' }, { status: 502 })
  }
}
