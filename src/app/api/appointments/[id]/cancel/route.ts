import { NextResponse } from 'next/server'
import { requireOwnAppointment } from '@/lib/appointmentAuth'
import { cancelIndividualAppointment } from '@/lib/cliniko'
import { writeAuditLog, getSeriesForAppointment, listFutureSeriesMembers } from '@/lib/db'

// POST /api/appointments/[id]/cancel — same ownership check as the edit
// route. Cliniko requires a reason code (see cliniko.ts
// CANCELLATION_REASONS); this doesn't delete the appointment, it sets
// cancelled_at, so history stays intact.
//
// Optional `scope: 'series'` (default is a single occurrence) also
// cancels every other future, not-yet-happened member of the same
// booking series (see lib/db.ts appointment_series) — Cliniko itself has
// no series concept, each occurrence is cancelled with its own API call.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireOwnAppointment(params.id)
  if ('error' in auth) return auth.error

  const { reason, note, scope } = await req.json().catch(() => ({}))
  if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 })

  try {
    await cancelIndividualAppointment(params.id, { reason, note })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'appointment_cancel',
      detail: { appointmentId: params.id, reason },
    })

    if (scope !== 'series') {
      return NextResponse.json({ ok: true, cancelledIds: [params.id] })
    }

    const series = await getSeriesForAppointment(params.id)
    if (!series) {
      // Asked for "series" on an appointment that isn't part of one
      // (e.g. stale UI state) — the single cancellation above already
      // succeeded, so just report that there was no series to extend it to.
      return NextResponse.json({ ok: true, cancelledIds: [params.id], seriesFound: false })
    }

    const members = await listFutureSeriesMembers(series.seriesId, new Date().toISOString())
    const cancelledIds = [params.id]
    const failures: { appointmentId: string; error: string }[] = []

    for (const member of members) {
      if (member.clinikoAppointmentId === params.id) continue
      try {
        // Re-checked per occurrence rather than trusted from booking
        // time — practitioner linkage could in principle have changed
        // between when the series was booked and now.
        const memberAuth = await requireOwnAppointment(member.clinikoAppointmentId)
        if ('error' in memberAuth) {
          failures.push({ appointmentId: member.clinikoAppointmentId, error: 'Not your appointment' })
          continue
        }
        await cancelIndividualAppointment(member.clinikoAppointmentId, { reason, note })
        cancelledIds.push(member.clinikoAppointmentId)
        await writeAuditLog({
          actorEmail: auth.email!,
          action: 'appointment_cancel',
          detail: { appointmentId: member.clinikoAppointmentId, reason, partOfSeries: series.seriesId },
        })
      } catch (e: any) {
        failures.push({ appointmentId: member.clinikoAppointmentId, error: e.message || 'Failed to cancel' })
      }
    }

    return NextResponse.json({ ok: true, cancelledIds, failures: failures.length ? failures : undefined })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to cancel appointment' }, { status: 502 })
  }
}
