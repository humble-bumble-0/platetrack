// lib/supabase-server.ts — server-only (uses next/headers)
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        get(name: string)                              { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any)              { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

export function createSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function requireAuth(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw Object.assign(new Error('Authentication required'), { status: 401 })
  return user
}

export async function isPro(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase.from('profiles').select('plan, plan_expires_at').eq('id', userId).single()
  if (!data || data.plan !== 'pro') return false
  if (data.plan_expires_at === null) return true
  return new Date(data.plan_expires_at) > new Date()
}

export async function requirePro(userId: string) {
  const ok = await isPro(userId)
  if (!ok) throw Object.assign(new Error('Pro subscription required'), { status: 403 })
}
