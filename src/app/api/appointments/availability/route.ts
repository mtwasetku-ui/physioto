import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAvailableTimes } from '@/lib/cliniko'

function requireAdmin(email: string | undefined | null) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail
}

// GET /api/appointments/availability?appointmentTypeId=X&date=YYYY-MM-DD
// Returns Cliniko's actual open slots for that day, so the booking form
// can't offer a time Cliniko would reject as a clash. Same admin-only gate
// as the rest of /api/appointments — see lib/cliniko.ts for why booking
// is deliberately restricted to Micheal's own practitioner record.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!requireAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const appointmentTypeId = searchParams.get('appointmentTypeId')
  const date = searchParams.get('date')
  if (!appointmentTypeId || !date) {
    return NextResponse.json({ error: 'appointmentTypeId and date required' }, { status: 400 })
  }

  try {
    const slots = await getAvailableTimes(appointmentTypeId, date, date)
    return NextResponse.json({ slots })
  } catch (e: any) {
    // If this endpoint's shape drifts from the docs (unverified against a
    // live sandbox — see README), fail soft: the client falls back to a
    // manual time entry rather than blocking booking entirely.
    return NextResponse.json({ error: e.message || 'Failed to load availability' }, { status: 502 })
  }
}
