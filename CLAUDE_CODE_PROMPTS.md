# PlateTrack — Claude Code Prompts

Paste these prompts **in order** into Claude Code (`claude` in your terminal).
Each prompt is self-contained. Wait for Claude Code to finish before starting the next one.

---

## PROMPT 1 — Install dependencies and verify structure

```
Install all dependencies for this Next.js 14 project and verify the structure is correct.

Run:
1. npm install
2. Check that all imports in lib/ resolve correctly
3. Check that all @/ path aliases work (they should map to the project root per tsconfig.json)
4. List any missing peer dependencies and install them

Do not modify any existing files. Just install and verify.
```

---

## PROMPT 2 — Fill stub pages

```
This is PlateTrack — a fitness tracker with a God of War Ragnarök aesthetic.

Design rules:
- Background: #0D0F1C (near black)
- Cards: #252836 with clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))  — angled corners
- Primary accent: #3B82F6 (electric blue)
- Green: #22C55E, Gold: #F59E0B, Red: #EF4444, Purple: #8B5CF6
- ALL section labels: 9px, uppercase, letter-spacing .14em, class="gl"
- Numbers: font-family 'Courier New' monospace, class="gm"
- GoW segmented bars: display:flex gap-0.5, each segment flex:1 h-2 (not border-radius progress bars)
- Every card uses clip-path angled corners, never border-radius

Replace the stub implementations in these pages with full working UIs:

### app/friends/page.tsx
Show friends leaderboard. Fetch from GET /api/friends and GET /api/friends/leaderboard.
- Metric toggle: Weight % | Volume % | Streak
- Ranked list: rank number, avatar (first letter of username), name, progress bar, % change
- "You" row highlighted in blue
- Add friend button (input username, POST /api/friends)
- Share button

### app/challenges/page.tsx
Show active challenges. Fetch from GET /api/challenges.
- Active challenge cards: name, metric, end date, participant count, leaderboard preview
- "Create challenge" button: opens form with name, metric picker, duration slider (1-4 weeks), invite code display
- "Join by code" input
- POST /api/challenges to create, POST /api/challenges with action:'join' to join

### app/bmi/page.tsx
BMI tracker. Fetch from GET /api/weight (weight history) and GET /api/auth/profile (height).
- Calculate BMI = (weight_lbs × 703) / (height_inches²)
- Semicircle SVG gauge: Underweight(blue) | Healthy(green) | Overweight(amber) | Obese(red), needle points to current BMI value
- BMI number large and prominent, category label
- Ideal weight range in lbs (18.5-24.9 BMI range for their height)
- 3 comparison bars (GoW segmented style):
  - vs adults 30-39 (NHANES data: avg BMI 28.5, show top X%)
  - vs global average (NCD-RisC: avg BMI 26.8)
  - vs PlateTrack users (show percentile)
- Weight history line chart (last 30 days), simple SVG

### app/progress/page.tsx
Progress and PRs. Fetch from GET /api/workouts/sessions and GET /api/standards.
- Weekly volume bar chart (last 8 weeks) using SVG bars
- Personal records section: squat, bench, deadlift, OHP displayed as cards with GoW level bars
- Recent PRs list with date and weight
- Workout heatmap (last 90 days, simple grid of colored squares)
- Body stats summary: current weight, trend arrow

### app/profile/page.tsx
User profile. Fetch from GET /api/auth/profile and GET /api/rewards.
- Avatar (large initials circle with GoW clip-path)
- Username, level badge (colored by level), Pro badge if applicable
- Level progress card with GoW segmented bar
- Stats grid: total workouts, total sets, total PRs, streak
- Settings shortcuts: Units, Notifications
- Subscription status card: current plan, upgrade CTA if free
- Export data button (Pro only) → GET /api/export
- Delete account link → /delete-account
- Sign out button

### app/settings/page.tsx
App settings. Fetch from GET /api/auth/profile.
- Units toggle: Imperial / Metric (PUT /api/auth/profile)
- Notification toggles: Workout reminders, PR celebrations, XP alerts, Friend activity
- Bar weight default (saved to localStorage)
- Plate colour theme (cosmetic reward unlock)
- Data section: Export CSV, Delete account
- About section: version, Privacy Policy link, Terms link
- All toggles use GoW-styled switch design

### app/rewards/page.tsx
XP and rewards. Fetch from GET /api/rewards.
Replace the stub with three tabs:

Tab 1 — Overview:
- Level card: level name in level colour, GoW segmented XP bar (10 segments), XP into level, XP to next level
- This week stats grid: XP earned, workouts, PRs
- XP feed: recent events list, each showing icon + description + "+X XP" + expiry pill if expiring within 30 days (amber: 14-30 days, red: <14 days, grey strikethrough: expired)
- Inactivity warning banner (amber) if last_workout_at > 30 days ago

Tab 2 — Badges:
- Category filter pills: All | Milestone | Strength | Consistency | Social | Nutrition
- 3-column grid of badge cards
- Each badge: icon (large emoji), name, rarity dot (colour from RARITY_COLORS), XP reward if earned
- Locked badges: greyed out, opacity 0.3
- Earned badges: full colour, subtle glow border

Tab 3 — Redeem:
- "X XP available" counter
- Reward cards with icon, name, description, XP cost in gold
- "Redeem" button (active if can afford, greyed if not)
- POST /api/rewards/redeem with reward_id
- Show redemption result (discount code, pro trial confirmation)
```

