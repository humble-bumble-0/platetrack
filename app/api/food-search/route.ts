import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    await requireAuth(supabase)
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    if (!q || q.length < 2) return success([])

    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,serving_size,image_small_url,code`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const items = (data.products || [])
      .filter((p: any) => p.product_name && p.nutriments)
      .map((p: any) => ({
        name: p.product_name + (p.brands ? ` (${p.brands})` : ''),
        barcode: p.code || null,
        image: p.image_small_url || null,
        serving: p.serving_size || '100g',
        calories: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
        protein_g: Math.round((p.nutriments.proteins_100g || p.nutriments.proteins || 0) * 10) / 10,
        carbs_g: Math.round((p.nutriments.carbohydrates_100g || p.nutriments.carbohydrates || 0) * 10) / 10,
        fat_g: Math.round((p.nutriments.fat_100g || p.nutriments.fat || 0) * 10) / 10,
        fiber_g: Math.round((p.nutriments.fiber_100g || p.nutriments.fiber || 0) * 10) / 10,
      }))
    return success(items)
  } catch (err) { return handleError(err) }
}
