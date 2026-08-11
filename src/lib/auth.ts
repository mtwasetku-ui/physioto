import type { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { createTransport } from 'nodemailer'
import { isEmailAllowed } from '@/lib/db'
import { PostgresVerificationAdapter } from '@/lib/authAdapter'

// Magic-link sign-in, gated to a hand-managed allow-list (see app/admin).
// Emails are sent via the practice's existing Zoho Mail account over SMTP —
// no separate transactional-email account to manage for 2-3 contractors.
//
// The Email provider requires an adapter to store verification tokens —
// see authAdapter.ts. Without it NextAuth fails validation before ever
// attempting to send mail (EMAIL_REQUIRES_ADAPTER_ERROR).
export const authOptions: NextAuthOptions = {
  adapter: PostgresVerificationAdapter(),
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
      // TEMP DEBUG: log the real SMTP config + Zoho's raw response so we can
      // see in Vercel's runtime logs why messages aren't landing in Sent.
      // Safe to remove once delivery is confirmed working again.
      async sendVerificationRequest({ identifier, url, provider }) {
        const serverConfig = provider.server as {
          host: string
          port: number
          auth: { user: string }
        }
        console.log('[magic-link] config', {
          host: serverConfig.host,
          port: serverConfig.port,
          user: serverConfig.auth.user,
          from: provider.from,
          to: identifier,
        })
        const transport = createTransport(provider.server)
        try {
          const result = await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `Sign in to Physio to Home Staff Portal`,
            text: `Sign in: ${url}\n\nThis link expires in 15 minutes.`,
            html: `<p><a href="${url}">Sign in to the Staff Portal</a></p><p>This link expires in 15 minutes.</p>`,
          })
          console.log('[magic-link] send result', {
            accepted: result.accepted,
            rejected: result.rejected,
            pending: result.pending,
            response: result.response,
            messageId: result.messageId,
          })
          const failed = result.rejected.concat(result.pending).filter(Boolean)
          if (failed.length) {
            throw new Error(`Email (${failed.join(', ')}) could not be sent`)
          }
        } catch (error) {
          console.error('[magic-link] send failed', error)
          throw error
        }
      },
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
