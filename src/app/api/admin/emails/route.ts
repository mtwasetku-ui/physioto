import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addAllowedEmail, removeAllowedEmail, writeAuditLog } from '@/lib/db'

// Belt-and-braces: middleware.ts already restricts /admin/* to ADMIN_EMAIL,
// but these API routes are checked independently too, since API routes
// aren't guaranteed to only ever be called from the admin UI.
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email, displayName } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const record = await addAllowedEmail(email, displayName)
  await writeAuditLog({ actorEmail: auth.email!, action: 'admin_email_add', detail: { email } })
  return NextResponse.json({ email: record })
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  await removeAllowedEmail(email)
  await writeAuditLog({ actorEmail: auth.email!, action: 'admin_email_remove', detail: { email } })
  return NextResponse.json({ ok: true })
}
