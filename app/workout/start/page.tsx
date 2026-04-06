'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useXPToast } from '@/components/rewards/XPToast'
import { Dumbbell, BicepsFlexed, Footprints, Flame, MoveVertical, RotateCcw, Star, Layers, Crown, BookOpen, Calendar, ChevronUp } from 'lucide-react'

interface SetRow { id: string; weight: string; reps: string; rpe: string; done: boolean; warmup: boolean }
interface Exercise { id: string; exerciseId: string; name: string; sets: SetRow[]; groupId?: string; groupType?: 'superset'|'dropset'|'circuit' }

function newSet(): SetRow { return { id: Math.random().toString(36).slice(2), weight:'', reps:'', rpe:'', done:false, warmup:false } }
function newExercise(id: string, name: string): Exercise { return { id: Math.random().toString(36).slice(2), exerciseId: id, name, sets: [newSet()] } }

export default function WorkoutPage() {
  const [mode, setMode]           = useState<'select'|'active'>('select')
  const [workoutName, setWorkoutName] = useState('')
  const [savedWorkouts, setSavedWorkouts] = useState<any[]>([])
  const [progLevel, setProgLevel] = useState(0)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [restDuration, setRestDuration] = useState(()=>{try{return parseInt(localStorage.getItem('pt_rest_duration')||'90')}catch{return 90}})
  const [plateCalc, setPlateCalc] = useState<{exId:string,setId:string}|null>(null)
  const [plateCounts, setPlateCounts] = useState<Record<number,number>>({45:0,35:0,25:0,10:0,5:0,2.5:0})
  const [plateBar, setPlateBar]   = useState(45)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [elapsed, setElapsed]     = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [search, setSearch]       = useState('')
  const [exLib, setExLib]         = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [summary, setSummary]     = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const { showXP } = useXPToast()
  const startTime = useRef(0)
  const timerRef  = useRef<ReturnType<typeof setInterval>>()
  const restRef   = useRef<ReturnType<typeof setInterval>>()

  function beginWorkout(name: string) {
    setWorkoutName(name)
    setMode('active')
    startTime.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now()-startTime.current)/1000)), 1000)
  }

  const [prevData, setPrevData] = useState<Record<string,{weight:number,reps:number}[]>>({})
  const [activeTP, setActiveTP] = useState<any>(null)

  useEffect(() => {
    supabase.from('exercises').select('id,name,category').order('name').limit(200).then(({data})=>setExLib(data||[]))
    supabase.from('training_profiles').select('*').eq('is_active',true).maybeSingle().then(({data})=>setActiveTP(data))
    // Load previous workout data for all exercises
    supabase.from('session_sets').select('weight_kg,reps,session_exercises!inner(exercise_id)').order('id',{ascending:false}).limit(500).then(({data})=>{
      const map: Record<string,{weight:number,reps:number}[]> = {}
      for (const s of (data||[])) {
        const exId = (s as any).session_exercises?.exercise_id
        if (!exId || !s.weight_kg) continue
        if (!map[exId]) map[exId] = []
        if (map[exId].length < 5) map[exId].push({weight:Math.round(s.weight_kg*2.20462),reps:s.reps||0})
      }
      setPrevData(map)
    })
    try { const saved = JSON.parse(localStorage.getItem('pt_saved_workouts')||'[]'); setSavedWorkouts(saved) } catch {}
    return () => clearInterval(timerRef.current)
  }, [])

  function fmt(s: number) { return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}` }

  function playTimerAlert() {
    // Vibrate if supported
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
    // Play a beep using Web Audio API
    try {
      const ctx = new AudioContext()
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.value = 0.3
        osc.start(ctx.currentTime + i * 0.3)
        osc.stop(ctx.currentTime + i * 0.3 + 0.15)
      }
    } catch {}
    // Show notification if app is in background
    if (document.hidden && Notification.permission === 'granted') {
      new Notification('Rest Over', { body: 'Time to lift!', icon: '/icons/icon-192.png' })
    }
  }

  function addExercise(ex: any) {
    const prev = prevData[ex.id]
    const exercise = newExercise(ex.id, ex.name)
    // Auto-fill from previous workout
    if (prev && prev.length > 0) {
      exercise.sets = prev.slice(0, 3).map(p => ({
        ...newSet(),
        weight: String(p.weight),
        reps: String(p.reps),
      }))
    }
    setExercises(p=>[...p, exercise])
    setShowSearch(false); setSearch('')
  }

  function addSet(exId: string) {
    setExercises(p=>p.map(e=>e.id===exId?{...e,sets:[...e.sets,newSet()]}:e))
  }

  function updateSet(exId: string, setId: string, field: string, val: any) {
    setExercises(p=>p.map(e=>e.id===exId?{...e,sets:e.sets.map(s=>s.id===setId?{...s,[field]:val}:s)}:e))
  }

  function logSet(exId: string, setId: string) {
    updateSet(exId, setId, 'done', true)
    clearInterval(restRef.current); setRestTimer(restDuration)
    restRef.current = setInterval(() => setRestTimer(t=>{ if(t<=1){clearInterval(restRef.current);playTimerAlert();return 0;} return t-1; }), 1000)
  }

  async function finishWorkout() {
    if (exercises.length === 0) return
    setSaving(true)
    const sets = exercises.flatMap(e => e.sets.filter(s=>s.done).map(s=>({
      exercise_id: e.exerciseId,
      weight_kg: s.weight ? parseFloat(s.weight) * 0.453592 : null,
      reps: s.reps ? parseInt(s.reps) : null,
      rpe: s.rpe ? parseFloat(s.rpe) : null,
    })))
    const res = await fetch('/api/workouts/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sets, name: workoutName || null, notes: workoutNotes || null, training_profile_id: activeTP?.id || null, started_at: new Date(startTime.current).toISOString(), completed_at: new Date().toISOString() })
    })
    const result = await res.json().catch(() => null)
    setSaving(false)
    clearInterval(timerRef.current)
    const totalSets = sets.length
    const totalWeight = sets.reduce((a:number,s:any)=>a+(s.weight_kg?s.weight_kg*2.20462:0),0)
    const xpEarned = result?.data?.xp?.xp_earned || 50
    const isPR = result?.data?.is_pr || false
    const levelUp = result?.data?.xp?.level_up || null
    // Show XP toast
    showXP(xpEarned, 'Workout complete')
    if (levelUp) setTimeout(() => showXP(0, `Level up: ${levelUp}!`), 1500)
    // Show summary screen
    setSummary({ duration: elapsed, totalSets, totalWeight: Math.round(totalWeight), exercises: exercises.length, isPR, xpEarned, levelUp, name: workoutName })
  }

  function saveAsTemplate() {
    const name = prompt('Name this workout template:')
    if (!name) return
    const template = { name, exercises: exercises.map(e=>e.name), code: Math.random().toString(36).slice(2,8).toUpperCase() }
    const updated = [...savedWorkouts, template]
    setSavedWorkouts(updated)
    localStorage.setItem('pt_saved_workouts', JSON.stringify(updated))
    alert(`Saved! Share code: ${template.code}`)
  }

  const filtered = search.trim() ? exLib.filter(e=>e.name.toLowerCase().includes(search.toLowerCase())) : exLib.slice(0,20)

  // ── Selection screen ──
  if (mode === 'select') {
    return (
      <div className="px-4 pt-12 pb-24">
        <h1 className="text-2xl font-black text-[var(--text)] mb-1">Start Workout</h1>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-[var(--subtext)]">Choose how you want to train</p>
          {activeTP && (
            <span className="text-[9px] font-bold px-2 py-0.5" style={{background:activeTP.color+'20',color:activeTP.color,clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{activeTP.name}</span>
          )}
        </div>

        {/* Freestyle */}
        <button onClick={()=>beginWorkout('Freestyle')} className="w-full card mb-3 flex items-center gap-3" style={{borderColor:'rgba(59,130,246,.3)',background:'rgba(59,130,246,.04)'}}>
          <div className="w-10 h-10 flex items-center justify-center" style={{background:'rgba(59,130,246,.15)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
            <Dumbbell size={18} color="var(--acc)" strokeWidth={2.5}/>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-[var(--text)]">Freestyle</p>
            <p className="text-xs text-[var(--subtext)]">Pick exercises as you go</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--acc)]">Start</span>
        </button>

        {/* Quick starts */}
        <p className="section-label mb-2 mt-5">Quick start by muscle group</p>
        {[
          {name:'Chest',desc:'Bench, incline, flys',Icon:Dumbbell,color:'#EF4444',exercises:['Bench Press','Incline Bench Press','Dumbbell Fly','Cable Fly']},
          {name:'Back',desc:'Rows, pulldowns, pull-ups',Icon:ChevronUp,color:'#3B82F6',exercises:['Barbell Row','Lat Pulldown','Pull-Up','Cable Row']},
          {name:'Shoulders',desc:'Press, raises, face pulls',Icon:MoveVertical,color:'#8B5CF6',exercises:['Overhead Press','Lateral Raise','Face Pull','Dumbbell Shoulder Press']},
          {name:'Arms',desc:'Biceps + triceps',Icon:BicepsFlexed,color:'#F59E0B',exercises:['Dumbbell Curl','Hammer Curl','Tricep Pushdown','Dip']},
          {name:'Legs',desc:'Squats, deadlifts, leg press',Icon:Footprints,color:'#22C55E',exercises:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl']},
          {name:'Glutes',desc:'Hip thrusts, lunges, abductors',Icon:Flame,color:'#EC4899',exercises:['Hip Thrust','Dumbbell Lunge','Hip Abductor Machine','Goblet Squat']},
        ].map(t=>(
          <button key={t.name} onClick={()=>{
            beginWorkout(t.name)
            const matched = t.exercises.map(name=>exLib.find(e=>e.name===name)).filter(Boolean)
            if (matched.length) setTimeout(()=>setExercises(matched.map((e:any)=>newExercise(e.id,e.name))),100)
          }} className="w-full text-left card mb-2 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{background:t.color+'18',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
              <t.Icon size={18} color={t.color} strokeWidth={2}/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[var(--text)]">{t.name}</p>
              <p className="text-xs text-[var(--subtext)]">{t.desc}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{color:t.color}}>Start</span>
          </button>
        ))}

        {/* Programs — tabbed by level */}
        {(()=>{
          const levels = [
            {level:'Beginner',color:'#6E7191',LvlIcon:BookOpen,desc:'Compound lifts, simple progression, 3-4 days/week',programs:[
              {name:'Starting Strength',desc:'3x5 compounds, 3 days/week',days:[{day:'Workout A',ex:['Back Squat','Bench Press','Deadlift']},{day:'Workout B',ex:['Back Squat','Overhead Press','Barbell Row']}]},
              {name:'Full Body',desc:'3 days/week, all major muscles',days:[{day:'Day A',ex:['Back Squat','Bench Press','Barbell Row','Dumbbell Curl']},{day:'Day B',ex:['Deadlift','Overhead Press','Lat Pulldown','Dip']},{day:'Day C',ex:['Front Squat','Incline Bench Press','Cable Row','Hammer Curl']}]},
              {name:'Upper / Lower',desc:'4 days/week alternating',days:[{day:'Upper',ex:['Bench Press','Barbell Row','Overhead Press','Dumbbell Curl']},{day:'Lower',ex:['Back Squat','Romanian Deadlift','Leg Press','Calf Raise Machine']}]},
            ]},
            {level:'Intermediate',color:'#3B82F6',LvlIcon:Layers,desc:'More volume, targeted splits, 4-5 days/week',programs:[
              {name:'Push / Pull / Legs',desc:'3-day classic PPL rotation',days:[{day:'Push',ex:['Bench Press','Overhead Press','Dumbbell Fly','Tricep Pushdown','Lateral Raise']},{day:'Pull',ex:['Barbell Row','Lat Pulldown','Dumbbell Curl','Face Pull','Hammer Curl']},{day:'Legs',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raise Machine']}]},
              {name:'Upper / Lower',desc:'4-day upper and lower alternating',days:[{day:'Upper A',ex:['Bench Press','Barbell Row','Overhead Press','Dumbbell Curl','Tricep Pushdown']},{day:'Lower A',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raise Machine']},{day:'Upper B',ex:['Incline Bench Press','Pull-Up','Dumbbell Shoulder Press','Hammer Curl','Dip']},{day:'Lower B',ex:['Deadlift','Front Squat','Leg Extension','Hip Thrust','Goblet Squat']}]},
              {name:'Full Body',desc:'3 days, higher intensity',days:[{day:'Day A',ex:['Back Squat','Bench Press','Barbell Row','Lateral Raise','Dumbbell Curl']},{day:'Day B',ex:['Deadlift','Overhead Press','Pull-Up','Cable Fly','Tricep Pushdown']},{day:'Day C',ex:['Front Squat','Incline Bench Press','Cable Row','Face Pull','Hammer Curl']}]},
            ]},
            {level:'Advanced',color:'#F59E0B',LvlIcon:BicepsFlexed,desc:'High volume, targeted isolation, 5-6 days/week',programs:[
              {name:'Bro Split',desc:'5-day, one muscle per day',days:[{day:'Chest',ex:['Bench Press','Incline Bench Press','Dumbbell Fly','Cable Fly']},{day:'Back',ex:['Barbell Row','Lat Pulldown','Cable Row','Pull-Up']},{day:'Shoulders',ex:['Overhead Press','Lateral Raise','Face Pull','Dumbbell Shoulder Press']},{day:'Arms',ex:['Dumbbell Curl','Hammer Curl','Tricep Pushdown','Dip']},{day:'Legs',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl']}]},
              {name:'PPL x2',desc:'6-day PPL, twice/week',days:[{day:'Push',ex:['Bench Press','Overhead Press','Incline Bench Press','Lateral Raise','Tricep Pushdown']},{day:'Pull',ex:['Deadlift','Barbell Row','Lat Pulldown','Face Pull','Dumbbell Curl']},{day:'Legs',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raise Machine']}]},
              {name:'Arnold Split',desc:'6-day chest/back, shoulders/arms, legs',days:[{day:'Chest + Back',ex:['Bench Press','Barbell Row','Incline Bench Press','Lat Pulldown','Cable Fly']},{day:'Shoulders + Arms',ex:['Overhead Press','Lateral Raise','Dumbbell Curl','Tricep Pushdown','Hammer Curl']},{day:'Legs',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raise Machine']}]},
            ]},
            {level:'Elite',color:'#EF4444',LvlIcon:Crown,desc:'Max frequency and volume, 6 days/week',programs:[
              {name:'PPL Heavy',desc:'6-day heavy compounds + accessories',days:[{day:'Push',ex:['Bench Press','Overhead Press','Incline Bench Press','Dumbbell Fly','Lateral Raise','Dip']},{day:'Pull',ex:['Deadlift','Barbell Row','Lat Pulldown','Cable Row','Face Pull','Dumbbell Curl']},{day:'Legs',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Extension','Leg Curl','Calf Raise Machine']}]},
              {name:'Upper / Lower x3',desc:'6-day, 3 upper + 3 lower',days:[{day:'Upper A',ex:['Bench Press','Barbell Row','Overhead Press','Dumbbell Curl','Tricep Pushdown']},{day:'Lower A',ex:['Back Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raise Machine']},{day:'Upper B',ex:['Incline Bench Press','Pull-Up','Lateral Raise','Hammer Curl','Dip']},{day:'Lower B',ex:['Deadlift','Front Squat','Leg Extension','Hip Thrust','Goblet Squat']}]},
              {name:'Powerbuilding',desc:'Strength + hypertrophy',days:[{day:'Squat',ex:['Back Squat','Front Squat','Leg Press','Leg Curl','Goblet Squat']},{day:'Bench',ex:['Bench Press','Incline Bench Press','Dumbbell Fly','Tricep Pushdown','Lateral Raise']},{day:'Deadlift',ex:['Deadlift','Barbell Row','Lat Pulldown','Dumbbell Curl','Face Pull']},{day:'OHP',ex:['Overhead Press','Dumbbell Shoulder Press','Lateral Raise','Dip','Hammer Curl']}]},
            ]},
          ]
          const active = levels[progLevel]
          return <>
            <p className="section-label mb-3 mt-6">Programs</p>
            {/* Level tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
              {levels.map((l,i)=>(
                <button key={l.level} onClick={()=>setProgLevel(i)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap" style={{
                  background: progLevel===i ? l.color+'20' : 'var(--card)',
                  color: progLevel===i ? l.color : 'var(--subtext)',
                  border: `1px solid ${progLevel===i ? l.color : 'var(--border)'}`,
                  clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))',
                }}>
                  <l.LvlIcon size={12} strokeWidth={2.5}/> {l.level}
                </button>
              ))}
            </div>
            {/* Level description */}
            <p className="text-xs text-[var(--subtext)] mb-3">{active.desc}</p>
            {/* Programs for selected level */}
            {active.programs.map(prog=>(
              <div key={prog.name} className="card mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-sm text-[var(--text)]">{prog.name}</p>
                    <p className="text-xs text-[var(--subtext)]">{prog.desc}</p>
                  </div>
                  <span className="text-xs gm text-[var(--subtext)]">{prog.days.length} days</span>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
                  {prog.days.map(d=>(
                    <button key={d.day} onClick={()=>{
                      beginWorkout(`${prog.name} — ${d.day}`)
                      const matched = d.ex.map(name=>exLib.find(e=>e.name===name)).filter(Boolean)
                      if (matched.length) setTimeout(()=>setExercises(matched.map((e:any)=>newExercise(e.id,e.name))),100)
                    }} className="text-xs font-bold px-3 py-2 whitespace-nowrap" style={{background:active.color+'12',color:active.color,border:`1px solid ${active.color}30`,clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
                      {d.day}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-[var(--subtext)] uppercase tracking-wider mb-1">Tap a day above to start, or:</p>
                <button onClick={()=>{
                  beginWorkout(prog.name)
                  const allEx = prog.days.flatMap(d=>d.ex)
                  const unique = [...new Set(allEx)]
                  const matched = unique.map(name=>exLib.find(e=>e.name===name)).filter(Boolean)
                  if (matched.length) setTimeout(()=>setExercises(matched.map((e:any)=>newExercise(e.id,e.name))),100)
                }} className="w-full text-center text-xs font-bold py-2.5 uppercase tracking-widest" style={{background:active.color,color:'#fff',clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
                  Start {prog.name}
                </button>
              </div>
            ))}
          </>
        })()}

        {/* Saved custom workouts */}
        <p className="section-label mb-2 mt-5">Your saved workouts</p>
        {savedWorkouts.length === 0 ? (
          <div className="card mb-3 text-center py-4">
            <p className="text-xs text-[var(--subtext)]">No saved workouts yet. Finish a workout and tap "Save as template" to create one.</p>
          </div>
        ) : savedWorkouts.map((sw:any,i:number)=>(
          <button key={i} onClick={()=>{
            beginWorkout(sw.name)
            const matched = sw.exercises.map((name:string)=>exLib.find(e=>e.name===name)).filter(Boolean)
            if (matched.length) setTimeout(()=>setExercises(matched.map((e:any)=>newExercise(e.id,e.name))),100)
          }} className="w-full text-left card mb-2 flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" style={{background:'rgba(245,158,11,.15)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
              <Star size={18} color="var(--gold)" strokeWidth={2} fill="var(--gold)"/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-[var(--text)]">{sw.name}</p>
              <p className="text-xs text-[var(--subtext)]">{sw.exercises.length} exercises · {sw.exercises.slice(0,3).join(', ')}</p>
            </div>
            <button onClick={(e)=>{e.stopPropagation();const next=[...savedWorkouts];next.splice(i,1);setSavedWorkouts(next);localStorage.setItem('pt_saved_workouts',JSON.stringify(next))}} className="text-xs text-[var(--subtext)]">✕</button>
          </button>
        ))}

        {/* Repeat last */}
        <button onClick={async()=>{
          // Load last workout's exercises
          const res = await fetch('/api/workouts/sessions?limit=1').then(r=>r.json())
          const last = res?.data?.[0]
          beginWorkout(last?.name || 'Repeat')
          if (last?.session_exercises?.length) {
            const exs = last.session_exercises.map((se:any)=>newExercise(se.exercises?.id||se.exercise_id, se.exercises?.name||'Exercise'))
            setTimeout(()=>setExercises(exs),100)
          }
        }} className="w-full text-left card mt-3 flex items-center gap-3" style={{opacity:0.7}}>
          <div className="w-10 h-10 flex items-center justify-center" style={{background:'var(--muted)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
            <RotateCcw size={18} color="var(--subtext)" strokeWidth={2}/>
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text)]">Repeat last workout</p>
            <p className="text-xs text-[var(--subtext)]">Same exercises, empty sets</p>
          </div>
        </button>
      </div>
    )
  }

  // ── Summary screen ──
  if (summary) {
    return (
      <div className="px-4 pt-16 pb-8 flex flex-col items-center text-center min-h-screen">
        <div className="w-16 h-16 flex items-center justify-center mb-4" style={{background:'rgba(34,197,94,.15)',clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))'}}>
          <svg width="32" height="32" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1 className="text-2xl font-black text-[var(--text)] mb-1">Workout Complete</h1>
        <p className="text-sm text-[var(--subtext)] mb-6">{summary.name || 'Great session'}</p>

        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="gow-card py-4"><p className="section-label mb-1">Duration</p><p className="gm text-xl font-black text-[var(--acc)]">{fmt(summary.duration)}</p></div>
          <div className="gow-card py-4"><p className="section-label mb-1">Sets</p><p className="gm text-xl font-black text-[var(--acc)]">{summary.totalSets}</p></div>
          <div className="gow-card py-4"><p className="section-label mb-1">Exercises</p><p className="gm text-xl font-black text-[var(--text)]">{summary.exercises}</p></div>
          <div className="gow-card py-4"><p className="section-label mb-1">Volume</p><p className="gm text-xl font-black text-[var(--text)]">{summary.totalWeight.toLocaleString()} lbs</p></div>
        </div>

        {summary.isPR && (
          <div className="card w-full mb-4 relative overflow-hidden" style={{borderColor:'rgba(245,158,11,.4)',background:'rgba(245,158,11,.06)'}}>
            <p className="text-lg font-black text-[var(--gold)] text-center">New Personal Record</p>
            <p className="text-xs text-[var(--gold)] text-center mt-1 animate-pulse">You crushed it</p>
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({length:20}).map((_,i)=>(
                <div key={i} className="absolute" style={{
                  left:`${Math.random()*100}%`,
                  top:'-10px',
                  width:Math.random()*6+3,height:Math.random()*6+3,
                  background:['#F59E0B','#EF4444','#3B82F6','#22C55E','#8B5CF6'][i%5],
                  borderRadius:Math.random()>0.5?'50%':'0',
                  animation:`confetti ${1.5+Math.random()*2}s ease-out ${Math.random()*0.5}s forwards`,
                }}/>
              ))}
            </div>
            <style>{`@keyframes confetti{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(200px) rotate(${360+Math.random()*360}deg);opacity:0}}`}</style>
          </div>
        )}

        <div className="card w-full mb-6" style={{borderColor:'rgba(34,197,94,.3)',background:'rgba(34,197,94,.06)'}}>
          <div className="flex justify-between items-center">
            <p className="font-bold text-[var(--text)]">XP earned</p>
            <p className="gm text-2xl font-black text-[var(--green)]">+{summary.xpEarned}</p>
          </div>
          {summary.levelUp && <p className="text-sm font-bold text-[var(--acc)] mt-1 text-center">Level up: {summary.levelUp}!</p>}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-3">
            <button onClick={()=>router.push('/dashboard')} className="btn-primary flex-1">Done</button>
            <button onClick={()=>{setSummary(null);setMode('select');setExercises([]);setElapsed(0)}} className="btn-ghost flex-1">New workout</button>
          </div>
          <button onClick={async()=>{
            const text = `💪 ${summary.name||'Workout'} complete!\n⏱ ${fmt(summary.duration)} · ${summary.totalSets} sets · ${summary.totalWeight.toLocaleString()} lbs${summary.isPR?' · 🏆 New PR!':''}\n+${summary.xpEarned} XP earned\n\nTracked with PlateTrack`
            if (navigator.share) {
              await navigator.share({title:'PlateTrack Workout',text}).catch(()=>{})
            } else {
              await navigator.clipboard.writeText(text).catch(()=>{})
              alert('Copied to clipboard!')
            }
          }} className="btn-ghost text-xs" style={{color:'var(--acc)'}}>Share workout</button>
        </div>
      </div>
    )
  }

  // ── Active workout ──
  return (
    <div className="px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="gl mb-0.5">● {workoutName || 'Workout'}</p>
          <h1 className="text-xl font-black text-[var(--text)] gm">{fmt(elapsed)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{
            if(!confirm('Cancel this workout? All progress will be lost.')) return
            clearInterval(timerRef.current); clearInterval(restRef.current)
            setMode('select'); setExercises([]); setElapsed(0); setRestTimer(0)
          }} className="text-[10px] text-[var(--subtext)] px-2 py-2">Cancel</button>
          <button onClick={()=>{
            const logged = exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0)
            if (logged===0) { alert('Log at least one set before finishing'); return }
            if (!confirm(`Finish workout? ${logged} sets logged.`)) return
            finishWorkout()
          }} disabled={saving||exercises.length===0} className="text-xs font-bold px-4 py-2 text-[var(--red)]" style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
            {saving ? 'Saving…' : 'Finish'}
          </button>
        </div>
      </div>

      {/* Notes + rest config */}
      <div className="flex gap-2 mb-4">
        <input value={workoutNotes} onChange={e=>setWorkoutNotes(e.target.value)} placeholder="Workout notes…" className="input-gow flex-1 text-xs py-2"/>
        <div className="flex items-center gap-1 px-2" style={{background:'var(--muted)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
          <span className="text-[8px] text-[var(--subtext)] uppercase">Rest</span>
          <select value={restDuration} onChange={e=>{setRestDuration(Number(e.target.value));localStorage.setItem('pt_rest_duration',e.target.value)}} className="bg-transparent text-xs gm text-[var(--gold)] font-bold outline-none border-none" style={{WebkitAppearance:'none',width:32}}>
            {[30,45,60,90,120,180,300].map(s=><option key={s} value={s}>{s}s</option>)}
          </select>
        </div>
      </div>

      {/* Rest timer */}
      {restTimer > 0 && (
        <div className="mb-4 p-3 flex items-center justify-between" style={{background:'rgba(245,158,11,.07)',border:'1px solid rgba(245,158,11,.2)',clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))'}}>
          <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest">Rest</span>
          <span className="gm text-xl text-[var(--gold)]">{fmt(restTimer)}</span>
          <button onClick={()=>{clearInterval(restRef.current);setRestTimer(0)}} className="text-xs text-[var(--subtext)]">Skip</button>
        </div>
      )}

      {/* Exercise list */}
      {exercises.map(ex => {
        const prev = prevData[ex.exerciseId]
        const doneSets = ex.sets.filter(s=>s.done && s.weight && s.reps)
        const est1rm = doneSets.length > 0 ? Math.round(Math.max(...doneSets.map(s=>parseFloat(s.weight)*(1+parseInt(s.reps)/30)))) : null
        return (
        <div key={ex.id} className="card mb-4" style={ex.groupId?{borderLeft:`3px solid var(--gold)`,marginBottom:ex.groupType?4:16}:{}}>
          <div className="flex justify-between items-center mb-1">
            <p className="font-bold text-[var(--text)]">{ex.name}</p>
            <div className="flex items-center gap-2">
              <button onClick={()=>{
                // Link this exercise with the next one as a superset
                const idx = exercises.findIndex(e=>e.id===ex.id)
                const nextEx = exercises[idx+1]
                if (!nextEx) return
                const gid = ex.groupId || Math.random().toString(36).slice(2,6)
                setExercises(p=>p.map((e,i)=>{
                  if (i===idx) return {...e,groupId:gid,groupType:'superset'}
                  if (i===idx+1) return {...e,groupId:gid,groupType:'superset'}
                  return e
                }))
              }} className="text-[10px] text-[var(--gold)]">{ex.groupId?ex.groupType?.toUpperCase():'Link'}</button>
              <button onClick={()=>{const idx=exercises.findIndex(e=>e.id===ex.id);if(idx>0)setExercises(p=>{const n=[...p];[n[idx-1],n[idx]]=[n[idx],n[idx-1]];return n})}} className="text-[10px] text-[var(--subtext)]">↑</button>
              <button onClick={()=>{const idx=exercises.findIndex(e=>e.id===ex.id);if(idx<exercises.length-1)setExercises(p=>{const n=[...p];[n[idx],n[idx+1]]=[n[idx+1],n[idx]];return n})}} className="text-[10px] text-[var(--subtext)]">↓</button>
              <button onClick={()=>{
                const alt = exLib.filter(e=>e.category===exLib.find((x:any)=>x.id===ex.exerciseId)?.category && e.id!==ex.exerciseId)
                if (!alt.length) return
                const pick = alt[Math.floor(Math.random()*alt.length)]
                setExercises(p=>p.map(e=>e.id===ex.id?{...e,exerciseId:pick.id,name:pick.name,sets:e.sets.map(s=>({...s,weight:'',reps:'',done:false}))}:e))
              }} className="text-[10px] text-[var(--acc)]">Swap</button>
              <button onClick={()=>setExercises(p=>p.filter(e=>e.id!==ex.id))} className="text-[10px] text-[var(--subtext)]">Remove</button>
            </div>
          </div>
          {/* Previous data + 1RM + overload suggestion */}
          <div className="flex justify-between items-center mb-2">
            {prev && prev[0] ? (
              <p className="text-[10px] text-[var(--subtext)]">Last: {prev[0].weight} lbs x {prev[0].reps}</p>
            ) : <span/>}
            {est1rm && <p className="text-[10px] gm" style={{color:'var(--gold)'}}>Est 1RM: {est1rm} lbs</p>}
          </div>
          {prev && prev[0] && !doneSets.length && (
            <div className="flex items-center gap-2 mb-3 py-1.5 px-2" style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.15)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
              <span className="text-[10px]">📈</span>
              <p className="text-[10px] text-[var(--green)]">
                Try {prev[0].reps < 12 ? `${prev[0].weight + 5} lbs x ${prev[0].reps}` : `${prev[0].weight} lbs x ${prev[0].reps + 1}`} for progressive overload
              </p>
            </div>
          )}
          {/* Set headers */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {['Set','Weight (lbs)','Reps',''].map(h=><p key={h} className="section-label text-center">{h}</p>)}
          </div>
          {ex.sets.map((set, si) => (
            <div key={set.id} className="grid grid-cols-4 gap-2 mb-2 items-center">
              <button onClick={()=>!set.done&&updateSet(ex.id,set.id,'warmup',!set.warmup)} className="text-center gm text-sm" style={{color:set.warmup?'var(--gold)':'var(--subtext)'}}>{set.warmup?'W':si+1}</button>
              <button onClick={()=>{if(!set.done){setPlateCounts({45:0,35:0,25:0,10:0,5:0,2.5:0});setPlateCalc({exId:ex.id,setId:set.id})}}} disabled={set.done} className="input-gow text-center py-2 text-sm gm" style={{opacity:set.done?.6:1,cursor:set.done?'default':'pointer',color:set.weight?'var(--text)':'var(--subtext)'}}>{set.weight||'lbs'}</button>
              <input type="number" value={set.reps} onChange={e=>updateSet(ex.id,set.id,'reps',e.target.value)} placeholder={prev?.[si]?.reps ? String(prev[si].reps) : 'reps'} disabled={set.done} className="input-gow text-center py-2 text-sm" style={{opacity:set.done?.6:1}}/>
              {set.done
                ? <div className="text-center text-[var(--green)]">✓</div>
                : <button onClick={()=>logSet(ex.id,set.id)} className="text-xs font-bold py-2 text-[var(--acc)]" style={{background:'rgba(59,130,246,.12)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>Log</button>
              }
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={()=>addSet(ex.id)} className="text-xs font-bold text-[var(--acc)]">+ Add set</button>
            <input placeholder="Exercise notes..." className="input-gow text-[10px] py-1 flex-1" style={{background:'transparent',border:'none',borderBottom:'1px solid var(--border)',borderRadius:0,padding:'4px 0'}} onChange={e=>{
              // Store notes on the exercise object (not persisted yet but available for display)
              setExercises(p=>p.map(x=>x.id===ex.id?{...x,notes:e.target.value}:x))
            }}/>
          </div>
        </div>
        )
      })}

      {/* Add exercise */}
      {showSearch ? (
        <div className="card">
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exercises…" className="input-gow mb-3" autoFocus/>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(e=>(
              <button key={e.id} onClick={()=>addExercise(e)} className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[var(--text)] border-b border-[var(--border)] last:border-0">
                {e.name} <span className="text-[var(--subtext)] font-normal text-xs ml-2">{e.category}</span>
              </button>
            ))}
          </div>
          <button onClick={()=>setShowSearch(false)} className="btn-ghost mt-3 text-xs">Cancel</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={()=>setShowSearch(true)} className="btn-ghost flex-1">+ Add exercise</button>
          {exercises.length > 0 && <button onClick={saveAsTemplate} className="btn-ghost" style={{width:'auto',padding:'12px 16px',color:'var(--gold)',borderColor:'rgba(245,158,11,.3)'}}>Save</button>}
        </div>
      )}

      {/* Plate calculator slide-up */}
      {plateCalc && (()=>{
        const PLATES = [{lbs:45,color:'#EF4444'},{lbs:35,color:'#EAB308'},{lbs:25,color:'#22C55E'},{lbs:10,color:'#D1D5DB'},{lbs:5,color:'#3B82F6'},{lbs:2.5,color:'#9CA3AF'}]
        const perSide = PLATES.reduce((a,p)=>a+(plateCounts[p.lbs]||0)*p.lbs,0)
        const total = Math.round((plateBar+perSide*2)*10)/10
        return (
          <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}}>
            <div className="w-full max-h-[85vh] overflow-y-auto" style={{background:'var(--surface)',borderTop:'2px solid var(--acc)'}}>
              <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-[var(--text)]">Load the bar</p>
                  <div className="gm text-2xl font-black" style={{color:'var(--green)'}}>{total} <span className="text-sm">lbs</span></div>
                </div>

                {/* Bar selector */}
                <div className="flex gap-2 mb-3">
                  {[{lbs:45,l:'45 lb'},{lbs:35,l:'35 lb'},{lbs:0,l:'No bar'}].map(b=>(
                    <button key={b.lbs} onClick={()=>setPlateBar(b.lbs)} className="text-xs font-bold px-2.5 py-1.5" style={{background:plateBar===b.lbs?'rgba(59,130,246,.15)':'var(--card)',border:`1px solid ${plateBar===b.lbs?'var(--acc)':'var(--border)'}`,color:plateBar===b.lbs?'var(--acc)':'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{b.l}</button>
                  ))}
                </div>

                {/* Plates grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PLATES.map(p=>{
                    const cnt=plateCounts[p.lbs]||0
                    return (
                      <div key={p.lbs} className="flex items-center justify-between p-2" style={{background:'var(--card)',border:`1px solid ${cnt>0?p.color:'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
                        <div className="flex items-center gap-1.5">
                          <div style={{width:10,height:10,borderRadius:2,background:p.color}}/>
                          <span className="text-xs font-bold gm" style={{color:cnt>0?p.color:'var(--subtext)'}}>{p.lbs}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>setPlateCounts(c=>({...c,[p.lbs]:Math.max(0,c[p.lbs]-1)}))} className="w-6 h-6 flex items-center justify-center text-sm font-bold" style={{background:'var(--muted)',color:cnt?'var(--text)':'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>-</button>
                          <span className="gm text-sm font-bold min-w-[16px] text-center" style={{color:cnt>0?p.color:'var(--subtext)'}}>{cnt}</span>
                          <button onClick={()=>setPlateCounts(c=>({...c,[p.lbs]:c[p.lbs]+1}))} className="w-6 h-6 flex items-center justify-center text-sm font-bold text-white" style={{background:p.color,clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Breakdown */}
                {perSide > 0 && <p className="text-xs text-[var(--subtext)] mb-3 text-center">{plateBar > 0 ? `${plateBar} lb bar + ` : ''}{perSide} lbs x 2 sides</p>}

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={()=>{
                    if(plateCalc) updateSet(plateCalc.exId,plateCalc.setId,'weight',String(total))
                    setPlateCalc(null)
                  }} className="btn-primary flex-1" style={{background:'var(--green)'}}>Use {total} lbs</button>
                  <button onClick={()=>setPlateCalc(null)} className="btn-ghost" style={{width:'auto',padding:'12px 20px'}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
