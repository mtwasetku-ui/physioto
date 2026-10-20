'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CalendarDays, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  {
    href: '/portal/diary',
    label: 'Calendar',
    icon: CalendarDays,
    isActive: (p: string) => p === '/portal' || p.startsWith('/portal/diary'),
  },
  {
    href: '/portal/patients',
    label: 'Patients',
    icon: Users,
    // Also highlights while viewing an individual patient (/portal/patient/…)
    isActive: (p: string) => p.startsWith('/portal/patient'),
  },
  {
    href: '/portal/account',
    label: 'Password',
    icon: KeyRound,
    isActive: (p: string) => p.startsWith('/portal/account'),
  },
]

// Desktop: vertical list in the sidebar.
export function RailNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav aria-label="Portal" className="portal-on-ink flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-11 items-center gap-3 rounded-md px-3 text-[15px] font-medium transition-colors',
              active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[var(--portal-signal)]"
              />
            )}
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile: thumb-reach tab bar fixed to the bottom of the screen.
export function TabBar() {
  const pathname = usePathname() ?? ''
  return (
    <nav
      aria-label="Portal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-0 h-[3px] w-10 -translate-x-1/2 rounded-b-full bg-[var(--portal-signal)]"
                  />
                )}
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

