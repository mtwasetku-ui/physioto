import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addAssignment, getClinikoPractitionerIdForEmail, writeAuditLog } from '@/lib/db'
import {
  listAppointmentTypesForPractice,
  createIndividualAppointment,
  buildRepeatDates,
  MAX_REPEAT_APPOINTMENTS,
  type RepeatFrequency,
} from '@/lib/cliniko'

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
        { error: "Your account isn't linked to a practitioner record yet — ask Micheal to link it from the Staff page." },
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

const REPEAT_FREQUENCIES: RepeatFrequency[] = ['weekly', 'fortnightly', 'monthly']

// POST — book the appointment under the logged-in physio's own Cliniko
// practitioner record. patientId, appointmentTypeId, startsAt and
// durationMinutes are the only inputs accepted from the client —
// practitioner/business are always resolved server-side (see
// lib/cliniko.ts createIndividualAppointment). patientLabel is optional,
// cosmetic only (used to label the new assignment below) — never trusted
// for anything else.
//
// Optional repeat + repeatCount book a series: repeatCount is the TOTAL
// number of appointments including the first one, capped at
// MAX_REPEAT_APPOINTMENTS (20) — enforced here even though the client also
// enforces it, since the client's limit is only a courtesy.
//
// Booking is open to any patient, not just ones already on this physio's
// assigned list — a booking is itself evidence of a legitimate reason to
// see that patient. On success we add (or refresh) the assignment so the
// patient then shows up under "My patients" without a separate admin step.
export async function POST(req: Request) {
  const { patientId, appointmentTypeId, startsAt, durationMinutes, notes, patientLabel, repeat, repeatCount } =
    await req.json()
  if (!patientId || !appointmentTypeId || !startsAt || !durationMinutes) {
    return NextResponse.json(
      { error: 'patientId, appointmentTypeId, startsAt and durationMinutes required' },
      { status: 400 }
    )
  }

  let count = 1
  if (repeat !== undefined && repeat !== null && repeat !== 'none') {
    if (!REPEAT_FREQUENCIES.includes(repeat)) {
      return NextResponse.json({ error: `repeat must be one of ${REPEAT_FREQUENCIES.join(', ')}` }, { status: 400 })
    }
    count = Number(repeatCount) || 1
    if (count > MAX_REPEAT_APPOINTMENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_REPEAT_APPOINTMENTS} appointments per series.` },
        { status: 400 }
      )
    }
    if (count < 1) {
      return NextResponse.json({ error: 'repeatCount must be at least 1' }, { status: 400 })
    }
  }

  const auth = await requireLinkedPractitioner()
  if ('error' in auth) return auth.error

  const startDates = repeat && repeat !== 'none' ? buildRepeatDates(startsAt, count, repeat as RepeatFrequency) : [startsAt]

  const appointments: any[] = []
  const failures: { startsAt: string; error: string }[] = []

  for (const occurrenceStart of startDates) {
    try {
      const endsAt = new Date(new Date(occurrenceStart).getTime() + durationMinutes * 60_000).toISOString()
      const appointment = await createIndividualAppointment({
        patientId,
        practitionerId: auth.practitionerId!,
        appointmentTypeId,
        startsAt: occurrenceStart,
        endsAt,
        notes,
      })
      appointments.push(appointment)
      await writeAuditLog({
        actorEmail: auth.email!,
        action: 'appointment_create',
        clinikoPatientId: patientId,
        detail: { appointmentTypeId, startsAt: occurrenceStart, practitionerId: auth.practitionerId, repeat: repeat || undefined },
      })
    } catch (e: any) {
      failures.push({ startsAt: occurrenceStart, error: e.message || 'Failed to book appointment' })
    }
  }

  if (appointments.length === 0) {
    return NextResponse.json({ error: failures[0]?.error || 'Failed to book appointment' }, { status: 502 })
  }

  await addAssignment(auth.email!, patientId, patientLabel)
  await writeAuditLog({
    actorEmail: auth.email!,
    action: 'portal_assignment_add',
    clinikoPatientId: patientId,
    detail: { via: 'booking' },
  })

  return NextResponse.json({ appointment: appointments[0], appointments, failures })
}
