# Friendli - Internal Documentation

This document is for the development team. It covers implementation details, design decisions, and the full feature breakdown that wouldn't belong in a public-facing README.

---

## Feature Breakdown

### Free Tier - Full Details

**Authentication & Account**
- Email/password registration with server-side storage in Supabase KV
- Passwords hashed with a simple 32-bit hash (demo-grade, not production cryptography)
- Login returns user profile, redirects to onboarding if not completed
- Route guards: unauthenticated users are redirected to `/` from any protected page
- Authenticated users on `/` are auto-redirected to `/home` if onboarded
- Account deletion removes: user record, email lookup, all friendify records (sent and received), rejection records, and marks the user as `[deleted account]` in existing chats
- Logout clears localStorage session

**Onboarding (5 steps)**
1. Basic info: age, alma mater, gender, city (all required)
2. About you: fun fact, what you're looking for in a friend (both required)
3. Hobbies: select from 16 presets or add custom hobbies (at least 1 required)
4. Photos: profile photo and per-hobby photo uploads (all optional, can skip)
5. Preferences: personality type, preferred hobbies in friends, plus a live preview card showing exactly what their profile will look like to other users

**Photo System**
- Photos are compressed client-side to 300px max dimension, JPEG quality 0.7
- Stored as base64 data URLs in the user's KV record
- Profile photo and hobby photos are separate (hobby photos are tagged by hobby name)
- Photos can be added, replaced, or removed from the Profile page at any time

**Discovery**
- Shows all onboarded users except: the current user, anyone already friendified, anyone already rejected
- Free users see a maximum of 10 profiles per page load
- Profiles display: name, age, city, alma mater, profile photo, hobby photos in a swipeable carousel, hobby tags, "looking for" text, and fun fact
- Refresh button and pull-to-refresh gesture to reload profiles

**Matching**
- Purely mutual: User A friendifies User B, nothing visible happens to B
- When User B also friendifies User A, the server detects the mutual action and creates a match
- On match: a chat record is created and added to both users' chat lists
- Match celebration: full-screen confetti overlay with spring animation, auto-dismisses in 3 seconds
- Card animations: bye slides card left, friendify slides card right (300ms transition)

**Messaging**
- Messages stored in chat records in Supabase KV
- Frontend polls for new messages every 5 seconds
- Optimistic UI: message appears instantly, then syncs to server
- Typing indicators: debounced (sent every 2 seconds while typing, expires after 2 seconds of inactivity, polled every 3 seconds by the other user)
- Read receipts: chat is marked as read when opened and when new messages arrive, polled every 5 seconds, shown as double checkmarks on sent messages
- Deleted account handling: shows "[deleted account]" name, gray "?" avatar, "this user has deleted their account" banner, message input disabled

**Profile Editing**
- All fields from onboarding are editable
- Hobby photos can be added/removed per hobby
- Changes are saved to Supabase KV on save
- Custom hobbies can be added or removed

### Premium Tier (Friendli+) - Full Details

**Trial System**
- 48-hour free trial, no payment required
- Trial start time stored server-side in user record (`premiumTrialStart`)
- Server checks `Date.now() <= premiumTrialStart + 48h` on every premium status request
- When trial expires and user is not subscribed, `premium` flag is set to `false`

**Payment Flow (Simulated)**
- After trial expires, a payment dialog appears with: name on card, card number, expiry, CVV fields
- The "Subscribe" button works without filling in any fields - it always succeeds
- On "subscribe", sets `premiumSubscribed: true` on the user record
- This reactivates all premium features indefinitely
- Design decision: we need the app to work for classmates for at least a week, so payment is simulated

**Unlimited Discovery**
- No daily profile cap (free users are limited to 10)
- All available profiles are shown

**Advanced Filters**
- Filter by: age range (min/max), city (text search), personality type (introvert/extrovert/ambivert), hobbies (multi-select from 16 options)
- Distance radius filter: slider from 5-100 miles, uses Haversine formula on lat/lng coordinates
- Filters are applied client-side on the already-fetched profile list
- Filter button is grayed out for free users and redirects to settings with a toast

