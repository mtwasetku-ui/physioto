import type { Metadata } from 'next'
import AuthProvider from '@/components/portal/AuthProvider'

// Staff-only area — never indexed. Also blocked in robots.txt as a
// second layer, but the noindex tag is what actually keeps it out of
// search results for engines that crawl it anyway.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

// Applies to everything under /portal, including /portal/login — just the
// session context, no visible chrome. The staff header/nav lives one level
// down in the (staff) route group so the login page doesn't inherit it.
export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <AuthProvider>{children}</AuthProvider>
    </div>
  )
}
