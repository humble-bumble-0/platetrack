import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { reward_id } = await req.json()
    if (!reward_id) throw Object.assign(new Error('reward_id required'),{status:400})
    const { data: reward } = await supabase.from('reward_catalog').select('*').eq('id',reward_id).eq('is_active',true).single()
    if (!reward) throw Object.assign(new Error('Reward not found'),{status:404})
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id',user.id).single()
    if ((profile?.total_xp||0) < reward.xp_cost) throw Object.assign(new Error(`Need ${reward.xp_cost} XP, you have ${profile?.total_xp||0}`),{status:402})
    const admin = createSupabaseAdmin()
    let meta: any = {}
    if (reward.reward_type.startsWith('pro_trial')) {
      const days = reward.reward_value?.days||7
      const exp = new Date(); exp.setDate(exp.getDate()+days)
      await admin.from('profiles').update({plan:'pro',plan_expires_at:exp.toISOString()}).eq('id',user.id)
      meta = { expires_at: exp.toISOString() }
    }
    if (reward.reward_type==='discount_code') {
      meta = { code: `PLTR-${Math.random().toString(36).slice(2,8).toUpperCase()}` }
    }
    const { data: redemption } = await admin.from('redemptions').insert({ user_id:user.id, reward_id:reward.id, xp_spent:reward.xp_cost, status:'fulfilled', metadata:meta }).select().single()
    return success({ redemption, metadata: meta },201)
  } catch (err) { return handleError(err) }
}
