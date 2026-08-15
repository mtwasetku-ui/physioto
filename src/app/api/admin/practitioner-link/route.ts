import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setClinikoPractitionerId, writeAuditLog } from '@/lib/db'

// Belt-and-braces admin gate, same pattern as the other /api/admin/* routes.
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  if (!email || !adminEmail || email.toLowerCase() !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email }
}

// POST — link (or clear, with practitionerId: null) a staff email to a
// real Cliniko practitioner id (from /api/admin/cliniko-practitioners).
// This is what lets that physio book appointments under their own name
// instead of Micheal's — see /api/appointments.
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { email, practitionerId } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const record = await setClinikoPractitionerId(email, practitionerId || null)
  if (!record) return NextResponse.json({ error: 'No such staff email' }, { status: 404 })

  await writeAuditLog({
    actorEmail: auth.email!,
    action: 'admin_practitioner_link',
    detail: { email, practitionerId: practitionerId || null },
  })
  return NextResponse.json({ email: record })
}
