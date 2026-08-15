import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPatientAssignedToEmail, getClinikoPractitionerIdForEmail, writeAuditLog } from '@/lib/db'
import { listAppointmentTypesForPractice, createIndividualAppointment } from '@/lib/cliniko'

// Booking is open to any signed-in physio whose account has been linked to
// their own Cliniko practitioner record (admin does this once from the
// Staff page — see /api/admin/practitioner-link). The practitioner_id used
// for the actual Cliniko call is always resolved server-side from that
// link, never taken from the client, so nobody can book under someone
// else's name — same safety property as the old single-admin hardcode,
// just keyed per logged-in physio instead of one env var.
async function requireLinkedPractitioner() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const practitionerId = await getClinikoPractitionerIdForEmail(email)
  if (!practitionerId) {
    return {
      error: NextResponse.json(
        { error: "Your account isn't linked to a Cliniko practitioner yet — ask Micheal to link it from the Staff page." },
        { status: 403 }
      ),
    }
  }
  return { email, practitionerId }
}

// GET — appointment types available to offer in the booking form, for
// whichever physio is logged in.
export async function GET() {
  const auth = await requireLinkedPractitioner()
  if ('error' in auth) return auth.error

  try {
    const appointmentTypes = await listAppointmentTypesForPractice(auth.practitionerId!)
    console.log('[appointments] loaded types', { count: appointmentTypes.length, practitionerId: auth.practitionerId })
    return NextResponse.json({ appointmentTypes })
  } catch (e: any) {
    console.error('[appointments] failed to load types', e)
    return NextResponse.json({ error: e.message || 'Failed to load appointment types' }, { status: 502 })
  }
}

// POST — book the appointment under the logged-in physio's own Cliniko
// practitioner record. patientId, appointmentTypeId, startsAt and
// durationMinutes are the only inputs accepted from the client —
// practitioner/business are always resolved server-side (see
// lib/cliniko.ts createIndividualAppointment).
export async function POST(req: Request) {
  const { patientId, appointmentTypeId, startsAt, durationMinutes, notes } = await req.json()
  if (!patientId || !appointmentTypeId || !startsAt || !durationMinutes) {
    return NextResponse.json(
      { error: 'patientId, appointmentTypeId, startsAt and durationMinutes required' },
      { status: 400 }
    )
  }

  const auth = await requireLinkedPractitioner()
  if ('error' in auth) return auth.error

  const assigned = await isPatientAssignedToEmail(auth.email!, patientId)
  if (!assigned) return NextResponse.json({ error: 'Not assigned to this patient' }, { status: 403 })

  try {
    const endsAt = new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()
    const appointment = await createIndividualAppointment({
      patientId,
      practitionerId: auth.practitionerId!,
      appointmentTypeId,
      startsAt,
      endsAt,
      notes,
    })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'appointment_create',
      clinikoPatientId: patientId,
      detail: { appointmentTypeId, startsAt, practitionerId: auth.practitionerId },
    })
    return NextResponse.json({ appointment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to book appointment' }, { status: 502 })
  }
}
