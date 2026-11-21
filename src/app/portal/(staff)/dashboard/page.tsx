import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listLiveDashboardPosts, listManageableDashboardPosts, listDashboardReplies } from '@/lib/db'
import type { DashboardPostRow, DashboardReplyRow } from '@/lib/db'
import { isAdminEmail } from '@/lib/isAdmin'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

// Staff Dashboard: notices from admin. Auth is enforced by middleware; this
// page only decides what to show. Local database only — no Cliniko calls.
// ?post=<id> (from the strip above the calendar) opens and highlights that
// notice. It's only used to pick which strip to open, never to query.
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { post?: string | string[] }
}) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? ''
  const isAdmin = isAdminEmail(email)
  const rawFocus = Array.isArray(searchParams?.post) ? searchParams?.post[0] : searchParams?.post
  const focusId = rawFocus && /^\d{1,18}$/.test(rawFocus) ? rawFocus : null

  let posts: DashboardPostRow[] = []
  let loadError = false
  try {
    posts = isAdmin ? await listManageableDashboardPosts(email) : await listLiveDashboardPosts(email)
  } catch (err) {
    console.error('[page:portal/dashboard] failed to load posts', err)
    loadError = true
  }

  // Replies are separate so a problem there (e.g. migration 005 not run yet)
  // never hides the posts themselves.
  let replies: DashboardReplyRow[] = []
  try {
    replies = await listDashboardReplies(isAdmin ? 'manageable' : 'live')
  } catch (err) {
    console.error('[page:portal/dashboard] failed to load replies', err)
  }

  return (
    <DashboardClient
      posts={posts}
      replies={replies}
      currentEmail={email.toLowerCase()}
      isAdmin={isAdmin}
      loadError={loadError}
      focusId={focusId}
    />
  )
}
