import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onFriendAdded } from '@/lib/xpIntegration'
export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { data } = await supabase.from('friendships').select('id,status,friend:profiles!friend_id(id,username,current_level,total_xp,last_workout_at)').eq('user_id',user.id).eq('status','accepted')
    return success(data||[])
  } catch (err) { return handleError(err) }
}
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { username, action, friendship_id } = await req.json()
    if (action==='accept'&&friendship_id) {
      // Only the recipient (friend_id) can accept a friendship request
      const { data: updated, error: accErr } = await supabase.from('friendships').update({status:'accepted'}).eq('id',friendship_id).eq('friend_id',user.id).eq('status','pending').select().single()
      if (accErr || !updated) throw Object.assign(new Error('Cannot accept this request'),{status:403})
      onFriendAdded(user.id).catch(()=>{})
      return success({accepted:true})
    }
    if (!username) throw Object.assign(new Error('username required'),{status:400})
    const { data: target } = await supabase.from('profiles').select('id').eq('username',username).single()
    if (!target) throw Object.assign(new Error('User not found'),{status:404})
    if (target.id === user.id) throw Object.assign(new Error('Cannot friend yourself'),{status:400})
    // Check for existing friendship in either direction
    const { data: existing } = await supabase.from('friendships').select('id,status').or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`).limit(1)
    if (existing && existing.length > 0) throw Object.assign(new Error('Friendship already exists'),{status:409})
    const { data, error } = await supabase.from('friendships').insert({user_id:user.id,friend_id:target.id,status:'pending'}).select().single()
    if (error) throw new Error(error.message)
    return success(data,201)
  } catch (err) { return handleError(err) }
}
