# Physio to Home — Next.js + TypeScript

Migrated from Vite + React (JSX) to **Next.js 14 + TypeScript**.

## What Changed

| Before | After |
|--------|-------|
| Vite + React | Next.js 14 (App Router) |
| JavaScript (.jsx) | TypeScript (.tsx) |
| `react-router-dom` | Next.js `<Link>` + `useRouter` |
| `react-helmet` | Next.js `metadata` exports |
| `BrowserRouter` | Next.js file-based routing |
| `src/pages/` folder | `src/app/` folder (App Router) |

## Route Mapping

| Old Route | New File |
|-----------|----------|
| `/` | `src/app/page.tsx` |
| `/services` | `src/app/services/page.tsx` |
| `/team` | `src/app/team/page.tsx` |
| `/blog` | `src/app/blog/page.tsx` |
| `/blog/:id` | `src/app/blog/[id]/page.tsx` |
| `/booking` | `src/app/booking/page.tsx` |
| `/contact` | `src/app/contact/page.tsx` |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (Header + Footer)
│   ├── globals.css
│   ├── page.tsx            # Home
│   ├── services/page.tsx
│   ├── team/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── booking/page.tsx
│   └── contact/page.tsx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ui/
│       ├── button.tsx
│       ├── form-elements.tsx
│       └── toaster.tsx
├── hooks/
│   └── use-toast.ts
└── lib/
    ├── pocketbaseClient.ts
    └── utils.ts
```

## Notes
- All content and PocketBase collections are unchanged
- `'use client'` directive added to interactive components
- Server Components used where possible