---

## PROMPT 3 — Complete the nutrition page

```
app/nutrition/page.tsx already exists but needs a full implementation.

Replace it with a complete Nutrition Log page:

Design: same GoW dark navy theme. Use PURPLE (#8B5CF6) as the accent colour for nutrition (distinct from blue used elsewhere).

Layout:
1. Header: "Nutrition Log" with purple accent, date selector (prev/next day arrows + today button)

2. Daily macros card:
   - Fetch GET /api/nutrition?date=YYYY-MM-DD
   - 3 GoW segmented bars (not circular rings): Protein (blue), Carbs (gold), Fat (red)
   - Each bar: label, "X / Yg" counter, 10-segment bar filled to %
   - Calories total at bottom: "1,742 / 2,200 kcal"

3. Meal sections (4 sections, each collapsible):
   - Morning | Midday | Post-Workout | Evening
   - Each section shows logged food items
   - Each item: name, amount, macros inline
   - "+ Log food" button per section → simple search input + POST /api/nutrition

4. Hydration tracker:
   - "HYDRATION" label
   - 12 water drop segments, filled blue based on logged ml vs goal (3000ml default)
   - Tap to add 250ml

5. Quick add button: fixed bottom button "+ Log Food" that opens a bottom sheet with food search

State management:
- useEffect to fetch on date change
- Optimistic updates when logging
- Show loading skeletons while fetching
```

---

## PROMPT 4 — Write the SQL schema files

