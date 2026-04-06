import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onWorkoutComplete } from '@/lib/xpIntegration'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const limit = Math.min(50,parseInt(searchParams.get('limit')||'20'))
    const offset = parseInt(searchParams.get('offset')||'0')
    const { data, error } = await supabase.from('workout_sessions')
      .select('id,name,notes,started_at,completed_at,set_count,session_exercises(id,order_index,exercises(id,name,slug,category),session_sets(id,set_number,weight_kg,reps,rpe,is_pr))')
      .eq('user_id',user.id).eq('is_complete',true)
      .order('completed_at',{ascending:false}).range(offset,offset+limit-1)
    if (error) throw new Error(error.message)
    return success(data)
  } catch (err) { return handleError(err) }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    const { sets=[], name, notes, training_profile_id, started_at, completed_at } = body
    const { data: session, error: sessErr } = await supabase.from('workout_sessions')
      .insert({ user_id:user.id, name:name||null, notes:notes||null, training_profile_id:training_profile_id||null, started_at:started_at||new Date().toISOString(), completed_at:completed_at||new Date().toISOString(), is_complete:true, set_count:sets.length })
      .select().single()
    if (sessErr) throw new Error(sessErr.message)
    const exerciseMap = new Map<string,any[]>()
    for (const s of sets) { if(!exerciseMap.has(s.exercise_id))exerciseMap.set(s.exercise_id,[]); exerciseMap.get(s.exercise_id)!.push(s) }
    const exIds = [...exerciseMap.keys()]

    // Batch: fetch all existing PRs and exercise names in 2 queries instead of N
    const [{ data: existingPRs }, { data: exNames }] = await Promise.all([
      supabase.from('personal_records').select('exercise_id,value').eq('user_id',user.id).eq('record_type','1rm').in('exercise_id',exIds),
      supabase.from('exercises').select('id,name').in('id',exIds),
    ])
    const prMap = new Map((existingPRs||[]).map((p:any)=>[p.exercise_id, p.value]))
    const nameMap = new Map((exNames||[]).map((e:any)=>[e.id, e.name]))

    // Batch: insert all session_exercises at once
    let orderIdx = 0
    const seInserts = exIds.map(exId => ({ session_id:session.id, exercise_id:exId, order_index:orderIdx++ }))
    const { data: sessionExercises } = await supabase.from('session_exercises').insert(seInserts).select()
    const seMap = new Map((sessionExercises||[]).map((se:any)=>[se.exercise_id, se.id]))

    let isPR=false, prName:string|undefined
    const allSets:any[] = [], prUpserts:any[] = []

    for (const [exId,exSets] of exerciseMap) {
      const seId = seMap.get(exId)
      if (!seId) continue
      for (let i=0;i<exSets.length;i++) {
        const s=exSets[i]; if(s.weight_kg==null&&s.reps==null&&s.duration_seconds==null) continue
        let is_pr=false
        if (s.weight_kg&&s.reps) {
          const e1rm=s.weight_kg*(1+s.reps/30)
          const oldPR = prMap.get(exId)
          if (!oldPR||e1rm>oldPR) {
            is_pr=true; isPR=true; prName=nameMap.get(exId)||'lift'; prMap.set(exId,e1rm)
            prUpserts.push({ user_id:user.id, exercise_id:exId, session_id:session.id, record_type:'1rm', value:Math.round(e1rm*100)/100 })
          }
        }
        allSets.push({ session_exercise_id:seId, set_number:i+1, weight_kg:s.weight_kg??null, reps:s.reps??null, rpe:s.rpe??null, duration_seconds:s.duration_seconds??null, is_pr })
      }
    }

    // Batch: insert all sets and upsert all PRs
    const batchOps = [supabase.from('session_sets').insert(allSets)]
    if (prUpserts.length) batchOps.push(supabase.from('personal_records').upsert(prUpserts,{onConflict:'user_id,exercise_id,record_type'}) as any)
    await Promise.all(batchOps)
    const xpResult = await onWorkoutComplete(user.id,session.id,sets.length,isPR,prName).catch(e=>{console.error('[XP]',e);return null})
    // Post to activity feed
    try { await supabase.from('activity_feed').insert({
      user_id:user.id, activity_type: isPR ? 'pr' : 'workout', reference_id:session.id,
      title: isPR ? `New PR: ${prName}` : `Completed ${name||'workout'}: ${sets.length} sets`,
      metadata: { set_count:sets.length, is_pr:isPR, pr_name:prName },
    }) } catch {}
    return success({session,is_pr:isPR,xp:xpResult},201)
  } catch (err) { return handleError(err) }
}
