PLATETRACK — CLAUDE CODE BRIEFING
===================================
Complete brief for building and running the PlateTrack app.
Read this entire document before writing a single line of code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. WHAT THIS IS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PlateTrack is a full-stack weightlifting and fitness tracker app competing with Hevy.
App ID: app.platetrack
URL: platetrack.app

Owner: Matt — Director/Founder of Work By Others Construction Ltd. (WBO), Lively Ontario.
Also works full-time at Vale Canada as a Contract Administrator and Cost Analyst.
Direct communication style. Prefers structured, actionable outputs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. TECH STACK — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres + Auth + RLS + Storage)
- Tailwind CSS
- Stripe (web billing)
- RevenueCat (iOS + Android IAP — unified layer over Apple StoreKit + Google Play Billing)
- Capacitor (iOS + Android wrapper)
- PostHog (analytics)
- AdMob via @capacitor/admob (free tier ads, NEVER mid-workout)
- Vercel (deployment)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DESIGN SYSTEM — GOD OF WAR RAGNARÖK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The entire UI follows God of War Ragnarök's angular dark aesthetic combined with
PlateTrack's original navy/blue color palette. This is NOT the amber GoW gold — 
it's electric blue as the primary accent.

COLORS:
  --bg:      #0D0F1C   (near-black navy — page background)
  --surface: #1A1D2E   (dark navy — card backgrounds)
  --card:    #252836   (slightly lighter — inner cards)
  --muted:   #2D3148   (muted elements, inputs)
  --border:  rgba(59,130,246,0.15)   (subtle blue border)
  --text:    #F0F0F5   (warm off-white)
  --subtext: #6E7191   (muted purple-gray)
  --acc:     #3B82F6   (electric blue — PRIMARY accent)
  --acc2:    #60A5FA   (lighter blue — labels, highlights)
  --green:   #22C55E   (success, completed sets)
  --gold:    #F59E0B   (PRs, streak, gold tier)
  --red:     #EF4444   (danger, intensity, 45lb plates)
  --purple:  #8B5CF6   (nutrition section accent)

KEY DESIGN ELEMENT — ANGLED CARD CORNERS:
Every card/button has cut corners via CSS clip-path:
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));

This is the signature GoW UI element. Use it on ALL cards, buttons, inputs.
Corner size varies: 4px for small buttons, 6px for inputs, 8px for cards, 10px for large cards.

TYPOGRAPHY:
  - Body: Inter (system-ui fallback)
  - Numbers: 'Courier New' monospace (tabular-nums) — all weight values, timers, XP
  - Section labels: 8-9px, font-weight 800, uppercase, letter-spacing .14em, color var(--acc2)
  - Headings: font-weight 800, letter-spacing -.3px

NAVIGATION: 
  - Side drawer (slides in from left, 230px wide)
  - Bottom nav (5 items: Home, Workout, Standards, Progress, Profile)
  - Hamburger button fixed top-right

PROGRESS BARS — GoW segmented style:
  NOT smooth fills. Use a row of individual segments (flex gap-0.5):
  <div class="flex gap-0.5">
    <div class="flex-1 h-2 rounded-sm" style="background: var(--acc)"/>  ← filled
    <div class="flex-1 h-2 rounded-sm" style="background: rgba(59,130,246,.1)"/>  ← empty
  </div>

WEIGHT PLATE COLORS (gym standard):
  45 lb = #EF4444 (red)
  35 lb = #EAB308 (yellow)
  25 lb = #22C55E (green)
  10 lb = #D1D5DB (white/light)
   5 lb = #3B82F6 (blue)
 2.5 lb = #9CA3AF (gray)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. COMPLETE FEATURE LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 WORKOUT TRACKING
- Active workout session with live timer
- 11 tracking types: weight_reps, bodyweight_reps, weighted_bodyweight, timed,
  distance, distance_time, cardio_hr, amrap, emom, circuit, rpe_only
- Auto PR detection using Epley 1RM formula: weight_kg × (1 + reps/30)
- Rest timer (GoW gold segmented countdown bar) — defaults 90s
- Exercise search from 120+ exercise library
- Set log with weight (lbs), reps, RPE slider 1-10
- Add/remove sets per exercise

