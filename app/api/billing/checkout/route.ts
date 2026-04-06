import { createSupabaseServerClient, requireAuth } from '@/lib/supabase-server'
import { success, handleError } from '@/lib/api'
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const { plan_type, success_url, cancel_url } = await req.json()
    const priceMap: Record<string,string> = { monthly:process.env.STRIPE_PRICE_MONTHLY!, annual:process.env.STRIPE_PRICE_ANNUAL!, lifetime:process.env.STRIPE_PRICE_LIFETIME! }
    const priceId = priceMap[plan_type]
    if (!priceId) throw Object.assign(new Error('Invalid plan_type'),{status:400})
    const isLifetime = plan_type==='lifetime'
    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/profile?upgraded=1`,
      cancel_url:  cancel_url  || `${req.headers.get('origin')}/profile`,
      metadata: { user_id: user.id, plan_type },
      client_reference_id: user.id,
    })
    return success({ url: session.url })
  } catch (err) { return handleError(err) }
}
