import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays } from 'lucide-react'
import PortalSignOutButton from '@/components/portal/PortalSignOutButton'

// Chrome for the signed-in staff area only — page.tsx (assigned patients
// list) and patient/[id] live inside this (staff) group. /portal/login
// sits outside the group and never sees this header.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Physio to Home" width={32} height={32} />
            <span className="serif text-lg text-primary font-semibold">Staff Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/portal/diary"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>
            <PortalSignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </>
  )
}
