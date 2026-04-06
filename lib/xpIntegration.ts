// lib/xpIntegration.ts
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { XP, xpEventLabel, computeExpiryDate, type XPEventType } from '@/lib/rewards'

export async function earnXP(userId: string, eventType: XPEventType, metadata?: Record<string,any>) {
  try {
    const admin = createSupabaseAdmin()
    const amount = metadata?.xp_override || XP[eventType]
    if (!amount) return { xp_earned: 0, new_achievements: [], level_up: null }

    const { data: prof } = await admin.from('profiles').select('last_workout_at,current_level').eq('id',userId).single()
    const daysSince = prof?.last_workout_at ? Math.floor((Date.now()-new Date(prof.last_workout_at).getTime())/86_400_000) : null
    const expiresAt = computeExpiryDate(new Date(), daysSince)
    const oldLevel  = prof?.current_level || 'Novice'

    await admin.from('xp_events').insert({
      user_id: userId, event_type: eventType, xp_amount: amount,
      description: xpEventLabel(eventType, metadata),
      reference_id: metadata?.reference_id || null,
      expires_at: expiresAt.toISOString(), metadata,
    })

    const newAchievements = await checkAchievements(userId, admin)
    const { data: upd } = await admin.from('profiles').select('current_level').eq('id',userId).single()
    const levelUp = (upd?.current_level !== oldLevel) ? upd?.current_level : null

    return { xp_earned: amount, new_achievements: newAchievements, level_up: levelUp }
  } catch (err) { console.error('[XP]', err); return { xp_earned: 0, new_achievements: [], level_up: null } }
}

export async function earnSetXP(userId: string, setCount: number, sessionId: string) {
  if (setCount <= 0) return
  const admin = createSupabaseAdmin()
  const { data: prof } = await admin.from('profiles').select('last_workout_at').eq('id',userId).single()
  const daysSince = prof?.last_workout_at ? Math.floor((Date.now()-new Date(prof.last_workout_at).getTime())/86_400_000) : null
  const expiresAt = computeExpiryDate(new Date(), daysSince)
  await admin.from('xp_events').insert({
    user_id: userId, event_type: 'SET_COMPLETED', xp_amount: setCount * XP.SET_COMPLETED,
    description: `${setCount} sets logged`, reference_id: sessionId,
    expires_at: expiresAt.toISOString(), metadata: { set_count: setCount },
  })
}

export async function onWorkoutComplete(userId: string, sessionId: string, setCount: number, isPR: boolean, exerciseName?: string) {
  await earnSetXP(userId, setCount, sessionId)
  const wktResult = await earnXP(userId, 'WORKOUT_COMPLETED', { reference_id: sessionId })
  if (isPR) await earnXP(userId, 'PR_ACHIEVED', { exercise: exerciseName, reference_id: sessionId })
  const admin = createSupabaseAdmin()
  await admin.from('profiles').update({ last_workout_at: new Date().toISOString() }).eq('id', userId)
  await checkStreakAndWeekly(userId, admin)
  // Return total XP earned for this workout so the API can pass it to the client
  const totalXP = (setCount * XP.SET_COMPLETED) + XP.WORKOUT_COMPLETED + (isPR ? XP.PR_ACHIEVED : 0)
  return { xp_earned: totalXP, level_up: wktResult.level_up, new_achievements: wktResult.new_achievements }
}

export const onPRDetected       = (u:string,e:string,s:string) => earnXP(u,'PR_ACHIEVED',{exercise:e,reference_id:s})
export const onWeightLogged     = (u:string) => earnXP(u,'WEIGHT_LOGGED')
export const onBodyCompLogged   = (u:string) => earnXP(u,'BODY_COMP_LOGGED')
export const onNutritionDay     = (u:string) => earnXP(u,'NUTRITION_DAY_COMPLETE')
export const onFriendAdded      = (u:string) => earnXP(u,'FRIEND_ADDED')
export const onChallengeWon     = (u:string,c:string) => earnXP(u,'CHALLENGE_WON',{reference_id:c})
export const onChallengeJoined  = (u:string,c:string) => earnXP(u,'CHALLENGE_JOINED',{reference_id:c})
export const onProgressShared   = (u:string) => earnXP(u,'PROGRESS_SHARED')
export const onNewExercise      = (u:string,e:string) => earnXP(u,'NEW_EXERCISE_TRIED',{exercise:e})

