import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import { NextResponse }       from 'next/server'
import type { NextRequest }   from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')
  const next  = searchParams.get('next') ?? '/dashboard'

  if (error) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  if (!code) return NextResponse.redirect(`${origin}/login?error=no_code`)

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(n: string)              { return cookieStore.get(n)?.value },
        set(n: string,v: string,o: any) { cookieStore.set({name:n,value:v,...o}) },
        remove(n: string,o: any)    { cookieStore.set({name:n,value:'',...o}) },
      }
    }
  )
  const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(code)
  if (exchErr) return NextResponse.redirect(`${origin}/login?error=exchange_failed`)

  const user = data.session?.user
  if (!user) return NextResponse.redirect(`${origin}/login?error=no_session`)

  const { data: profile } = await supabase.from('profiles').select('id,onboarding_complete').eq('id', user.id).single()
  if (!profile) {
    const username = (user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g,'_') || user.email?.split('@')[0] || `user_${user.id.slice(0,8)}`).replace(/[^a-z0-9_]/g,'').slice(0,30)
    await supabase.from('profiles').insert({ id: user.id, username, email: user.email, onboarding_complete: false })
    return NextResponse.redirect(`${origin}/onboarding`)
  }
  if (!profile.onboarding_complete) return NextResponse.redirect(`${origin}/onboarding`)
  // Validate next param to prevent open redirect (block protocol-relative URLs like //evil.com)
  const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
