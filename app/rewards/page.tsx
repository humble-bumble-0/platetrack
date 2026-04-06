'use client'
import { useState, useEffect } from 'react'
import { RARITY_COLORS } from '@/lib/rewards'

type Tab = 'overview'|'badges'|'redeem'

export default function RewardsPage() {
  const [data,      setData]     = useState<any>(null)
  const [tab,       setTab]      = useState<Tab>('overview')
  const [loading,   setLoading]  = useState(true)
  const [redeeming, setRedeeming]= useState<string|null>(null)
  const [toast,     setToast]    = useState<string|null>(null)

  const load = () => fetch('/api/rewards').then(r=>r.json()).then(r=>{ if(r.success) setData(r.data) }).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  async function redeem(id: string, name: string, cost: number) {
    if (!confirm(`Redeem "${name}" for ${cost.toLocaleString()} XP?`)) return
    setRedeeming(id)
    const r = await fetch('/api/rewards/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reward_id:id})})
    const res = await r.json()
    setRedeeming(null)
    if (res.success) { showToast(`${name} redeemed! ✓`); load() }
    else showToast(res.error||'Failed')
  }

  function showToast(msg: string) { setToast(msg); setTimeout(()=>setToast(null),3000) }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>
  const { xp, level, achievements, recent_xp, catalog } = data||{}
  const lc = level?.color||'#6E7191'

  return (
    <div className="px-4 pt-12 pb-8">
      {toast && <div className="fixed top-4 left-4 right-4 z-50 bg-[var(--green)] text-white font-bold text-center py-3  animate-fade-up">{toast}</div>}

      <div className="flex justify-between items-start mb-5">
        <div><h1 className="text-2xl font-black text-[var(--text)]">Rewards</h1><p className="text-sm text-[var(--subtext)] mt-0.5">Earn XP. Level up. Unlock rewards.</p></div>
        <div className="text-center px-4 py-2" style={{background:lc+'15',border:`1.5px solid ${lc}35`,clipPath:'polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))'}}>
          <p className="text-base font-black" style={{color:lc}}>{level?.current}</p>
          <p className="text-xs gm text-[var(--subtext)]">{xp?.formatted} XP</p>
        </div>
      </div>

      {/* Level bar */}
      <div className="card mb-4" style={{borderColor:lc+'30',background:lc+'06'}}>
        <div className="flex justify-between mb-3">
          <div><p className="section-label mb-1">Level</p><p className="text-2xl font-black" style={{color:lc}}>{level?.current}</p></div>
          <div className="text-right"><p className="section-label mb-1">Total XP</p><p className="text-2xl font-black gm" style={{color:lc}}>{xp?.formatted}</p></div>
        </div>
        <div className="flex gap-1 mb-2">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 h-2 rounded-sm" style={{background:i<Math.round((level?.progress_pct||0)/10)?lc:'rgba(255,255,255,.08)'}}/>)}</div>
        <div className="flex justify-between">
          <p className="text-xs text-[var(--subtext)]">Progress to {level?.next_level||'Elite'}</p>
          {level?.xp_to_next && <p className="text-xs font-bold" style={{color:lc}}>{level.xp_to_next.toLocaleString()} to go</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--muted)]  p-1 gap-1 mb-4">
        {([['overview','Overview'],['badges',`Badges (${achievements?.earned_count||0})`],['redeem','Redeem']] as const).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`flex-1 py-2  text-xs font-bold ${tab===id?'bg-[var(--card)] text-[var(--text)]':'text-[var(--subtext)]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="gow-card text-center"><p className="section-label mb-1">This week</p><p className="gm text-xl font-black text-[var(--acc)]">{(xp?.this_week||0).toLocaleString()}</p><p className="text-xs text-[var(--subtext)]">XP earned</p></div>
            <div className="gow-card text-center"><p className="section-label mb-1">This month</p><p className="gm text-xl font-black text-[var(--acc)]">{(xp?.this_month||0).toLocaleString()}</p><p className="text-xs text-[var(--subtext)]">XP earned</p></div>
          </div>
          <div className="card">
            <p className="section-label mb-3">Recent XP</p>
            {(recent_xp||[]).slice(0,8).map((e:any,i:number)=>(
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{e.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-[var(--subtext)]">{new Date(e.created_at).toLocaleDateString()}</p>
                    {e.expires_at && !e.is_expired && (() => { const d=Math.ceil((new Date(e.expires_at).getTime()-Date.now())/86400000); return d<=30?<span className="text-xs font-bold" style={{color:d<=7?'#EF4444':'#F59E0B'}}>Exp {d}d</span>:null })()}
                  </div>
                </div>
                <p className="gm font-black text-[var(--green)]">+{e.xp_amount}</p>
              </div>
            ))}
            {(!recent_xp||recent_xp.length===0) && <p className="text-sm text-[var(--subtext)] text-center py-4">Complete workouts to earn XP</p>}
          </div>
        </div>
      )}

      {tab === 'badges' && (
        <div className="grid grid-cols-3 gap-3">
          {(achievements?.all||[]).map((a:any)=>(
            <div key={a.key} className={`flex flex-col items-center gap-1.5 p-3 border ${a.earned?'border-[var(--border)] bg-[var(--card)]':'border-transparent bg-[var(--muted)] opacity-40'}`} style={{clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
              <p className="text-2xl">{a.icon}</p>
              <p className="text-xs font-bold text-center text-[var(--text)] leading-tight">{a.name}</p>
              <p className="text-xs" style={{color:(RARITY_COLORS as any)[a.rarity]||'#6E7191'}}>{a.rarity}</p>
              {a.earned && a.xp_reward>0 && <p className="text-xs font-bold text-[var(--acc)]">+{a.xp_reward} XP</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'redeem' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="section-label">Spend XP</p>
            <p className="gm text-sm font-black text-[var(--acc)]">{(xp?.total||0).toLocaleString()} available</p>
          </div>
          {(catalog||[]).map((r:any)=>{
            const can = (xp?.total||0) >= r.xp_cost
            return (
              <div key={r.id} className="card flex items-center gap-3 mb-3" style={{borderColor:can?'rgba(59,130,246,.2)':'var(--border)',opacity:can?1:.55}}>
                <p className="text-3xl">{r.icon}</p>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[var(--text)]">{r.name}</p>
                  <p className="text-xs text-[var(--subtext)] mt-0.5">{r.description}</p>
                  <p className="text-xs font-black gm mt-1" style={{color:can?'#F59E0B':'var(--subtext)'}}>{r.xp_cost.toLocaleString()} XP</p>
                </div>
                <button onClick={()=>can&&!redeeming&&redeem(r.id,r.name,r.xp_cost)} disabled={!can||!!redeeming} className="text-xs font-bold py-2 px-3" style={{background:can?'#F59E0B':'var(--muted)',color:can?'#07080D':'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
                  {redeeming===r.id?'…':can?'Redeem':'Need more'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
