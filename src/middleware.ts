import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Protects /portal/* (any signed-in, allow-listed physio) and /admin/*
// (Micheal only). Actual allow-list membership is already enforced at
// sign-in time (see lib/auth.ts signIn callback) — this just checks a
// valid session exists, plus the extra admin-email check for /admin.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/portal/login')) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token?.email) {
    const loginUrl = new URL('/portal/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin')) {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase()
    if (!adminEmail || token.email.toLowerCase() !== adminEmail) {
      return NextResponse.redirect(new URL('/portal', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*'],
}