```
Write the complete SQL schema files in the schema/ directory.

schema/01_main.sql — Complete database schema:
Tables needed:
- profiles (id, username, email, plan, plan_expires_at, stripe_customer_id, gender, height_cm, date_of_birth, unit_preference, fitness_goal, onboarding_complete, total_xp, current_level, xp_this_week, xp_this_month, last_workout_at, deleted_at, deletion_scheduled_at, created_at)
- exercises (id, name, slug, category, primary_muscles, secondary_muscles, tracking_type, is_default, user_id, created_at)
- programs (id, user_id, name, description, is_public, created_at)
- workout_sessions (id, user_id, program_id, name, notes, started_at, completed_at, is_complete, set_count, created_at)
- session_exercises (id, session_id, exercise_id, order_index, notes)
- session_sets (id, session_exercise_id, set_number, weight_kg, reps, rpe, duration_seconds, distance_km, is_pr, notes)
- personal_records (id, user_id, exercise_id, session_id, record_type, value, created_at)
- weight_logs (id, user_id, weight_lbs, logged_date, notes, UNIQUE(user_id, logged_date))
- body_composition (id, user_id, body_fat_pct, lean_mass_pct, logged_date, UNIQUE(user_id, logged_date))
- nutrition_goals (id, user_id, calories, protein_g, carbs_g, fat_g, water_ml)
- nutrition_logs (id, user_id, food_name, meal_type, calories, protein_g, carbs_g, fat_g, amount_g, log_date, logged_at)
- friendships (id, user_id, friend_id, status, created_at, UNIQUE(user_id, friend_id))
- challenges (id, creator_id, name, description, metric, duration_days, invite_code, starts_at, ends_at, created_at)
- challenge_participants (id, challenge_id, user_id, score, rank, is_winner, joined_at)
- push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at)
- subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, plan_type, status, current_period_end, updated_at)
- audit_log (id, user_id, action, metadata, created_at)

Add:
- All RLS policies (users can only see/modify their own data)
- Proper indexes on user_id, dates, foreign keys
- Cascade deletes where appropriate
- Check constraints (weight > 0, body_fat_pct between 1-70, rpe between 1-10)

schema/02_rewards.sql — Rewards/XP schema:
- xp_events (id, user_id, event_type, xp_amount, description, reference_id, expires_at, is_expired, expiry_rule, metadata, created_at)
- achievements (id, key UNIQUE, name, description, icon, xp_reward, rarity, category)
- user_achievements (id, user_id, achievement_key, earned_at, UNIQUE(user_id, achievement_key))
- reward_catalog (id, name, description, xp_cost, reward_type, reward_value, icon, is_active)
- redemptions (id, user_id, reward_id, xp_spent, status, metadata, created_at)
- Trigger: update_profile_xp() — fires on xp_events INSERT, updates profiles.total_xp and current_level
- Trigger: set_xp_expiry() — fires on xp_events INSERT, sets expires_at based on inactivity
- Trigger: check_xp_balance() — fires on redemptions INSERT, deducts XP or throws error
- Function: run_xp_expiry() — expires old XP, recalculates totals (called by cron)
- Seed all 35 achievements from the catalog
- Seed reward catalog with 7 items (pro trials, cosmetics, discount codes)

schema/03_exercises.sql — Seed 120+ exercises:
Seed the exercises table with exercises across these categories:
- Barbell: Back Squat, Front Squat, Bench Press, Incline Bench, Deadlift, Romanian Deadlift, Barbell Row, Overhead Press, Hip Thrust, Good Morning, Barbell Curl, Skull Crusher, Barbell Lunge, Power Clean, Snatch
- Dumbbell: Dumbbell Press, Incline DB Press, DB Row, DB Shoulder Press, DB Curl, DB Tricep Extension, DB Lateral Raise, DB Fly, DB Lunge, DB Romanian Deadlift, DB Shrug, DB Hammer Curl, DB Step Up, DB Goblet Squat, DB Pullover
- Bodyweight: Pull-up, Chin-up, Push-up, Dip, Pistol Squat, Nordic Curl, Glute Bridge, Plank, Side Plank, Mountain Climber, Burpee, Jump Squat, Box Jump, Dragon Flag, Muscle Up, L-Sit, Handstand Push-up, Pike Push-up, Diamond Push-up, Decline Push-up, Inverted Row, Australian Pull-up, Hollow Hold, Superman, Bird Dog, Dead Bug, Cossack Squat, Bulgarian Split Squat (bodyweight), Step Up (bodyweight), Single Leg Deadlift
- Machine/Cable: Leg Press, Leg Curl, Leg Extension, Cable Row, Lat Pulldown, Cable Fly, Chest Press Machine, Shoulder Press Machine, Cable Curl, Cable Tricep Pushdown, Hack Squat, Calf Raise Machine, Pec Deck, Cable Face Pull, Assisted Pull-up
- Cardio: Running, Cycling, Rowing Machine, Elliptical, Stairmaster, Jump Rope, Swimming, Walking, Sprint, Assault Bike, SkiErg, Sled Push, Sled Pull, Farmer Walk, Battle Ropes
- Olympic/CrossFit: Clean and Jerk, Snatch, Thruster, Wall Ball, Kettlebell Swing, Kettlebell Clean, Kettlebell Snatch, Turkish Get-Up, Box Jump Over, Double Under, Toes to Bar, Kipping Pull-up, Ring Dip, Ring Row
- Stretching/Yoga: Hip Flexor Stretch, Hamstring Stretch, Quad Stretch, Shoulder Stretch, Chest Opener, Pigeon Pose, Downward Dog, Child's Pose, Cat-Cow, World's Greatest Stretch

For each exercise set appropriate: slug (kebab-case), category, tracking_type (weight_reps, bodyweight_reps, timed, distance_time, cardio_hr, etc.), primary_muscles array, is_default=true
```

---

## PROMPT 5 — Public files and config

```
Create these missing public files and config:

public/manifest.json:
{
  name: "PlateTrack",
  short_name: "PlateTrack", 
  theme_color: "#1A1D2E",
  background_color: "#0D0F1C",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
  start_url: "/",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ],
  shortcuts: [
    { name: "Start Workout", url: "/workout/start", description: "Log a new workout" },
    { name: "Weight Plates", url: "/plates", description: "Calculate plate loading" }
  ]
}

public/sw.js:
Service worker that:
- Caches shell (/, /dashboard, /workout/start) on install
- Cache-first for static assets
- Network-first for API routes
- Falls back to /offline for navigation when offline
- Handles push notifications: show notification with title, body, icon, click opens the app

capacitor.config.ts:
- appId: 'app.platetrack'
- appName: 'PlateTrack'
- webDir: 'out' (for static export) or '.next' 
- server: { androidScheme: 'https' }
- plugins: PushNotifications (auto permissions on iOS), StatusBar (dark style)

.env.example — complete list of all required env vars with descriptions (no real values)
```

