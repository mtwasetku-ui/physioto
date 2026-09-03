import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listOpenSmsRequests, listRecentlyClosedSmsRequests } from '@/lib/db'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  try {
    const [open, closed] = await Promise.all([listOpenSmsRequests(), listRecentlyClosedSmsRequests()])
    return NextResponse.json({ open, closed })
  } catch (err) {
    console.error('[api:admin/sms-requests:GET] failed', err)
    return NextResponse.json({ error: 'Failed to load the SMS queue' }, { status: 500 })
  }
}
