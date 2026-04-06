import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const { data } = await supabase.from('activity_feed')
      .select('*,profiles!user_id(username,current_level,avatar_url),activity_likes(user_id),activity_comments(id,user_id,content,created_at,profiles!user_id(username))')
      .order('created_at', { ascending: false })
      .limit(limit)
    return success((data || []).map((a: any) => ({
      ...a,
      like_count: a.activity_likes?.length || 0,
      liked_by_me: (a.activity_likes || []).some((l: any) => l.user_id === user.id),
      comment_count: a.activity_comments?.length || 0,
    })))
  } catch (err) { return handleError(err) }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    if (body.action === 'like') {
      const { data: existing } = await supabase.from('activity_likes').select('id').eq('activity_id', body.activity_id).eq('user_id', user.id).maybeSingle()
      if (existing) { await supabase.from('activity_likes').delete().eq('id', existing.id); return success({ liked: false }) }
      await supabase.from('activity_likes').insert({ activity_id: body.activity_id, user_id: user.id })
      return success({ liked: true })
    }
    if (body.action === 'comment') {
      const { data } = await supabase.from('activity_comments').insert({ activity_id: body.activity_id, user_id: user.id, content: body.content }).select().single()
      return success(data, 201)
    }
    return success(null)
  } catch (err) { return handleError(err) }
}
