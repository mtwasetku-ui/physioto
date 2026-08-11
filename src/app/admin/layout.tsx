import Link from 'next/link'
import AuthProvider from '@/components/portal/AuthProvider'
import PortalSignOutButton from '@/components/portal/PortalSignOutButton'

// Access control for this whole tree is enforced in middleware.ts (checks
// the signed-in email against ADMIN_EMAIL) — this layout is chrome only.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-muted/40">
        <header className="border-b border-border bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/admin" className="serif text-lg text-primary font-semibold">
              Portal Admin
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/portal" className="text-sm text-muted-foreground hover:text-foreground">
                Back to portal
              </Link>
              <PortalSignOutButton />
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </AuthProvider>
  )
}
