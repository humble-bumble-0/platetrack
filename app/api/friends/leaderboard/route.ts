import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const ALLOWED_METRICS = new Set(['total_xp','xp_this_week'])
    const metric = ALLOWED_METRICS.has(searchParams.get('metric')||'') ? searchParams.get('metric')! : 'total_xp'
    // Query bidirectional friendships
    const [{ data: f1 }, { data: f2 }] = await Promise.all([
      supabase.from('friendships').select('friend_id').eq('user_id',user.id).eq('status','accepted'),
      supabase.from('friendships').select('user_id').eq('friend_id',user.id).eq('status','accepted'),
    ])
    const ids = [...new Set([...(f1||[]).map((f:any)=>f.friend_id), ...(f2||[]).map((f:any)=>f.user_id), user.id])]
    // Single query for all profiles — no N+1
    const { data: profiles } = await supabase.from('profiles').select('id,username,total_xp,current_level,last_workout_at,xp_this_week').in('id',ids)
    const ranked = (profiles||[]).sort((a:any,b:any)=>(b[metric]||0)-(a[metric]||0)).map((p:any,i:number)=>({...p,rank:i+1,is_me:p.id===user.id}))
    return success(ranked)
  } catch (err) { return handleError(err) }
}
