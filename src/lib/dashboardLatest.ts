import { sql } from '@/lib/db'

// Most recent live dashboard post for the strip above the calendar.
// "Live" = same rule as listLiveDashboardPosts in db.ts: not archived,
// publish_at has passed, not past expires_at. Ordered by publish date only
// (not pinned-first) so the strip always shows what was posted last.
// Local database only — no Cliniko calls.
export interface LatestDashboardPost {
  id: string
  title: string
  body: string
  author_name: string | null
  publish_at: string
  is_unread: boolean
}

export async function getLatestLiveDashboardPost(email: string): Promise<LatestDashboardPost | null> {
  const rows = await sql`
    select p.id::text as id, p.title, p.body, a.display_name as author_name, p.publish_at,
      (p.publish_at > coalesce(me.dashboard_last_seen_at, 'epoch'::timestamptz)) as is_unread
    from announcements p
    left join allowed_emails a on a.email = p.author_email
    left join allowed_emails me on me.email = ${email.toLowerCase()}
    where p.archived = false
      and p.publish_at <= now()
      and (p.expires_at is null or p.expires_at > now())
    order by p.publish_at desc
    limit 1
  `
  return (rows[0] as LatestDashboardPost | undefined) ?? null
}
