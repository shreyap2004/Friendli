# Friendli

A friendship-matching app where users create profiles, discover people with shared hobbies, and connect through real-time messaging. Built as a mobile-first web app.

**Live app:** https://friendli-beta.vercel.app

## Features

### Free Tier
- Create a profile with photos, hobbies, and bio
- Discover up to 10 new people per day
- Mutual matching (both users must "friendify" each other to match)
- Real-time messaging with matches

### Friendli+ (Premium - 48h Free Trial)
- Unlimited profile discovery
- Advanced filters (age, city, personality, hobbies)
- See who friendified you
- Priority matching (sorted by hobby overlap)

## Tech Stack

- **Frontend:** React 18, React Router 7, Tailwind CSS 4, shadcn/ui (Radix), Vite
- **Backend:** Supabase Edge Functions (Hono framework, Deno runtime)
- **Database:** Supabase PostgreSQL (KV store pattern)
- **Hosting:** Vercel (frontend), Supabase (backend + database)

## Project Structure

```
src/
  app/
    components/
      Auth.tsx        - Email/password sign in & sign up
      Onboarding.tsx  - 5-step profile setup (info, bio, hobbies, photos, preferences)
      Home.tsx        - Discover page with profile cards, filters, "who liked you"
      Messages.tsx    - Chat list and individual conversations
      Profile.tsx     - View/edit profile, manage photos
      Settings.tsx    - Premium trial, mock payment, account management
    Root.tsx          - App layout with bottom navigation
    routes.tsx        - React Router configuration
  lib/
    api.ts            - API helper (all Supabase edge function calls)
  styles/             - Tailwind, theme variables, fonts

supabase/
  functions/
    make-server-50b042b1/
      index.ts        - All API endpoints (auth, users, friendify, chat, premium)
      kv_store.ts     - Supabase KV abstraction layer
  schema.sql          - Database table creation SQL

utils/
  supabase/
    info.tsx          - Supabase project ID and public anon key
```

## Running Locally

```bash
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Database Setup

If setting up a new Supabase project, run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

## Deploying

### Frontend (Vercel)
```bash
npx vercel --prod
```

### Backend (Supabase Edge Functions)
```bash
npx supabase login
npx supabase functions deploy make-server-50b042b1 --project-ref vaqvxkjelzrzwbtdohsa
```

## How Matching Works

1. User A sees User B's profile and clicks "Friendify"
2. This is stored server-side. User B sees nothing yet.
3. If User B also clicks "Friendify" on User A, it's a mutual match.
4. A chat is automatically created between them.
5. Both users can now message each other in the Messages tab.

There is no random chance involved - matches are purely based on mutual interest.

## Premium Trial Flow

1. User clicks "Try Friendli+ Free" in Settings
2. 48-hour trial starts immediately, no payment required
3. After 48 hours, trial expires and a payment dialog appears
4. User can enter credit card info and subscribe ($9.99/month)
5. The payment is simulated (no real charges) - subscribe button always works

## Data Persistence

All data is stored in Supabase PostgreSQL. User accounts, profiles, matches, messages, and premium status persist across sessions and devices. Users can log in from any browser with their email and password.

## Original Design

Based on the Figma design at https://www.figma.com/design/XTAzRpuUJdALMi0g1UZOig/Friendli-app-design
