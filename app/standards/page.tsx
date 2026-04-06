'use client'
import { useState, useEffect } from 'react'

const LNAMES  = ['Beginner','Novice','Intermediate','Advanced','Elite']
const LCOLORS = ['#6E7191','#22C55E','#3B82F6','#8B5CF6','#F59E0B']

export default function StandardsPage() {
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [targetLevel, setTargetLevel] = useState(2)

  useEffect(()=>{
    fetch('/api/standards').then(r=>r.json()).then(r=>{ if(r.success) setData(r.data) }).finally(()=>setLoading(false))
  },[])

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  const liftDetails = Array.isArray(data?.liftDetails) ? data.liftDetails : []
  const overallLevel = data?.overall ?? 0
  const overallLevelName = LNAMES[overallLevel] || 'Beginner'
  const overallColor = LCOLORS[overallLevel] || '#6E7191'
  const total_lbs = data?.total || 0
  const bw_ratio = data?.bwLbs ? Math.round((total_lbs / data.bwLbs) * 100) / 100 : 0

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Strength Standards</h1>
      <p className="text-sm text-[var(--subtext)] mb-5">How you stack up against global standards</p>

      {/* Overall level */}
      <div className="card mb-4" style={{borderColor:overallColor+'40',background:overallColor+'08'}}>
        <div className="flex justify-between items-center mb-3">
          <div><p className="section-label mb-1">Overall level</p><p className="text-3xl font-black" style={{color:overallColor}}>{overallLevelName||'—'}</p></div>
          <div className="text-right">
            <p className="section-label mb-1">S+B+D</p>
            <p className="text-2xl font-black gm text-[var(--text)]">{total_lbs||0} lbs</p>
            <p className="text-sm gm" style={{color:'var(--acc)'}}>{bw_ratio||0}× BW</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {LNAMES.map((_,i)=><div key={i} className="flex-1 h-2.5 rounded-sm" style={{background:i<=overallLevel?LCOLORS[i]:'rgba(255,255,255,.08)'}}/>)}
        </div>
      </div>

      {/* Target level selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {LNAMES.map((n,i)=>(
          <button key={i} onClick={()=>setTargetLevel(i)} className="text-xs font-bold px-3 py-1.5 whitespace-nowrap" style={{background:targetLevel===i?LCOLORS[i]+'20':'var(--card)',border:`1px solid ${targetLevel===i?LCOLORS[i]:'var(--border)'}`,color:targetLevel===i?LCOLORS[i]:'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
            {n}
          </button>
        ))}
      </div>

      {/* DOTS score */}
      {data?.dots > 0 && (
        <div className="card mb-4">
          <div className="flex justify-between items-center">
            <div><p className="section-label mb-1">DOTS score</p><p className="text-2xl font-black gm text-[var(--acc)]">{data.dots}</p></div>
            <p className="text-xs text-[var(--subtext)] max-w-[50%] text-right">Cross-bodyweight comparison. Higher = stronger relative to size.</p>
          </div>
        </div>
      )}

      {/* Per-lift breakdown */}
      {liftDetails.length === 0 && (
        <div className="card text-center py-8 mb-4">
          <p className="font-bold text-[var(--text)] mb-1">No lift data yet</p>
          <p className="text-xs text-[var(--subtext)]">Complete a workout with squat, bench, deadlift, or OHP to see your strength standards</p>
        </div>
      )}
      <div className="space-y-4">
        {liftDetails.map((lift:any) => {
          const levelColor = LCOLORS[lift.level] || '#6E7191'
          const levelName = LNAMES[lift.level] || 'Beginner'
          const pct = lift.progress || 0
          return (
            <div key={lift.key} className="card">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-[var(--text)] capitalize">{lift.key==='ohp'?'Overhead Press':lift.key.charAt(0).toUpperCase()+lift.key.slice(1)}</p>
                <div className="flex items-center gap-2">
                  {lift.lbs>0 && <span className="gm text-[var(--text)] font-black">{lift.lbs} lbs</span>}
                  <span className="text-xs font-bold px-2 py-0.5" style={{background:levelColor+'20',color:levelColor,clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{levelName}</span>
                </div>
              </div>
              {/* GoW 10-segment bar */}
              <div className="flex gap-1 mb-1.5">
                {Array.from({length:10}).map((_,i)=>{
                  const segPct = (i+1)*10
                  const filled = pct >= segPct
                  // Color each segment based on which level range it falls in
                  const levelForSeg = Math.min(4, Math.floor(i/2))
                  return <div key={i} className="flex-1 h-2.5 rounded-sm" style={{background:filled?LCOLORS[levelForSeg]:'rgba(255,255,255,.08)'}}/>
                })}
              </div>
              <div className="flex justify-between text-[9px] mb-2">
                {LNAMES.map((n,i)=>(
                  <div key={i} className="text-center" style={{color:LCOLORS[i],flex:1}}>
                    {n.slice(0,3)}
                  </div>
                ))}
              </div>
              {lift.lbs>0 && lift.level<4 && (
                <p className="text-xs text-[var(--subtext)]">
                  Target ({LNAMES[targetLevel]}): <span className="font-bold gm" style={{color:LCOLORS[targetLevel]}}>{lift.levelTarget} lbs</span>
                  {lift.lbs < lift.levelTarget && <span className="ml-1 text-[var(--subtext)]">(+{lift.toNext} lbs to go)</span>}
                  {lift.lbs >= lift.levelTarget && <span className="ml-1" style={{color:'var(--green)'}}>✓ Achieved</span>}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Global comparison */}
      {Array.isArray(data?.global_averages) && (
        <div className="card mt-4">
          <p className="section-label mb-3">Global comparison (avg BW multiplier)</p>
          {data.global_averages.map((r:any)=>(
            <div key={r.region} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0" style={{fontWeight:r.bold?800:400}}>
              <span className="text-xs text-[var(--text)]">{r.flag} {r.region}</span>
              <div className="flex gap-3 text-xs gm">
                <span style={{color:'var(--subtext)'}}>{r.squat}×</span>
                <span style={{color:'var(--subtext)'}}>{r.bench}×</span>
                <span style={{color:'var(--subtext)'}}>{r.deadlift}×</span>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 mt-1">
            <span className="text-[8px] text-[var(--subtext)]">SQ</span>
            <span className="text-[8px] text-[var(--subtext)]">BN</span>
            <span className="text-[8px] text-[var(--subtext)]">DL</span>
          </div>
        </div>
      )}
    </div>
  )
}
