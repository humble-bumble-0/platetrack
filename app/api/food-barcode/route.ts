import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    if (!code) return success(null)

    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments,serving_size,image_small_url`)
    const data = await res.json()
    if (data.status !== 1 || !data.product) return success(null)
    const p = data.product
    return success({
      name: p.product_name + (p.brands ? ` (${p.brands})` : ''),
      barcode: code,
      image: p.image_small_url || null,
      serving: p.serving_size || '100g',
      calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
      protein_g: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
      carbs_g: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
      fat_g: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
    })
  } catch (err) { return handleError(err) }
}
