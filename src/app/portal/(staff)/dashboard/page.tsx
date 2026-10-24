import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listLiveDashboardPosts, listManageableDashboardPosts } from '@/lib/db'
import type { DashboardPostRow } from '@/lib/db'
import { isAdminEmail } from '@/lib/isAdmin'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

// Staff Dashboard: notices from admin. Auth is enforced by middleware; this
// page only decides what to show. Local database only — no Cliniko calls.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? ''
  const isAdmin = isAdminEmail(email)

  let posts: DashboardPostRow[] = []
  let loadError = false
  try {
    posts = isAdmin ? await listManageableDashboardPosts(email) : await listLiveDashboardPosts(email)
  } catch (err) {
    console.error('[page:portal/dashboard] failed to load posts', err)
    loadError = true
  }

  return <DashboardClient posts={posts} isAdmin={isAdmin} loadError={loadError} />
}
