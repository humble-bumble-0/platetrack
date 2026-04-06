// lib/exerciseCues.ts — form cues for common exercises
export const EXERCISE_CUES: Record<string,string[]> = {
  'back-squat': ['Feet shoulder-width apart','Brace core, chest up','Break at hips first','Knees track over toes','Depth: hip crease below knees'],
  'bench-press': ['Arch upper back, retract scapula','Grip just outside shoulders','Lower bar to mid-chest','Drive feet into floor','Lock out at top'],
  'deadlift': ['Feet hip-width, bar over mid-foot','Hinge at hips, flat back','Push floor away with legs','Lock hips at top','Controlled lower'],
  'overhead-press': ['Grip just outside shoulders','Brace core tight','Press straight overhead','Full lockout at top','Lower under control'],
  'barbell-row': ['Hinge to 45 degrees','Pull to lower chest','Squeeze shoulder blades','Control the negative','Keep core braced'],
  'front-squat': ['Elbows high, bar on delts','Upright torso','Core tight throughout','Drive knees out','Full depth'],
  'romanian-deadlift': ['Slight knee bend','Hinge at hips','Bar stays close to legs','Feel hamstring stretch','Squeeze glutes at top'],
  'pull-up': ['Full hang start','Pull elbows to hips','Chin over bar','Controlled descent','Avoid kipping'],
  'dip': ['Lean slightly forward','Lower until 90° at elbow','Drive up to lockout','Keep shoulders down','Control the tempo'],
  'lat-pulldown': ['Wide grip','Pull to upper chest','Squeeze lats at bottom','Slow negative','Avoid leaning too far back'],
}

export function getCues(slug: string): string[] {
  return EXERCISE_CUES[slug] || []
}
