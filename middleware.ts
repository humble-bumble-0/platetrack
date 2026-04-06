import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC = ['/login','/signup','/reset-password','/auth/callback','/privacy','/terms','/offline']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()
  if (PUBLIC.some(r=>pathname.startsWith(r))) return res
  if (pathname.startsWith('/_next')||pathname.includes('.')) return res

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    { cookies: { get:(n: string)=>req.cookies.get(n)?.value, set:(n: string,v: string,o: any)=>res.cookies.set({name:n,value:v,...o}), remove:(n: string,o: any)=>res.cookies.set({name:n,value:'',...o}) } }
  )
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) {
    const url = req.nextUrl.clone(); url.pathname='/login'; url.searchParams.set('next',pathname)
    return NextResponse.redirect(url)
  }
  const { data:profile } = await supabase.from('profiles').select('onboarding_complete,deleted_at').eq('id',user.id).single()
  if (profile?.deleted_at) { await supabase.auth.signOut(); const url=req.nextUrl.clone(); url.pathname='/login'; url.searchParams.set('error','account_deleted'); return NextResponse.redirect(url) }
  if (!profile?.onboarding_complete && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
    const url=req.nextUrl.clone(); url.pathname='/onboarding'; return NextResponse.redirect(url)
  }
  return res
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/billing/stripe-webhook|api/billing/revenuecat).*)'] }
