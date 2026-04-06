import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import { onNutritionDay } from '@/lib/xpIntegration'
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('nutrition_logs').select('*,food_items(name,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g)').eq('user_id',user.id).eq('log_date',date)
    const { data: goals } = await supabase.from('nutrition_goals').select('*').eq('user_id',user.id).single()
    // Count hydration cups (entries logged as meal_type 'Hydration')
    const hydration_cups = (data||[]).filter((l:any)=>l.meal_type==='Hydration').length
    const logs = (data||[]).filter((l:any)=>l.meal_type!=='Hydration')
    return success({ logs, goals, date, hydration_cups })
  } catch (err) { return handleError(err) }
}
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const body = await req.json()
    const allowed = { food_name: body.food_name, calories: body.calories, protein_g: body.protein_g, carbs_g: body.carbs_g, fat_g: body.fat_g, meal_type: body.meal_type, log_date: body.log_date, serving_size: body.serving_size, food_item_id: body.food_item_id }
    const { data, error } = await supabase.from('nutrition_logs').insert({ user_id:user.id, ...allowed }).select().single()
    if (error) throw new Error(error.message)
    // Check if daily macros are near targets
    const { data: goals } = await supabase.from('nutrition_goals').select('*').eq('user_id',user.id).single()
    if (goals) {
      const { data: todayLogs } = await supabase.from('nutrition_logs').select('protein_g,carbs_g,fat_g').eq('user_id',user.id).eq('log_date',body.log_date||new Date().toISOString().split('T')[0])
      const totProt = (todayLogs||[]).reduce((a:number,l:any)=>a+(l.protein_g||0),0)
      if (totProt >= (goals.protein_g||0)*0.85) onNutritionDay(user.id).catch(()=>{})
    }
    return success(data,201)
  } catch (err) { return handleError(err) }
}
export async function DELETE(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const mealType = searchParams.get('meal_type')
    const date = searchParams.get('date')
    if (!id && !mealType) throw Object.assign(new Error('id or meal_type required'),{status:400})
    if (mealType && date) {
      // Delete the most recent entry of this meal_type on this date
      const { data: entries } = await supabase.from('nutrition_logs').select('id').eq('user_id',user.id).eq('meal_type',mealType).eq('log_date',date).order('created_at',{ascending:false}).limit(1)
      if (entries?.[0]) await supabase.from('nutrition_logs').delete().eq('id',entries[0].id).eq('user_id',user.id)
      return success({deleted:true})
    }
    if (!id) throw Object.assign(new Error('id required'),{status:400})
    const { error } = await supabase.from('nutrition_logs').delete().eq('id',id).eq('user_id',user.id)
    if (error) throw new Error(error.message)
    return success({deleted:true})
  } catch (err) { return handleError(err) }
}