4.2 WEIGHT PLATE CALCULATOR
CRITICAL: This is a MANUAL add mode, NOT an auto-solver.
- User taps + to add one plate of that weight to each side
- Shows individual plate count per type (NOT grouped "×2")  
- Barbell SVG with actual coloured weight plates
- Bar weight selector: Men's 45lb, Women's 35lb, EZ Bar 15lb, No bar
- Shows each plate individually: #1 45lb, #2 45lb, #3 10lb
- Total updates in real time
- End caps are SHORT stubs (10px height max — previous versions were too tall)
- Plates stack outward from the knurl (centre grip)

4.3 EXERCISE LIBRARY
- 120+ exercises seeded in DB
- Categories: barbell, dumbbell, machine/cable, bodyweight, timed, cardio, etc.
- Each has: name, slug, category, primary_muscles, tracking_type, met_value
- Search by name
- Filter by category
- Animated muscle map on exercise detail (SVG — red pulse for primary, orange for secondary)

4.4 STRENGTH STANDARDS
- Big 4 lifts: Back Squat, Bench Press, Deadlift, Overhead Press
- 5 levels: Beginner, Novice, Intermediate, Advanced, Elite
- Standards are bodyweight multipliers (sex-specific):
  Male:   squat [0.50,0.75,1.25,1.75,2.25], bench [0.50,0.65,1.00,1.40,1.75]
          dead  [0.75,1.00,1.50,2.00,2.50], ohp   [0.30,0.40,0.65,0.85,1.10]
  Female: squat [0.30,0.50,0.80,1.15,1.50], bench [0.25,0.35,0.55,0.80,1.00]
          dead  [0.40,0.65,1.00,1.40,1.75], ohp   [0.15,0.25,0.40,0.55,0.75]
- Age adjustment factor (lifts peak 28-32, decline after 40)
- DOTS score (competitive powerlifting coefficient)
- 3 tabs: My lifts (per-lift level bars), Global (10 world regions), Targets (cycle levels)
- Global comparison: 10 regions, blue line = user, bar = regional average
- Shows exactly how many lbs to next level

4.5 BMI TRACKER
- Weight input + height from profile
- Semicircle gauge SVG with needle (color zones: blue=underweight, green=healthy, amber=overweight, red=obese)
- Ideal weight range (min/ideal/max in lbs)
- Three comparison bars: vs. adults 30-39 (NHANES), vs. global average, vs. PlateTrack users
- Percentile calculations (NCD-RisC 2022 population data)

4.6 WEIGHT TRACKER
- Log daily weight (lbs or kg per user preference)
- Line chart showing 90-day history
- Goal weight with progress ring
- Friends weight leaderboard (PERCENTAGE change, not raw lbs — fairer comparison)

4.7 BODY COMPOSITION
- Log body fat %, lean mass %, water %, bone %
- Trend tracking
- One entry per day (unique constraint)

4.8 NUTRITION LOG — OWN DEDICATED PAGE
IMPORTANT: Nutrition is its own separate page, NOT embedded elsewhere.
Accent color: #8B5CF6 (purple) to distinguish it from blue workout sections.
- Daily macro tracking: Protein (blue), Carbs (gold), Fat (red) — GoW segmented bars
- Meal sections: Breakfast, Lunch, Post-Workout, Dinner, Snacks
- Each meal shows logged items with calories
- Hydration tracker with segmented water bar
- Daily goal progress (calories and macros)
- "Add food" button opens food search

4.9 FRIENDS & SOCIAL
- Add friends by username
- % leaderboard (weight lost as % of bodyweight, volume % change — not raw numbers)
- Friends activity feed
- Progress sharing (generates shareable card image)

4.10 CHALLENGES
- Create challenge with: metric, duration (days), invite code
- Join by invite code
- Leaderboard per challenge
- Winner gets 500 XP

4.11 XP / REWARDS SYSTEM — FULL DETAIL

XP EARN AMOUNTS:
  SET_COMPLETED:           10 per set
  WORKOUT_COMPLETED:       50 per session  
  PR_ACHIEVED:            100 per new PR
  STREAK_DAY:              25 per day of active streak
  WEEKLY_GOAL_MET:        200 (3+ workouts in a week)
  FIRST_WORKOUT_OF_WEEK:   75 bonus
  CHALLENGE_WON:          500
  CHALLENGE_JOINED:        50
  NUTRITION_DAY_COMPLETE:  30
  WEIGHT_LOGGED:           15
  BODY_COMP_LOGGED:        20
  NEW_EXERCISE_TRIED:      40 (first time logging an exercise)
  FRIEND_ADDED:            50
  PROGRESS_SHARED:         25
  ACHIEVEMENT_BONUS:       varies (per badge, 50-10000)

