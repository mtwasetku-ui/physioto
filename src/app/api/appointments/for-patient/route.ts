import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail } from '@/lib/db'
import { listAppointmentsForPatient } from '@/lib/cliniko'

// GET /api/appointments/for-patient?patientId=X — recent + upcoming
// appointments for a single patient, used by the note form so a physio
// can link a note to the actual visit it was written for. Gated the same
// way as /api/notes (any physio assigned to this patient, not just
// admin) — this is a read of the patient's own visit list, not booking.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const patientId = searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId required' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const assigned = await isPatientAssignedToEmail(email, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const appointments = await listAppointmentsForPatient(patientId)
    return NextResponse.json({ appointments })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load appointments' }, { status: 502 })
  }
}
