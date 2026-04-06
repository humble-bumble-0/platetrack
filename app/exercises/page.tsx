'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronRight, X } from 'lucide-react'
import { getCues } from '@/lib/exerciseCues'

const CATS = ['All','Barbell','Dumbbell','Machine','Bodyweight','Cardio','Olympic','Functional']

const MUSCLE_COLORS: Record<string,string> = {
  chest:'#EF4444',back:'#3B82F6',shoulders:'#8B5CF6',arms:'#F59E0B',legs:'#22C55E',
  core:'#EC4899',glutes:'#EC4899',full_body:'#60A5FA',cardio:'#22C55E',
}

function getMuscleColor(m: string) {
  const key = m.toLowerCase().replace(/\s+/g,'_')
  for (const [k,v] of Object.entries(MUSCLE_COLORS)) { if (key.includes(k)) return v }
  return 'var(--subtext)'
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [q,         setQ]         = useState('')
  const [cat,       setCat]       = useState('All')
  const [loading,   setLoading]   = useState(false)
  const [detail,    setDetail]    = useState<any>(null)
  const [prHistory, setPrHistory] = useState<any[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const supabase = createClient()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (q)   params.set('q', q)
      if (cat !== 'All') params.set('category', cat.toLowerCase())
      fetch(`/api/exercises?${params}`).then(r=>r.json()).then(r=>setExercises(r.data||[])).finally(()=>setLoading(false))
    }, q ? 300 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [q, cat])

  const [setHistory, setSetHistory] = useState<any[]>([])

  function openDetail(ex: any) {
    setDetail(ex)
    setPrHistory([])
    setSetHistory([])
    // Load PRs and recent session sets for this exercise
    supabase.from('personal_records').select('value,record_type,created_at').eq('exercise_id',ex.id).then(({data})=>setPrHistory(data||[]))
    supabase.from('session_sets').select('weight_kg,reps,rpe,is_pr,session_exercises!inner(exercise_id,workout_sessions!inner(completed_at))').eq('session_exercises.exercise_id',ex.id).order('id',{ascending:false}).limit(50).then(({data})=>setSetHistory(data||[]))
  }

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Exercises</h1>
      <p className="text-sm text-[var(--subtext)] mb-4">{exercises.length} exercises</p>

      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search exercises…" className="input-gow mb-3 w-full"/>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)} className="whitespace-nowrap text-xs font-bold px-3 py-1.5" style={{background:cat===c?'var(--acc)':'var(--muted)',color:cat===c?'white':'var(--subtext)',border:cat===c?'none':'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-14 bg-[var(--card)] rounded"/>)}</div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12"><p className="font-bold text-[var(--text)]">No exercises found</p><p className="text-xs text-[var(--subtext)] mt-1">Try a different search or category</p></div>
      ) : (
        <div className="space-y-1.5">
          {exercises.map(e=>(
            <button key={e.id} onClick={()=>openDetail(e)} className="w-full text-left card py-3 flex items-center justify-between" style={{marginBottom:0}}>
              <div className="flex-1">
                <p className="font-bold text-sm text-[var(--text)]">{e.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5" style={{background:'var(--muted)',color:'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{e.category}</span>
                  {(e.primary_muscles||[]).slice(0,2).map((m:string)=>(
                    <span key={m} className="text-[9px] font-bold" style={{color:getMuscleColor(m)}}>{m}</span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} color="var(--subtext)"/>
            </button>
          ))}
        </div>
      )}

      {/* Exercise detail slide-up */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}} onClick={()=>setDetail(null)}>
          <div className="w-full max-h-[80vh] overflow-y-auto" style={{background:'var(--surface)',borderTop:'2px solid var(--acc)'}} onClick={e=>e.stopPropagation()}>
            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--text)]">{detail.name}</h2>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 mt-1 inline-block" style={{background:'var(--muted)',color:'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{detail.category}</span>
                </div>
                <button onClick={()=>setDetail(null)} className="p-1"><X size={20} color="var(--subtext)"/></button>
              </div>

              {/* Muscles */}
              <div className="mb-4">
                <p className="section-label mb-2">Primary muscles</p>
                <div className="flex flex-wrap gap-2">
                  {(detail.primary_muscles||[]).map((m:string)=>(
                    <span key={m} className="text-xs font-bold px-2.5 py-1" style={{background:getMuscleColor(m)+'18',color:getMuscleColor(m),clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{m}</span>
                  ))}
                </div>
              </div>
              {(detail.secondary_muscles||[]).length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-2">Secondary muscles</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.secondary_muscles.map((m:string)=>(
                      <span key={m} className="text-xs px-2.5 py-1" style={{background:'var(--muted)',color:'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment & tracking */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="gow-card py-2.5">
                  <p className="section-label mb-1">Equipment</p>
                  <p className="text-sm font-bold text-[var(--text)] capitalize">{detail.equipment||'None'}</p>
                </div>
                <div className="gow-card py-2.5">
                  <p className="section-label mb-1">Tracking</p>
                  <p className="text-sm font-bold text-[var(--text)]">{(detail.tracking_type||'').replace(/_/g,' ')}</p>
                </div>
              </div>

              {/* Form cues */}
              {getCues(detail.slug||'').length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-2">Form cues</p>
                  <div className="space-y-1.5">
                    {getCues(detail.slug).map((c:string,i:number)=>(
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-[9px] font-bold gm" style={{background:'var(--acc)',color:'#fff',borderRadius:2,marginTop:1}}>{i+1}</div>
                        <p className="text-xs text-[var(--text)]">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PR history */}
              <div className="mb-4">
                <p className="section-label mb-2">Your records</p>
                {prHistory.length === 0 ? (
                  <p className="text-xs text-[var(--subtext)]">No records yet — log this exercise in a workout to track PRs</p>
                ) : prHistory.map((h:any,i:number)=>(
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                    <span className="text-xs text-[var(--subtext)] capitalize">{h.record_type.replace(/_/g,' ')}</span>
                    <span className="gm text-sm font-black text-[var(--gold)]">{Math.round(h.value * 2.20462)} lbs</span>
                  </div>
                ))}
              </div>

              {/* Progress chart */}
              {setHistory.length > 0 && (()=>{
                // Group by session date, get max estimated 1RM per session
                const byDate: Record<string,number> = {}
                for (const s of setHistory) {
                  const date = (s as any).session_exercises?.workout_sessions?.completed_at?.split('T')[0]
                  if (!date || !s.weight_kg || !s.reps) continue
                  const e1rm = Math.round(s.weight_kg * 2.20462 * (1 + s.reps / 30))
                  if (!byDate[date] || e1rm > byDate[date]) byDate[date] = e1rm
                }
                const points = Object.entries(byDate).sort(([a],[b])=>a.localeCompare(b)).slice(-20)
                if (points.length < 2) return null
                const vals = points.map(([,v])=>v)
                const min = Math.min(...vals), max = Math.max(...vals), spread = max-min||1
                const svgPts = points.map(([,v],i)=>`${(i/(points.length-1))*100},${140-((v-min)/spread)*120-10}`).join(' ')
                return (
                  <div className="mb-4">
                    <p className="section-label mb-2">Estimated 1RM trend</p>
                    <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{width:'100%',height:100}}>
                      <polygon points={`0,140 ${svgPts} 100,140`} fill="var(--acc)" opacity="0.08"/>
                      <polyline points={svgPts} fill="none" stroke="var(--acc)" strokeWidth="1.5" strokeLinejoin="round"/>
                      <circle cx="100" cy={140-((vals[vals.length-1]-min)/spread)*120-10} r="2" fill="var(--acc)"/>
                    </svg>
                    <div className="flex justify-between text-[8px] text-[var(--subtext)]">
                      <span>{points[0][0]}</span>
                      <span className="font-bold" style={{color:'var(--acc)'}}>Latest: {vals[vals.length-1]} lbs</span>
                    </div>
                  </div>
                )
              })()}

              {/* Recent sets */}
              {setHistory.length > 0 && (
                <div className="mb-4">
                  <p className="section-label mb-2">Recent sets</p>
                  {setHistory.slice(0,8).map((s:any,i:number)=>(
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
                      <span className="text-[10px] text-[var(--subtext)]">{(s as any).session_exercises?.workout_sessions?.completed_at?.split('T')[0]||''}</span>
                      <div className="flex gap-2 gm text-xs">
                        <span className="text-[var(--text)] font-bold">{s.weight_kg?Math.round(s.weight_kg*2.20462):'-'} lbs</span>
                        <span className="text-[var(--subtext)]">x{s.reps||'-'}</span>
                        {s.is_pr && <span className="text-[var(--gold)] font-bold">PR</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Start workout with this exercise */}
              <button onClick={()=>{setDetail(null);window.location.href='/workout/start'}} className="btn-primary">Start workout with {detail.name}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
