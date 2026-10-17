'use client'

import { usePathname } from 'next/navigation'

// The marketing header and footer belong to the public site only. The staff
// portal and admin render their own shell, so skip the public chrome there
// (same prefixes ClarityScript already excludes).
const APP_PREFIXES = ['/portal', '/admin']

export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const inApp = APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (inApp) return null
  return <>{children}</>
}

