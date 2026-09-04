import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createTravelBlock, listTravelBlocksForEmailInRange, writeAuditLog } from '@/lib/db'

// GET /api/travel-blocks?from=ISO&to=ISO — the logged-in physio's own
// travel time for that window. No Cliniko/practitioner lookup needed here
// (unlike /api/appointments/diary) — travel blocks are local-only and
// scoped straight off the session email.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from and to are required' }, { status: 400 })

  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = await listTravelBlocksForEmailInRange(email, from, to)
    const travelBlocks = rows.map((r) => ({
      id: r.id,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      label: r.label,
      linkedAppointmentId: r.linked_appointment_id,
    }))
    return NextResponse.json({ travelBlocks })
  } catch (e: any) {
    console.error('[travel-blocks] failed to list', e)
    return NextResponse.json({ error: 'Failed to load travel blocks' }, { status: 500 })
  }
}

// POST /api/travel-blocks — create a new travel block on the caller's own
// diary. Accepts either an explicit endsAt or a durationMinutes (the diary
// UI's "click-drag on empty space" and "add travel before/after a visit"
// flows both build on this).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { startsAt, endsAt, durationMinutes, label, linkedAppointmentId } = await req.json().catch(() => ({}))
  if (!startsAt || (!endsAt && !durationMinutes)) {
    return NextResponse.json({ error: 'startsAt and either endsAt or durationMinutes are required' }, { status: 400 })
  }
  const resolvedEndsAt = endsAt ?? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()
  if (new Date(resolvedEndsAt).getTime() <= new Date(startsAt).getTime()) {
    return NextResponse.json({ error: 'Travel block must have a positive duration' }, { status: 400 })
  }

  try {
    const row = await createTravelBlock({
      email,
      startsAt,
      endsAt: resolvedEndsAt,
      label,
      linkedAppointmentId: linkedAppointmentId ?? null,
    })
    await writeAuditLog({ actorEmail: email, action: 'travel_block_create', detail: { id: row.id, startsAt, endsAt: resolvedEndsAt } })
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
    console.error('[travel-blocks] failed to create', e)
    return NextResponse.json({ error: 'Failed to create travel block' }, { status: 500 })
  }
}
