'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getLevelProgress } from '@/lib/rewards'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/auth/profile').then(r=>r.json()).then(r=>{ if(r.success) setProfile(r.data) }).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  const xp = profile?.total_xp || 0
  const { level, nextLevel, progressPct, xpToNextLevel } = getLevelProgress(xp)

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <label className="relative cursor-pointer">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 object-cover" style={{clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))'}}/>
          ) : (
            <div className="w-16 h-16 bg-[var(--acc)] flex items-center justify-center text-white text-2xl font-black" style={{clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))'}}>
              {profile?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--acc)] flex items-center justify-center rounded-full text-[10px] text-white font-bold">+</div>
          <input type="file" accept="image/*" className="hidden" onChange={async(e)=>{
            const file = e.target.files?.[0]
            if (!file) return
            // Compress to max 128x128 JPEG
            const img = new Image()
            img.onload = async()=>{
              const canvas = document.createElement('canvas')
              const size = 128
              canvas.width = size; canvas.height = size
              const ctx = canvas.getContext('2d')!
              const scale = Math.max(size/img.width,size/img.height)
              const w = img.width*scale, h = img.height*scale
              ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h)
              const url = canvas.toDataURL('image/jpeg',0.7)
              await fetch('/api/auth/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({avatar_url:url})})
              setProfile((p:any)=>({...p,avatar_url:url}))
            }
            img.src = URL.createObjectURL(file)
          }}/>
        </label>
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">{profile?.username}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold px-2 py-0.5" style={{background:level.color+'20',color:level.color,clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{level.name}</span>
            {profile?.plan === 'pro' && <span className="text-xs font-bold px-2 py-0.5" style={{background:'rgba(245,158,11,.2)',color:'#F59E0B',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>PRO</span>}
          </div>
        </div>
      </div>

      {/* Level progress */}
      <div className="card mb-4" style={{borderColor:level.color+'30',background:level.color+'06'}}>
        <div className="flex justify-between mb-3">
          <div><p className="section-label mb-1">Level</p><p className="text-xl font-black" style={{color:level.color}}>{level.name}</p></div>
          <div className="text-right"><p className="section-label mb-1">XP</p><p className="text-xl font-black gm text-[var(--text)]">{xp.toLocaleString()}</p></div>
        </div>
        <div className="flex gap-1 mb-2">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 h-2 rounded-sm" style={{background:i<Math.round(progressPct/10)?level.color:'rgba(255,255,255,.08)'}}/>)}</div>
        <p className="text-xs text-[var(--subtext)]">{xpToNextLevel ? `${xpToNextLevel.toLocaleString()} XP to ${nextLevel?.name}` : 'Max level reached 👑'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {label:'Height', val: profile?.height_cm ? `${Math.round(profile.height_cm/2.54/12)}'${Math.round(profile.height_cm/2.54%12)}"` : '—'},
          {label:'Weight', val: profile?.weight_kg ? `${Math.round(profile.weight_kg*2.205)} lbs` : '—'},
          {label:'Goal',   val: profile?.fitness_goal || '—'},
          {label:'Units',  val: profile?.unit_preference || 'imperial'},
        ].map(s=>(
          <div key={s.label} className="gow-card text-center">
            <p className="section-label mb-1">{s.label}</p>
            <p className="font-bold text-[var(--text)] capitalize">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="card mb-3">
        <p className="section-label mb-3">Your data</p>
        <div className="space-y-1">
          {[
            {label:'Rewards & XP', href:'/rewards', icon:'🏆'},
            {label:'Strength standards', href:'/standards', icon:'📊'},
            {label:'Progress & PRs', href:'/progress', icon:'📈'},
            {label:'Export data (Pro)', href:'/api/export', icon:'💾'},
          ].map(item=>(
            <Link key={item.href} href={item.href} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0" style={{textDecoration:'none'}}>
              <div className="flex items-center gap-3"><span>{item.icon}</span><span className="text-sm font-semibold text-[var(--text)]">{item.label}</span></div>
              <span className="text-[var(--subtext)]">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Subscription */}
      <div className="card mb-3" style={{borderColor:'rgba(245,158,11,.2)',background:'rgba(245,158,11,.04)'}}>
        <div className="flex justify-between items-center">
          <div>
            <p className="section-label mb-1">Subscription</p>
            <p className="font-bold text-[var(--text)]">{profile?.plan==='pro'?'Pro':'Free'}</p>
            {profile?.plan_expires_at && <p className="text-xs text-[var(--subtext)] mt-0.5">Renews {new Date(profile.plan_expires_at).toLocaleDateString()}</p>}
          </div>
          {profile?.plan !== 'pro' && (
            <Link href="/settings?tab=subscription" className="text-xs font-bold px-4 py-2" style={{background:'#F59E0B',color:'#07080D',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))',textDecoration:'none'}}>Upgrade</Link>
          )}
        </div>
      </div>

      <Link href="/settings" className="btn-ghost block text-center mb-3" style={{textDecoration:'none',display:'block',textAlign:'center'}}>Settings →</Link>

      <button onClick={async()=>{await supabase.auth.signOut();window.location.href='/login'}} className="btn-ghost block text-center" style={{color:'var(--red)',borderColor:'rgba(239,68,68,.25)'}}>Sign out</button>
    </div>
  )
}
