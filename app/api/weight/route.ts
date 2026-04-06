import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onWeightLogged } from '@/lib/xpIntegration'
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data, error } = await supabase.from('weight_logs').select('weight_lbs,logged_date').eq('user_id',user.id).order('logged_date',{ascending:false}).limit(90)
    if (error) throw new Error(error.message)
    return success(data)
  } catch (err) { return handleError(err) }
}
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { weight_lbs, logged_date } = await req.json()
    if (!weight_lbs) throw Object.assign(new Error('weight_lbs required'),{status:400})
    const { data, error } = await supabase.from('weight_logs').upsert({ user_id:user.id, weight_lbs, logged_date:logged_date||new Date().toISOString().split('T')[0] },{onConflict:'user_id,logged_date'}).select().single()
    if (error) throw new Error(error.message)
    onWeightLogged(user.id).catch(()=>{})
    return success(data,201)
  } catch (err) { return handleError(err) }
}
