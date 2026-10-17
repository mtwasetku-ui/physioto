import Link from 'next/link'
import Image from 'next/image'
import '@/app/portal-theme.css'
import AuthProvider from '@/components/portal/AuthProvider'
import PortalSignOutButton from '@/components/portal/PortalSignOutButton'

// Access control for this whole tree is enforced in middleware.ts (checks
// the signed-in email against ADMIN_EMAIL) — this layout is chrome only.
// Uses the same theme and colours as the staff portal.
const navLink =
  'rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="portal-theme min-h-screen bg-background text-foreground">
        <header className="portal-on-ink bg-[var(--portal-ink)] text-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
              <Image src="/images/logo.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
              <span className="font-display hidden truncate text-base font-semibold sm:inline">Portal admin</span>
              <span className="sr-only sm:hidden">Portal admin</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Admin">
              <Link href="/admin/sms" className={navLink}>
                SMS requests
              </Link>
              <Link href="/portal" className={navLink}>
                <span className="sm:hidden">Portal</span>
                <span className="hidden sm:inline">Back to portal</span>
              </Link>
              <PortalSignOutButton className="text-white/75 hover:bg-white/10 hover:text-white" />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </AuthProvider>
  )
}

