import Link from 'next/link'
import { Pin } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listUnreadPinnedDashboardPosts } from '@/lib/db'

// Slim strip above the calendar: only shows pinned dashboard posts the
// person hasn't seen yet, and disappears once they open the dashboard.
// Never breaks the calendar — any failure (including the table not existing
// yet) just renders nothing.
export default async function DashboardBanner() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return null

  let posts: { id: string; title: string }[] = []
  try {
    posts = await listUnreadPinnedDashboardPosts(email)
  } catch (err) {
    console.error('[DashboardBanner] failed to load pinned posts', err)
    return null
  }
  if (posts.length === 0) return null

  return (
    <Link
      href="/portal/dashboard"
      className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 transition-colors hover:bg-amber-100"
    >
      <Pin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="font-medium">New on the dashboard: </span>
        {posts.map((p) => p.title).join(' · ')}
      </span>
    </Link>
  )
}
