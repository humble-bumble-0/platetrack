// lib/rewards.ts
export const LEVELS = [
  { name: 'Novice',   min: 0,      max: 999,    color: '#6E7191', next: 1000    },
  { name: 'Iron',     min: 1000,   max: 4999,   color: '#9CA3AF', next: 5000    },
  { name: 'Bronze',   min: 5000,   max: 14999,  color: '#CD7F32', next: 15000   },
  { name: 'Silver',   min: 15000,  max: 34999,  color: '#C0C0C0', next: 35000   },
  { name: 'Gold',     min: 35000,  max: 74999,  color: '#F59E0B', next: 75000   },
  { name: 'Platinum', min: 75000,  max: 149999, color: '#60A5FA', next: 150000  },
  { name: 'Elite',    min: 150000, max: Infinity,color: '#EF4444', next: null    },
] as const

export const XP_EXPIRY = {
  DEFAULT_DAYS: 365,
  INACTIVITY_THRESHOLD_DAYS: 60,
  INACTIVITY_EXPIRY_DAYS: 90,
  SOFT_THRESHOLD_DAYS: 30,
  SOFT_EXPIRY_DAYS: 180,
  WARNING_DAYS: 30,
}

export const XP = {
  SET_COMPLETED:           10,
  WORKOUT_COMPLETED:       50,
  PR_ACHIEVED:            100,
  STREAK_DAY:              25,
  WEEKLY_GOAL_MET:        200,
  FIRST_WORKOUT_OF_WEEK:   75,
  CHALLENGE_WON:          500,
  CHALLENGE_JOINED:        50,
  NUTRITION_DAY_COMPLETE:  30,
  WEIGHT_LOGGED:           15,
  BODY_COMP_LOGGED:        20,
  NEW_EXERCISE_TRIED:      40,
  FRIEND_ADDED:            50,
  PROGRESS_SHARED:         25,
  ACHIEVEMENT_BONUS:        0,
} as const

export type XPEventType = keyof typeof XP

export const REDEMPTION_COSTS = {
  pro_trial_7:    5_000,
  pro_trial_30:  15_000,
  pro_trial_90:  30_000,
  cosmetic:       8_000,
  challenge_slot: 6_000,
  discount_10:   20_000,
  discount_30:   35_000,
}

export const RARITY_COLORS = {
  common:    '#6E7191',
  rare:      '#3B82F6',
  epic:      '#8B5CF6',
  legendary: '#F59E0B',
} as const

export function getLevel(xp: number) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getLevelProgress(xp: number) {
  const level  = getLevel(xp)
  const idx    = LEVELS.findIndex(l => l.name === level.name)
  const next   = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
  const xpInto = xp - level.min
  const range  = next ? next.min - level.min : 1
  return {
    level, nextLevel: next,
    progressPct: next ? Math.min(100, Math.round((xpInto / range) * 100)) : 100,
    xpIntoLevel: xpInto,
    xpToNextLevel: next ? next.min - xp : null,
  }
}

export function computeExpiryDate(earnedAt: Date, daysSinceLastWorkout: number | null): Date {
  const d = daysSinceLastWorkout ?? 0
  let days = XP_EXPIRY.DEFAULT_DAYS
  if (d >= XP_EXPIRY.INACTIVITY_THRESHOLD_DAYS) days = XP_EXPIRY.INACTIVITY_EXPIRY_DAYS
  else if (d >= XP_EXPIRY.SOFT_THRESHOLD_DAYS)  days = XP_EXPIRY.SOFT_EXPIRY_DAYS
  const expiry = new Date(earnedAt)
  expiry.setDate(expiry.getDate() + days)
  return expiry
}

export function formatXP(xp: number) {
  if (xp >= 1_000_000) return `${(xp/1_000_000).toFixed(1)}M`
  if (xp >= 1_000)     return `${(xp/1_000).toFixed(1)}K`
  return xp.toString()
}

export function expiryLabel(expiresAt: Date | null | undefined, isExpired: boolean): string | null {
  if (isExpired) return 'Expired'
  if (!expiresAt) return null
  const d = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
  if (d <= 0)  return 'Expiring today'
  if (d <= 7)  return `Expires in ${d}d`
  if (d <= 30) return `Expires in ${d}d`
  return null
}

export function xpEventLabel(type: XPEventType, metadata?: any): string {
  const m: Record<XPEventType, string> = {
    SET_COMPLETED: 'Set logged', WORKOUT_COMPLETED: 'Workout completed',
    PR_ACHIEVED: `New PR — ${metadata?.exercise || 'lift'}`,
    STREAK_DAY: `${metadata?.streak || ''}-day streak`,
    WEEKLY_GOAL_MET: 'Weekly goal hit', FIRST_WORKOUT_OF_WEEK: 'First workout this week',
    CHALLENGE_WON: 'Challenge won', CHALLENGE_JOINED: 'Challenge joined',
    NUTRITION_DAY_COMPLETE: 'Full day of nutrition logged', WEIGHT_LOGGED: 'Weight logged',
    BODY_COMP_LOGGED: 'Body comp logged', NEW_EXERCISE_TRIED: `First time: ${metadata?.exercise || 'new exercise'}`,
    FRIEND_ADDED: 'Friend added', PROGRESS_SHARED: 'Progress shared',
    ACHIEVEMENT_BONUS: `Achievement: ${metadata?.name || 'badge earned'}`,
  }
  return m[type] || type
}
