-- Adds the forced-password-change flag on top of password auth
-- (see 002_add_password_auth.sql). Run this against the Neon database
-- before deploying the code that reads/writes it.

alter table allowed_emails
  add column if not exists must_change_password boolean not null default false;
