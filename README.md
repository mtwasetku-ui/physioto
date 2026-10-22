# Physio to Home

Next.js 14 (App Router) + TypeScript + Tailwind app for physiotohome.com. One codebase holds:

- **Public site** — home, services, team, blog, booking, contact, privacy policy, terms.
- **Staff portal (`/portal`) and admin (`/admin`)** — lets practitioners search Cliniko, log treatment notes, manage attachments, appointments and travel blocks, and handle SMS requests. See [README.portal.md](./README.portal.md) for setup and architecture.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values, or: vercel env pull .env.local
npm run dev
```

Open http://localhost:3000. The database connection string is required at startup (`src/lib/db.ts` throws if it's missing).

## Where things live

```
src/app/            routes (public pages, /portal, /admin, /api)
src/components/     shared UI; components/portal for portal-specific UI
src/lib/            db.ts (Neon), auth.ts (NextAuth), cliniko.ts, mail.ts, debug.ts
src/content/blog/   blog posts as markdown
migrations/         SQL migrations, applied manually after schema.sql
public/             static assets, intake forms, robots.txt, llms.txt
```

## Data sources

- **Neon Postgres** — staff allow-list, patient assignments, travel blocks, SMS requests, booking/contact submissions, auth tokens.
- **Cliniko** — patients, notes, attachments and appointments, accessed server-side only.
- **PocketBase** (`physio-pb.fly.dev`) — homepage services and testimonials, loaded client-side by `HomeClient.tsx`.

## Diagnostics

Verbose database and email logging is off by default. Set `DEBUG_LOGS=1` in Vercel environment variables to turn it on temporarily; it can log staff emails and Cliniko patient IDs, so switch it off again afterwards.

## Deployment

Deployed on Vercel. Set the same variables as `.env.example` in the project's Environment Variables.