**Distance/Radius Filtering**
- Users can optionally enter a zip code during onboarding or in profile settings
- Zip codes are geocoded to lat/lng using the free zippopotam.us API (no API key needed, US zip codes only)
- Lat/lng coordinates are stored in the user's profile record on the server
- Premium filter dialog includes a radius slider (5-100 miles, step 5)
- Profile cards show "X miles away" when both the viewer and profile have coordinates
- Users without zip codes are never excluded from results (they just don't show distance)
- Distance calculation uses the Haversine formula (`src/lib/geo.ts`)

**See Who Friendified You**
- Fetches the `friendify_received:{userId}` list from the server
- Shows a dialog with profiles of people who friendified the current user
- Each profile has a "Friendify" button to create a mutual match instantly
- Eye icon button is grayed out for free users

**Priority Matching**
- Profiles are sorted by number of shared hobbies (descending)
- Uses `currentUser.hobbies` compared against each profile's hobbies
- Only active for premium users; free users see default order

**Hobby Match Badges**
- Green badge on each profile card: "X hobbies in common"
- Visible to all users, but more useful combined with priority sorting for premium

---

## Design Decisions

**Why KV store instead of relational tables?**
- The app was originally scaffolded from a Figma Make export that provided a generic KV store
- For a class project with ~30 users, the KV pattern is sufficient
- All data (users, friendifies, matches, chats, messages) stored as JSONB values with string keys
- Key patterns are documented in `supabase/schema.sql`

**Why base64 photos instead of Supabase Storage?**
- Simplicity: no additional Supabase configuration needed
- For ~30 users with compressed 300px images, the payload sizes are manageable
- If scaling beyond a class project, photos should move to Supabase Storage or a CDN

**Why polling instead of WebSockets?**
- Supabase Edge Functions (Deno) don't natively support WebSocket connections
- 5-second polling for messages and 3-second polling for typing indicators provides a good-enough real-time experience
- Typing indicators have a 5-second server-side expiry to prevent stale "typing..." bubbles

**Why zippopotam.us for geocoding?**
- Free API, no registration or API key required
- Supports all US zip codes with lat/lng coordinates
- Simple REST endpoint: `https://api.zippopotam.us/us/{zip}`
- Called once at profile save time, coordinates stored in user record
- If the API is down, zip code is saved without coordinates (graceful degradation)
- For production, Google Maps Geocoding API or Mapbox would be more reliable

**Why no real payment processing?**
- This is a class project demo, not a commercial product
- The payment form UI demonstrates the intended UX flow
- The subscribe button works without card info so classmates can use premium features
- If this were production, Stripe Elements would replace the mock form

**Password security**
- Uses a simple 32-bit hash, not bcrypt/argon2
- Acceptable for a class demo where security isn't the primary concern
- If deploying to real users, passwords should use `bcrypt` or Supabase Auth

**API authentication**
- All requests use the Supabase public anon key (shared across all users)
- There are no per-user JWT tokens or session validation
- Any user could theoretically call endpoints with another user's ID
- Acceptable for a trusted class environment; would need proper auth for production

---

## App Safety & Guards

**Route Protection**
- `Root.tsx` checks `localStorage.friendli_user` on every navigation
- Protected routes (`/home`, `/messages`, `/profile`, `/settings`) redirect to `/` if not authenticated
- Authenticated users on `/` are redirected to `/home` if onboarded

**Account Deletion**
- Server-side: deletes user record, email lookup, friendify records (sent/received), rejection records
- Chats are preserved but the deleted user's name becomes `[deleted account]` and their photo is nulled
- Chat participants see a banner and the message input is disabled
- Client-side: clears localStorage

**Data Validation**
- Server validates required fields on registration (email, password, name)
- Server checks for duplicate emails on registration
- Server validates required fields on friendify, reject, and message endpoints
- Client validates onboarding steps before allowing progression

**Unread Badge**
- Root layout polls the server every 10 seconds for the current user's chats
- Counts chats where `isNewMatch: true` and no messages have been sent
- Displays a red badge on the Messages tab in the bottom nav

---

## Key File Reference

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | All API calls (auth, users, friendify, chat, typing, read receipts, account deletion) |
| `src/app/Root.tsx` | Layout, bottom nav, route guards, unread badge polling |
| `src/app/components/Auth.tsx` | Login/signup with welcome back toast |
| `src/app/components/Onboarding.tsx` | 5-step profile setup with photo upload and preview card |
| `src/app/components/Home.tsx` | Discover page: cards, carousel, filters, animations, confetti, pull-to-refresh |
| `src/app/components/Messages.tsx` | Chat list and conversation: typing, read receipts, deleted accounts |
| `src/app/components/Profile.tsx` | Profile view/edit with photo management |
| `src/app/components/Settings.tsx` | Premium trial, mock payment, logout, account deletion |
| `supabase/functions/server/index.tsx` | Source for all backend endpoints |
| `supabase/functions/make-server-50b042b1/` | Deployed copy of edge function (`.ts` extension for Supabase) |
| `supabase/schema.sql` | Database table creation + key pattern documentation |
| `utils/supabase/info.tsx` | Supabase project ID and public anon key |

---

## Environment & Deployment

- **Supabase Project:** `vaqvxkjelzrzwbtdohsa`
- **Vercel Project:** `friendli` (auto-deploys from `master` branch)
- **GitHub:** `https://github.com/shreyap2004/Friendli`
- **Live URL:** `https://friendli-beta.vercel.app`
- **Edge Function URL:** `https://vaqvxkjelzrzwbtdohsa.supabase.co/functions/v1/make-server-50b042b1`
