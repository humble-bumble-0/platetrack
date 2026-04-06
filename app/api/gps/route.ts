import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data } = await supabase.from('gps_activities')
      .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
    return success(data || [])
  } catch (err) { return handleError(err) }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    const allowed = {
      activity_type: body.activity_type || 'run', title: body.title, distance_km: body.distance_km,
      duration_seconds: body.duration_seconds, pace_per_km: body.pace_per_km, calories_burned: body.calories_burned,
      elevation_gain_m: body.elevation_gain_m, route_data: body.route_data, started_at: body.started_at,
      completed_at: body.completed_at, is_public: body.is_public ?? true,
    }
    const { data, error } = await supabase.from('gps_activities').insert({ user_id: user.id, ...allowed }).select().single()
    if (error) throw new Error(error.message)
    // Post to activity feed
    await supabase.from('activity_feed').insert({
      user_id: user.id, activity_type: 'gps_activity', reference_id: data.id,
      title: `${body.activity_type || 'Run'}: ${(body.distance_km || 0).toFixed(2)} km`,
      description: body.title || null,
      metadata: { distance_km: body.distance_km, duration_seconds: body.duration_seconds, pace_per_km: body.pace_per_km },
    })
    return success(data, 201)
  } catch (err) { return handleError(err) }
}
