import type { Metadata } from 'next'
import '@/app/portal-demo/demo.css'

export const metadata: Metadata = {
  title: 'Portal Design Preview | Physio to Home',
  robots: { index: false, follow: false },
}

export default function PortalDemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-demo min-h-screen">{children}</div>
}
