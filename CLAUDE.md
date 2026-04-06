# PlateTrack — Claude Code Briefing

You are building PlateTrack, a full-stack fitness tracking app. This is a **production-ready** app that needs to be fully functional, tested, and deployable. Read this entire file before writing a single line of code.

---

## What PlateTrack is

A weightlifting tracker competing with Hevy — differentiating on:
- **God of War Ragnarök UI** (dark navy, electric blue, angled card corners, GoW segmented bars)
- **Strength standards** with global population comparison (10 world regions)
- **Manual weight plate calculator** (tap + to add plates, not auto-solve)
- **XP/rewards system** with 365-day rolling expiry + inactivity acceleration
- **Canadian-built** by Work By Others Construction Ltd., Lively, Ontario

**App ID:** `app.platetrack`  
**Domain:** `platetrack.app`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Supabase (Postgres + Auth + RLS + Storage) |
| Mobile | Capacitor (iOS + Android from Next.js) |
| Web billing | Stripe |
| Mobile IAP | RevenueCat (Apple StoreKit + Google Play) |
| Analytics | PostHog |
| Ads (free tier) | AdMob |
| Push notifications | Web Push (VAPID) + Capacitor |
| Deployment | Vercel |

---

## Design System — GOD OF WAR RAGNARÖK

This is non-negotiable. Every UI element must follow this:

**Colors:**
```css
--bg:      #0D0F1C   /* near-black navy */
--surface: #1A1D2E   /* navy panels */
--card:    #252836   /* card background */
--muted:   #2D3148   /* inputs, muted areas */
--border:  rgba(59,130,246,0.15)
--text:    #F0F0F5
--subtext: #6E7191
--acc:     #3B82F6   /* electric blue — PRIMARY accent */
--acc2:    #60A5FA   /* lighter blue */
--green:   #22C55E
--gold:    #F59E0B   /* PRs, achievements */
--red:     #EF4444
--purple:  #8B5CF6  /* nutrition accent */
```

**Card corners — GoW angled clip:**
```css
clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
```

**Section labels:**
```css
font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; color: var(--subtext);
```

**Progress bars — GoW segmented style:**
```tsx
<div className="flex gap-1">
  {Array.from({length:10}).map((_,i)=>(
    <div key={i} className="flex-1 h-2 rounded-sm" style={{background: i < filled ? color : 'rgba(255,255,255,.08)'}}/>
  ))}
</div>
```

**Monospace numbers:** `font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums;`

**GoW buttons:**
```css
clip-path: polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 7px 100%, 0 calc(100% - 7px));
```

---

## Navigation

**Side drawer** (slides from left, hamburger top-right):
- Home, Workout, Weight Plates, Exercises, Standards, Progress, BMI & Body, **Nutrition** (purple accent), Friends, Challenges, Rewards & XP, Settings

**Bottom nav** (5 items): Home | Workout | Standards | Progress | Profile

---

## All Pages

| Route | Page |
|-------|------|
| `/dashboard` | Dashboard with streak, volume chart, latest PR, Start Workout CTA |
| `/workout/start` | Active workout — add exercises, log sets, rest timer, finish |
| `/plates` | Manual weight plate calculator |
| `/exercises` | Exercise library, searchable, 120+ exercises |
| `/standards` | Strength standards — lift breakdown, global comparison, targets |
| `/progress` | Workout history + PR chart |
| `/bmi` | BMI gauge + population percentile comparison |
| `/nutrition` | **Own dedicated page** — daily macros, meal sections, hydration |
| `/friends` | Friends leaderboard (% based, not raw lbs) |
| `/challenges` | Create/join challenges with invite codes |
| `/rewards` | XP feed, level progress, badges, redeem store |
| `/profile` | User profile, subscription, sign out |
| `/settings` | Units, notifications, export, about |
| `/login` | Email + Apple + Google OAuth |
| `/signup` | Create account |
| `/onboarding` | 6-step: goal, gender, units, height, weight, notifications |
| `/reset-password` | Two-phase password reset |
| `/delete-account` | Soft-delete with 30-day grace period |
| `/privacy` | Privacy policy (PIPEDA/GDPR/CCPA) |
| `/terms` | Terms of service with health disclaimer |
| `/offline` | PWA offline fallback |

---

## All API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/profile` | GET, PUT | User profile |
| `/api/workouts/sessions` | GET, POST | Workout history + save session |
| `/api/exercises` | GET | Exercise library (search + filter) |
| `/api/standards` | GET | Strength analysis vs. standards |
| `/api/weight` | GET, POST | Weight log |
| `/api/body-composition` | GET, POST | Body comp tracking |
| `/api/nutrition` | GET, POST | Daily nutrition log |
| `/api/friends` | GET, POST | Friends list + add friend |
| `/api/friends/leaderboard` | GET | % progress leaderboard |
| `/api/challenges` | GET, POST | Challenges list + create/join |
| `/api/rewards` | GET | Full rewards profile |
| `/api/rewards/earn` | POST | Award XP for an action |
| `/api/rewards/redeem` | POST | Spend XP on reward |
| `/api/billing/checkout` | POST | Create Stripe checkout |
| `/api/billing/stripe-webhook` | POST | Stripe webhook handler |
| `/api/billing/revenuecat` | POST | RevenueCat webhook |
| `/api/account/delete` | DELETE | Soft-delete account |
| `/api/export` | GET | CSV export (Pro only) |
| `/auth/callback` | GET | OAuth callback — CRITICAL |

