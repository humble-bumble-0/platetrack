'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() { return <Suspense><SettingsInner/></Suspense> }
function SettingsInner() {
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [tProfiles, setTProfiles] = useState<any[]>([])
  const [newTP, setNewTP] = useState({name:'',goal:'strength',color:'#3B82F6'})
  const router = useRouter()
  const params = useSearchParams()
  const tab    = params.get('tab') || 'account'
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/auth/profile').then(r=>r.json()).then(r=>{ if(r.success) setProfile(r.data) })
    supabase.from('training_profiles').select('*').order('created_at').then(({data})=>setTProfiles(data||[]))
  }, [])

  async function save(updates: any) {
    setSaving(true)
    await fetch('/api/auth/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(updates)})
    setSaving(false); setToast('Saved ✓'); setTimeout(()=>setToast(''),2500)
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/login') }

  const Row = ({label, children}: {label:string; children:React.ReactNode}) => (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )

  return (
    <div className="px-4 pt-12 pb-8">
      {toast && <div className="fixed top-4 left-4 right-4 z-50 bg-[var(--green)] text-white font-bold text-center py-3 rounded-xl">{toast}</div>}
      <h1 className="text-2xl font-black text-[var(--text)] mb-5">Settings</h1>

      {/* Profile */}
      <div className="card mb-4">
        <p className="section-label mb-3">Profile</p>
        <Row label="Username"><p className="text-sm text-[var(--subtext)] gm">@{profile?.username}</p></Row>
        <Row label="Email"><p className="text-sm text-[var(--subtext)]">{profile?.email}</p></Row>
        <Row label="Units">
          <select value={profile?.unit_preference||'imperial'} onChange={e=>{ setProfile((p:any)=>({...p,unit_preference:e.target.value})); save({unit_preference:e.target.value}) }} className="input-gow py-1 text-xs" style={{width:'auto'}}>
            <option value="imperial">Imperial (lbs)</option>
            <option value="metric">Metric (kg)</option>
          </select>
        </Row>
        <Row label="Fitness goal">
          <select value={profile?.fitness_goal||'general'} onChange={e=>{ setProfile((p:any)=>({...p,fitness_goal:e.target.value})); save({fitness_goal:e.target.value}) }} className="input-gow py-1 text-xs" style={{width:'auto'}}>
            <option value="strength">Get stronger</option>
            <option value="muscle">Build muscle</option>
            <option value="endurance">Endurance</option>
            <option value="general">General fitness</option>
          </select>
        </Row>
        <Row label="Gender">
          <select value={profile?.gender||''} onChange={e=>{ setProfile((p:any)=>({...p,gender:e.target.value})); save({gender:e.target.value}) }} className="input-gow py-1 text-xs" style={{width:'auto'}}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Row>
      </div>

      {/* Training profiles */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <p className="section-label">Training profiles</p>
          <span className="text-[9px] text-[var(--subtext)]">Track different goals separately</span>
        </div>
        {tProfiles.map((tp:any)=>(
          <div key={tp.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 flex items-center justify-center text-xs font-black" style={{background:tp.color+'20',color:tp.color,clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{tp.name[0]}</div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{tp.name}</p>
                <p className="text-[10px] text-[var(--subtext)] capitalize">{tp.goal}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tp.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5" style={{background:'var(--green)',color:'#fff',clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>Active</span>}
              {!tp.is_active && <button onClick={async()=>{
                await supabase.from('training_profiles').update({is_active:false}).eq('user_id',profile?.id)
                await supabase.from('training_profiles').update({is_active:true}).eq('id',tp.id)
                supabase.from('training_profiles').select('*').order('created_at').then(({data})=>setTProfiles(data||[]))
                setToast(`Switched to ${tp.name}`); setTimeout(()=>setToast(''),2500)
              }} className="text-[10px] font-bold text-[var(--acc)]">Activate</button>}
              <button onClick={async()=>{
                if(!confirm(`Delete "${tp.name}"?`)) return
                await supabase.from('training_profiles').delete().eq('id',tp.id)
                setTProfiles(p=>p.filter(x=>x.id!==tp.id))
              }} className="text-[10px] text-[var(--red)]">x</button>
            </div>
          </div>
        ))}
        {tProfiles.length === 0 && <p className="text-xs text-[var(--subtext)] py-2">No profiles yet. Create one to track different training goals.</p>}
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex gap-2 mb-2">
            <input value={newTP.name} onChange={e=>setNewTP(p=>({...p,name:e.target.value}))} placeholder="Profile name (e.g. Powerlifting)" className="input-gow text-xs flex-1 py-2"/>
            <select value={newTP.goal} onChange={e=>setNewTP(p=>({...p,goal:e.target.value}))} className="input-gow text-xs py-2" style={{width:'auto'}}>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="powerlifting">Powerlifting</option>
              <option value="bodybuilding">Bodybuilding</option>
              <option value="endurance">Endurance</option>
              <option value="cutting">Cutting</option>
              <option value="bulking">Bulking</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="flex gap-1.5 mb-2">
            {['#3B82F6','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#6E7191'].map(c=>(
              <button key={c} onClick={()=>setNewTP(p=>({...p,color:c}))} className="w-6 h-6 rounded-sm" style={{background:c,border:newTP.color===c?'2px solid #fff':'2px solid transparent'}}/>
            ))}
          </div>
          <button onClick={async()=>{
            if (!newTP.name.trim()) return
            const isFirst = tProfiles.length === 0
            const { data } = await supabase.from('training_profiles').insert({user_id:profile?.id,name:newTP.name.trim(),goal:newTP.goal,color:newTP.color,is_active:isFirst}).select().single()
            if (data) setTProfiles(p=>[...p,data])
            setNewTP({name:'',goal:'strength',color:'#3B82F6'})
            setToast('Profile created'); setTimeout(()=>setToast(''),2500)
          }} disabled={!newTP.name.trim()} className="btn-primary text-xs" style={{padding:'8px 16px'}}>Create profile</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card mb-4">
        <p className="section-label mb-3">Preferences</p>
        <Row label="Default rest timer">
          <select defaultValue="90" onChange={e=>localStorage.setItem('pt_rest_duration',e.target.value)} className="input-gow py-1 text-xs" style={{width:'auto'}}>
            {[30,45,60,90,120,180,300].map(s=><option key={s} value={s}>{s<60?`${s}s`:`${s/60}m`}</option>)}
          </select>
        </Row>
        <Row label="Notifications">
          <button onClick={async()=>{
            if (!('Notification' in window)) { alert('Notifications not supported'); return }
            const perm = await Notification.requestPermission()
            alert(perm === 'granted' ? 'Notifications enabled' : 'Notifications blocked')
          }} className="text-xs font-bold text-[var(--acc)]">{typeof window!=='undefined'&&'Notification' in window && Notification.permission==='granted'?'Enabled':'Enable'}</button>
        </Row>
        <Row label="Theme"><span className="text-xs text-[var(--subtext)]">Dark (GoW)</span></Row>
      </div>

      {/* Subscription */}
      <div className="card mb-4" style={{borderColor:'rgba(245,158,11,.2)'}}>
        <p className="section-label mb-3">Subscription</p>
        <Row label="Plan">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:profile?.plan==='pro'?'rgba(245,158,11,.2)':'var(--muted)',color:profile?.plan==='pro'?'#F59E0B':'var(--subtext)'}}>{profile?.plan==='pro'?'Pro':'Free'}</span>
        </Row>
        {profile?.plan_expires_at && <Row label="Renewal"><p className="text-sm text-[var(--subtext)]">{new Date(profile.plan_expires_at).toLocaleDateString()}</p></Row>}
        {profile?.plan !== 'pro' && (
          <button onClick={()=>fetch('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_type:'monthly'})}).then(r=>r.json()).then(r=>r.data?.url&&(window.location.href=r.data.url))} className="btn-primary mt-3" style={{background:'#F59E0B',color:'#07080D'}}>
            Upgrade to Pro — $4.99/mo
          </button>
        )}
        {profile?.plan === 'pro' && (
          <button onClick={()=>fetch('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan_type:'monthly'})}).then(r=>r.json()).then(r=>r.data?.url&&(window.location.href=r.data.url))} className="btn-ghost mt-3 text-xs">Manage subscription</button>
        )}
      </div>

      {/* Data */}
      <div className="card mb-4">
        <p className="section-label mb-3">Data</p>
        <Row label="Export workout data">
          <a href="/api/export" className="text-xs font-bold text-[var(--acc)]">Download CSV</a>
        </Row>
        <Row label="Privacy policy"><Link href="/privacy" className="text-xs font-bold text-[var(--acc)]">View</Link></Row>
        <Row label="Terms of service"><Link href="/terms" className="text-xs font-bold text-[var(--acc)]">View</Link></Row>
      </div>

      {/* Change password */}
      <div className="card mb-4">
        <p className="section-label mb-3">Security</p>
        <div className="flex flex-col gap-2">
          <input type="password" id="new-pw" placeholder="New password (min 8 chars)" className="input-gow text-sm"/>
          <button onClick={async()=>{
            const pw = (document.getElementById('new-pw') as HTMLInputElement)?.value
            if (!pw || pw.length < 8) { alert('Password must be at least 8 characters'); return }
            const { error } = await supabase.auth.updateUser({ password: pw })
            if (error) alert(error.message)
            else { alert('Password updated'); (document.getElementById('new-pw') as HTMLInputElement).value = '' }
          }} className="btn-ghost text-xs">Update password</button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card mb-4" style={{borderColor:'rgba(239,68,68,.2)'}}>
        <p className="section-label mb-3" style={{color:'var(--red)'}}>Danger zone</p>
        <Row label="Delete account"><Link href="/delete-account" className="text-xs font-bold text-[var(--red)]">Delete</Link></Row>
      </div>

      {/* About */}
      <div className="card mb-4">
        <p className="section-label mb-3">About</p>
        <Row label="Version"><span className="gm text-xs text-[var(--subtext)]">1.0.0</span></Row>
        <Row label="Support"><a href="mailto:support@platetrack.app" className="text-xs font-bold text-[var(--acc)]">support@platetrack.app</a></Row>
      </div>

      <button onClick={signOut} className="btn-ghost w-full text-[var(--red)]" style={{borderColor:'rgba(239,68,68,.2)'}}>Sign out</button>
    </div>
  )
}
