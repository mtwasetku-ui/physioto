-- Physio to Home — Staff Portal schema
-- Run against Vercel Postgres. Safe to re-run (IF NOT EXISTS guards).

create table if not exists allowed_emails (
  id            serial primary key,
  email         text not null unique,
  display_name  text,
  created_at    timestamptz not null default now()
);

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
