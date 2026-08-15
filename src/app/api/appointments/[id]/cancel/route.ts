import { NextResponse } from 'next/server'
import { requireOwnAppointment } from '@/lib/appointmentAuth'
import { cancelIndividualAppointment } from '@/lib/cliniko'
import { writeAuditLog } from '@/lib/db'

// POST /api/appointments/[id]/cancel — same ownership check as the edit
// route. Cliniko requires a reason code (see cliniko.ts
// CANCELLATION_REASONS); this doesn't delete the appointment, it sets
// cancelled_at, so history stays intact.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireOwnAppointment(params.id)
  if ('error' in auth) return auth.error

  const { reason, note } = await req.json().catch(() => ({}))
  if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 })

  try {
    await cancelIndividualAppointment(params.id, { reason, note })
    await writeAuditLog({
      actorEmail: auth.email!,
      action: 'appointment_cancel',
      detail: { appointmentId: params.id, reason },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to cancel appointment' }, { status: 502 })
  }
}
