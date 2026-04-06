import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q'), cat = searchParams.get('category')
    let query = supabase.from('exercises').select('id,name,slug,category,primary_muscles,is_default').order('name').limit(200)
    if (q) query = query.ilike('name',`%${q}%`)
    if (cat) query = query.eq('category',cat)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return success(data)
  } catch (err) { return handleError(err) }
}
