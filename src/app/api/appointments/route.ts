import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, writeAuditLog } from '@/lib/db'
import { listAppointmentTypesForPractice, createIndividualAppointment } from '@/lib/cliniko'

// Booking is restricted to Micheal (ADMIN_EMAIL), same gate as /admin —
// this always creates the appointment under his own practitioner record
// in the Physio to Home business (see lib/cliniko.ts), so it shouldn't
// be something a casual contractor can trigger for a patient.
function requireAdmin(email: string | undefined | null) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail
}

// GET — appointment types available to offer in the booking form.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const appointmentTypes = await listAppointmentTypesForPractice()
    console.log('[appointments] loaded types', { count: appointmentTypes.length })
    return NextResponse.json({ appointmentTypes })
  } catch (e: any) {
    console.error('[appointments] failed to load types', e)
    return NextResponse.json({ error: e.message || 'Failed to load appointment types' }, { status: 502 })
  }
}

// POST — book the appointment. patientId, appointmentTypeId and startsAt
// are the only inputs accepted; business/practitioner are never taken
// from the client (see lib/cliniko.ts createIndividualAppointment).
export async function POST(req: Request) {
  const { patientId, appointmentTypeId, startsAt, durationMinutes, notes } = await req.json()
  if (!patientId || !appointmentTypeId || !startsAt || !durationMinutes) {
    return NextResponse.json(
      { error: 'patientId, appointmentTypeId, startsAt and durationMinutes required' },
      { status: 400 }
    )
  }

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!requireAdmin(email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assigned = await isPatientAssignedToEmail(email!, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()
    const appointment = await createIndividualAppointment({
      patientId,
      appointmentTypeId,
      startsAt,
      endsAt,
      notes,
    })
    await writeAuditLog({
      actorEmail: email!,
      action: 'appointment_create',
      clinikoPatientId: patientId,
      detail: { appointmentTypeId, startsAt },
    })
    return NextResponse.json({ appointment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to book appointment' }, { status: 502 })
  }
}
