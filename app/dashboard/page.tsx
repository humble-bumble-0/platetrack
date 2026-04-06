'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getLevelProgress } from '@/lib/rewards'
import { Scale, UtensilsCrossed, Plus, X } from 'lucide-react'

export default function Dashboard() {
  const [profile, setProfile]   = useState<any>(null)
  const [stats, setStats]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [fab, setFab]           = useState(false)
  const [weightModal, setWeightModal] = useState(false)
  const [weightVal, setWeightVal]     = useState('')
  const [foodModal, setFoodModal]     = useState(false)
  const [foodForm, setFoodForm]       = useState({name:'',calories:'',protein:'',carbs:'',fat:''})
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('username,total_xp,current_level,plan,last_workout_at').maybeSingle().then(r => r.data),
      supabase.from('workout_sessions').select('id,name,completed_at,set_count').eq('is_complete',true).order('completed_at',{ascending:false}).limit(10).then(r => r.data),
      supabase.from('personal_records').select('exercises(name),value,record_type,created_at').order('created_at',{ascending:false}).limit(1).maybeSingle().then(r => r.data),
      supabase.from('weight_logs').select('weight_lbs,logged_date').order('logged_date',{ascending:false}).limit(1).maybeSingle().then(r => r.data),
      supabase.from('xp_events').select('xp_amount,event_type,description,created_at').order('created_at',{ascending:false}).limit(5).then(r => r.data),
      fetch('/api/nutrition?date='+new Date().toISOString().split('T')[0]).then(r=>r.json()).then(r=>r.success?r.data:null).catch(()=>null),
    ]).then(([p, sessions, pr, weight, xpFeed, nutrition]) => {
      setProfile(p)
      setStats({ sessions: sessions || [], latestPR: pr, weight, xpFeed: xpFeed || [], nutrition })
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="px-4 pt-12 pb-8 page-enter">
      <div className="flex items-center justify-between mb-5"><div><div className="skeleton w-32 h-3 mb-2"/><div className="skeleton w-48 h-6"/></div><div className="skeleton w-9 h-9"/></div>
      <div className="card mb-4"><div className="flex justify-between mb-3"><div className="skeleton w-20 h-6"/><div className="skeleton w-24 h-6"/></div><div className="flex gap-1">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 h-2 skeleton"/>)}</div></div>
      <div className="grid grid-cols-3 gap-3 mb-4">{[1,2,3].map(i=><div key={i} className="gow-card py-4"><div className="skeleton w-16 h-3 mx-auto mb-2"/><div className="skeleton w-10 h-5 mx-auto"/></div>)}</div>
      <div className="card mb-4"><div className="skeleton w-24 h-3 mb-3"/>{[1,2,3].map(i=><div key={i} className="flex justify-between py-2 border-b border-[var(--border)]"><div className="skeleton w-32 h-4"/><div className="skeleton w-12 h-4"/></div>)}</div>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="gl mb-1">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</p>
          <h1 className="text-xl font-black text-[var(--text)] tracking-tight">{greeting}, {profile?.username || 'Athlete'}</h1>
        </div>
        <Link href="/profile" className="w-9 h-9 bg-[var(--acc)] flex items-center justify-center text-white font-black text-sm" style={{clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
          {profile?.username?.[0]?.toUpperCase() || 'U'}
        </Link>
      </div>

      {/* XP / Level card */}
      <div className="card mb-4" style={{borderColor:'rgba(59,130,246,.25)',background:'rgba(59,130,246,.04)'}}>
        <div className="flex justify-between items-center mb-3">
          <div><p className="section-label mb-1">Level</p><p className="text-2xl font-black text-[var(--acc)]">{profile?.current_level || 'Novice'}</p></div>
          <div className="text-right"><p className="section-label mb-1">Total XP</p><p className="text-2xl font-black gm text-[var(--acc)]">{(profile?.total_xp || 0).toLocaleString()}</p></div>
        </div>
        <div className="flex gap-1">{Array.from({length:10}).map((_,i)=>{const prog=getLevelProgress(profile?.total_xp||0);const filled=Math.round(prog.progressPct/10);return <div key={i} className="flex-1 h-2 rounded-sm" style={{background:i<filled?'var(--acc)':'rgba(59,130,246,.1)'}}/>})}</div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {(()=>{
          const weekWkts = stats?.sessions?.filter((s:any)=>new Date(s.completed_at)>new Date(Date.now()-7*86400000)).length||0
          const todaySets = stats?.sessions?.filter((s:any)=>new Date(s.completed_at).toDateString()===new Date().toDateString()).reduce((a:number,s:any)=>a+(s.set_count||0),0)||0
          const lvl = getLevelProgress(profile?.total_xp||0)
          return [
            {label:'This week',val:`${weekWkts} wkts`},
            {label:'Sets today',val:`${todaySets}`},
            {label:'Next level',val:lvl.xpToNextLevel != null ? `${lvl.xpToNextLevel.toLocaleString()} XP` : 'Max'},
          ]
        })().map(s=>(
          <div key={s.label} className="gow-card text-center">
            <p className="section-label mb-1">{s.label}</p>
            <p className="gm text-lg font-black text-[var(--text)]">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Latest PR */}
      {stats?.latestPR && (
        <div className="card mb-4" style={{borderLeft:'2px solid var(--gold)',background:'rgba(245,158,11,.04)'}}>
          <div className="flex justify-between items-center">
            <div>
              <p className="section-label text-[var(--gold)] mb-1">Latest PR ◆</p>
              <p className="font-bold text-[var(--text)]">{(stats.latestPR as any).exercises?.name}</p>
              <p className="text-xs text-[var(--subtext)]">{new Date((stats.latestPR as any).created_at).toLocaleDateString()}</p>
            </div>
            <p className="gm text-2xl text-[var(--gold)] font-black">{Math.round((stats.latestPR as any).value * 2.20462)} lbs</p>
          </div>
        </div>
      )}

      {/* Recent workouts */}
      <div className="card mb-4">
        <p className="section-label mb-3">Recent workouts</p>
        {stats?.sessions?.length > 0 ? stats.sessions.map((s:any) => (
          <div key={s.id} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="text-sm font-bold text-[var(--text)]">{s.name || 'Workout'}</p>
              <p className="text-xs text-[var(--subtext)]">{new Date(s.completed_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</p>
            </div>
            <p className="text-xs text-[var(--subtext)] gm">{s.set_count} sets</p>
          </div>
        )) : <p className="text-sm text-[var(--subtext)] text-center py-4">No workouts yet — start one below</p>}
      </div>

      {/* Daily tip */}
      {(()=>{
        const tips = [
          {cat:'Workout',tip:'Progressive overload is key — increase weight by 2.5-5 lbs when you hit all reps',color:'var(--acc)'},
          {cat:'Nutrition',tip:'Aim for 0.8-1g protein per lb bodyweight to maximize muscle protein synthesis',color:'#8B5CF6'},
          {cat:'Recovery',tip:'Sleep 7-9 hours — growth hormone peaks during deep sleep, critical for gains',color:'var(--green)'},
          {cat:'Workout',tip:'Compound movements (squat, bench, deadlift) recruit more muscle fibers than isolation',color:'var(--acc)'},
          {cat:'Nutrition',tip:'Eat 20-40g protein within 2 hours post-workout to optimize the anabolic window',color:'#8B5CF6'},
          {cat:'Recovery',tip:'Rest each muscle group 48-72 hours between sessions for optimal recovery',color:'var(--green)'},
          {cat:'Workout',tip:'Track RPE (Rate of Perceived Exertion) to auto-regulate intensity on tough days',color:'var(--acc)'},
          {cat:'Nutrition',tip:'Creatine monohydrate (5g/day) is the most researched and effective supplement',color:'#8B5CF6'},
          {cat:'Workout',tip:'Control the eccentric (lowering) phase — 2-3 seconds builds more muscle',color:'var(--acc)'},
          {cat:'Recovery',tip:'Deload every 4-6 weeks — reduce volume 40-50% to let your body catch up',color:'var(--green)'},
          {cat:'Nutrition',tip:'Hydrate: aim for half your bodyweight in ounces of water daily',color:'#8B5CF6'},
          {cat:'Workout',tip:'Train movements, not muscles — push, pull, hinge, squat, carry',color:'var(--acc)'},
          {cat:'Nutrition',tip:'Fiber (25-35g/day) improves gut health, satiety, and nutrient absorption',color:'#8B5CF6'},
          {cat:'Recovery',tip:'Cold exposure (cold showers/ice baths) can reduce inflammation post-workout',color:'var(--green)'},
        ]
        const tip = tips[new Date().getDate() % tips.length]
        return (
          <div className="card mb-4" style={{borderLeft:`2px solid ${tip.color}`,background:tip.color.replace(')',',0.04)').replace('var(','rgba(').replace('--acc','59,130,246').replace('--green','34,197,94')}}>
            <div className="flex items-start gap-2">
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 flex-shrink-0" style={{background:tip.color+'18',color:tip.color,clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>{tip.cat}</span>
              <p className="text-xs text-[var(--text)] leading-relaxed">{tip.tip}</p>
            </div>
          </div>
        )
      })()}

      {/* Weekly volume chart */}
      <div className="card mb-4">
        <p className="section-label mb-3">Weekly volume</p>
        <div className="flex items-end gap-1.5" style={{height:80}}>
          {(()=>{
            const days = Array.from({length:7}).map((_,i)=>{
              const d = new Date(); d.setDate(d.getDate()-6+i)
              const key = d.toDateString()
              const sets = (stats?.sessions||[]).filter((s:any)=>new Date(s.completed_at).toDateString()===key).reduce((a:number,s:any)=>a+(s.set_count||0),0)
              return { day: d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,2), sets, isToday: i===6 }
            })
            const max = Math.max(1,...days.map(d=>d.sets))
            return days.map((d,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{height:`${Math.max(4,(d.sets/max)*60)}px`,background:d.isToday?'var(--acc)':d.sets>0?'rgba(59,130,246,.4)':'rgba(255,255,255,.06)',transition:'height .3s'}}/>
                <span className="text-[8px] font-bold" style={{color:d.isToday?'var(--acc)':'var(--subtext)'}}>{d.day}</span>
              </div>
            ))
          })()}
        </div>
      </div>

      {/* Body weight */}
      {stats?.weight && (
        <div className="card mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="section-label mb-1">Body weight</p>
              <p className="text-xl font-black gm text-[var(--text)]">{Math.round(stats.weight.weight_lbs)} <span className="text-sm font-normal text-[var(--subtext)]">lbs</span></p>
            </div>
            <Link href="/bmi" className="text-xs font-bold text-[var(--acc)]" style={{textDecoration:'none'}}>BMI & Body →</Link>
          </div>
        </div>
      )}

      {/* Recent XP feed */}
      {stats?.xpFeed?.length > 0 && (
        <div className="card mb-4">
          <p className="section-label mb-3">Recent XP</p>
          {stats.xpFeed.map((e:any,i:number) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
              <p className="text-xs text-[var(--text)]">{e.description || e.event_type}</p>
              <p className="gm text-xs font-bold text-[var(--green)]">+{e.xp_amount}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's nutrition + water */}
      <div className="card mb-4" style={{borderColor:'rgba(139,92,246,.25)',background:'rgba(139,92,246,.04)'}}>
        <div className="flex justify-between items-center mb-3">
          <p className="section-label" style={{color:'#A78BFA'}}>Today's nutrition</p>
          <Link href="/nutrition" className="text-xs font-bold" style={{color:'#8B5CF6',textDecoration:'none'}}>Log food →</Link>
        </div>
        {(()=>{
          const logs = stats?.nutrition?.logs || []
          const goals = stats?.nutrition?.goals || { calories:2200, protein_g:180, carbs_g:250, fat_g:70 }
          const waterCups = stats?.nutrition?.hydration_cups || 0
          const cals = logs.reduce((a:number,l:any)=>a+(l.calories||0),0)
          const prot = logs.reduce((a:number,l:any)=>a+(l.protein_g||0),0)
          const carbs = logs.reduce((a:number,l:any)=>a+(l.carbs_g||0),0)
          const fat = logs.reduce((a:number,l:any)=>a+(l.fat_g||0),0)
          return <>
            <div className="flex justify-between items-baseline mb-3">
              <div>
                <span className="text-2xl font-black gm text-[var(--text)]">{Math.round(cals)}</span>
                <span className="text-sm text-[var(--subtext)] ml-1">/ {goals.calories} cal</span>
              </div>
              <span className="text-sm font-bold gm" style={{color:(goals.calories-cals)>0?'var(--green)':'var(--red)'}}>{Math.round(goals.calories-cals)} left</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                {label:'Protein',val:prot,goal:goals.protein_g,color:'var(--acc)'},
                {label:'Carbs',val:carbs,goal:goals.carbs_g,color:'var(--gold)'},
                {label:'Fat',val:fat,goal:goals.fat_g,color:'var(--red)'},
              ].map(m=>(
                <div key={m.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] font-bold uppercase" style={{color:m.color}}>{m.label}</span>
                    <span className="gm text-[8px]" style={{color:m.color}}>{Math.round(m.val)}/{m.goal}g</span>
                  </div>
                  <div className="flex gap-0.5 h-1.5">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 rounded-sm" style={{background:i<Math.round(Math.min(1,m.val/m.goal)*10)?m.color:'rgba(255,255,255,.08)'}}/>)}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-sm">💧</span>
                <span className="text-xs font-bold text-[var(--text)]">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{Array.from({length:12}).map((_,i)=><div key={i} className="w-1.5 h-3 rounded-sm" style={{background:i<waterCups?'var(--acc)':'rgba(59,130,246,.1)'}}/>)}</div>
                <span className="gm text-xs text-[var(--acc)]">{waterCups}/12</span>
              </div>
            </div>
          </>
        })()}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {href:'/plates',label:'Plate Calculator',icon:'⚖️'},
          {href:'/nutrition',label:'Nutrition',icon:'🥗'},
          {href:'/standards',label:'Standards',icon:'📊'},
          {href:'/rewards',label:'Rewards & XP',icon:'🏆'},
        ].map(q=>(
          <Link key={q.href} href={q.href} className="gow-card flex items-center gap-2.5 py-3" style={{textDecoration:'none'}}>
            <span className="text-lg">{q.icon}</span>
            <span className="text-xs font-bold text-[var(--text)]">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Start workout CTA */}
      <Link href="/workout/start" className="btn-primary block text-center" style={{textDecoration:'none',display:'block',padding:'14px',textAlign:'center',background:'var(--acc)',color:'#fff',fontWeight:800,fontSize:13,letterSpacing:'.1em',textTransform:'uppercase',clipPath:'polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))'}}>
        Start Workout →
      </Link>

      {/* Floating quick-add button */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col-reverse items-end gap-2">
        {fab && <>
          <button onClick={()=>{setWeightModal(true);setFab(false)}} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold" style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
            <Scale size={14} color="var(--green)"/> Log weight
          </button>
          <button onClick={()=>{setFoodModal(true);setFab(false)}} className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold" style={{background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
            <UtensilsCrossed size={14} color="#8B5CF6"/> Log food
          </button>
        </>}
        <button onClick={()=>setFab(!fab)} className="w-12 h-12 flex items-center justify-center" style={{background:'var(--acc)',clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
          {fab ? <X size={20} color="#fff"/> : <Plus size={20} color="#fff"/>}
        </button>
      </div>

      {/* Weight log modal */}
      {weightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{background:'rgba(0,0,0,.7)'}}>
          <div className="w-full max-w-sm p-5" style={{background:'var(--surface)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))'}}>
            <div className="flex items-center gap-2 mb-4">
              <Scale size={16} color="var(--green)"/>
              <p className="font-bold text-[var(--text)]">Log today's weight</p>
            </div>
            <input type="number" value={weightVal} onChange={e=>setWeightVal(e.target.value)} placeholder="Weight (lbs)" className="input-gow text-center text-2xl gm mb-4" autoFocus/>
            <div className="flex gap-2">
              <button onClick={async()=>{
                if (!weightVal) return
                await fetch('/api/weight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weight_lbs:parseFloat(weightVal)})})
                setWeightModal(false); setWeightVal('')
              }} className="btn-primary flex-1" style={{background:'var(--green)'}}>Save</button>
              <button onClick={()=>setWeightModal(false)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick food log modal */}
      {foodModal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}}>
          <div className="w-full p-4" style={{background:'var(--surface)',borderTop:'1px solid var(--border)'}}>
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed size={16} color="#8B5CF6"/>
              <p className="font-bold text-[var(--text)]">Quick log food</p>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              <input value={foodForm.name} onChange={e=>setFoodForm(f=>({...f,name:e.target.value}))} placeholder="Food name" className="input-gow" autoFocus/>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={foodForm.calories} onChange={e=>setFoodForm(f=>({...f,calories:e.target.value}))} placeholder="Calories" className="input-gow"/>
                <input type="number" value={foodForm.protein} onChange={e=>setFoodForm(f=>({...f,protein:e.target.value}))} placeholder="Protein (g)" className="input-gow"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={foodForm.carbs} onChange={e=>setFoodForm(f=>({...f,carbs:e.target.value}))} placeholder="Carbs (g)" className="input-gow"/>
                <input type="number" value={foodForm.fat} onChange={e=>setFoodForm(f=>({...f,fat:e.target.value}))} placeholder="Fat (g)" className="input-gow"/>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={async()=>{
                if (!foodForm.name||!foodForm.calories) return
                await fetch('/api/nutrition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({food_name:foodForm.name,calories:parseFloat(foodForm.calories),protein_g:parseFloat(foodForm.protein)||0,carbs_g:parseFloat(foodForm.carbs)||0,fat_g:parseFloat(foodForm.fat)||0,meal_type:'Snacks',log_date:new Date().toISOString().split('T')[0]})})
                setFoodModal(false); setFoodForm({name:'',calories:'',protein:'',carbs:'',fat:''})
              }} className="btn-primary flex-1" style={{background:'#8B5CF6'}}>Add</button>
              <button onClick={()=>setFoodModal(false)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
