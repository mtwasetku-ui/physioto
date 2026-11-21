import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLatestLiveDashboardPost } from '@/lib/dashboardLatest'
import type { LatestDashboardPost } from '@/lib/dashboardLatest'

// Strip above the calendar showing the most recent live dashboard notice,
// read or not. Replaces DashboardBanner (which only showed unread pinned
// posts). Clicking it opens that notice on the Dashboard.
// Never breaks the calendar — any failure (including the table not existing
// yet) just renders nothing.
function snippet(body: string) {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > 110 ? `${flat.slice(0, 108)}…` : flat
}

export default async function LatestAnnouncement() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return null

  let post: LatestDashboardPost | null = null
  try {
    post = await getLatestLiveDashboardPost(email)
  } catch (err) {
    console.error('[LatestAnnouncement] failed to load latest post', err)
    return null
  }
  if (!post) return null

  // Fixed zone so the date doesn't shift between server (UTC) and Tasmania.
  const when = new Date(post.publish_at).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Australia/Hobart',
  })

  return (
    <Link
      href={`/portal/dashboard?post=${encodeURIComponent(post.id)}`}
      aria-label={`Open announcement on the Dashboard: ${post.title}`}
      className={`mb-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-border border-l-[5px] bg-white px-4 py-3.5 transition-shadow hover:shadow-md sm:grid-cols-[auto_1fr_auto] ${
        post.is_unread ? 'border-l-[var(--portal-signal)]' : 'border-l-primary/30'
      }`}
    >
      <span
        aria-hidden
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          post.is_unread ? 'bg-[var(--portal-signal)] text-white' : 'bg-secondary text-primary'
        }`}
      >
        <Megaphone className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Latest announcement</span>
          {post.is_unread && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">New</span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-foreground">{post.title}</span>
        <span className="block text-sm text-muted-foreground">{snippet(post.body)}</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {when}
          {post.author_name ? ` · ${post.author_name}` : ''}
        </span>
      </span>
      <span className="col-span-2 text-xs font-bold text-primary sm:col-span-1">View on Dashboard →</span>
    </Link>
  )
}
