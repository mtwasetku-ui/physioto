import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDashboardPost } from '@/lib/db'
import { isAdminEmail } from '@/lib/isAdmin'
import { parsePostFields } from '@/lib/dashboardValidation'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!isAdminEmail(email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { email: email as string }
}

// Create a dashboard post. Admin only (checked here, not just in the UI).
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const body = await req.json().catch(() => null)
  const parsed = parsePostFields(body, false)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const f = parsed.fields
  try {
    const created = await createDashboardPost({
      authorEmail: auth.email,
      title: f.title as string,
      body: f.body as string,
      pinned: f.pinned ?? false,
      publishAt: f.publishAt ?? null,
      expiresAt: f.expiresAt ?? null,
    })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    console.error('[api:admin/dashboard-posts:POST] failed', err)
    return NextResponse.json({ error: 'Failed to create the post' }, { status: 500 })
  }
}