LEVELS:
  Novice:   0 - 999 XP     color: #6E7191
  Iron:     1,000 - 4,999   color: #9CA3AF
  Bronze:   5,000 - 14,999  color: #CD7F32
  Silver:   15,000 - 34,999 color: #C0C0C0
  Gold:     35,000 - 74,999 color: #F59E0B
  Platinum: 75,000 - 149,999 color: #60A5FA
  Elite:    150,000+         color: #EF4444

XP EXPIRY — TWO RULES RUNNING TOGETHER:
  Rule 1 ROLLING: All XP expires 365 days after it was earned (rolling from earn date)
  Rule 2 INACTIVITY:
    - 30+ days no workout → expiry window shrinks to 180 days
    - 60+ days no workout → expiry window shrinks to 90 days
  A daily cron job (pg_cron or Supabase Edge Function at 3am UTC) runs run_xp_expiry()
  Notification sent 14 days before significant XP expires
  "Expiring soon" amber tag on XP feed items within 30 days
  "Expires in Xd" red tag within 7 days

REDEMPTION COSTS (high — meaningful to earn):
  7-Day Pro Trial:    5,000 XP  (~3.5 weeks consistent training)
  Custom Plate Colors: 8,000 XP (~5-6 weeks)
  Challenge Slot:     6,000 XP  (~4 weeks)
  1-Month Pro Trial:  15,000 XP (~10 weeks)
  10% Off Annual:     20,000 XP (~13 weeks)
  3-Month Pro Trial:  30,000 XP (~20 weeks)
  30% Off Annual:     35,000 XP (~23 weeks — elite tier)

35 ACHIEVEMENTS in 5 categories: milestone, strength, consistency, social, nutrition.
Examples: "First Blood" (first workout), "Week Warrior" (7-day streak),
"Push It" (bench 1× bodyweight), "Year of Iron" (365 workouts), etc.

4.12 BILLING — TWO SYSTEMS
Web (Stripe):
  Monthly: $4.99/month    STRIPE_PRICE_MONTHLY
  Annual:  $39.99/year    STRIPE_PRICE_ANNUAL
  Lifetime: $79.99 once   STRIPE_PRICE_LIFETIME

Mobile (RevenueCat over Apple/Google):
  iOS product IDs:     app.platetrack.pro.monthly / .annual / .lifetime
  Android product IDs: platetrack_pro_monthly / _annual / _lifetime
  RevenueCat entitlement: "pro"
  RevenueCat offering:    "default"

Both systems write to profiles.plan and profiles.plan_expires_at.
Lifetime = plan_expires_at IS NULL (never expires).
isPro check: plan = 'pro' AND (plan_expires_at IS NULL OR plan_expires_at > now())

4.13 PUSH NOTIFICATIONS
7 notification types: workout reminder, rest timer done, PR celebration,
XP expiring, streak at risk, challenge update, friend PR.
VAPID push via web-push library.

4.14 ADMOB
Ads shown: between sessions, after workout summary.
NEVER during an active workout (this is a hard rule).
iOS: requires NSUserTrackingUsageDescription in Info.plist + ATT prompt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. DATABASE SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run SQL files in this exact order:
  schema/01_main.sql          ← core tables
  schema/02_rewards.sql       ← XP, achievements, catalog
  schema/03_exercises.sql     ← 120+ exercise seed data
  schema/04_security.sql      ← RLS hardening, constraints, audit log
  schema/05_expiry.sql        ← XP expiry triggers + cron function

