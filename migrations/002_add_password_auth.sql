-- Adds password-based login on top of the existing allow-list.
-- Run this against the Neon database before deploying the credentials-auth code.

alter table allowed_emails
  add column if not exists password_hash text;

-- verification_tokens was only ever needed by the NextAuth Email (magic-link)
-- provider's adapter. It's no longer written to or read from once auth.ts
-- switches to Credentials. Safe to drop once you've confirmed the new login
-- flow works in production — left as a manual step rather than dropped here
-- automatically, in case you want to keep it a little longer as a rollback
-- cushion.
-- drop table if exists verification_tokens;
