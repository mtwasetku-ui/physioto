import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { touchLastSeen, getMustChangePassword } from '@/lib/db'

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

  // A forced password change (set whenever admin sends/resets one — see
  // /api/admin/emails/invite) takes precedence over everything else in
  // this tree, including the admin gate below: /portal/account is the
  // only place they're allowed until it's done. Checked fresh from the DB
  // on every request rather than embedded in the JWT, since the JWT isn't
  // re-issued mid-session and would otherwise keep forcing the redirect
  // for days after they'd already changed it.
  if (!pathname.startsWith('/portal/account')) {
    const mustChangePassword = await getMustChangePassword(token.email).catch((err) => {
      console.error('[middleware] getMustChangePassword failed', err)
      return false // fail open on a DB blip rather than locking everyone out
    })
    if (mustChangePassword) {
      return withNoStore(NextResponse.redirect(new URL('/portal/account?forced=1', req.url)))
    }
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
