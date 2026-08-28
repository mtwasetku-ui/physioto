-- Physio to Home — Staff Portal schema
-- Run against Vercel Postgres. Safe to re-run (IF NOT EXISTS guards).

create table if not exists allowed_emails (
  id            serial primary key,
  email         text not null unique,
  display_name  text,
  created_at    timestamptz not null default now()
);

-- Added after initial launch — was already live in production but missing
-- from this file (schema drift). Included here so a fresh database matches
-- what's actually deployed.
alter table allowed_emails add column if not exists cliniko_practitioner_id text;

-- Updated on every /portal/* page load (see middleware.ts) — "last active",
-- distinct from a login event: a practitioner can stay signed in (JWT
-- session) for days without hitting the Email provider's sign-in flow
-- again, so this is the more useful "are they actually using it" signal.
alter table allowed_emails add column if not exists last_seen_at timestamptz;

create table if not exists patient_assignments (
  id            serial primary key,
  email         text not null references allowed_emails(email) on delete cascade,
  cliniko_patient_id text not null,
  patient_label text, -- e.g. "Jane Smith" — cached label so the admin UI doesn't need a live Cliniko call to render the list
  created_at    timestamptz not null default now(),
  unique (email, cliniko_patient_id)
);

create index if not exists idx_patient_assignments_email on patient_assignments(email);

create table if not exists audit_log (
  id              serial primary key,
  actor_email     text not null,
  action          text not null, -- 'note_create' | 'note_update' | 'attachment_upload' | 'attachment_view' | 'admin_email_add' | 'admin_email_remove' | 'admin_assignment_add' | 'admin_assignment_remove'
  cliniko_patient_id text,
  detail          jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_log_patient on audit_log(cliniko_patient_id);
create index if not exists idx_audit_log_actor on audit_log(actor_email);

-- Needed for gen_random_uuid() below.
create extension if not exists pgcrypto;

-- A "series" is a set of Cliniko appointments created together from one
-- repeat booking (see /api/appointments POST — repeat/repeatCount).
-- Cliniko itself has no concept of a series; each occurrence is created
-- as an independent individual_appointment. This table is the only place
-- that remembers which appointments belong together, so that cancelling
-- one occurrence can offer "cancel this and all future ones in the
-- series" as well as "just this one".
create table if not exists appointment_series (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null references allowed_emails(email) on delete cascade,
  cliniko_patient_id  text not null,
  frequency           text not null, -- 'weekly' | 'fortnightly' | 'monthly'
  created_at          timestamptz not null default now()
);

create table if not exists appointment_series_members (
  id                      serial primary key,
  series_id               uuid not null references appointment_series(id) on delete cascade,
  cliniko_appointment_id  text not null unique,
  starts_at               timestamptz not null,
  created_at              timestamptz not null default now()
);

create index if not exists idx_series_members_series on appointment_series_members(series_id);
