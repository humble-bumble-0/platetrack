'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Scale, Flame, Droplets, Trophy, History, TrendingUp, CalendarDays, X, ChevronRight, Clock, MapPin } from 'lucide-react'

function BarChart({data,color,unit}:{data:{date:string,val:number}[],color:string,unit:string}) {
  if (!data.length) return <p className="text-xs text-[var(--subtext)] text-center py-6">No data yet — log your first entry to start tracking</p>

  // Always show 30 day columns, fill missing days with 0
  const days: {date:string,val:number,hasData:boolean}[] = []
  for (let i=29;i>=0;i--) {
    const d = new Date(); d.setDate(d.getDate()-i)
    const key = d.toISOString().split('T')[0]
    const found = data.find(x=>x.date===key)
    days.push({date:key,val:found?.val||0,hasData:!!found})
  }

  const withData = days.filter(d=>d.hasData)
  const latest = withData.length ? withData[withData.length-1].val : 0
  const max = Math.max(1,...days.map(d=>d.val))
  const avg7 = withData.slice(-7).reduce((a,d)=>a+d.val,0) / Math.max(1,Math.min(7,withData.length))

  return (
    <div>
      <div className="flex justify-between items-baseline mb-4">
        <div>
          <span className="gm text-3xl font-black text-[var(--text)]">{Math.round(latest)}</span>
          <span className="text-xs text-[var(--subtext)] ml-1">{unit}</span>
        </div>
        <div className="text-right">
          <p className="section-label mb-0.5">7-day avg</p>
          <span className="gm text-sm font-bold" style={{color}}>{Math.round(avg7)} {unit}</span>
        </div>
      </div>
      <div className="flex items-end gap-[2px]" style={{height:120}}>
        {days.map((d,i)=>{
          const isToday = i===29
          const h = d.val > 0 ? Math.max(6, (d.val/max)*100) : 3
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{height:'100%'}}>
              <div className="w-full rounded-sm" style={{
                height: d.hasData ? `${h}px` : '40px',
                background: d.hasData ? (isToday ? color : color+'80') : 'transparent',
                border: d.hasData ? 'none' : '1px solid rgba(255,255,255,.06)',
                borderBottom: d.hasData ? 'none' : '1px solid rgba(255,255,255,.1)',
              }}/>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[8px] text-[var(--subtext)]">30 days ago</span>
        {[21,14,7].map(n=><span key={n} className="text-[8px] text-[var(--subtext)]">{n}d</span>)}
        <span className="text-[8px] font-bold" style={{color}}>Today</span>
      </div>
    </div>
  )
}

function LineChart({data,color,unit,range,onRangeChange}:{data:{date:string,val:number}[],color:string,unit:string,range:string,onRangeChange:(r:any)=>void}) {
  const ranges = [{id:'7d',days:7},{id:'30d',days:30},{id:'90d',days:90},{id:'1y',days:365},{id:'all',days:9999}]
  const activeDays = ranges.find(r=>r.id===range)?.days||30
  const filtered = data.filter(d=>{
    if (activeDays>=9999) return true
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-activeDays)
    return new Date(d.date) >= cutoff
  }).reverse() // oldest first for line chart

  if (!filtered.length) return <p className="text-xs text-[var(--subtext)] text-center py-6">No data in this range</p>

  const latest = data[0]?.val||0
  const min = Math.min(...filtered.map(d=>d.val))
  const max = Math.max(...filtered.map(d=>d.val))
  const spread = max-min || 1
  const avg = Math.round(filtered.reduce((a,d)=>a+d.val,0)/filtered.length)
  const H = 140, W = 100 // percentages

  // Build SVG polyline points
  const points = filtered.map((d,i)=>{
    const x = filtered.length===1 ? 50 : (i/(filtered.length-1))*W
    const y = H - ((d.val-min)/spread)*(H-20) - 10
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <span className="gm text-3xl font-black text-[var(--text)]">{Math.round(latest)}</span>
          <span className="text-xs text-[var(--subtext)] ml-1">{unit}</span>
        </div>
        <div className="text-right">
          <p className="section-label mb-0.5">Avg</p>
          <span className="gm text-sm font-bold" style={{color}}>{avg} {unit}</span>
        </div>
      </div>
      {/* Range tabs */}
      <div className="flex gap-1 mb-3">
        {ranges.map(r=>(
          <button key={r.id} onClick={()=>onRangeChange(r.id)} className="flex-1 text-[9px] font-bold py-1.5 text-center" style={{
            background:range===r.id?color+'20':'var(--muted)',
            color:range===r.id?color:'var(--subtext)',
            border:`1px solid ${range===r.id?color:'transparent'}`,
            clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))',
          }}>{r.id==='all'?'All':r.id.toUpperCase()}</button>
        ))}
      </div>
      {/* SVG line chart */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%',height:120}}>
        {/* Grid lines */}
        {[0,25,50,75,100].map(y=><line key={y} x1="0" y1={H-y/100*(H-20)-10} x2={W} y2={H-y/100*(H-20)-10} stroke="rgba(255,255,255,.04)" strokeWidth="0.3"/>)}
        {/* Area fill */}
        <polygon points={`0,${H} ${points} ${W},${H}`} fill={color} opacity="0.08"/>
        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Latest dot */}
        {filtered.length>0 && (()=>{
          const last = filtered[filtered.length-1]
          const x = filtered.length===1?50:W
          const y = H-((last.val-min)/spread)*(H-20)-10
          return <circle cx={x} cy={y} r="2.5" fill={color}/>
        })()}
      </svg>
      {/* Range labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-[var(--subtext)]">{filtered[0]?.date||''}</span>
        <span className="text-[8px] font-bold" style={{color}}>Latest</span>
      </div>
      {/* Stats row */}
      <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
        <div><p className="section-label mb-0.5">High</p><p className="gm text-xs font-bold text-[var(--text)]">{Math.round(max)} {unit}</p></div>
        <div><p className="section-label mb-0.5">Low</p><p className="gm text-xs font-bold text-[var(--text)]">{Math.round(min)} {unit}</p></div>
        <div><p className="section-label mb-0.5">Change</p><p className="gm text-xs font-bold" style={{color:filtered[filtered.length-1]?.val<=filtered[0]?.val?'var(--green)':'var(--red)'}}>{filtered.length>1?Math.round(filtered[filtered.length-1].val-filtered[0].val):0} {unit}</p></div>
        <div><p className="section-label mb-0.5">Entries</p><p className="gm text-xs font-bold text-[var(--text)]">{filtered.length}</p></div>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [loading, setLoading]   = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [prs, setPRs]           = useState<any[]>([])
  const [weights, setWeights]   = useState<any[]>([])
  const [nutrition, setNutrition] = useState<any[]>([])
  const [gpsActivities, setGpsActivities] = useState<any[]>([])
  const [weightRange, setWeightRange] = useState<'7d'|'30d'|'90d'|'1y'|'all'>('30d')
  const [workoutDetail, setWorkoutDetail] = useState<any>(null)
  const [gpsDetail, setGpsDetail] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const since = new Date(); since.setDate(since.getDate()-30)
    Promise.all([
      fetch('/api/workouts/sessions?limit=30').then(r=>r.json()),
      fetch('/api/standards').then(r=>r.json()),
      supabase.from('weight_logs').select('weight_lbs,logged_date').order('logged_date',{ascending:false}).limit(365).then(r=>r.data),
      supabase.from('nutrition_logs').select('calories,protein_g,carbs_g,fat_g,meal_type,log_date').gte('log_date',since.toISOString().split('T')[0]).order('log_date',{ascending:false}).then(r=>r.data),
      supabase.from('gps_activities').select('*').order('created_at',{ascending:false}).limit(30).then(r=>r.data),
    ]).then(([s,st,wt,nut,gps]) => {
      setSessions(s.data||[])
      if (st.success && Array.isArray(st.data?.liftDetails)) setPRs(st.data.liftDetails)
      setWeights(wt||[])
      setNutrition(nut||[])
      setGpsActivities(gps||[])
    }).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  // Aggregate nutrition by day
  const calByDay = Object.entries(
    (nutrition||[]).filter((n:any)=>n.meal_type!=='Hydration').reduce((acc:any,n:any)=>{acc[n.log_date]=(acc[n.log_date]||0)+(n.calories||0);return acc},{})
  ).map(([date,val])=>({date,val:val as number})).sort((a,b)=>b.date.localeCompare(a.date))

  const waterByDay = Object.entries(
    (nutrition||[]).filter((n:any)=>n.meal_type==='Hydration').reduce((acc:any,n:any)=>{acc[n.log_date]=(acc[n.log_date]||0)+1;return acc},{})
  ).map(([date,val])=>({date,val:(val as number)*250})).sort((a,b)=>b.date.localeCompare(a.date))

  const weightData = (weights||[]).map((w:any)=>({date:w.logged_date,val:w.weight_lbs}))

  const totalSets = sessions.reduce((a:number,s:any)=>a+(s.set_count||0),0)

  // Volume per session (sets * approximate effort)
  const volumeByDay = Object.entries(
    sessions.reduce((acc:any,s:any)=>{const d=s.completed_at?.split('T')[0];if(d)acc[d]=(acc[d]||0)+(s.set_count||0);return acc},{})
  ).map(([date,val])=>({date,val:val as number})).sort((a,b)=>b.date.localeCompare(a.date))

  // Streak calendar — last 12 weeks (84 days)
  const workoutDates = new Set(sessions.map((s:any)=>new Date(s.completed_at).toISOString().split('T')[0]))

  // Compute streak
  let currentStreak = 0
  for (let i=0;i<90;i++) {
    const d = new Date(); d.setDate(d.getDate()-i)
    if (workoutDates.has(d.toISOString().split('T')[0])) currentStreak++
    else if (currentStreak > 0) break
  }

  return (
    <div className="px-4 pt-12 pb-8 space-y-4">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Progress</h1>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        {[{l:'Workouts',v:sessions.length,c:'var(--acc)'},{l:'Total sets',v:totalSets,c:'var(--acc)'},{l:'PRs',v:prs.filter((p:any)=>p.lbs>0).length,c:'var(--gold)'},{l:'Streak',v:`${currentStreak}d`,c:'var(--green)'}].map(s=>(
          <div key={s.l} className="gow-card text-center py-3">
            <p className="section-label mb-1">{s.l}</p>
            <p className="gm text-lg font-black" style={{color:s.c}}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Streak calendar */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2"><CalendarDays size={14} color="var(--acc)"/><span className="section-label" style={{color:'var(--acc)'}}>Workout calendar</span></div>
          <span className="gm text-xs text-[var(--acc)]">{[...workoutDates].filter(d=>d.startsWith(new Date().toISOString().slice(0,7))).length} this month</span>
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1">
            {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className="text-[7px] text-[var(--subtext)] font-bold" style={{height:12,lineHeight:'12px'}}>{d}</div>)}
          </div>
          {Array.from({length:12}).map((_,week)=>(
            <div key={week} className="flex-1 flex flex-col gap-1">
              {Array.from({length:7}).map((_,day)=>{
                const daysAgo = (11-week)*7 + (6-day)
                const d = new Date(); d.setDate(d.getDate()-daysAgo)
                const key = d.toISOString().split('T')[0]
                const active = workoutDates.has(key)
                const isToday = daysAgo === 0
                return <div key={day} style={{height:12,borderRadius:2,background:active?'var(--acc)':'rgba(255,255,255,.03)',border:isToday?'1px solid var(--acc)':active?'none':'1px solid rgba(255,255,255,.05)'}}/>
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Weight — line chart + goal */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Scale size={14} color="var(--green)"/><span className="section-label" style={{color:'var(--green)'}}>Body weight</span></div>
          {(()=>{
            const goal = typeof window!=='undefined'?localStorage.getItem('pt_weight_goal'):null
            return goal ? <span className="text-[9px] gm text-[var(--green)]">Goal: {goal} lbs</span> : (
              <button onClick={()=>{const g=prompt('Set weight goal (lbs):');if(g)localStorage.setItem('pt_weight_goal',g)}} className="text-[9px] text-[var(--acc)]">Set goal</button>
            )
          })()}
        </div>
        <LineChart data={weightData} color="var(--green)" unit="lbs" range={weightRange} onRangeChange={setWeightRange}/>
        {(()=>{
          const goal = typeof window!=='undefined'?parseFloat(localStorage.getItem('pt_weight_goal')||'0'):0
          if (!goal || weightData.length < 2) return null
          const current = weightData[0]?.val||0
          const diff = Math.abs(current-goal)
          // Calculate weekly rate from last 4 entries
          const recent = weightData.slice(0,4)
          const weeklyRate = recent.length>=2 ? Math.abs(recent[0].val-recent[recent.length-1].val)/(recent.length-1)*7 : 0
          const weeksToGoal = weeklyRate > 0 ? Math.ceil(diff / weeklyRate) : null
          return (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center">
              <div>
                <p className="text-[9px] text-[var(--subtext)]">To goal</p>
                <p className="gm text-xs font-bold" style={{color:current>goal?'var(--green)':'var(--acc)'}}>{current>goal?'-':'+'}{Math.round(diff)} lbs</p>
              </div>
              <div>
                <p className="text-[9px] text-[var(--subtext)]">Weekly rate</p>
                <p className="gm text-xs font-bold text-[var(--text)]">{weeklyRate.toFixed(1)} lbs/wk</p>
              </div>
              {weeksToGoal && <div>
                <p className="text-[9px] text-[var(--subtext)]">Est. arrival</p>
                <p className="gm text-xs font-bold text-[var(--green)]">~{weeksToGoal} weeks</p>
              </div>}
            </div>
          )
        })()}
      </div>

      {/* Volume */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><TrendingUp size={14} color="var(--acc)"/><span className="section-label" style={{color:'var(--acc)'}}>Training volume</span></div>
        <BarChart data={volumeByDay} color="var(--acc)" unit="sets"/>
        {volumeByDay.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between">
            <div><p className="section-label mb-0.5">Total</p><p className="gm text-xs font-bold text-[var(--acc)]">{totalSets} sets</p></div>
            <div><p className="section-label mb-0.5">Best day</p><p className="gm text-xs font-bold text-[var(--acc)]">{Math.max(...volumeByDay.map(d=>d.val))}</p></div>
            <div><p className="section-label mb-0.5">Avg/wkt</p><p className="gm text-xs font-bold text-[var(--acc)]">{sessions.length?Math.round(totalSets/sessions.length):0}</p></div>
          </div>
        )}
      </div>

      {/* Calories */}
      <div className="card" style={{borderColor:'rgba(139,92,246,.2)'}}>
        <div className="flex items-center gap-2 mb-3"><Flame size={14} color="#8B5CF6"/><span className="section-label" style={{color:'#8B5CF6'}}>Calories</span></div>
        <BarChart data={calByDay} color="#8B5CF6" unit="cal"/>
      </div>

      {/* Water */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><Droplets size={14} color="var(--acc)"/><span className="section-label" style={{color:'var(--acc)'}}>Water intake</span></div>
        <BarChart data={waterByDay} color="var(--acc)" unit="ml"/>
      </div>

      {/* PRs */}
      <div className="card" style={{borderColor:'rgba(245,158,11,.2)'}}>
        <div className="flex items-center gap-2 mb-3"><Trophy size={14} color="var(--gold)"/><span className="section-label" style={{color:'var(--gold)'}}>Personal records</span></div>
        {prs.filter((p:any)=>p.lbs>0).length === 0 ? (
          <p className="text-xs text-[var(--subtext)] text-center py-3">Log a barbell workout to see PRs</p>
        ) : prs.filter((p:any)=>p.lbs>0).map((p:any)=>(
          <div key={p.key} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <span className="font-bold text-sm text-[var(--text)]">{p.label}</span>
            <span className="gm font-black text-[var(--gold)]">{p.lbs} lbs</span>
          </div>
        ))}
      </div>

      {/* Recent workouts with search */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><History size={14} color="var(--subtext)"/><span className="section-label">Workouts ({sessions.length})</span></div>
        </div>
        {sessions.length > 3 && <input placeholder="Search workouts..." className="input-gow text-xs py-1.5 mb-3" onChange={e=>{
          const q = e.target.value.toLowerCase()
          document.querySelectorAll('[data-workout-item]').forEach((el:any)=>{el.style.display=!q||el.dataset.workoutName?.includes(q)?'':'none'})
        }}/>}
        {sessions.length === 0 ? (
          <p className="text-xs text-[var(--subtext)] text-center py-3">No workouts yet</p>
        ) : sessions.slice(0,20).map((s:any)=>(
          <button key={s.id} data-workout-item data-workout-name={(s.name||'workout').toLowerCase()} onClick={()=>setWorkoutDetail(s)} className="w-full text-left flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="font-bold text-xs text-[var(--text)]">{s.name||'Workout'}</p>
              <p className="text-[10px] text-[var(--subtext)]">{new Date(s.completed_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="gm text-xs font-bold text-[var(--acc)]">{s.set_count} sets</p>
              <ChevronRight size={14} color="var(--subtext)"/>
            </div>
          </button>
        ))}
      </div>

      {/* GPS Activities */}
      {gpsActivities.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><MapPin size={14} color="var(--green)"/><span className="section-label" style={{color:'var(--green)'}}>GPS Activities</span></div>
          {gpsActivities.slice(0,10).map((a:any)=>{
            // Mini route SVG
            const routePts = a.route_data || []
            let routeSvg = null
            if (routePts.length > 2) {
              const lats = routePts.map((p:any)=>p.lat), lngs = routePts.map((p:any)=>p.lng)
              const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs)
              const spread = Math.max(maxLat-minLat,maxLng-minLng)||0.001
              const pts = routePts.map((p:any)=>`${((p.lng-minLng)/spread)*90+5},${90-((p.lat-minLat)/spread)*80-5}`).join(' ')
              routeSvg = (
                <svg viewBox="0 0 100 100" className="w-12 h-12 flex-shrink-0" style={{background:'var(--muted)',borderRadius:4}}>
                  <polyline points={pts} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
                </svg>
              )
            }
            const typeIcons: Record<string,string> = {run:'🏃',walk:'🚶',cycle:'🚴',hike:'🥾',swim:'🏊',other:'⚡'}
            return (
              <button key={a.id} onClick={()=>setGpsDetail(a)} className="w-full text-left flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
                {routeSvg || <div className="w-12 h-12 flex items-center justify-center text-xl" style={{background:'var(--muted)',borderRadius:4}}>{typeIcons[a.activity_type]||'🏃'}</div>}
                <div className="flex-1">
                  <p className="font-bold text-xs text-[var(--text)]">{a.title || `${a.activity_type} activity`}</p>
                  <p className="text-[10px] text-[var(--subtext)]">{new Date(a.created_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="gm text-xs font-bold text-[var(--green)]">{(a.distance_km||0).toFixed(2)} km</p>
                    <p className="text-[10px] text-[var(--subtext)] gm">{a.duration_seconds?`${Math.floor(a.duration_seconds/60)}m`:''}</p>
                  </div>
                  <ChevronRight size={14} color="var(--subtext)"/>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Workout detail modal */}
      {workoutDetail && (()=>{
        const w = workoutDetail
        const exs = w.session_exercises || []
        const duration = w.started_at && w.completed_at ? Math.round((new Date(w.completed_at).getTime()-new Date(w.started_at).getTime())/60000) : null
        return (
          <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}} onClick={()=>setWorkoutDetail(null)}>
            <div className="w-full max-h-[85vh] overflow-y-auto" style={{background:'var(--surface)',borderTop:'2px solid var(--acc)'}} onClick={e=>e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-black text-[var(--text)]">{w.name||'Workout'}</h2>
                    <p className="text-xs text-[var(--subtext)] mt-0.5">{new Date(w.completed_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
                  </div>
                  <button onClick={()=>setWorkoutDetail(null)} className="p-1"><X size={20} color="var(--subtext)"/></button>
                </div>

                {/* Quick stats */}
                <div className="flex gap-3 mb-4">
                  {duration && <div className="gow-card py-2 px-3 flex items-center gap-1.5"><Clock size={12} color="var(--acc)"/><span className="gm text-xs font-bold text-[var(--text)]">{duration}m</span></div>}
                  <div className="gow-card py-2 px-3"><span className="gm text-xs font-bold text-[var(--acc)]">{w.set_count} sets</span></div>
                  <div className="gow-card py-2 px-3"><span className="gm text-xs font-bold text-[var(--text)]">{exs.length} exercises</span></div>
                </div>

                {w.notes && <p className="text-xs text-[var(--subtext)] mb-4 italic">{w.notes}</p>}

                {/* Exercise breakdown */}
                {exs.length === 0 ? (
                  <p className="text-xs text-[var(--subtext)] text-center py-4">No exercise data available for this workout</p>
                ) : exs.sort((a:any,b:any)=>(a.order_index||0)-(b.order_index||0)).map((ex:any)=>(
                  <div key={ex.id} className="card mb-3">
                    <p className="font-bold text-sm text-[var(--text)] mb-2">{ex.exercises?.name || 'Exercise'}</p>
                    {ex.exercises?.category && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 mb-2 inline-block" style={{background:'var(--muted)',color:'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{ex.exercises.category}</span>}
                    {/* Set headers */}
                    <div className="grid grid-cols-4 gap-2 mb-1">
                      {['Set','Weight','Reps','RPE'].map(h=><p key={h} className="section-label text-center">{h}</p>)}
                    </div>
                    {(ex.session_sets||[]).sort((a:any,b:any)=>(a.set_number||0)-(b.set_number||0)).map((set:any)=>(
                      <div key={set.id} className="grid grid-cols-4 gap-2 py-1.5 border-b border-[var(--border)] last:border-0 items-center">
                        <p className="text-center gm text-xs text-[var(--subtext)]">{set.set_number}</p>
                        <p className="text-center gm text-xs font-bold text-[var(--text)]">{set.weight_kg ? Math.round(set.weight_kg*2.20462) : '—'} <span className="text-[var(--subtext)] font-normal">lbs</span></p>
                        <p className="text-center gm text-xs font-bold text-[var(--text)]">{set.reps ?? '—'}</p>
                        <div className="text-center">
                          {set.is_pr ? <span className="text-xs font-bold text-[var(--gold)]">PR</span> : <span className="gm text-xs text-[var(--subtext)]">{set.rpe ?? '—'}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* GPS detail modal */}
      {gpsDetail && (()=>{
        const a = gpsDetail
        const routePts = a.route_data || []
        const typeIcons: Record<string,string> = {run:'🏃',walk:'🚶',cycle:'🚴',hike:'🥾',swim:'🏊',other:'⚡'}
        const dur = a.duration_seconds||0
        const fmt = `${Math.floor(dur/3600).toString().padStart(2,'0')}:${Math.floor((dur%3600)/60).toString().padStart(2,'0')}:${(dur%60).toString().padStart(2,'0')}`

        // Full route SVG
        let routeMap = null
        if (routePts.length > 2) {
          const lats = routePts.map((p:any)=>p.lat), lngs = routePts.map((p:any)=>p.lng)
          const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs)
          const spread = Math.max(maxLat-minLat,maxLng-minLng)||0.001
          const pts = routePts.map((p:any)=>`${((p.lng-minLng)/spread)*90+5},${90-((p.lat-minLat)/spread)*80-5}`).join(' ')
          routeMap = (
            <div className="card mb-4" style={{background:'var(--muted)',padding:8}}>
              <svg viewBox="0 0 100 100" style={{width:'100%',height:200}}>
                <polygon points={`0,100 ${pts} 100,100`} fill="var(--green)" opacity="0.06"/>
                <polyline points={pts} fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                <circle cx={parseFloat(pts.split(' ')[0].split(',')[0])} cy={parseFloat(pts.split(' ')[0].split(',')[1])} r="3" fill="var(--green)"/>
                <circle cx={parseFloat(pts.split(' ').pop()!.split(',')[0])} cy={parseFloat(pts.split(' ').pop()!.split(',')[1])} r="3" fill="var(--red)"/>
              </svg>
              <div className="flex justify-between text-[9px] mt-1 px-1">
                <span className="text-[var(--green)] font-bold">Start</span>
                <span className="text-[var(--subtext)]">{routePts.length} GPS points</span>
                <span className="text-[var(--red)] font-bold">Finish</span>
              </div>
            </div>
          )
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}} onClick={()=>setGpsDetail(null)}>
            <div className="w-full max-h-[85vh] overflow-y-auto" style={{background:'var(--surface)',borderTop:'2px solid var(--green)'}} onClick={e=>e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{typeIcons[a.activity_type]||'🏃'}</span>
                      <h2 className="text-xl font-black text-[var(--text)]">{a.title || `${a.activity_type} activity`}</h2>
                    </div>
                    <p className="text-xs text-[var(--subtext)]">{new Date(a.created_at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
                  </div>
                  <button onClick={()=>setGpsDetail(null)} className="p-1"><X size={20} color="var(--subtext)"/></button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="gow-card py-3"><p className="section-label mb-1">Distance</p><p className="gm text-xl font-black text-[var(--green)]">{(a.distance_km||0).toFixed(2)} km</p></div>
                  <div className="gow-card py-3"><p className="section-label mb-1">Duration</p><p className="gm text-xl font-black text-[var(--text)]">{fmt}</p></div>
                  <div className="gow-card py-3"><p className="section-label mb-1">Pace</p><p className="gm text-xl font-black text-[var(--text)]">{(a.pace_per_km||0).toFixed(1)} min/km</p></div>
                  <div className="gow-card py-3"><p className="section-label mb-1">Calories</p><p className="gm text-xl font-black text-[var(--red)]">{a.calories_burned||0}</p></div>
                </div>

                {/* Route map */}
                {routeMap}

                {/* Share */}
                <button onClick={async()=>{
                  const text = `${typeIcons[a.activity_type]||'🏃'} ${a.title||a.activity_type}\n📏 ${(a.distance_km||0).toFixed(2)} km · ⏱ ${fmt}\n\nTracked with PlateTrack`
                  if (navigator.share) await navigator.share({text}).catch(()=>{})
                  else { await navigator.clipboard.writeText(text); alert('Copied!') }
                }} className="btn-ghost text-xs" style={{color:'var(--green)'}}>Share activity</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
