# Staff Portal — setup & architecture

A login portal at `physiotohome.com/portal` so casual/contractor physios can search Cliniko and log treatment notes for patients without a full Cliniko login. Built into the
same Next.js/Vercel app as the public site — see `physio-portal-summary.md` for the full
decision history behind this design.

## What's here

```
schema.sql                                   Postgres schema
.env.example                                 all required env vars

src/lib/db.ts                                Postgres query helpers (allowed emails, assignments, audit log)
src/lib/auth.ts                              NextAuth config — magic link + email allow-list gate
src/lib/cliniko.ts                           all Cliniko API interaction

middleware.ts                                protects /portal/* and /admin/*

src/app/api/auth/[...nextauth]/route.ts      NextAuth handler
src/app/api/templates/route.ts               GET  — live treatment note templates from Cliniko
src/app/api/notes/route.ts                   GET/POST/PATCH — timeline, create, update-draft
src/app/api/attachments/route.ts             GET  — list attachments for a patient
src/app/api/attachments/upload/route.ts      POST — uploads via our server (proxied; see note below),
                                              then registers the attachment with Cliniko
src/app/api/attachments/[id]/download/route.ts  GET — proxied download
src/app/api/admin/emails/route.ts            POST/DELETE — manage staff allow-list
src/app/api/admin/assignments/route.ts       POST/DELETE — manage patient assignments

src/app/portal/layout.tsx                    session-only wrapper for all of /portal
src/app/portal/login/page.tsx                magic-link sign-in form
src/app/portal/login/check-email/page.tsx    fallback "check your email" page
src/app/portal/(staff)/layout.tsx            staff header/nav (login page doesn't inherit this)
src/app/portal/(staff)/page.tsx              landing page — Cliniko patient search
src/app/portal/(staff)/patient/[id]/page.tsx        patient detail (server) — authenticated staff access + data fetch
src/app/portal/(staff)/patient/[id]/PatientDetailClient.tsx   info block, note form, timeline, attachments

src/app/admin/layout.tsx                     admin chrome
src/app/admin/page.tsx                       admin data loader
src/app/admin/AdminClient.tsx                manage allowed emails + patient assignments together

src/app/api/portal/patients/search/route.ts  GET — authenticated staff patient search
src/components/portal/PatientSearch.tsx     Cliniko patient search UI
src/components/portal/AuthProvider.tsx       NextAuth SessionProvider wrapper
src/components/portal/PortalSignOutButton.tsx
```

Also changed: `src/components/Footer.tsx` (quiet "Staff Login" link), `package.json` (added
`next-auth`, `@neondatabase/serverless`, `nodemailer`).

## Setup steps

1. **Install new deps** — `next-auth`, `@neondatabase/serverless`, `nodemailer` are already added to
   `package.json`; run `npm install`.

2. **Postgres (Neon)** — connect a Postgres store to the Vercel project (Storage tab). Vercel's
   Postgres offering now runs on Neon under the hood; this populates `POSTGRES_URL`
   automatically. For local dev run `vercel env pull .env.local`. Then run `schema.sql` against
   it once (the Neon/Vercel dashboard has a query console, or `psql "$POSTGRES_URL" -f schema.sql`).

3. **Env vars** — copy `.env.example` to `.env.local` and fill in:
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `ZOHO_SMTP_PASSWORD` — an **app-specific password** from Zoho Mail (Settings → Security →
     App Passwords), not the normal account password
   - `CLINIKO_API_KEY` / `CLINIKO_API_BASE` — from Cliniko → My Info → API Keys. The base URL
     is shard-specific (e.g. `api.au4.cliniko.com`) — Cliniko shows the correct one on the same
     page as the key.
   - `ADMIN_EMAIL` — Micheal's email; only this address can reach `/admin`

4. **Add yourself as the first allowed staff email** — before the admin UI exists in the
   database, insert directly:
   ```sql
   insert into allowed_emails (email, display_name) values ('micheal@physiotohome.com', 'Micheal');
   ```
   After that, `/admin` can manage everyone else.

5. **Deploy** — set the same env vars in Vercel (Project Settings → Environment Variables),
   push, done.

## Open next steps (not yet built)

1. **Live test against a real Cliniko sandbox.** Everything in `lib/cliniko.ts` is built from
   Cliniko's published docs, not verified against real responses. The riskiest surfaces:
   - the exact `content.sections[].questions[].answer` format Cliniko expects back for
     `radio_buttons` and `checkboxes` questions (this code assumes a plain string / string
     array — confirm against a real template + real save)
   - the field names in the S3 presigned-POST response (`url`/`fields`/`key` — Cliniko's docs
     and actual response can drift slightly) — confirmed correct against live Cliniko
2. **Attachment uploads are proxied through our own server, capped at 4MB.** Cliniko's S3
   bucket (`cliniko-files-*.s3.*.amazonaws.com`) has no CORS policy allowing our origin, so a
   direct browser→S3 upload (as Cliniko's own docs describe) gets blocked by the browser
   before it leaves the page. Routing the upload through `/api/attachments/upload` sidesteps
   CORS (server-to-server requests aren't subject to it), but Vercel Serverless Functions have
   a hard 4.5MB request body limit, so this only works for small files for now.
   **To lift the cap:** ask Cliniko support to whitelist `https://www.physiotohome.com` (and
   any other portal origins) in that bucket's CORS policy — once they do, the upload can go
   straight browser→S3 again and the 4MB cap can be removed.
   - the `/patients/{id}/individual_appointments` query-param syntax for "next appointment only"
2. **Loading/error states** are minimal throughout — functional, not polished.
3. **Booking/appointment linking in the note UI.** `createTreatmentNote` accepts a `bookingId`
   but nothing in the form collects one yet.
4. **Medical alerts, emergency contact, and an in-portal "flag an issue" channel** — all
   discussed in the original design, none built. Flagging currently stays off-platform
   (text/call to Micheal).
5. **Attachment deletion/archiving** — currently view/upload only, matching Cliniko's own
   attachment model, which the portal deliberately hasn't extended.

## Design language

Deep forest emerald (`--primary` in `globals.css`, already the site-wide accent) reused as-is —
the portal doesn't introduce a new palette. Neutral grays, generous whitespace. The visit
timeline renders as a vertical list with a connecting line and dot markers since chronological
order carries real clinical meaning, not just as decoration. Draft notes are badged amber
throughout (form, timeline) so it's never ambiguous whether a note is locked.
