'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DeleteAccountPage() {
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function deleteAccount() {
    if (confirm !== 'DELETE') return
    setLoading(true); setError('')
    const r = await fetch('/api/account/delete',{method:'DELETE'}).then(r=>r.json())
    if (!r.success) { setError(r.error||'Failed'); setLoading(false); return }
    await supabase.auth.signOut()
    router.push('/login?message=account_deleted')
  }

  return (
    <div className="min-h-screen px-6 pt-16 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-2">Delete account</h1>
      <div className="card mb-4" style={{borderColor:'rgba(239,68,68,.2)',background:'rgba(239,68,68,.04)'}}>
        <p className="text-sm font-bold text-[var(--red)] mb-2">⚠️ This is permanent</p>
        <p className="text-sm text-[var(--subtext)] leading-relaxed">All your workouts, PRs, weight logs, friends, challenges, and XP will be permanently deleted after a 30-day grace period. This cannot be undone.</p>
      </div>
      <p className="text-sm text-[var(--subtext)] mb-2">Type <strong className="text-[var(--red)]">DELETE</strong> to confirm:</p>
      <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="DELETE" className="input-gow mb-4"/>
      {error && <p className="text-xs text-[var(--red)] font-bold mb-3">{error}</p>}
      <button onClick={deleteAccount} disabled={confirm!=='DELETE'||loading} className="w-full py-3 text-sm font-bold" style={{background:confirm==='DELETE'?'var(--red)':'rgba(239,68,68,.2)',color:'white',clipPath:'polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))'}}>
        {loading?'Scheduling deletion…':'Permanently delete my account'}
      </button>
      <button onClick={()=>router.back()} className="w-full py-3 mt-2 text-sm text-[var(--subtext)]">Cancel — keep my account</button>
    </div>
  )
}
