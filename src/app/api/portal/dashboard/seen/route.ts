import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markDashboardSeen } from '@/lib/db'

// Called when a signed-in person opens the Dashboard: clears their "new"
// badge and the banner above the calendar. Only ever touches the caller's
// own row (email comes from the session, not the request).
export async function POST() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await markDashboardSeen(email)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api:portal/dashboard/seen:POST] failed', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
