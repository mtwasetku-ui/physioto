import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteTravelBlock, updateTravelBlock, writeAuditLog } from '@/lib/db'

// PATCH /api/travel-blocks/[id] — reposition (startsAt) and/or resize
// (durationMinutes) a travel block, or rename its label. Ownership is
// enforced inside updateTravelBlock's WHERE clause, so a block belonging
// to another physio just comes back as "not found" here.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { startsAt, durationMinutes, label } = await req.json().catch(() => ({}))
  const endsAt =
    startsAt && durationMinutes ? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString() : undefined

  try {
    const row = await updateTravelBlock(params.id, email, { startsAt, endsAt, label })
    if (!row) return NextResponse.json({ error: 'Travel block not found' }, { status: 404 })
    await writeAuditLog({ actorEmail: email, action: 'travel_block_update', detail: { id: params.id, startsAt, durationMinutes, label } })
    return NextResponse.json({
      travelBlock: {
        id: row.id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        label: row.label,
        linkedAppointmentId: row.linked_appointment_id,
      },
    })
  } catch (e: any) {
    console.error('[travel-blocks] failed to update', e)
    return NextResponse.json({ error: 'Failed to update travel block' }, { status: 500 })
  }
}

// DELETE /api/travel-blocks/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ok = await deleteTravelBlock(params.id, email)
    if (!ok) return NextResponse.json({ error: 'Travel block not found' }, { status: 404 })
    await writeAuditLog({ actorEmail: email, action: 'travel_block_delete', detail: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[travel-blocks] failed to delete', e)
    return NextResponse.json({ error: 'Failed to delete travel block' }, { status: 500 })
  }
}
