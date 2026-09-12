import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { getAllowedEmailAuth, setPasswordHash, writeAuditLog } from '@/lib/db'

const MIN_PASSWORD_LENGTH = 8

// POST /api/portal/change-password — self-service, for a practitioner who's
// already signed in. Deliberately separate from the admin reset endpoint
// (/api/admin/emails/invite): this one requires proving you know the
// *current* password rather than an admin override, and only ever touches
// the caller's own row (email comes from the session, never the request
// body — nobody can change someone else's password this way).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` }, { status: 400 })
  }

  try {
    const record = await getAllowedEmailAuth(email)
    if (!record || !record.password_hash) {
      return NextResponse.json({ error: 'No password set on this account yet — ask Micheal to send you one' }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, record.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await setPasswordHash(email, newHash, false)
    await writeAuditLog({ actorEmail: email, action: 'portal_password_change' })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to change password' }, { status: 500 })
  }
}