CORE TABLES:
  profiles (extends auth.users):
    id, username, email, plan (free/pro), plan_expires_at, 
    stripe_customer_id, onboarding_complete, unit_preference (imperial/metric),
    fitness_goal, gender, height_cm, date_of_birth, avatar_url,
    total_xp, current_level, xp_this_week, xp_this_month, last_workout_at,
    last_xp_at, deleted_at, deletion_scheduled_at

  exercises:
    id, name, slug (unique), category, primary_muscles[], secondary_muscles[],
    tracking_type, met_value, is_default, user_id (for custom exercises)

  workout_sessions:
    id, user_id, program_id, name, notes, started_at, completed_at,
    is_complete, set_count

  session_exercises:
    id, session_id (CASCADE DELETE), exercise_id, order_index

  session_sets:
    id, session_exercise_id (CASCADE DELETE), set_number,
    weight_kg, reps, rpe, duration_seconds, distance_km, is_pr
    CHECK: weight_kg>=0, reps BETWEEN 0 AND 10000, rpe BETWEEN 1 AND 10

  personal_records:
    id, user_id, exercise_id, session_id, record_type (1rm/max_reps/max_weight/max_distance/fastest_pace/longest_hold), value
    UNIQUE: (user_id, exercise_id, record_type)

  weight_logs:
    id, user_id, weight_lbs, logged_date
    UNIQUE: (user_id, logged_date)
    CHECK: weight_lbs BETWEEN 50 AND 1500

  body_composition:
    id, user_id, body_fat_pct, lean_mass_pct, water_pct, bone_pct, logged_date
    UNIQUE: (user_id, logged_date)

  nutrition_logs, food_items, nutrition_goals, water_logs (standard macro tracking)

  friendships:
    id, user_id, friend_id, status (pending/accepted/blocked)

  challenges, challenge_participants, challenge_leaderboard_cache

  xp_events:
    id, user_id, event_type, xp_amount, description, reference_id,
    expires_at, is_expired (default false), expiry_rule, metadata, created_at

  achievements (catalog), user_achievements, reward_catalog, redemptions

  audit_log, push_subscriptions, subscriptions

KEY FUNCTIONS:
  calc_dots(total_kg, bw_kg, is_male) → DOTS score
  assess_lift_level(lift_lbs, bw_lbs, exercise_key, sex, age) → 0-4
  run_xp_expiry() → expires old XP, recalculates totals
  set_xp_expiry() → trigger that sets expires_at on INSERT
  update_last_workout() → trigger on workout_sessions INSERT/UPDATE

RLS: Every table has RLS. Users can only see/modify their own data.
Service role bypasses RLS for triggers and admin operations.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All routes: GET returns {success:true, data:...} or {success:false, error:...}
Auth: createSupabaseServerClient() + requireAuth(supabase) on every protected route
Admin ops use createSupabaseAdmin() (service role key, server only)

Routes to implement:
  GET/PUT  /api/auth/profile
  GET/POST /api/workouts/sessions
  GET      /api/exercises?q=&category=
  GET/POST /api/weight
  GET/POST /api/body-composition
  GET/POST /api/nutrition
  GET      /api/standards
  GET      /api/friends
  POST     /api/friends (add/accept)
  GET      /api/friends/leaderboard?metric=weight_lost_pct&period=30
  GET/POST /api/challenges
  GET      /api/rewards
  POST     /api/rewards/earn
  POST     /api/rewards/redeem
  POST     /api/billing/checkout
  POST     /api/billing/stripe-webhook (raw body, verify signature)
  POST     /api/billing/revenuecat
  DELETE   /api/account/delete
  GET      /api/export (Pro only, CSV, max 2yr range)

FRIENDS LEADERBOARD — single query pattern (no N+1):
  Fetch ALL weight logs for all friend IDs in one query using .in(user_id, friendIds)
  Fetch ALL profiles in one query
  Calculate % change in JS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. PAGES / ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app/page.tsx              → redirect to /dashboard
app/dashboard/page.tsx    → greeting, level card, PR card, volume chart, start CTA
app/login/page.tsx        → Apple OAuth, Google OAuth, email+password, magic link
app/signup/page.tsx       → username, email, password
app/onboarding/page.tsx   → 6-step wizard: goal, gender, units, height, weight, notifications
app/workout/start/page.tsx → live workout: exercise search, set logger, rest timer
app/exercises/page.tsx    → search + category filter, muscle map on tap
app/plates/page.tsx       → MANUAL weight plate calculator (tap + to add)
app/standards/page.tsx    → 3 tabs: My lifts, Global comparison, Targets
app/progress/page.tsx     → PRs, volume chart, workout history heatmap
app/bmi/page.tsx          → BMI gauge, percentile bars, weight trend
app/nutrition/page.tsx    → OWN PAGE, purple accent, macros, meals, hydration
app/friends/page.tsx      → % leaderboard, add friend, activity feed
app/challenges/page.tsx   → active challenges, create/join by code, leaderboard
app/rewards/page.tsx      → 3 tabs: Overview (XP feed), Badges, Redeem
app/profile/page.tsx      → avatar, stats summary, plan status, upgrade button
app/settings/page.tsx     → units, notifications, export data, delete account
app/reset-password/page.tsx → two-phase reset
app/delete-account/page.tsx → soft delete with 30-day grace
app/privacy/page.tsx      → PIPEDA/GDPR/CCPA compliant
app/terms/page.tsx        → with IAP terms and health disclaimer
app/offline/page.tsx      → offline fallback
app/auth/callback/route.ts → OAuth exchange, create profile for new users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

