import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteDashboardReply } from '@/lib/db'
import { isAdminEmail } from '@/lib/isAdmin'

// Delete a reply: allowed for its author, or the admin (checked in SQL, so a
// request for someone else's reply simply finds nothing to delete).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!/^\d+$/.test(params.id)) {
    return NextResponse.json({ error: 'Invalid reply id' }, { status: 400 })
  }

  try {
    const deleted = await deleteDashboardReply(params.id, email, isAdminEmail(email))
    if (!deleted) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api:portal/dashboard/replies/[id]:DELETE] failed', err)
    return NextResponse.json({ error: 'Failed to delete the reply' }, { status: 500 })
  }
}
