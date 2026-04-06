'use client'
import { useState, useEffect } from 'react'
import { Trophy, Users, Clock, ChevronRight, X, Copy, Share2 } from 'lucide-react'

const TEMPLATES = [
  {name:'30-Day Workout Streak',metric:'workouts',duration_days:30,desc:'Complete a workout every day for 30 days',icon:'🔥',target:null},
  {name:'100 Push-Up Challenge',metric:'sets',duration_days:14,desc:'Log 100 sets of push-ups in 2 weeks',icon:'💪',target:100},
  {name:'Weight Loss Challenge',metric:'weight_lost',duration_days:60,desc:'Who can lose the most body fat % in 60 days',icon:'⬇️',target:null},
  {name:'1000 Sets Club',metric:'sets',duration_days:30,desc:'Log 1000 total sets in 30 days',icon:'🏋️',target:1000},
  {name:'Weekly Warrior',metric:'workouts',duration_days:7,desc:'Most workouts in a single week',icon:'⚡',target:null},
  {name:'Couch to 5K',metric:'distance_km',duration_days:30,desc:'Build up to running 5 km total',icon:'🏃',target:5},
  {name:'Run 10km Challenge',metric:'distance_km',duration_days:14,desc:'Run 10 km total in 2 weeks',icon:'🏃',target:10},
  {name:'Run 20km',metric:'distance_km',duration_days:30,desc:'Run 20 km across the month',icon:'🏃',target:20},
  {name:'Cycle 10km',metric:'distance_km',duration_days:14,desc:'Cycle 10 km total in 2 weeks',icon:'🚴',target:10},
  {name:'Cycle 50km',metric:'distance_km',duration_days:30,desc:'Cycle 50 km across the month',icon:'🚴',target:50},
  {name:'5 Hours of Training',metric:'duration_min',duration_days:30,desc:'Accumulate 5 hours of total training time',icon:'⏱️',target:300},
]

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [code, setCode] = useState('')
  const [form, setForm] = useState({name:'',metric:'workouts',duration_days:30,target_value:0})
  const [detail, setDetail] = useState<any>(null)

  const load = () => fetch('/api/challenges').then(r=>r.json()).then(r=>{ if(r.success) setChallenges(r.data||[]) }).finally(()=>setLoading(false))
  useEffect(()=>{ load() },[])

  async function joinByCode() {
    if (!code) return
    const res = await fetch('/api/challenges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'join',invite_code:code})}).then(r=>r.json())
    if (!res.success) alert(res.error||'Failed to join')
    setCode(''); load()
  }

  async function create(c?: any) {
    const data = c || form
    await fetch('/api/challenges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    setShowCreate(false); setForm({name:'',metric:'workouts',duration_days:30,target_value:0}); load()
  }

  function daysLeft(c: any) {
    if (!c.starts_at || !c.duration_days) return null
    const end = new Date(c.starts_at); end.setDate(end.getDate()+c.duration_days)
    const left = Math.ceil((end.getTime()-Date.now())/86400000)
    return left > 0 ? left : 0
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="px-4 pt-12 pb-8">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-2xl font-black text-[var(--text)]">Challenges</h1><p className="text-sm text-[var(--subtext)] mt-0.5">Compete with friends</p></div>
        <button onClick={()=>setShowCreate(!showCreate)} className="text-xs font-bold px-3 py-2" style={{background:'rgba(59,130,246,.15)',color:'var(--acc)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>+ Create</button>
      </div>

      {/* Join by code */}
      <div className="card mb-4">
        <p className="section-label mb-3">Join by invite code</p>
        <div className="flex gap-2">
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" className="input-gow flex-1" onKeyDown={e=>e.key==='Enter'&&joinByCode()}/>
          <button onClick={joinByCode} disabled={!code} className="btn-primary" style={{width:'auto',padding:'0 14px'}}>Join</button>
        </div>
      </div>

      {/* Create / Templates */}
      {showCreate && (
        <div className="mb-4">
          {/* Templates */}
          <p className="section-label mb-2">Quick templates</p>
          <div className="space-y-2 mb-4">
            {TEMPLATES.map(t=>(
              <button key={t.name} onClick={()=>create(t)} className="w-full text-left card flex items-center gap-3 py-3" style={{marginBottom:0}}>
                <span className="text-xl">{t.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-xs text-[var(--text)]">{t.name}</p>
                  <p className="text-[10px] text-[var(--subtext)]">{t.desc}</p>
                </div>
                <span className="text-[9px] gm text-[var(--subtext)]">{t.duration_days}d</span>
              </button>
            ))}
          </div>

          {/* Custom */}
          <p className="section-label mb-2">Or create custom</p>
          <div className="card" style={{borderColor:'rgba(59,130,246,.3)'}}>
            <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Challenge name" className="input-gow mb-2 text-sm"/>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select value={form.metric} onChange={e=>setForm(p=>({...p,metric:e.target.value}))} className="input-gow text-sm">
                <option value="workouts">Most workouts</option>
                <option value="sets">Most sets</option>
                <option value="distance_km">Distance (km)</option>
                <option value="duration_min">Training time (min)</option>
                <option value="weight_lost">Weight lost (%)</option>
              </select>
              <select value={form.duration_days} onChange={e=>setForm(p=>({...p,duration_days:parseInt(e.target.value)}))} className="input-gow text-sm">
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            {(form.metric==='distance_km'||form.metric==='duration_min'||form.metric==='sets') && (
              <input type="number" value={form.target_value||''} onChange={e=>setForm(p=>({...p,target_value:parseFloat(e.target.value)||0}))} placeholder={form.metric==='distance_km'?'Target km (e.g. 50)':form.metric==='duration_min'?'Target minutes (e.g. 600)':'Target sets'} className="input-gow text-sm mb-2"/>
            )}
            <button onClick={()=>create()} disabled={!form.name} className="btn-primary text-xs" style={{padding:'8px'}}>Create challenge</button>
          </div>
        </div>
      )}

      {/* Active challenges */}
      {challenges.length === 0 ? (
        <div className="card text-center py-8">
          <Trophy size={32} color="var(--gold)" className="mx-auto mb-2"/>
          <p className="font-bold text-[var(--text)] mb-1">No active challenges</p>
          <p className="text-xs text-[var(--subtext)]">Create one or join with a code above</p>
        </div>
      ) : challenges.map((c:any)=>{
        const participants = c.challenge_participants || []
        const sorted = [...participants].sort((a:any,b:any)=>(b.score||0)-(a.score||0))
        const days = daysLeft(c)
        return (
          <button key={c.id} onClick={()=>setDetail(c)} className="w-full text-left card mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-[var(--text)]">{c.name}</p>
                <p className="text-xs text-[var(--subtext)]">{c.metric} · {c.duration_days} days</p>
              </div>
              <div className="flex items-center gap-2">
                {days !== null && days > 0 && <span className="text-[9px] gm text-[var(--gold)]">{days}d left</span>}
                {days === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5" style={{background:'var(--red)',color:'#fff',clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>Ended</span>}
                <ChevronRight size={14} color="var(--subtext)"/>
              </div>
            </div>
            {/* Mini leaderboard preview */}
            <div className="flex items-center gap-2">
              <Users size={12} color="var(--subtext)"/>
              <span className="text-xs text-[var(--subtext)]">{participants.length} participants</span>
              {sorted[0] && <span className="text-xs gm text-[var(--gold)] ml-auto">Leader: {sorted[0].score||0}</span>}
            </div>
          </button>
        )
      })}

      {/* Challenge detail modal */}
      {detail && (()=>{
        const c = detail
        const participants = (c.challenge_participants || []).sort((a:any,b:any)=>(b.score||0)-(a.score||0))
        const days = daysLeft(c)
        return (
          <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}} onClick={()=>setDetail(null)}>
            <div className="w-full max-h-[85vh] overflow-y-auto" style={{background:'var(--surface)',borderTop:'2px solid var(--gold)'}} onClick={e=>e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-black text-[var(--text)]">{c.name}</h2>
                    <p className="text-xs text-[var(--subtext)] mt-0.5">
                      {({workouts:'Most workouts',sets:'Most sets',distance_km:'Distance (km)',duration_min:'Training time',weight_lost:'Weight lost (%)'} as any)[c.metric]||c.metric} · {c.duration_days} days{days !== null ? ` · ${days} days left` : ''}
                    </p>
                  </div>
                  <button onClick={()=>setDetail(null)} className="p-1"><X size={20} color="var(--subtext)"/></button>
                </div>

                {/* Target progress */}
                {c.target_value && c.target_value > 0 && (
                  <div className="card mb-4" style={{borderColor:'rgba(245,158,11,.3)',background:'rgba(245,158,11,.04)'}}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="section-label">Target</span>
                      <span className="gm text-lg font-black text-[var(--gold)]">{c.target_value} {c.metric==='distance_km'?'km':c.metric==='duration_min'?'min':c.metric==='sets'?'sets':''}</span>
                    </div>
                    <div className="flex gap-0.5 h-2.5">
                      {Array.from({length:10}).map((_,i)=>{
                        const best = Math.max(...participants.map((p:any)=>p.score||0),0)
                        const filled = Math.round(Math.min(1,best/c.target_value)*10)
                        return <div key={i} className="flex-1 rounded-sm" style={{background:i<filled?'var(--gold)':'rgba(255,255,255,.08)'}}/>
                      })}
                    </div>
                    <p className="text-[9px] text-[var(--subtext)] mt-1 text-center">Best: {Math.max(...participants.map((p:any)=>p.score||0),0)} / {c.target_value}</p>
                  </div>
                )}

                {/* Invite code */}
                <div className="flex items-center gap-2 mb-4 py-2 px-3" style={{background:'var(--muted)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
                  <span className="text-xs text-[var(--subtext)]">Invite code:</span>
                  <span className="gm text-sm font-black text-[var(--acc)] flex-1">{c.invite_code}</span>
                  <button onClick={()=>{navigator.clipboard.writeText(c.invite_code);alert('Copied!')}}><Copy size={14} color="var(--acc)"/></button>
                  <button onClick={async()=>{
                    const text = `Join my PlateTrack challenge: ${c.name}\nCode: ${c.invite_code}\n\nDownload PlateTrack to compete!`
                    if (navigator.share) await navigator.share({text}).catch(()=>{})
                    else { navigator.clipboard.writeText(text); alert('Copied!') }
                  }}><Share2 size={14} color="var(--acc)"/></button>
                </div>

                {/* Leaderboard */}
                <p className="section-label mb-3">Leaderboard</p>
                {participants.length === 0 ? (
                  <p className="text-xs text-[var(--subtext)] text-center py-4">No participants yet — share the invite code!</p>
                ) : participants.map((p:any,i:number)=>(
                  <div key={p.id||i} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                    <div className="w-7 h-7 flex items-center justify-center font-black text-xs gm" style={{
                      background:i===0?'rgba(245,158,11,.15)':i===1?'rgba(192,192,192,.15)':i===2?'rgba(205,127,50,.15)':'var(--muted)',
                      color:i===0?'var(--gold)':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--subtext)',
                      clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'
                    }}>{i+1}</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[var(--text)]">{(p as any).profiles?.username || `Participant #${i+1}`}</p>
                      {(p as any).profiles?.current_level && <p className="text-[9px] text-[var(--subtext)]">{(p as any).profiles.current_level}</p>}
                    </div>
                    <div className="text-right">
                      <p className="gm text-sm font-black" style={{color:i===0?'var(--gold)':'var(--text)'}}>{p.score||0}</p>
                      <p className="text-[9px] text-[var(--subtext)]">{({workouts:'workouts',sets:'sets',distance_km:'km',duration_min:'min',weight_lost:'%'} as any)[c.metric]||c.metric}</p>
                    </div>
                  </div>
                ))}

                {/* Progress bar */}
                {days !== null && c.duration_days && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="section-label">Progress</span>
                      <span className="text-[9px] gm text-[var(--subtext)]">{Math.round(((c.duration_days-days)/c.duration_days)*100)}%</span>
                    </div>
                    <div className="flex gap-0.5 h-2">
                      {Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 rounded-sm" style={{background:i<Math.round(((c.duration_days-days)/c.duration_days)*10)?'var(--gold)':'rgba(255,255,255,.08)'}}/>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