components/layout/SideMenu.tsx
  - 11 nav items with GoW styling (blue left-border on active)
  - Nutrition in purple, Rewards in gold
  - User profile footer: avatar, username, level, XP, Pro badge
  - Sign out button
  - Closes on route change, backdrop click, Escape key

components/layout/BottomNav.tsx  
  - 5 items: Home, Workout, Standards, Progress, Profile
  - Hidden on auth pages
  - Active item in var(--acc) blue

components/rewards/XPToast.tsx
  - Context provider (XPToastProvider wraps layout)
  - useXPToast() hook → showXP(amount, label)
  - Floating +50 XP toast bottom-right, auto-dismiss 2.5s
  - GoW angled corners
  - Weight plate ring icon in green

components/ui/Skeleton.tsx
  - Skeleton, CardSkeleton, OfflineBanner, EmptyState, ErrorState

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. MIDDLEWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

middleware.ts handles:
  - Auth guard (redirect to /login?next=path if not authed)
  - Onboarding redirect (if onboarding_complete = false)
  - Deleted account block (sign out + redirect)
  - Stripe/RevenueCat webhook routes excluded from auth

Public routes: /login, /signup, /reset-password, /verify-email,
               /auth/callback, /privacy, /terms, /offline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. XP WIRING — WHERE TO CALL earnXP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Import from lib/xpIntegration.ts. ALL calls are fire-and-forget (.catch()).

After workout session save:
  onWorkoutComplete(userId, sessionId, setCount, isPR, prExerciseName)
  (internally handles: SET_COMPLETED batch, WORKOUT_COMPLETED, PR_ACHIEVED,
   last_workout_at update, streak check, weekly goal check)

After PR detected:     onPRDetected(userId, exerciseName, sessionId)
After weight logged:   onWeightLogged(userId)
After body comp saved: onBodyCompLogged(userId)
After nutrition day:   onNutritionDay(userId)
After friend accepted: onFriendAdded(userId)
After challenge won:   onChallengeWon(userId, challengeId)
After challenge join:  onChallengeJoined(userId, challengeId)
After share card:      onProgressShared(userId)
After new exercise:    onNewExercise(userId, exerciseName)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           ← server only, never expose

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_ANNUAL=
STRIPE_PRICE_LIFETIME=

REVENUECAT_API_KEY=
REVENUECAT_WEBHOOK_SECRET=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

NEXT_PUBLIC_ADMOB_APP_ID_IOS=
NEXT_PUBLIC_ADMOB_APP_ID_ANDROID=
NEXT_PUBLIC_ADMOB_BANNER_UNIT_ID=

NEXT_PUBLIC_APP_URL=https://platetrack.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. CRITICAL BUGS TO NOT REPEAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These were caught in a cold-eyes review. Do not reproduce them:

1. /auth/callback MUST exist — without it, Apple/Google OAuth silently fails
2. personal_records record_type CHECK must allow: 1rm, max_reps, max_weight,
   max_distance, fastest_pace, longest_hold — NOT just '1rm'
3. body_composition needs UNIQUE(user_id, logged_date) constraint
4. session_exercises and session_sets need ON DELETE CASCADE from sessions
5. isPro() MUST check plan_expires_at: plan='pro' AND (expires IS NULL OR expires > now())
6. requirePro() must use the above — not just check plan='pro'
7. OfflineBanner: use useCallback for event handlers or removeEventListener won't work
8. Onboarding skip: default height to 70in (178cm) if skipped — prevents NaN BMI
9. Friends leaderboard: single .in() query — not N+1 per friend
10. CSV export: clamp date range to max 2 years — prevents Vercel function timeout
11. Share tokens: use crypto.getRandomValues() not Math.random() or md5
12. Stripe webhook: stripe.webhooks.constructEvent() MUST verify signature
13. Stripe webhook route needs raw body — add to next.config matcher exclusion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. APP STORE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required to pass Apple review:
- Delete Account option in-app at /delete-account (30-day soft delete)
- Restore Purchases button in subscription/profile screen
- Privacy Policy at /privacy
- NSUserTrackingUsageDescription in Info.plist (for AdMob ATT)
- GADApplicationIdentifier in Info.plist
- No references to "Android" or "Google Play" in iOS app copy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. WHAT'S ALREADY BUILT IN THIS FOLDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following files already exist and are complete — do not overwrite without
checking them first:

