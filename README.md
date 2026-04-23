# Ms Ginko Restaurant Website

Full-featured restaurant website built with Next.js (App Router) and Supabase.

## Includes

- Home, Menu, About, Gallery, Reserve pages
- Contact modal with backend endpoint
- Google OAuth login (required only for reservation flow)
- Customer dashboard (`/dashboard`)
- Admin dashboard (`/admin/dashboard`)
- Reservation rules and validation
- Menu search + category filtering
- Ordering links for Zomato and Swiggy
- SEO foundations: metadata, OpenGraph, robots, sitemap, JSON-LD

## Tech

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- Supabase Auth + Postgres + RLS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill these values in `.env.local`:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. In Supabase SQL editor, run:

- `supabase/schema.sql`

5. Configure Google Auth in Supabase:

- Supabase Dashboard -> Authentication -> Providers -> Google
- Add callback URL:
  - `http://localhost:3000/auth/callback` (dev)
  - your production URL + `/auth/callback`

6. Promote one user as admin after first login:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-id>';
```

7. Run app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Reservation Rules

- Closed on Monday
- Lunch: `12:00-15:00`
- Dinner: `18:00-22:30`
- Slot interval: `30` minutes
- Booking window: `30` days in advance
- Party size: `1-12`

## Project Structure

- `src/app` - routes and server actions
- `src/components` - UI and interactive components
- `src/lib` - data, rules, Supabase helpers
- `supabase/schema.sql` - tables, policies, and seed data

## Notes

- Payment integration is intentionally not implemented yet.
- Current logo is a template placeholder (`public/brand/logo-template.svg`).
- Ordering is redirected to Swiggy/Zomato links.
