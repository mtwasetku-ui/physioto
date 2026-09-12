import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { setPasswordHash, writeAuditLog } from '@/lib/db'
import { sendMail } from '@/lib/mail'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

// Generates a random, easy-to-read temporary password — avoids visually
// ambiguous characters (0/O, 1/l/I) since this often gets read off a phone
// screen or retyped from an email.
function generateTempPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  let out = ''
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return out
}

// POST /api/admin/emails/invite — sets (or resets) a staff member's portal
// password and emails it to them, since this replaces the old magic-link
// flow where nothing needed to be generated up front.
//
// The email must already be on the allow-list (added via /api/admin/emails)
// — setPasswordHash throws if it isn't, same "no silent no-op" behaviour as
// the rest of db.ts.
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email, displayName } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const siteUrl = process.env.NEXTAUTH_URL || 'https://www.physiotohome.com'
  const loginUrl = `${siteUrl.replace(/\/$/, '')}/portal/login`
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,'
  const tempPassword = generateTempPassword()

  try {
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    await setPasswordHash(email, passwordHash)

    await sendMail({
      to: email,
      subject: `Your Physio to Home Staff Portal login`,
      text: `${greeting}\n\nMicheal has set you up with access to the Physio to Home Staff Portal, where you can log treatment notes and view your assigned patients.\n\nSign in here: ${loginUrl}\n\nEmail: ${email}\nTemporary password: ${tempPassword}\n\nYou can keep using this password, or ask Micheal to reset it any time.`,
      html: `<p>${greeting}</p><p>Micheal has set you up with access to the Physio to Home Staff Portal, where you can log treatment notes and view your assigned patients.</p><p><a href="${loginUrl}">Sign in here</a></p><p>Email: ${email}<br/>Temporary password: <strong>${tempPassword}</strong></p><p>You can keep using this password, or ask Micheal to reset it any time.</p>`,
    })
    await writeAuditLog({ actorEmail: auth.email!, action: 'admin_password_reset', clinikoPatientId: undefined, detail: { email } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to set password / send email' }, { status: 502 })
  }
}
