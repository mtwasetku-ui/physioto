import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateDashboardPost } from '@/lib/db'
import { isAdminEmail } from '@/lib/isAdmin'
import { parsePostFields } from '@/lib/dashboardValidation'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return {}
}

// Edit, pin/unpin or archive a post (archive = { archived: true }).
// Admin only. Nothing is hard-deleted.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = parsePostFields(body, true)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (Object.keys(parsed.fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const updated = await updateDashboardPost(params.id, parsed.fields)
    if (!updated) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api:admin/dashboard-posts/[id]:PATCH] failed', err)
    return NextResponse.json({ error: 'Failed to update the post' }, { status: 500 })
  }
}