---

## Key Business Logic

### Plate Calculator
**Manual mode only** — NOT auto-solve. User taps + on each plate type to add one plate per side. The calculator shows each plate as an individual line item (not grouped ×2). The barbell SVG updates in real time.

```
Plate colors: 45=red #EF4444, 35=yellow #EAB308, 25=green #22C55E, 10=white #D1D5DB, 5=blue #3B82F6, 2.5=gray #9CA3AF
```

### Strength Standards
5 levels: Beginner → Novice → Intermediate → Advanced → Elite  
Based on bodyweight multipliers (Symmetric Strength / ExRx)  
Age-adjusted using `ageFactor(age)` — declines after 32  
DOTS score for cross-weight-class comparison  
Global comparison: 7 world regions + overall avg  

### XP Expiry (two rules)
1. **Rolling 365 days** — every XP event expires exactly 1 year after earned
2. **Inactivity acceleration** — if no workout in 60+ days, old XP expires in 90 days instead of 365. 30+ days = 180 days.

XP costs for redemption are deliberately high (5,000 XP for 7-day trial = ~3.5 weeks of consistent training).

### Pricing
- Free: core tracking, ads between sessions (never mid-workout), AdMob
- Pro: $4.99/mo | $39.99/yr | $79.99 lifetime — ad-free, full analytics, CSV export
- RevenueCat handles iOS/Android IAP
- Stripe handles web subscriptions
- Both call `/api/billing/revenuecat` and `/api/billing/stripe-webhook`

### Nutrition
**Purple accent** throughout (`#8B5CF6`) to visually distinguish from the blue workout sections. Has its own route `/nutrition` — NOT embedded in another page. Four meal sections: breakfast, lunch, dinner, snacks. GoW segmented bars for macro progress.

---

## Files Already Written

These files exist and are **complete** — do not rewrite them unless fixing a bug:

**lib/**: `supabase.ts`, `api.ts`, `auth.ts`, `rewards.ts`, `xpIntegration.ts`, `strengthStandards.ts`, `analytics.ts`, `notifications.ts`

**app/api/**: All routes listed above — check each file before rewriting

**app/**: `dashboard`, `login`, `signup`, `onboarding`, `workout/start`, `plates`, `standards`, `nutrition`, `bmi`, `friends`, `challenges`, `rewards`, `progress`, `profile`, `settings`, `delete-account`, `reset-password`, `privacy`, `terms`, `offline`

**components/**: `layout/SideMenu.tsx`, `layout/BottomNav.tsx`, `rewards/XPToast.tsx`, `ui/Skeleton.tsx`

**schema/**: `01_main.sql`, `02_rewards.sql`, `02_seed.sql`, `03_exercises.sql`, `03_xp_expiry.sql`, `04_security.sql`

---

## What Still Needs Work (Your Job)

1. **Run `npm install`** — install all dependencies from package.json
2. **TypeScript errors** — fix any type errors across the codebase (`npm run type-check`)
3. **Build errors** — run `npm run build` and fix every error before considering it done
4. **Missing API routes** — `/api/friends/leaderboard` needs the full single-query implementation (no N+1)
5. **SideMenu** — verify it shows/hides on auth pages and the hamburger is properly wired
6. **XPToast wiring** — after `onWorkoutComplete()` returns, call `showXP()` in the workout finish handler
7. **Supabase client** — confirm `createClient()` is used in client components, `createSupabaseServerClient()` in server/API routes
8. **Middleware** — confirm it correctly redirects unauthenticated users and handles the OAuth callback exemption
9. **Missing pages** — check `app/standards/page.tsx` is fully implemented (it had a previous stub)
10. **Service worker** — verify `public/sw.js` is correct and the registration in `app/layout.tsx` works

---

## Database Schema

Run in this order (all files in `/schema/`):
1. `01_main.sql`
2. `02_seed.sql`
3. `02_rewards.sql`
4. `03_exercises.sql`
5. `03_xp_expiry.sql`
6. `04_security.sql`

Then enable `pg_cron` and run:
```sql
SELECT cron.schedule('expire-xp-daily', '0 3 * * *', $$ SELECT run_xp_expiry() $$);
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values. Required to run locally:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Definition of Done

The app is done when:
- [ ] `npm run build` passes with zero errors
- [ ] `npm run type-check` passes with zero errors
- [ ] All 18 pages load without crashing
- [ ] Login → Onboarding → Dashboard flow works end-to-end
- [ ] Workout can be started, sets logged, and session saved
- [ ] XP toast appears after finishing a workout
- [ ] Plate calculator adds individual plates, updates barbell SVG
- [ ] Side menu opens/closes, all links work
- [ ] Supabase RLS means users only see their own data
- [ ] Stripe checkout URL is generated successfully

---

## Company Info

- **Developer:** Work By Others Construction Ltd.
- **Location:** Lively, Ontario, Canada
- **Support email:** support@platetrack.app
- **Privacy email:** privacy@platetrack.app
