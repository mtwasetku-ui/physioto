import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getAllowedEmailAuth, writeAuditLog } from '@/lib/db'

// Email + password sign-in, gated to the same hand-managed allow-list as
// before (see app/admin) — only now the gate is "this email has a
// password_hash set" instead of "this email exists at all". An email can
// be allow-listed (added by admin) without yet having a password if the
// admin hasn't sent/reset one — that account simply can't sign in until
// it does.
//
// No adapter needed here (unlike the old Email provider) — Credentials
// doesn't touch verification tokens, and sessions are JWT-based so there's
// no persistent user/session table to satisfy either.
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password
        if (!email || !password) return null

        const record = await getAllowedEmailAuth(email)
        if (!record || !record.password_hash) return null

        const valid = await bcrypt.compare(password, record.password_hash)
        if (!valid) return null

        return { id: record.email, email: record.email, name: record.display_name ?? undefined }
      },
    }),
  ],
  pages: {
    signIn: '/portal/login',
    error: '/portal/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session }) {
      return session
    },
  },
  events: {
    // Fires once per actual authentication (credentials verified), not per
    // page view — a JWT session can persist for days without this firing
    // again. For "did they open the portal today" see last_seen_at on
    // allowed_emails instead (updated by middleware on every /portal hit).
    async signIn({ user }) {
      if (!user.email) return
      await writeAuditLog({ actorEmail: user.email, action: 'portal_login' })
    },
  },
}
