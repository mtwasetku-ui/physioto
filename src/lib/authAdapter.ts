import type { Adapter, AdapterUser } from 'next-auth/adapters'
import { sql } from '@/lib/db'

// NextAuth's Email (magic-link) provider requires an adapter with these
// three methods to store and verify sign-in tokens — see:
// https://next-auth.js.org/errors#email_requires_adapter_error
//
// We don't need full user/account/session persistence: the app uses JWT
// sessions and gates access via the hand-managed `allowed_emails` table
// (see `isEmailAllowed` in db.ts). But NextAuth's internal callback handler
// (core/lib/callback-handler.js) unconditionally calls `getUserByEmail`,
// then `createUser` when no user is found, and `getUser` when a session
// cookie is already present — so all three must exist on the adapter even
// though we have no real users table. They just fabricate an in-memory
// user shaped `{ id: email, email }`, which is all a JWT-session app needs.
//
// Requires a `verification_tokens` table:
//
//   create table verification_tokens (
//     identifier text not null,
//     token text not null,
//     expires timestamptz not null,
//     primary key (identifier, token)
//   );

export function PostgresVerificationAdapter(): Adapter {
  return {
    async createVerificationToken({ identifier, token, expires }) {
      await sql`
        insert into verification_tokens (identifier, token, expires)
        values (${identifier}, ${token}, ${expires.toISOString()})
      `
      return { identifier, token, expires }
    },

    async useVerificationToken({ identifier, token }) {
      const rows = await sql`
        delete from verification_tokens
        where identifier = ${identifier} and token = ${token}
        returning identifier, token, expires
      `
      if (rows.length === 0) return null
      const row = rows[0] as { identifier: string; token: string; expires: string }
      return { identifier: row.identifier, token: row.token, expires: new Date(row.expires) }
    },

    async getUserByEmail() {
      // No persistent users table — see comment above.
      return null
    },

    async createUser(user: Omit<AdapterUser, 'id'>) {
      // Fabricated, not persisted — id doubles as the email since that's
      // all downstream code (the jwt callback, isEmailAllowed) needs.
      return { id: user.email as string, email: user.email as string, emailVerified: user.emailVerified ?? null }
    },

    async getUser(id: string) {
      return { id, email: id, emailVerified: null }
    },
  } as Adapter
}