async function checkStreakAndWeekly(userId: string, admin: any) {
  const since = new Date(); since.setDate(since.getDate()-14)
  const { data: sessions } = await admin.from('workout_sessions')
    .select('completed_at').eq('user_id',userId).eq('is_complete',true)
    .gte('completed_at',since.toISOString()).order('completed_at',{ascending:false})
  if (!sessions?.length) return

  const dates = [...new Set(sessions.map((s:any)=>new Date(s.completed_at).toLocaleDateString('en-CA')))] as string[]
  // Count streak backwards: include today (just completed), then check consecutive prior days
  let streak = 0
  for (let i=0;i<14;i++) {
    const d = new Date(); d.setDate(d.getDate()-i)
    if (dates.includes(d.toLocaleDateString('en-CA'))) streak++
    else if (streak > 0) break // only break after we've found at least one day
  }
  if (streak > 0) await earnXP(userId,'STREAK_DAY',{streak})

  const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-weekStart.getDay()); weekStart.setHours(0,0,0,0)
  const weekCount = sessions.filter((s:any)=>new Date(s.completed_at)>=weekStart).length
  if (weekCount === 3) await earnXP(userId,'WEEKLY_GOAL_MET')
  if (weekCount === 1) await earnXP(userId,'FIRST_WORKOUT_OF_WEEK')
}

async function checkAchievements(userId: string, admin: any): Promise<string[]> {
  const [
    {count:wkts}, {data:prof}, {data:weight},
    {data:prs},   {count:friends}, {data:earned},
  ] = await Promise.all([
    admin.from('workout_sessions').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('is_complete',true),
    admin.from('profiles').select('total_xp').eq('id',userId).single(),
    admin.from('weight_logs').select('weight_lbs').eq('user_id',userId).order('logged_date',{ascending:false}).limit(1).single(),
    admin.from('personal_records').select('exercises(slug),value').eq('user_id',userId).eq('record_type','1rm'),
    admin.from('friendships').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('status','accepted'),
    admin.from('user_achievements').select('achievement_key').eq('user_id',userId),
  ])

  const got = new Set((earned||[]).map((e:any)=>e.achievement_key))
  const xp  = prof?.total_xp||0
  const bw  = weight?.weight_lbs||0
  const sq  = (prs?.find((p:any)=>p.exercises?.slug==='back-squat')?.value||0)*2.20462
  const bn  = (prs?.find((p:any)=>p.exercises?.slug==='bench-press')?.value||0)*2.20462
  const dl  = (prs?.find((p:any)=>p.exercises?.slug==='deadlift')?.value||0)*2.20462

  const checks: Record<string,boolean> = {
    first_workout:(wkts as number)>=1, workouts_10:(wkts as number)>=10, workouts_50:(wkts as number)>=50,
    workouts_100:(wkts as number)>=100, workouts_365:(wkts as number)>=365,
    first_pr:(prs?.length||0)>=1, prs_10:(prs?.length||0)>=10,
    bench_1x_bw:bn>0&&bw>0&&bn>=bw, bench_1_5x_bw:bn>0&&bw>0&&bn>=bw*1.5,
    squat_1_5x_bw:sq>0&&bw>0&&sq>=bw*1.5, deadlift_2x_bw:dl>0&&bw>0&&dl>=bw*2,
    total_5x_bw:sq>0&&bn>0&&dl>0&&bw>0&&(sq+bn+dl)>=bw*5,
    level_iron:xp>=1000, level_bronze:xp>=5000, level_silver:xp>=15000,
    level_gold:xp>=35000, level_platinum:xp>=75000, level_elite:xp>=150000,
    first_friend:(friends as number)>=1, friends_5:(friends as number)>=5,
  }

  const newKeys = Object.entries(checks).filter(([k,v])=>v&&!got.has(k)).map(([k])=>k)
  if (!newKeys.length) return []

  await admin.from('user_achievements').insert(newKeys.map((k:string)=>({user_id:userId,achievement_key:k})))

  const {data:achData} = await admin.from('achievements').select('key,name,xp_reward').in('key',newKeys)
  for (const a of (achData||[])) {
    if (a.xp_reward>0) await earnXP(userId,'ACHIEVEMENT_BONUS',{xp_override:a.xp_reward,key:a.key,name:a.name})
  }
  return newKeys
}
