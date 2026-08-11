import type { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { isEmailAllowed } from '@/lib/db'

// Magic-link sign-in, gated to a hand-managed allow-list (see app/admin).
// Emails are sent via the practice's existing Zoho Mail account over SMTP —
// no separate transactional-email account to manage for 2-3 contractors.
export const authOptions: NextAuthOptions = {
  providers: [
    EmailProvider({
      server: {
        host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com.au',
        port: Number(process.env.ZOHO_SMTP_PORT || 465),
        secure: true,
        auth: {
          user: process.env.ZOHO_SMTP_USER,
          pass: process.env.ZOHO_SMTP_PASSWORD,
        },
      },
      from: process.env.ZOHO_SMTP_FROM || process.env.ZOHO_SMTP_USER,
      maxAge: 15 * 60, // magic link expires after 15 minutes
    }),
  ],
  pages: {
    signIn: '/portal/login',
    verifyRequest: '/portal/login/check-email',
    error: '/portal/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Blocks sign-in entirely for emails not on the allow-list, rather than
    // letting them through and gating later — no session is ever issued.
    async signIn({ user }) {
      if (!user.email) return false
      return isEmailAllowed(user.email)
    },
    async session({ session }) {
      return session
    },
  },
}
