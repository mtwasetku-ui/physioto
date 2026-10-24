import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { countUnreadDashboardPosts } from '@/lib/db'
import PortalSignOutButton from '@/components/portal/PortalSignOutButton'
import { RailNav, TabBar } from '@/components/portal/PortalNav'

// Chrome for the signed-in staff area only — page.tsx (assigned patients
// list), diary, account and patient/[id] live inside this (staff) group.
// /portal/login sits outside the group and never sees this shell.
//
// Desktop: fixed sidebar on the left.
// Mobile:  slim top bar + tab bar at the bottom, within thumb reach.
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? ''
  const name = session?.user?.name || email

  // Unread dashboard posts for the nav badge. A failure here (e.g. the
  // migration hasn't been run yet) must never take the portal down — just
  // show no badge.
  let unread = 0
  if (email) {
    try {
      unread = await countUnreadDashboardPosts(email)
    } catch (err) {
      console.error('[layout:portal/(staff)] countUnreadDashboardPosts failed', err)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="portal-on-ink fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[var(--portal-ink)] text-white lg:flex">
        <Link href="/portal" className="flex items-center gap-3 px-5 pb-8 pt-6">
          <Image src="/images/logo.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <span className="font-display text-[17px] font-semibold leading-tight">
            Physio to Home
            <span className="block text-xs font-normal text-white/60">Staff portal</span>
          </span>
        </Link>

        <div className="px-3">
          <RailNav unread={unread} />
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          {name && <p className="truncate text-sm text-white/90">{name}</p>}
          {email && name !== email && <p className="truncate text-xs text-white/60">{email}</p>}
          <PortalSignOutButton className="-ml-2 mt-3 w-[calc(100%+0.5rem)] justify-start px-2 text-white/80 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="portal-on-ink sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--portal-ink)] px-4 text-white lg:hidden">
        <Link href="/portal" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="font-display text-base font-semibold">Staff portal</span>
        </Link>
        <PortalSignOutButton className="text-white/80 hover:bg-white/10 hover:text-white" />
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-12">
          {children}
        </main>
      </div>

      <TabBar unread={unread} />
    </div>
  )
}
