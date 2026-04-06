import { createSupabaseAdmin } from '@/lib/supabase-server'
export async function POST(req: Request) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) return new Response('Unauthorized',{status:401})
  const { event } = await req.json()
  const admin = createSupabaseAdmin()
  const userId = event?.app_user_id
  if (!userId) return new Response('ok')
  if (['INITIAL_PURCHASE','RENEWAL','PRODUCT_CHANGE'].includes(event.type)) {
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null
    await admin.from('profiles').update({plan:'pro',plan_expires_at:expiresAt}).eq('id',userId)
    await admin.from('audit_log').insert({user_id:userId,action:'plan_upgrade',metadata:{source:'revenuecat',event_type:event.type}})
  }
  if (['EXPIRATION','CANCELLATION'].includes(event.type)) {
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : new Date().toISOString()
    const stillActive = event.expiration_at_ms && new Date(event.expiration_at_ms) > new Date()
    await admin.from('profiles').update({plan:stillActive?'pro':'free',plan_expires_at:expiresAt}).eq('id',userId)
  }
  return new Response(JSON.stringify({ok:true}),{status:200})
}
