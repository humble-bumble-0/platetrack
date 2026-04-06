'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Square, MapPin, Clock, Flame, TrendingUp } from 'lucide-react'

type GeoPoint = { lat: number; lng: number; alt?: number; time: number }

export default function ActivityPage() {
  const [mode, setMode] = useState<'select'|'tracking'|'summary'>('select')
  const [actType, setActType] = useState('run')
  const [tracking, setTracking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [targetDist, setTargetDist] = useState('')
  const [targetTime, setTargetTime] = useState('')
  const [route, setRoute] = useState<GeoPoint[]>([])
  const [pace, setPace] = useState(0)
  const [calories, setCalories] = useState(0)
  const [saving, setSaving] = useState(false)
  const startTime = useRef(0)
  const watchId = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const router = useRouter()

  function fmt(s: number) { return `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }

  function calcDistance(p1: GeoPoint, p2: GeoPoint): number {
    const R = 6371
    const dLat = (p2.lat-p1.lat)*Math.PI/180
    const dLon = (p2.lng-p1.lng)*Math.PI/180
    const a = Math.sin(dLat/2)**2 + Math.cos(p1.lat*Math.PI/180)*Math.cos(p2.lat*Math.PI/180)*Math.sin(dLon/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  function startTracking() {
    if (!navigator.geolocation) { alert('GPS not supported'); return }
    setMode('tracking')
    setTracking(true)
    startTime.current = Date.now()
    timerRef.current = setInterval(()=>setElapsed(Math.floor((Date.now()-startTime.current)/1000)),1000)

    watchId.current = navigator.geolocation.watchPosition(
      (pos)=>{
        const pt: GeoPoint = { lat:pos.coords.latitude, lng:pos.coords.longitude, alt:pos.coords.altitude||undefined, time:Date.now() }
        setRoute(prev=>{
          const next = [...prev, pt]
          if (next.length >= 2) {
            const d = calcDistance(next[next.length-2], pt)
            setDistance(dd=>dd+d)
          }
          return next
        })
      },
      (err)=>console.error('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
  }

  function stopTracking() {
    clearInterval(timerRef.current)
    navigator.geolocation.clearWatch(watchId.current)
    setTracking(false)
    // Calculate final stats
    const km = distance
    const paceVal = elapsed > 0 && km > 0 ? elapsed / 60 / km : 0
    setPace(Math.round(paceVal * 10) / 10)
    // Rough calorie estimate based on MET values
    const mets: Record<string,number> = { run:9.8, walk:3.5, cycle:7.5, hike:6.0, swim:8.0, other:5.0 }
    const met = mets[actType] || 5
    const cal = Math.round(met * 80 * (elapsed/3600)) // assume 80kg
    setCalories(cal)
    setMode('summary')
  }

  async function saveActivity() {
    setSaving(true)
    await fetch('/api/gps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: actType, title: `${actType.charAt(0).toUpperCase()+actType.slice(1)} — ${distance.toFixed(2)} km`,
        distance_km: Math.round(distance*1000)/1000, duration_seconds: elapsed,
        pace_per_km: pace, calories_burned: calories,
        route_data: route.length > 500 ? route.filter((_,i)=>i%Math.ceil(route.length/500)===0) : route, // downsample for storage
        started_at: new Date(startTime.current).toISOString(), completed_at: new Date().toISOString(), is_public: true,
      })
    })
    setSaving(false)
    router.push('/feed')
  }

  const TYPES = [
    { id:'run', label:'Run', icon:'🏃', color:'#22C55E' },
    { id:'walk', label:'Walk', icon:'🚶', color:'#3B82F6' },
    { id:'cycle', label:'Cycle', icon:'🚴', color:'#F59E0B' },
    { id:'hike', label:'Hike', icon:'🥾', color:'#8B5CF6' },
    { id:'swim', label:'Swim', icon:'🏊', color:'#06B6D4' },
    { id:'other', label:'Other', icon:'⚡', color:'#6E7191' },
  ]
  const activeType = TYPES.find(t=>t.id===actType)||TYPES[0]

  // ── Select ──
  if (mode === 'select') return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Track Activity</h1>
      <p className="text-sm text-[var(--subtext)] mb-6">GPS tracking for outdoor activities</p>

      <p className="section-label mb-3">Activity type</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {TYPES.map(t=>(
          <button key={t.id} onClick={()=>setActType(t.id)} className="gow-card py-3 text-center" style={{borderColor:actType===t.id?t.color:'var(--border)',background:actType===t.id?t.color+'12':'var(--card)'}}>
            <p className="text-xl mb-1">{t.icon}</p>
            <p className="text-xs font-bold" style={{color:actType===t.id?t.color:'var(--subtext)'}}>{t.label}</p>
          </button>
        ))}
      </div>

      {/* Distance targets */}
      <p className="section-label mb-2">Distance goal</p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3">
        {(actType==='cycle'?[1,2,5,10,15,20,30,50]:[0.5,1,2,3,5,10,15,20]).map(d=>(
          <button key={d} onClick={()=>setTargetDist(targetDist===String(d)?'':String(d))} className="text-xs font-bold px-2.5 py-1.5 whitespace-nowrap gm" style={{
            background:targetDist===String(d)?activeType.color+'20':'var(--card)',
            color:targetDist===String(d)?activeType.color:'var(--subtext)',
            border:`1px solid ${targetDist===String(d)?activeType.color:'var(--border)'}`,
            clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))',
          }}>{d} km</button>
        ))}
      </div>

      {/* Time targets */}
      <p className="section-label mb-2">Time goal</p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4">
        {[10,15,20,30,45,60,90].map(t=>(
          <button key={t} onClick={()=>setTargetTime(targetTime===String(t)?'':String(t))} className="text-xs font-bold px-2.5 py-1.5 whitespace-nowrap gm" style={{
            background:targetTime===String(t)?activeType.color+'20':'var(--card)',
            color:targetTime===String(t)?activeType.color:'var(--subtext)',
            border:`1px solid ${targetTime===String(t)?activeType.color:'var(--border)'}`,
            clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))',
          }}>{t<60?`${t} min`:`${t/60}h`}</button>
        ))}
      </div>

      <button onClick={startTracking} className="btn-primary flex items-center justify-center gap-2" style={{background:activeType.color}}>
        <Play size={16}/> Start {activeType.label}
      </button>
    </div>
  )

  // ── Tracking ──
  if (mode === 'tracking') return (
    <div className="px-4 pt-12 pb-8 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse"/>
        <span className="text-xs font-bold uppercase tracking-widest" style={{color:activeType.color}}>{activeType.label} in progress</span>
      </div>

      <p className="gm text-6xl font-black text-[var(--text)] mb-6">{fmt(elapsed)}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="gow-card py-4">
          <MapPin size={16} color={activeType.color} className="mx-auto mb-1"/>
          <p className="section-label mb-1">Distance</p>
          <p className="gm text-2xl font-black text-[var(--text)]">{distance.toFixed(2)}</p>
          <p className="text-xs text-[var(--subtext)]">km</p>
        </div>
        <div className="gow-card py-4">
          <Clock size={16} color={activeType.color} className="mx-auto mb-1"/>
          <p className="section-label mb-1">Pace</p>
          <p className="gm text-2xl font-black text-[var(--text)]">{elapsed>0&&distance>0?(elapsed/60/distance).toFixed(1):'--'}</p>
          <p className="text-xs text-[var(--subtext)]">min/km</p>
        </div>
      </div>

      {/* Mini route preview */}
      {route.length > 2 && (()=>{
        const lats = route.map(p=>p.lat), lngs = route.map(p=>p.lng)
        const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs)
        const spread = Math.max(maxLat-minLat,maxLng-minLng)||0.001
        const pts = route.map(p=>`${((p.lng-minLng)/spread)*90+5},${90-((p.lat-minLat)/spread)*80-5}`).join(' ')
        return (
          <div className="card mb-6" style={{background:'var(--muted)'}}>
            <svg viewBox="0 0 100 100" style={{width:'100%',height:120}}>
              <polyline points={pts} fill="none" stroke={activeType.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
              {route.length>0&&<circle cx={parseFloat(pts.split(' ').pop()!.split(',')[0])} cy={parseFloat(pts.split(' ').pop()!.split(',')[1])} r="3" fill={activeType.color}/>}
            </svg>
          </div>
        )
      })()}

      {/* Target progress bars */}
      {(targetDist || targetTime) && (
        <div className="card mb-4">
          {targetDist && (()=>{
            const tgt = parseFloat(targetDist)
            const pct = Math.min(100,Math.round((distance/tgt)*100))
            return (
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-[var(--subtext)]">Distance goal</span>
                  <span className="gm text-xs font-bold" style={{color:pct>=100?'var(--green)':'var(--text)'}}>{distance.toFixed(2)} / {tgt} km</span>
                </div>
                <div className="flex gap-0.5 h-2">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 rounded-sm" style={{background:i<Math.round(pct/10)?'var(--green)':'rgba(255,255,255,.08)'}}/>)}</div>
                {pct>=100 && <p className="text-[9px] text-[var(--green)] font-bold text-center mt-1">Target reached!</p>}
              </div>
            )
          })()}
          {targetTime && (()=>{
            const tgt = parseFloat(targetTime)*60
            const pct = Math.min(100,Math.round((elapsed/tgt)*100))
            return (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-[var(--subtext)]">Time goal</span>
                  <span className="gm text-xs font-bold" style={{color:pct>=100?'var(--green)':'var(--text)'}}>{Math.floor(elapsed/60)} / {targetTime} min</span>
                </div>
                <div className="flex gap-0.5 h-2">{Array.from({length:10}).map((_,i)=><div key={i} className="flex-1 rounded-sm" style={{background:i<Math.round(pct/10)?'var(--acc)':'rgba(255,255,255,.08)'}}/>)}</div>
                {pct>=100 && <p className="text-[9px] text-[var(--green)] font-bold text-center mt-1">Target reached!</p>}
              </div>
            )
          })()}
        </div>
      )}
      <p className="text-xs text-[var(--subtext)] mb-4">{route.length} GPS points</p>

      <button onClick={stopTracking} className="btn-primary flex items-center justify-center gap-2" style={{background:'var(--red)'}}>
        <Square size={16} fill="#fff"/> Stop
      </button>
    </div>
  )

  // ── Summary ──
  return (
    <div className="px-4 pt-12 pb-8 text-center">
      <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{background:activeType.color+'20',clipPath:'polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))'}}>
        <span className="text-2xl">{activeType.icon}</span>
      </div>
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">{activeType.label} Complete</h1>
      <p className="text-sm text-[var(--subtext)] mb-6">{new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="gow-card py-4"><p className="section-label mb-1">Distance</p><p className="gm text-2xl font-black" style={{color:activeType.color}}>{distance.toFixed(2)} km</p></div>
        <div className="gow-card py-4"><p className="section-label mb-1">Duration</p><p className="gm text-2xl font-black text-[var(--text)]">{fmt(elapsed)}</p></div>
        <div className="gow-card py-4"><p className="section-label mb-1">Pace</p><p className="gm text-2xl font-black text-[var(--text)]">{pace} min/km</p></div>
        <div className="gow-card py-4"><p className="section-label mb-1">Calories</p><p className="gm text-2xl font-black text-[var(--red)]">{calories}</p></div>
      </div>

      {/* Route map */}
      {route.length > 2 && (()=>{
        const lats = route.map(p=>p.lat), lngs = route.map(p=>p.lng)
        const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs)
        const spread = Math.max(maxLat-minLat,maxLng-minLng)||0.001
        const pts = route.map(p=>`${((p.lng-minLng)/spread)*90+5},${90-((p.lat-minLat)/spread)*80-5}`).join(' ')
        return (
          <div className="card mb-6" style={{background:'var(--muted)'}}>
            <p className="section-label mb-2">Route</p>
            <svg viewBox="0 0 100 100" style={{width:'100%',height:150}}>
              <polyline points={pts} fill="none" stroke={activeType.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx={parseFloat(pts.split(' ')[0].split(',')[0])} cy={parseFloat(pts.split(' ')[0].split(',')[1])} r="3" fill="var(--green)"/>
              <circle cx={parseFloat(pts.split(' ').pop()!.split(',')[0])} cy={parseFloat(pts.split(' ').pop()!.split(',')[1])} r="3" fill="var(--red)"/>
            </svg>
            <div className="flex justify-between text-[9px] text-[var(--subtext)] mt-1">
              <span className="text-[var(--green)]">Start</span>
              <span className="text-[var(--red)]">Finish</span>
            </div>
          </div>
        )
      })()}

      <div className="flex flex-col gap-2">
        <button onClick={saveActivity} disabled={saving} className="btn-primary" style={{background:activeType.color}}>{saving?'Saving...':'Save & Share'}</button>
        <button onClick={()=>router.push('/dashboard')} className="btn-ghost">Discard</button>
      </div>
    </div>
  )
}
