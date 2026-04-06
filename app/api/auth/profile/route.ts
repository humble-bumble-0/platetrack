import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) throw new Error(error.message)
    return success(data)
  } catch (err) { return handleError(err) }
}

export async function PUT(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    const allowed = ['unit_preference','fitness_goal','gender','height_cm','weight_kg','date_of_birth','username','onboarding_complete','avatar_url']
    const update = Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k)))
    if (Object.keys(update).length === 0) throw Object.assign(new Error('No valid fields'), {status:400})
    const { data, error } = await supabase.from('profiles').update(update).eq('id', user.id).select().single()
    if (error) throw new Error(error.message)
    
    // If weight was updated, also log it
    if (body.weight_kg) {
      const weightLbs = Math.round(body.weight_kg * 2.20462 * 10) / 10
      await supabase.from('weight_logs').upsert({
        user_id: user.id, weight_lbs: weightLbs,
        logged_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'user_id,logged_date' })
    }
    return success(data)
  } catch (err) { return handleError(err) }
}
