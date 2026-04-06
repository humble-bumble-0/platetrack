'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function signUp() {
    if (!email||!password||!username) return
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) { setError('Username: 3-30 chars, lowercase letters/numbers/underscore only'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { username: username.toLowerCase() } }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    if (data.user) {
      // Create profile row for the new user
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase(),
        email: email.trim(),
        onboarding_complete: false,
      })
      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      <div className="flex items-center gap-3 mb-12">
        <svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--acc)" strokeWidth="2.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--acc)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--acc)"/></svg>
        <div><p className="gl">PlateTrack</p><p className="text-xl font-black text-[var(--text)]">Create account</p></div>
      </div>
      <div className="flex flex-col gap-3 mb-4">
        <input type="text" value={username} onChange={e=>setUsername(e.target.value.toLowerCase())} placeholder="Username (e.g. matt_lifts)" className="input-gow"/>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input-gow"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&signUp()} placeholder="Password (min 8 chars)" className="input-gow"/>
      </div>
      {error && <p className="text-xs text-[var(--red)] font-bold mb-3">{error}</p>}
      <button onClick={signUp} disabled={loading||!email||!password||!username} className="btn-primary mb-4">
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-xs text-[var(--subtext)] text-center mb-4">By signing up you agree to our <Link href="/terms" className="text-[var(--acc)]">Terms</Link> and <Link href="/privacy" className="text-[var(--acc)]">Privacy Policy</Link></p>
      <div className="text-center"><Link href="/login" className="text-[var(--acc)] font-semibold text-sm">Already have an account? Sign in</Link></div>
    </div>
  )
}
