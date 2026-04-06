'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [phase, setPhase]       = useState<'request'|'set'>('request')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setPhase('set')
      supabase.auth.onAuthStateChange((event) => { if(event==='PASSWORD_RECOVERY') setPhase('set') })
    }
  }, [])

  async function requestReset() {
    if (!email.trim()) return
    setLoading(true); setError('')
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` })
    setLoading(false)
    if (e) { setError(e.message); return }
    setSent(true)
  }

  async function setNewPassword() {
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error: e } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (e) { setError(e.message); return }
    setSuccess(true); setTimeout(()=>router.push('/dashboard'), 2000)
  }

  if (success) return <div className="min-h-screen flex items-center justify-center px-6"><div className="text-center"><p className="text-5xl mb-4">✓</p><h2 className="text-xl font-black text-[var(--green)]">Password updated</h2><p className="text-sm text-[var(--subtext)] mt-2">Redirecting…</p></div></div>
  if (sent&&phase==='request') return <div className="min-h-screen flex items-center justify-center px-6"><div className="text-center"><p className="text-5xl mb-4">📬</p><h2 className="text-xl font-black text-[var(--text)]">Check your email</h2><p className="text-sm text-[var(--subtext)] mt-2">Reset link sent to <strong>{email}</strong></p><button onClick={()=>setSent(false)} className="text-sm text-[var(--acc)] mt-4 block mx-auto">Try different email</button></div></div>

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      <Link href="/login" className="text-sm text-[var(--acc)] font-semibold mb-8 inline-block">← Back to login</Link>
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">{phase==='request'?'Reset password':'New password'}</h1>
      <p className="text-sm text-[var(--subtext)] mb-8">{phase==='request'?"Enter your email and we'll send a reset link.":'Choose a strong new password.'}</p>
      <div className="flex flex-col gap-3 mb-4">
        {phase==='request'
          ? <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&requestReset()} placeholder="Email address" className="input-gow"/>
          : <><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (min 8 chars)" className="input-gow"/>
             <input type="password" value={confirm}  onChange={e=>setConfirm(e.target.value)}  onKeyDown={e=>e.key==='Enter'&&setNewPassword()} placeholder="Confirm new password" className="input-gow"/></>}
      </div>
      {error && <p className="text-xs text-[var(--red)] font-bold mb-3">{error}</p>}
      <button onClick={phase==='request'?requestReset:setNewPassword} disabled={loading||(phase==='request'?!email:!password||!confirm)} className="btn-primary">
        {loading?'Loading…':phase==='request'?'Send reset link':'Update password'}
      </button>
    </div>
  )
}
