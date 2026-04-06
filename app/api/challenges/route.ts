import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onChallengeJoined } from '@/lib/xpIntegration'
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data } = await supabase.from('challenges').select('*,challenge_participants(user_id,score,rank,profiles!user_id(username,current_level))').order('created_at',{ascending:false}).limit(20)
    return success(data||[])
  } catch (err) { return handleError(err) }
}
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    if (body.action==='join') {
      const { data: ch } = await supabase.from('challenges').select('id').eq('invite_code',body.invite_code).single()
      if (!ch) throw Object.assign(new Error('Invalid invite code'),{status:404})
      // Prevent duplicate joins
      const { data: existing } = await supabase.from('challenge_participants').select('id').eq('challenge_id',ch.id).eq('user_id',user.id).maybeSingle()
      if (existing) throw Object.assign(new Error('Already joined this challenge'),{status:409})
      await supabase.from('challenge_participants').insert({challenge_id:ch.id,user_id:user.id,score:0})
      onChallengeJoined(user.id,ch.id).catch(()=>{})
      return success({joined:true})
    }
    const code = Math.random().toString(36).slice(2,8).toUpperCase()
    const allowed = { name: body.name, description: body.description, challenge_type: body.challenge_type, start_date: body.start_date, end_date: body.end_date, target_value: body.target_value }
    const { data, error } = await supabase.from('challenges').insert({ creator_id:user.id, invite_code:code, ...allowed }).select().single()
    if (error) throw new Error(error.message)
    await supabase.from('challenge_participants').insert({challenge_id:data.id,user_id:user.id,score:0})
    return success(data,201)
  } catch (err) { return handleError(err) }
}