---

## PROMPT 6 — TypeScript fixes and build

```
Run `npm run build` and fix every TypeScript error and build error until it passes cleanly.

Common things to fix:
1. Any imports that reference files that don't exist yet — create minimal stubs
2. Missing type annotations on function parameters  
3. 'any' type warnings — add proper types where obvious
4. Missing 'use client' directives on components that use hooks
5. Import paths using @/ that don't resolve — check tsconfig paths

After fixing errors, run `npm run build` again. Keep iterating until:
- Zero TypeScript errors
- Zero build errors  
- The .next folder is generated successfully

Do not change any logic, only fix type errors and missing files.
```

---

## PROMPT 7 — Final wiring and API routes

```
Check that these API routes exist and have complete implementations. Create or fix any that are missing or broken:

1. GET/PUT /api/auth/profile — user profile CRUD
2. POST /api/workouts/sessions — save completed workout, detect PRs, award XP
3. GET /api/workouts/sessions — paginated workout history
4. GET /api/exercises — search/filter exercise library
5. GET /api/standards — strength levels for user's weight/age/sex
6. GET/POST /api/weight — weight log history and logging
7. GET/POST /api/nutrition — nutrition log for a date
8. GET /api/friends — friend list
9. POST /api/friends — add friend / accept request
10. GET /api/challenges — challenge list  
11. POST /api/challenges — create or join challenge
12. GET /api/rewards — XP, level, achievements, catalog
13. POST /api/rewards/earn — award XP
14. POST /api/rewards/redeem — spend XP on reward
15. POST /api/billing/checkout — create Stripe checkout session
16. POST /api/billing/stripe-webhook — handle Stripe events
17. POST /api/billing/revenuecat — handle RevenueCat events
18. DELETE /api/account/delete — soft-delete account
19. GET /api/export — CSV export (Pro only)

For each route:
- Must call requireAuth() from @/lib/supabase
- Must return success() or handleError() from @/lib/api
- Must have correct HTTP method exports
```

---

## PROMPT 8 — Deploy prep

```
Prepare the app for deployment:

1. Verify middleware.ts protects all routes correctly:
   - Public routes (no auth): /login, /signup, /reset-password, /auth/callback, /privacy, /terms, /offline, /api/billing/stripe-webhook, /api/billing/revenuecat
   - All other routes require auth
   - Redirect unauthenticated users to /login?next=<path>
   - Redirect incomplete onboarding to /onboarding

2. Add missing app/offline/page.tsx if it's just a stub

3. Verify next.config.ts has:
   - Security headers (X-Frame-Options, X-Content-Type-Options)
   - Image domains for Supabase and Google avatars
   - No body parser for stripe-webhook route

4. Create a Vercel-ready vercel.json if needed

5. Run `npm run build` one final time and confirm it passes

6. Print a summary of:
   - Total pages: X
   - Total API routes: X  
   - Any TODO comments left in the code that need real env vars
```

---

## CHEAT SHEET — What each env var does

```
NEXT_PUBLIC_SUPABASE_URL          → Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     → Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY         → Supabase service role (server only)

STRIPE_SECRET_KEY                 → Stripe secret key (sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → Stripe publishable key (pk_live_...)
STRIPE_WEBHOOK_SECRET             → From Stripe dashboard → Webhooks
STRIPE_PRICE_MONTHLY              → Price ID for $4.99/mo
STRIPE_PRICE_ANNUAL               → Price ID for $39.99/yr
STRIPE_PRICE_LIFETIME             → Price ID for $79.99 one-time

REVENUECAT_API_KEY                → RevenueCat API key
REVENUECAT_WEBHOOK_SECRET         → Set in RevenueCat → Webhooks

NEXT_PUBLIC_POSTHOG_KEY           → PostHog project key
NEXT_PUBLIC_POSTHOG_HOST          → https://app.posthog.com

NEXT_PUBLIC_VAPID_PUBLIC_KEY      → Generate: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY                 → From same command above
```

---

## ORDER TO RUN SQL FILES IN SUPABASE

```
1. schema/01_main.sql       ← Run first — creates all tables
2. schema/02_rewards.sql    ← Run second — XP, achievements, rewards
3. schema/03_exercises.sql  ← Run third — seeds 120+ exercises
```
