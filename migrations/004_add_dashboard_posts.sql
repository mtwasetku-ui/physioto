-- Adds the staff Dashboard (posts shown at /portal/dashboard).
-- Run this against the Neon database in the Neon console before relying on
-- the dashboard code (the portal pages tolerate the table being missing
-- and just show no posts / no badge, but posting needs it).

create table if not exists announcements (
  id bigserial primary key,
  title text not null,
  body text not null,
  author_email text not null,
  pinned boolean not null default false,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_live_idx
  on announcements (archived, publish_at desc);

-- Per-person "last time they opened the Dashboard". Posts published after
-- this are "new" for them (nav badge + banner above the calendar).
-- NULL = never opened it, so every live post counts as new.
alter table allowed_emails
  add column if not exists dashboard_last_seen_at timestamptz;
