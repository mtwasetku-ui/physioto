import { NextResponse } from 'next/server'
import { requireOwnAppointment } from '@/lib/appointmentAuth'
import { updateIndividualAppointment } from '@/lib/cliniko'
import { writeAuditLog } from '@/lib/db'

// PATCH /api/appointments/[id] — reschedule/edit. Only the physio the
// appointment is actually booked under can do this (see
// requireOwnAppointment). appointmentTypeId/startsAt/durationMinutes/notes
// are the only inputs accepted — patient, practitioner and business are
// never touched here.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireOwnAppointment(params.id)
  if ('error' in auth) return auth.error

  const { appointmentTypeId, startsAt, durationMinutes, notes } = await req.json().catch(() => ({}))
  const endsAt =
    startsAt && durationMinutes ? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString() : undefined

  try {
    const appointment = await updateIndividualAppointment(params.id, { appointmentTypeId, startsAt, endsAt, notes })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'appointment_update',
      detail: { appointmentId: params.id, appointmentTypeId, startsAt },
    })
    return NextResponse.json({ appointment })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update appointment' }, { status: 502 })
  }
}
