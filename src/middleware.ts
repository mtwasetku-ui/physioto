import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { touchLastSeen } from '@/lib/db'

// Protects /portal/* (any signed-in, allow-listed physio) and /admin/*
// (Micheal only). Actual allow-list membership is already enforced at
// sign-in time (see lib/auth.ts signIn callback) — this just checks a
// valid session exists, plus the extra admin-email check for /admin.
// Staff/admin pages show live, frequently-mutated data (allowed emails,
// patient assignments, notes). Browsers (Edge in particular, via its disk
// cache / back-forward restore) can otherwise serve a stale copy of /admin
// or /portal on a plain refresh even though the server itself always
// renders fresh (see admin/page.tsx export const dynamic = 'force-dynamic').
// This forces every response in this tree to be explicitly non-cacheable
// client-side too, regardless of browser.
function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
}

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/portal/login')) {
    return withNoStore(NextResponse.next())
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token?.email) {
    const loginUrl = new URL('/portal/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return withNoStore(NextResponse.redirect(loginUrl))
  }

  if (pathname.startsWith('/admin')) {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
    if (!adminEmail || token.email.toLowerCase() !== adminEmail) {
      return withNoStore(NextResponse.redirect(new URL('/portal', req.url)))
    }
  }

  if (pathname.startsWith('/portal')) {
    // Background write via waitUntil — doesn't delay the actual page
    // response. Deliberately not awaited/checked for failure here (a
    // missed "last seen" update isn't worth failing the page load over).
    event.waitUntil(touchLastSeen(token.email).catch((err) => console.error('[middleware] touchLastSeen failed', err)))
  }

  return withNoStore(NextResponse.next())
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
}
