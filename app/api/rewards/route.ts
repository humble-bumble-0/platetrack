import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { getLevelProgress, formatXP } from '@/lib/rewards'
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data: profile } = await supabase.from('profiles').select('total_xp,current_level,xp_this_week,xp_this_month').eq('id',user.id).single()
    const xp = profile?.total_xp||0
    const { level, nextLevel, progressPct, xpToNextLevel } = getLevelProgress(xp)
    const { data: recentXP }  = await supabase.from('xp_events').select('event_type,xp_amount,description,created_at,expires_at,is_expired').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30)
    const { data: earned }    = await supabase.from('user_achievements').select('achievement_key,earned_at').eq('user_id',user.id).order('earned_at',{ascending:false})
    const { data: allAch }    = await supabase.from('achievements').select('*').order('rarity',{ascending:false})
    const { data: catalog }   = await supabase.from('reward_catalog').select('*').eq('is_active',true).order('xp_cost')
    const earnedKeys = new Set((earned||[]).map((e:any)=>e.achievement_key))
    return success({
      xp:{ total:xp, this_week:profile?.xp_this_week||0, this_month:profile?.xp_this_month||0, formatted:formatXP(xp) },
      level:{ current:level.name, color:level.color, progress_pct:progressPct, xp_to_next:xpToNextLevel, next_level:nextLevel?.name||null },
      achievements:{ all:(allAch||[]).map(a=>({...a,earned:earnedKeys.has(a.key)})), earned_count:earnedKeys.size },
      recent_xp: recentXP||[], catalog: catalog||[],
    })
  } catch (err) { return handleError(err) }
}
