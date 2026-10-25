-- Replies to dashboard posts (visible to everyone who can see the post).
-- Run in the Neon console after 004.

create table if not exists announcement_replies (
  id bigserial primary key,
  post_id bigint not null references announcements(id) on delete cascade,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists announcement_replies_post_idx
  on announcement_replies (post_id, created_at);
