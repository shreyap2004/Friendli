# Friendli

A friendship-matching app where users create profiles, discover people with shared hobbies, and connect through real-time messaging. Built as a mobile-first web app.

**Live app:** https://friendli-beta.vercel.app

---

## How Matching Works

1. User A sees User B's profile on the discover page and clicks **Friendify**
2. This is stored server-side. User B sees nothing yet.
3. If User B also clicks **Friendify** on User A, it's a mutual match
4. A chat is automatically created between both users
5. Both users can now message each other in the Messages tab

There is no random chance involved - matches are purely based on mutual interest.

## Premium Trial Flow

1. User taps "Try Friendli+ Free" in Settings
2. A 48-hour trial starts immediately with no payment required
3. After 48 hours, the trial expires and a payment dialog appears with credit card fields
4. User can subscribe for $9.99/month to continue premium access
5. All premium features are unlocked during the trial and after subscribing

## Data Persistence

All data is stored in Supabase PostgreSQL. User accounts, profiles, matches, messages, and premium status persist indefinitely across sessions, devices, and browsers. Users can log in from anywhere with their email and password.

---

## Features

### Free

- Email/password account creation
- 5-step profile onboarding (basic info, bio, hobbies, photo upload, preferences)
- Profile photo and hobby photo uploads
- Discover up to 10 new profiles per day
- Mutual matching (both users must friendify each other)
- Real-time messaging with matches
- Profile editing (update info, hobbies, photos anytime)
- Profile preview during onboarding
- Account deletion with server-side cleanup

### Friendli+ (Premium)

Everything in Free, plus:

- Unlimited profile discovery (no daily cap)
- Advanced search filters (age range, city, personality type, hobbies)
- See who friendified you (view pending likes before deciding)
- Priority matching (profiles sorted by shared hobby count)
- Hobby match badges showing how many interests you share

### Chat Features (all users)

- Real-time messaging with 5-second polling
- Typing indicators (animated dots when the other person is typing)
- Read receipts (double checkmarks on seen messages)
- Deleted account handling (graceful "[deleted account]" display)

### UI/UX

- Match celebration with confetti animation
- Smooth card slide-out animations (left for bye, right for friendify)
- Pull-to-refresh on discover page
- Welcome back toast on login
- Polished empty states with illustrations
- Mobile-first responsive design (430px phone frame)
- Bottom navigation with unread match badges

---

## Tech Stack

- **Frontend:** React 18, React Router 7, Tailwind CSS 4, shadcn/ui, Vite, Motion
- **Backend:** Supabase Edge Functions (Hono, Deno)
- **Database:** Supabase PostgreSQL (KV store)
- **Hosting:** Vercel (frontend), Supabase (backend + database)

## Running Locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

## Database Setup

For a new Supabase project, run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.

## Deploying

**Frontend (Vercel):**
```bash
npx vercel --prod
```

**Backend (Supabase Edge Functions):**
```bash
npx supabase login
npx supabase functions deploy make-server-50b042b1 --project-ref vaqvxkjelzrzwbtdohsa
```

## Project Structure

```
src/
  app/
    components/
      Auth.tsx        - Email/password sign in & sign up
      Onboarding.tsx  - 5-step profile setup with photo upload & preview
      Home.tsx        - Discover page with cards, filters, animations
      Messages.tsx    - Chat with typing indicators & read receipts
      Profile.tsx     - View/edit profile & photo management
      Settings.tsx    - Premium trial, payment, account management
    Root.tsx          - Layout, navigation, route guards
    routes.tsx        - React Router config
  lib/
    api.ts            - API helper for all backend calls

supabase/
  functions/
    make-server-50b042b1/
      index.ts        - API endpoints (auth, users, friendify, chat, premium)
      kv_store.ts     - Supabase KV abstraction
  schema.sql          - Database table SQL
```
