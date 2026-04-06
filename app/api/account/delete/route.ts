import { createSupabaseServerClient, requireAuth, createSupabaseAdmin } from '@/lib/supabase-server'
export async function DELETE() {
  try {
    const supabase = createSupabaseServerClient()
    const user = await requireAuth(supabase)
    const admin = createSupabaseAdmin()
    const exp = new Date(Date.now()+30*24*60*60*1000).toISOString()
    await admin.from('profiles').update({deleted_at:new Date().toISOString(),deletion_scheduled_at:exp}).eq('id',user.id)
    await admin.from('audit_log').insert({user_id:user.id,action:'account_delete_requested',metadata:{scheduled_hard_delete:exp}})
    // Sign out user but do NOT hard-delete auth user yet — that happens after the 30-day grace period
    await supabase.auth.signOut()
    return Response.json({success:true})
  } catch (err:any) { return Response.json({success:false,error:err.message},{status:500}) }
}
