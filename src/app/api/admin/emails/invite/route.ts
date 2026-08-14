import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeAuditLog } from '@/lib/db'
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

// POST /api/admin/emails/invite — sends an actual email to a staff address
// that's already on the allow-list, pointing them to /portal/login.
//
// Deliberately NOT the NextAuth magic link itself — that's generated only
// when someone submits their own email on the login form (it's short-lived,
// 15 minutes, and tied to that specific sign-in attempt). Sending a
// "one-time link" from here that then sits unused in an inbox for days
// would just expire before they click it. Instead this sends a plain
// pointer to the login page; they get their own live magic link the
// moment they actually go there and ask for one.
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email, displayName } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const siteUrl = process.env.NEXTAUTH_URL || 'https://www.physiotohome.com'
  const loginUrl = `${siteUrl.replace(/\/$/, '')}/portal/login`
  const greeting = displayName ? `Hi ${displayName},` : 'Hi,'

  try {
    await sendMail({
      to: email,
      subject: `You're invited to the Physio to Home Staff Portal`,
      text: `${greeting}\n\nMicheal has set you up with access to the Physio to Home Staff Portal, where you can log treatment notes and view your assigned patients.\n\nSign in here: ${loginUrl}\n\nEnter this email address (${email}) and you'll be sent a one-time sign-in link — no password needed.`,
      html: `<p>${greeting}</p><p>Micheal has set you up with access to the Physio to Home Staff Portal, where you can log treatment notes and view your assigned patients.</p><p><a href="${loginUrl}">Sign in here</a></p><p>Enter this email address (${email}) and you'll be sent a one-time sign-in link — no password needed.</p>`,
    })
    await writeAuditLog({ actorEmail: auth.email!, action: 'admin_email_add', clinikoPatientId: undefined, detail: { email, invite_sent: true } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to send invite email' }, { status: 502 })
  }
}
