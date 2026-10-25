import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createDashboardReply } from '@/lib/db'
import { parseReplyBody } from '@/lib/dashboardValidation'

// Any signed-in staff member can reply to a live dashboard post. The author
// is always taken from the session, never from the request body.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'Invalid post id' }, { status: 400 })
  }

  const parsed = parseReplyBody(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const created = await createDashboardReply({ postId: params.id, authorEmail: email, body: parsed.body })
    if (!created) {
      return NextResponse.json({ error: 'This post is no longer open for replies' }, { status: 404 })
    }
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    console.error('[api:portal/dashboard/posts/[id]/replies:POST] failed', err)
    return NextResponse.json({ error: 'Failed to send your reply' }, { status: 500 })
  }
}
