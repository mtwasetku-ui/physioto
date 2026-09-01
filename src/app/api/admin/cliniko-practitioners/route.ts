import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Backs the practitioner picker on the admin Staff page (see
// /api/admin/practitioner-link and AdminClient.tsx) — lets admin link each
// physio's portal account to their real Cliniko practitioner id. Cliniko's
// "Practitioner" and "User" are separate resources with separate IDs (see
// https://docs.api.cliniko.com/openapi/practitioner). Settings → Users
// gives you a User ID, not necessarily the Practitioner ID the API needs.
// This calls GET /practitioners directly so we can see the real
// practitioner id alongside the linked user, name-matched to confirm.
export async function GET() {
  const session = await getServerSession(authOptions)
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
  const email = session?.user?.email?.toLowerCase()
  if (!email || !adminEmail || email !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = process.env.CLINIKO_API_BASE
  const key = process.env.CLINIKO_API_KEY
  const userAgent = process.env.CLINIKO_USER_AGENT || 'PhysioToHome (info@physiotohome.com)'

  if (!base || !key) {
    return NextResponse.json({ error: 'CLINIKO_API_BASE / CLINIKO_API_KEY not set' }, { status: 500 })
  }

  try {
    const res = await fetch(`${base}/practitioners?per_page=100`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
        Accept: 'application/json',
        'User-Agent': userAgent,
      },
    })
    // Cliniko's practitioner ids are ~19-digit numbers, well past
    // Number.MAX_SAFE_INTEGER (~9e15). A plain res.json()/JSON.parse silently
    // rounds them (e.g. 2029549485620733908 -> 2029549485620734000), which
    // then can never match the exact id string stored in our database — the
    // "Books as" picker looks unlinked even when the saved id is correct.
    // Quote long integer "id" values in the raw text before parsing so they
    // come through as exact strings instead of lossy numbers.
    const rawText = await res.text()
    const safeText = rawText.replace(/"id":(\d{16,})/g, '"id":"$1"')
    const data = JSON.parse(safeText)
    if (!res.ok) {
      return NextResponse.json({ error: `Cliniko GET /practitioners failed: ${res.status}`, data }, { status: 502 })
    }
    const practitioners = (data.practitioners ?? []).map((p: any) => ({
      practitioner_id: String(p.id),
      name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
      linked_user_url: p.user?.links?.self ?? null,
    }))
    return NextResponse.json({ practitioners })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch practitioners' }, { status: 502 })
  }
}
