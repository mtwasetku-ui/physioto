import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getClinikoPractitionerIdForEmail, listAssignmentsForEmail } from '@/lib/db'
import { listAppointmentsForPractitionerInRange, listAppointmentTypesForPractice } from '@/lib/cliniko'

// GET /api/appointments/diary?from=ISO&to=ISO — the logged-in physio's own
// calendar for that window. Two layers of scoping, both server-side, both
// resolved from the session (never from the client):
//
// 1. practitioner_id — only appointments Cliniko has this physio down as
//    the practitioner for.
// 2. patient_assignments — of those, only the patients this app has
//    explicitly assigned to them. This matters for the "couple of
//    practitioners who only see two or three clients" case: someone could
//    in principle have a stray Cliniko appointment under their
//    practitioner id for a patient they're not meant to see in this app
//    (e.g. a booking made directly in Cliniko, or an old assignment that
//    was since removed here) — assignment is the real access boundary,
//    practitioner_id alone isn't enough.
//
// Defaults to the current week (Mon–Sun) if no range is given.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let practitionerId: string | null
  try {
    practitionerId = await getClinikoPractitionerIdForEmail(email)
  } catch (e: any) {
    // Full detail (including any DB/column specifics) goes to the server
    // log only — the client-facing message stays generic so a practitioner
    // never sees backend implementation detail (Final Agreement §4).
    console.error('[appointments/diary] failed to look up linked practitioner', e)
    return NextResponse.json(
      { error: 'Failed to look up your linked practitioner record' },
      { status: 500 }
    )
  }
  if (!practitionerId) {
    return NextResponse.json(
      { error: "Your account isn't linked to a practitioner record yet — ask Micheal to link it from the Staff page." },
      { status: 403 }
    )
  }

  let assignedPatientIds: Set<string>
  try {
    const assignments = await listAssignmentsForEmail(email)
    assignedPatientIds = new Set(assignments.map((a: any) => String(a.cliniko_patient_id)))
  } catch (e: any) {
    console.error('[appointments/diary] failed to load assignments', e)
    return NextResponse.json({ error: 'Failed to load your assigned patients' }, { status: 500 })
  }

  // Default window: current week, Monday to the following Monday.
  let from: string
  let to: string
  if (fromParam && toParam) {
    from = fromParam
    to = toParam
  } else {
    const now = new Date()
    const day = now.getDay() // 0 = Sun
    const diffToMonday = (day + 6) % 7
    const monday = new Date(now)
    monday.setHours(0, 0, 0, 0)
    monday.setDate(now.getDate() - diffToMonday)
    const nextMonday = new Date(monday)
    nextMonday.setDate(monday.getDate() + 7)
    from = monday.toISOString()
    to = nextMonday.toISOString()
  }

  try {
    const appointments = await listAppointmentsForPractitionerInRange(practitionerId, from, to)
    const visible = appointments.filter((a) => a.patientId && assignedPatientIds.has(a.patientId))

    // Appointment-type colour is only used for the week-grid display — a
    // failure to load it should never break the calendar itself, so this
    // is best-effort and falls back to no colour (frontend picks one).
    let colorByTypeId = new Map<string, string | null>()
    try {
      const types = await listAppointmentTypesForPractice(practitionerId)
      colorByTypeId = new Map(types.map((t) => [t.id, t.color]))
    } catch (e) {
      console.error('[appointments/diary] failed to load appointment type colours', e)
    }

    const withColor = visible.map((a) => ({
      ...a,
      appointmentTypeColor: a.appointmentTypeId ? colorByTypeId.get(a.appointmentTypeId) ?? null : null,
    }))

    return NextResponse.json({ appointments: withColor, from, to })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load calendar' }, { status: 502 })
  }
}
