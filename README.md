# PlateTrack

Strength tracker competing with Hevy. God of War Ragnarök UI.

**Stack:** Next.js 14 · Supabase · Stripe · RevenueCat · Capacitor · Vercel

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env vars
cp .env.example .env.local
# Fill in all values — see CLAUDE_CODE_PROMPTS.md for what each one does

# 3. Run Supabase SQL files in order:
#    schema/01_main.sql → schema/02_rewards.sql → schema/03_exercises.sql

# 4. Dev
npm run dev

# 5. Build
npm run build
```

## Deploy with Claude Code

```bash
npm install -g @anthropic-ai/claude-code
cd platetrack
claude
```

Paste the prompts from **CLAUDE_CODE_PROMPTS.md** in order (1–8).
Claude Code will write all remaining pages, fix TypeScript errors, and run the build until it passes.

## What's built

| File | Status |
|------|--------|
| All API routes (`/api/**`) | ✅ Complete |
| Auth (login, signup, OAuth callback, reset password) | ✅ Complete |
| Dashboard | ✅ Complete |
| Active workout logger | ✅ Complete |
| Weight plate calculator | ✅ Complete |
| Onboarding | ✅ Complete |
| lib/* (supabase, auth, api, rewards, strengthStandards, xpIntegration) | ✅ Complete |
| Middleware (auth guard, onboarding redirect) | ✅ Complete |
| SideMenu + BottomNav components | ✅ Complete |
| XP toast notification system | ✅ Complete |
| BMI tracker page | 🔲 Needs full UI (Prompt 2) |
| Friends leaderboard page | 🔲 Needs full UI (Prompt 2) |
| Challenges page | 🔲 Needs full UI (Prompt 2) |
| Progress / PRs page | 🔲 Needs full UI (Prompt 2) |
| Profile page | 🔲 Needs full UI (Prompt 2) |
| Settings page | 🔲 Needs full UI (Prompt 2) |
| Rewards / XP page | 🔲 Needs full UI (Prompt 2) |
| Nutrition log page | 🔲 Needs full UI (Prompt 3) |
| SQL schema files | 🔲 Need content (Prompt 4) |
| manifest.json + sw.js | 🔲 Need content (Prompt 5) |
| TypeScript build passing | 🔲 Run Prompt 6 |

## Design system

- **Background:** `#0D0F1C` near-black navy
- **Cards:** `#252836` with angled clip-path corners (GoW style)
- **Primary:** `#3B82F6` electric blue
- **Nutrition accent:** `#8B5CF6` purple
- **PRs / Gold:** `#F59E0B`
- **Success:** `#22C55E`
- **Labels:** 9px ALL CAPS, letter-spacing .14em
- **Numbers:** `'Courier New'` monospace
- **Bars:** Segmented flex bars (not border-radius progress bars)

## App ID

`app.platetrack`

RevenueCat entitlement: `pro`  
RevenueCat products: `app.platetrack.pro.monthly` / `.annual` / `.lifetime`
