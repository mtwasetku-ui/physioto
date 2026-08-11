import AuthProvider from '@/components/portal/AuthProvider'

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
