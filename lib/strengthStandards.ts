// lib/strengthStandards.ts
export const STANDARDS = {
  m: { squat:[0.50,0.75,1.25,1.75,2.25], bench:[0.50,0.65,1.00,1.40,1.75], deadlift:[0.75,1.00,1.50,2.00,2.50], ohp:[0.30,0.40,0.65,0.85,1.10] },
  f: { squat:[0.30,0.50,0.80,1.15,1.50], bench:[0.25,0.35,0.55,0.80,1.00], deadlift:[0.40,0.65,1.00,1.40,1.75], ohp:[0.15,0.25,0.40,0.55,0.75] },
}
export const LEVEL_NAMES  = ['Beginner','Novice','Intermediate','Advanced','Elite'] as const
export const LEVEL_COLORS = ['#6E7191','#22C55E','#3B82F6','#8B5CF6','#F59E0B'] as const
export type Sex = 'm' | 'f'
export type LiftKey = 'squat' | 'bench' | 'deadlift' | 'ohp'
export const LIFT_DEFS = [
  {key:'squat' as LiftKey, label:'Back Squat',       icon:'🏋️'},
  {key:'bench' as LiftKey, label:'Bench Press',      icon:'💪'},
  {key:'deadlift' as LiftKey, label:'Deadlift',      icon:'⬆️'},
  {key:'ohp' as LiftKey, label:'Overhead Press',     icon:'🔼'},
]
export const GLOBAL_AVERAGES = [
  {region:'Scandinavia',   flag:'🇸🇪', squat:1.35,bench:1.05,deadlift:1.70,note:'Highest per capita'},
  {region:'North America', flag:'🇺🇸', squat:1.20,bench:1.00,deadlift:1.55,note:'Large powerlifting base'},
  {region:'Australia/NZ',  flag:'🇦🇺', squat:1.18,bench:0.95,deadlift:1.52,note:''},
  {region:'Europe (avg)',  flag:'🇩🇪', squat:1.15,bench:0.92,deadlift:1.48,note:''},
  {region:'Latin America', flag:'🇧🇷', squat:1.05,bench:0.90,deadlift:1.38,note:''},
  {region:'East Asia',     flag:'🇯🇵', squat:1.08,bench:0.82,deadlift:1.35,note:''},
  {region:'🌍 Global avg', flag:'',   squat:1.05,bench:0.85,deadlift:1.40,note:'', bold:true},
]
export function ageFactor(age: number) {
  if (age <= 32) return 1.0
  if (age <= 40) return 1.0 - (age-32)*0.005
  if (age <= 50) return 0.96 - (age-40)*0.008
  if (age <= 60) return 0.88 - (age-50)*0.010
  return Math.max(0.60, 0.78 - (age-60)*0.008)
}
export function getLiftLevel(lbs: number, bw: number, key: LiftKey, sex: Sex, age: number) {
  if (!lbs||bw<=0) return 0
  const ratio = (lbs/bw)/ageFactor(age)
  const std = STANDARDS[sex][key]
  let level = 0
  for (let i=0;i<std.length;i++) { if(ratio>=std[i]) level=i }
  return level
}
export function getLevelTarget(bw: number, key: LiftKey, sex: Sex, age: number, level: number) {
  return Math.round(STANDARDS[sex][key][level] * ageFactor(age) * bw)
}
export function getLevelProgress(lbs: number, bw: number, key: LiftKey, sex: Sex, age: number) {
  const ratio = (lbs/bw)/ageFactor(age)
  const std   = STANDARDS[sex][key]
  const level = getLiftLevel(lbs,bw,key,sex,age)
  if (level >= 4) return 100
  const lo = level > 0 ? std[level-1] : 0, hi = std[level]
  if (hi === lo) return 0
  return Math.min(100,Math.round(((ratio-lo)/(hi-lo))*100))
}
export function getOverallLevel(lifts: Partial<Record<LiftKey,number>>, bw: number, sex: Sex, age: number) {
  const entered = LIFT_DEFS.filter(d=>(lifts[d.key]||0)>0)
  if (!entered.length) return 0
  return Math.round(entered.reduce((a,d)=>a+getLiftLevel(lifts[d.key]!,bw,d.key,sex,age),0)/entered.length)
}
export function calcDOTS(totalKg: number, bwKg: number, isMale: boolean) {
  const [a,b,c,d,e] = isMale ? [-307.75076,24.0900756,-0.1918759221,0.0007391293,-0.000001093] : [-57.96288,13.6175032,-0.1126655495,0.0005158568,-0.0000010706]
  const coeff = 500/(a+b*bwKg+c*bwKg**2+d*bwKg**3+e*bwKg**4)
  return Math.round(totalKg*coeff)
}
