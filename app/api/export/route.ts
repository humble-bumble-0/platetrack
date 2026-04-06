import { createSupabaseServerClient, requireAuth, requirePro } from '@/lib/supabase-server'
import { handleError } from '@/lib/api'
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    // Pro restriction disabled for now — enable when Stripe is connected
    // await requirePro(user.id)
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')||new Date(Date.now()-365*86400000).toISOString().split('T')[0]
    const to   = searchParams.get('to')||new Date().toISOString().split('T')[0]
    const [sessions,prs,weights] = await Promise.all([
      supabase.from('workout_sessions').select('name,completed_at,set_count,session_exercises(exercises(name),session_sets(weight_kg,reps,rpe,is_pr))').eq('user_id',user.id).gte('completed_at',from).lte('completed_at',to).order('completed_at').limit(1000),
      supabase.from('personal_records').select('exercises(name),value,record_type,created_at').eq('user_id',user.id).order('created_at'),
      supabase.from('weight_logs').select('weight_lbs,logged_date').eq('user_id',user.id).gte('logged_date',from).lte('logged_date',to).order('logged_date'),
    ])
    let csv = 'type,date,name,value,unit\n'
    for (const s of (sessions.data||[])) {
      csv += `workout,${s.completed_at?.split('T')[0]||''},${JSON.stringify(s.name||'Workout')},${s.set_count},sets\n`
    }
    for (const p of (prs.data||[])) {
      csv += `pr,${p.created_at?.split('T')[0]||''},${JSON.stringify((p as any).exercises?.name||'')},${Math.round(p.value*2.20462*10)/10},lbs\n`
    }
    for (const w of (weights.data||[])) {
      csv += `weight,${w.logged_date},,${w.weight_lbs},lbs\n`
    }
    return new Response(csv,{headers:{'Content-Type':'text/csv','Content-Disposition':`attachment; filename="platetrack-export-${to}.csv"`}})
  } catch (err) { return handleError(err) }
}