lib/supabase.ts           ← client, server client, admin, requireAuth, isPro
lib/api.ts                ← success(), handleError()
lib/auth.ts               ← rateLimit, ensureProfile, generateShareToken
lib/rewards.ts            ← LEVELS, XP amounts, expiry logic, formatXP
lib/xpIntegration.ts      ← earnXP, earnSetXP, onWorkoutComplete, all wiring
lib/strengthStandards.ts  ← STANDARDS multipliers, LIFT_DEFS, calcDOTS, all helpers
lib/analytics.ts          ← PostHog init, track, identifyUser
lib/notifications.ts      ← requestPushPermission, subscribeToPush

app/layout.tsx            ← root layout with providers
app/page.tsx              ← redirect to /dashboard
app/dashboard/page.tsx    ← full dashboard (check before overwriting)
app/login/page.tsx        ← full (Apple, Google, email)
app/signup/page.tsx       ← full
app/onboarding/page.tsx   ← full 6-step wizard
app/workout/start/page.tsx ← full active workout
app/plates/page.tsx       ← full MANUAL plate calculator
app/auth/callback/route.ts ← full OAuth handler
middleware.ts             ← full auth guard

app/api/auth/profile/route.ts
app/api/workouts/sessions/route.ts
app/api/exercises/route.ts
app/api/weight/route.ts
app/api/nutrition/route.ts
app/api/standards/route.ts
app/api/friends/route.ts
app/api/challenges/route.ts
app/api/rewards/route.ts
app/api/rewards/earn/route.ts
app/api/rewards/redeem/route.ts
app/api/billing/checkout/route.ts
app/api/billing/stripe-webhook/route.ts
app/api/billing/revenuecat/route.ts
app/api/account/delete/route.ts
app/api/export/route.ts

components/layout/SideMenu.tsx    ← full GoW side drawer
components/layout/BottomNav.tsx   ← full bottom nav
components/rewards/XPToast.tsx    ← full XP toast system
components/ui/Skeleton.tsx        ← Skeleton, OfflineBanner, EmptyState, ErrorState

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. WHAT STILL NEEDS TO BE BUILT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are stubs or empty — build them fully:

PAGES (full implementations needed):
  app/standards/page.tsx      ← 3 tabs: My lifts, Global, Targets
  app/progress/page.tsx       ← PRs list, volume chart, workout history
  app/bmi/page.tsx            ← gauge SVG, percentile bars, weight trend
  app/nutrition/page.tsx      ← purple accent, macros, meals, hydration
  app/exercises/page.tsx      ← search, categories, muscle map
  app/friends/page.tsx        ← % leaderboard, add friend, feed
  app/challenges/page.tsx     ← list, create, join by code
  app/rewards/page.tsx        ← 3 tabs: Overview, Badges, Redeem
  app/profile/page.tsx        ← stats, plan status, upgrade, edit
  app/settings/page.tsx       ← units, notifications, export, delete link
  app/reset-password/page.tsx ← two-phase (request → set new)
  app/delete-account/page.tsx ← type DELETE to confirm
  app/privacy/page.tsx        ← PIPEDA/GDPR/CCPA policy
  app/terms/page.tsx          ← with health disclaimer and IAP terms
  app/offline/page.tsx        ← offline fallback

API ROUTES (missing):
  app/api/friends/leaderboard/route.ts  ← single-query, no N+1
  app/api/body-composition/route.ts     ← GET/POST with unique per day

SCHEMA FILES (write all 5 in /schema folder):
  01_main.sql       ← all core tables, RLS, indexes
  02_rewards.sql    ← xp_events, achievements seed, reward catalog seed
  03_exercises.sql  ← 120+ exercises seed data
  04_security.sql   ← constraint fixes, audit log, rate_limits
  05_expiry.sql     ← XP expiry triggers, pg_cron setup, run_xp_expiry()

OTHER:
  public/manifest.json      ← PWA manifest
  public/sw.js              ← service worker (cache-first, push, offline)
  capacitor.config.ts       ← app.platetrack, iOS/Android config
  .env.example              ← all vars listed (no values)
  tailwind.config.ts        ← already exists, check it's correct

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. FIRST THING TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Run: npm install
2. Copy .env.example to .env.local and fill in Supabase URL + anon key
3. Run: npm run dev
4. Fix any TypeScript/build errors
5. Then build remaining pages and schema files
6. Run the SQL schema files against your Supabase project
7. Test: create account → onboarding → log a workout → check XP earned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
