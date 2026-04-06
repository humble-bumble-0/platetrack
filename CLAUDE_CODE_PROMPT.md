# PlateTrack — Claude Code Prompt

Paste this into Claude Code after opening the project folder.

---

## START PROMPT

You are completing **PlateTrack** — a full-stack fitness tracking app. The project skeleton is already in this folder. Your job is to finish it, fix all TypeScript errors, and get `npm run build` to pass clean.

### What's already built (do not rewrite from scratch):
- All 22 pages in `app/` — dashboard, login, signup, onboarding, workout, plates, nutrition, bmi, standards, progress, exercises, friends, challenges, rewards, profile, settings, and static pages
- All 17 API routes in `app/api/`
- All lib files: supabase, api, auth, rewards, strengthStandards, xpIntegration, analytics, notifications
- Components: SideMenu, BottomNav, XPToast, Skeleton
- Schema: 3 SQL files in `schema/`
- Config: package.json, tailwind, tsconfig, next.config, middleware

### Your tasks in order:

**1. Install dependencies**
```bash
npm install
```

**2. Fix TypeScript errors**
Run `npm run type-check` and fix every error. Common issues to watch for:
- `createClient` import — must come from `@/lib/supabase` (not `@supabase/supabase-js` directly) for server components
- `cookies()` from `next/headers` must be in async server components or Route Handlers
- All `'use client'` pages that use `useState`/`useEffect` are already marked correctly
- The `supabase.ts` exports: `createClient` (browser), `createSupabaseServerClient` (server), `createSupabaseAdmin` (service role)
- Check `lib/rewards.ts` — `RARITY_COLORS` is imported in rewards/page.tsx, make sure it's exported
- `getLevelProgress` in `lib/rewards.ts` conflicts with same name in `lib/strengthStandards.ts` — rename one

**3. Fix missing API routes**
These pages fetch from routes that don't exist yet. Create them:
- `/api/bmi` → returns BMI data, weight history (alias to `/api/weight`)
- `/api/friends/leaderboard` → see existing friends route, add leaderboard calculation
- `/api/body-composition` → GET/POST body fat %, lean mass (same pattern as weight route)

**4. Add missing `app/api/friends/leaderboard/route.ts`**
```typescript
// Single query leaderboard — no N+1
// GET /api/friends/leaderboard?metric=weight_lost_pct&period=30
// Returns ranked list of friends + user, sorted by % progress
```

**5. Fix the SideMenu and BottomNav**
- `SideMenu.tsx` needs the `nutrition` page added — it's already in NAV_ITEMS but double-check
- `BottomNav` should hide on `/login`, `/signup`, `/onboarding`, `/reset-password`

**6. Wire up the AnalyticsProvider**
In `app/layout.tsx`, the `AnalyticsProvider` is imported from `@/lib/analytics` — but that file exports functions, not a component. Either:
- Remove `AnalyticsProvider` from layout.tsx and call `initAnalytics()` in a client component, OR
- Create a simple `AnalyticsProvider` wrapper component in `lib/analytics.ts`

**7. Fix the `app/api/body-composition/route.ts`** — it exists in the file tree but may be empty. Write it:
```typescript
// GET → last 30 body comp entries
// POST → log new body_fat_pct, lean_mass_pct
// Call onBodyCompLogged(userId) after POST
```

**8. Standards page fix**
In `app/standards/page.tsx`, the import `getLevelProgress` from `@/lib/strengthStandards` — this function doesn't exist there. The one in `lib/rewards.ts` is for XP levels, not lift levels. For the standards page use `getLiftLevel` and `getLevelTarget` from strengthStandards directly (already imported).

**9. Make sure `next build` passes**
```bash
npm run build
```
Fix every error until it passes. Common Next.js 14 issues:
- Server/client boundary violations (hooks in server components)  
- Missing `'use client'` directives
- Dynamic imports if needed for heavy components
- Route handler exports must be named `GET`, `POST`, `PUT`, `DELETE` (not default exports)

**10. Create a placeholder icon**
```bash
# Create a simple placeholder icon so the PWA manifest doesn't 404
mkdir -p public/icons
# You'll need to create actual icons before App Store submission
# For now, create an SVG placeholder
```

### Design system (do not change):
- Background: `#0D0F1C` (near black)
- Cards: `#252836` with `1px solid rgba(59,130,246,0.15)` border
- Angled card corners: `clip-path: polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))`
- Primary blue: `#3B82F6`
- All CSS via Tailwind + CSS variables in `globals.css`
- GoW section labels: `class="gl"` (9px, blue, uppercase, tracking-widest)
- GoW numbers: `class="gm"` (Courier New, tabular-nums)

### Environment setup for dev:
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project
- You can leave Stripe/RevenueCat/AdMob blank for initial dev — those pages gracefully handle missing keys

### Database setup:
Run these SQL files in Supabase SQL Editor in order:
1. `schema/01_main.sql` — all tables, RLS, triggers
2. `schema/02_seed.sql` — achievements, reward catalog, 120+ exercises
3. `schema/03_xp_expiry.sql` — XP expiry triggers

Then in Supabase Auth settings:
- Enable Email provider
- Enable Google and/or Apple OAuth
- Set Site URL to `http://localhost:3000` for dev
- Add redirect URL: `http://localhost:3000/auth/callback`

### When build passes, run:
```bash
npm run dev
```
Open http://localhost:3000 — it should redirect to `/login`, let you sign up, complete onboarding, and land on the dashboard.

---

## SECONDARY PROMPT (after build passes)

Now that the build is clean, add these improvements:

1. **Loading states** — every page that fetches data should show `<CardSkeleton/>` components while loading (import from `@/components/ui/Skeleton`)

2. **Error boundaries** — wrap each page in a try/catch and show `<ErrorState/>` if the API call fails

3. **Workout page improvements** — the active workout page at `/workout/start` currently uses a simple exercise picker. Wire it to the actual exercises from `/api/exercises` with real-time search

4. **Standards page** — the page currently shows blank state if no PRs are logged. Add a message: "Complete workouts and log PRs to see your strength levels" with a CTA to start a workout

5. **Empty states everywhere** — add proper empty states using `<EmptyState/>` component for: no workouts (progress page), no friends, no challenges, no nutrition entries

6. **XP toast integration** — after a workout saves successfully, read `new_achievements` from the response and show the XP toast. Import `useXPToast` from `@/components/rewards/XPToast`

7. **PWA icons** — generate proper icons:
```bash
# Install sharp for icon generation
npm install sharp --save-dev
# Create a script to generate 192x192 and 512x512 icons
```

8. **Capacitor prep** (only if targeting iOS/Android):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init PlateTrack app.platetrack --web-dir out
npm run build && npx cap sync
```

