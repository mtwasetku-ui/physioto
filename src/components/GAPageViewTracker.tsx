'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const GA_ID = 'G-78YHHCX8JE'

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export default function GAPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || typeof window.gtag !== 'function') return

    const query = searchParams.toString()
    const url = query ? `${pathname}?${query}` : pathname

    window.gtag('config', GA_ID, {
      page_path: url,
    })
  }, [pathname, searchParams])

  return null
}
