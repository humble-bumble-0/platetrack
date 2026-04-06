import Stripe from 'stripe'
import { createSupabaseAdmin } from '@/lib/supabase-server'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')
  if (!sig) return new Response('Missing signature',{status:400})
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!) }
  catch (err:any) { return new Response(`Webhook error: ${err.message}`,{status:400}) }
  const admin = createSupabaseAdmin()
  try {
    if (event.type==='checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session
      const userId = s.metadata?.user_id; if(!userId) return new Response('ok')
      const isLife = s.metadata?.plan_type==='lifetime'
      let expiresAt=null
      if (!isLife&&s.subscription) { const sub=await stripe.subscriptions.retrieve(s.subscription as string); expiresAt=new Date(sub.current_period_end*1000).toISOString() }
      await admin.from('profiles').update({plan:'pro',plan_expires_at:isLife?null:expiresAt,stripe_customer_id:s.customer as string}).eq('id',userId)
      await admin.from('audit_log').insert({user_id:userId,action:'plan_upgrade',metadata:{plan_type:s.metadata?.plan_type,amount:s.amount_total}})
    }
    if (event.type==='customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const { data: prof } = await admin.from('profiles').select('id').eq('stripe_customer_id',sub.customer as string).single()
      if (prof) { const exp=new Date(sub.current_period_end*1000).toISOString(); await admin.from('profiles').update({plan:new Date(exp)>new Date()?'pro':'free',plan_expires_at:exp}).eq('id',prof.id) }
    }
    if (event.type==='customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const { data: prof } = await admin.from('profiles').select('id').eq('stripe_customer_id',sub.customer as string).single()
      if (prof) { const active=['active','trialing'].includes(sub.status); await admin.from('profiles').update({plan:active?'pro':'free',plan_expires_at:new Date(sub.current_period_end*1000).toISOString()}).eq('id',prof.id) }
    }
    return new Response(JSON.stringify({received:true}),{status:200,headers:{'Content-Type':'application/json'}})
  } catch (err) { console.error('[Stripe webhook]',err); return new Response(JSON.stringify({error:'Processing failed'}),{status:500}) }
}
