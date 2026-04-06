import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onBodyCompLogged } from '@/lib/xpIntegration'
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data } = await supabase.from('body_composition').select('*').eq('user_id',user.id).order('logged_date',{ascending:false}).limit(30)
    return success(data||[])
  } catch (err) { return handleError(err) }
}
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    const allowed = { logged_date: body.logged_date || new Date().toISOString().split('T')[0], body_fat_pct: body.body_fat_pct, muscle_mass_kg: body.muscle_mass_kg, waist_cm: body.waist_cm, hip_cm: body.hip_cm, chest_cm: body.chest_cm, neck_cm: body.neck_cm, notes: body.notes }
    const { data, error } = await supabase.from('body_composition').upsert({ user_id:user.id, ...allowed },{onConflict:'user_id,logged_date'}).select().single()
    if (error) throw new Error(error.message)
    onBodyCompLogged(user.id).catch(()=>{})
    return success(data,201)
  } catch (err) { return handleError(err) }
}
