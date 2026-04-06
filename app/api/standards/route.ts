import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { STANDARDS, LIFT_DEFS, GLOBAL_AVERAGES, ageFactor, getOverallLevel, getLevelTarget, getLiftLevel, getLevelProgress, calcDOTS } from '@/lib/strengthStandards'
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data: profile } = await supabase.from('profiles').select('gender,date_of_birth,unit_preference').eq('id',user.id).single()
    const { data: wt } = await supabase.from('weight_logs').select('weight_lbs').eq('user_id',user.id).order('logged_date',{ascending:false}).limit(1).single()
    const { data: prs } = await supabase.from('personal_records').select('exercises(slug,name),value,record_type').eq('user_id',user.id).eq('record_type','1rm')
    const slugMap:Record<string,string> = {squat:'back-squat',bench:'bench-press',deadlift:'deadlift',ohp:'overhead-press'}
    const nameMap:Record<string,string> = {squat:'Back Squat',bench:'Bench Press',deadlift:'Deadlift',ohp:'Overhead Press'}
    const lifts:Record<string,number> = {}
    for (const pr of (prs||[])) {
      const ex = (pr as any).exercises
      for (const [k,slug] of Object.entries(slugMap)) {
        if (ex?.slug===slug||ex?.name?.toLowerCase()===nameMap[k].toLowerCase()) {
          const lbs = pr.value*2.20462
          if (!lifts[k]||lifts[k]<lbs) lifts[k]=Math.round(lbs*10)/10
        }
      }
    }
    const bwLbs = wt?.weight_lbs||185
    const bwKg  = bwLbs*0.453592
    const sex   = profile?.gender==='female'?'f':'m' as 'm'|'f'
    const age   = profile?.date_of_birth ? Math.floor((Date.now()-new Date(profile.date_of_birth).getTime())/(365.25*24*3600*1000)) : 30
    const overall = getOverallLevel(lifts as any, bwLbs, sex, age)
    const total   = (lifts.squat||0)+(lifts.bench||0)+(lifts.deadlift||0)
    const dots    = total>0?calcDOTS(total*0.453592,bwKg,sex==='m'):0
    const liftDetails = LIFT_DEFS.map(d=>{
      const lbs=(lifts as any)[d.key]||0
      const level=getLiftLevel(lbs,bwLbs,d.key,sex,age)
      const next=Math.min(4,level+1)
      return { ...d, lbs, level, levelTarget:getLevelTarget(bwLbs,d.key,sex,age,next), progress:lbs>0?getLevelProgress(lbs,bwLbs,d.key,sex,age):0, toNext:Math.max(0,getLevelTarget(bwLbs,d.key,sex,age,next)-lbs) }
    })
    return success({ lifts, bwLbs, sex, age, overall, total, dots, liftDetails, global_averages: GLOBAL_AVERAGES })
  } catch (err) { return handleError(err) }
}
