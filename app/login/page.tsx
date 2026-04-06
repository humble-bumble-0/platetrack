'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() { return <Suspense><LoginInner/></Suspense> }
function LoginInner() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router  = useRouter()
  const params  = useSearchParams()
  const next    = params.get('next') || '/dashboard'
  const supabase = createClient()

  async function signIn() {
    if (!email || !password) return
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (err) { setError(err.message); return }
    router.push(next)
  }

  async function signInGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` }
    })
  }

  async function signInApple() {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${location.origin}/auth/callback?next=${next}` }
    })
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--acc)" strokeWidth="2.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--acc)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--acc)"/></svg>
        <div><p className="gl">PlateTrack</p><p className="text-xl font-black text-[var(--text)]">Sign in</p></div>
      </div>

      {/* OAuth */}
      <div className="flex flex-col gap-3 mb-6">
        <button onClick={signInApple} className="btn-ghost flex items-center justify-center gap-2 font-bold">
          <svg width="16" height="16" fill="var(--text)" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.8 136.8-317.7 271.4-317.7 70.1 0 128.1 45.8 170.3 45.8 40.2 0 104.1-48.9 185.7-48.9 39.3.1 139.8 5.6 219 101zm-139-194.9c31.8-35 52.7-84.3 52.7-133.6 0-6.3-.6-12.8-1.9-17.9-50.1 1.9-109 33.5-144.8 74.4-27.5 30.6-52.7 80-52.7 130 0 6.9 1.3 13.8 1.9 16.2 3.2.6 8.4 1.3 13.6 1.3 45.3 0 102-30 131.2-70.4z"/></svg>
          Continue with Apple
        </button>
        <button onClick={signInGoogle} className="btn-ghost flex items-center justify-center gap-2 font-bold">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[var(--border)]"/>
        <span className="text-xs text-[var(--subtext)]">or email</span>
        <div className="flex-1 h-px bg-[var(--border)]"/>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input-gow"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signIn()} placeholder="Password" className="input-gow"/>
      </div>

      {error && <p className="text-xs text-[var(--red)] font-bold mb-3">{error}</p>}

      <button onClick={signIn} disabled={loading||!email||!password} className="btn-primary mb-4">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="flex justify-between text-sm">
        <Link href="/reset-password" className="text-[var(--acc)] font-semibold">Forgot password?</Link>
        <Link href="/signup" className="text-[var(--acc)] font-semibold">Create account</Link>
      </div>
    </div>
  )
}
