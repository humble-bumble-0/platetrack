'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = ['goal','gender','units','height','weight','notifications']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<any>({ goal:'strength', gender:null, units:'imperial', height_ft:'5', height_in:'10', weight:'185', notifications:true })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function set(k: string, v: any) { setState((p:any)=>({...p,[k]:v})) }
  function next() { if (step < STEPS.length-1) setStep(s=>s+1); else finish() }
  function back() { if (step > 0) setStep(s=>s-1) }

  async function finish() {
    setLoading(true)
    const heightCm = state.units === 'imperial'
      ? ((parseInt(state.height_ft||'5')*12 + parseInt(state.height_in||'10')) * 2.54)
      : parseFloat(state.height_cm || '178')
    const weightKg = state.units === 'imperial' ? parseFloat(state.weight||'185') * 0.453592 : parseFloat(state.weight||'84')
    await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_preference: state.units, fitness_goal: state.goal, gender: state.gender, height_cm: Math.round(heightCm*10)/10, weight_kg: Math.round(weightKg*100)/100, onboarding_complete: true })
    })
    setLoading(false)
    router.push('/dashboard')
  }

  const btn = (label: string, onClick: ()=>void, variant = 'primary') => (
    <button onClick={onClick} className={variant==='primary'?'btn-primary':'btn-ghost'} style={{marginBottom:8}}>{label}</button>
  )

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-8">
      {/* Progress */}
      <div className="flex gap-1.5 mb-10">
        {STEPS.map((_,i)=><div key={i} className="flex-1 h-1 rounded-full" style={{background:i<=step?'var(--acc)':'rgba(59,130,246,.15)'}}/>)}
      </div>

      {step === 0 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">What's your main goal?</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">We'll personalise your experience</p>
        {[['strength','Get stronger 💪'],['muscle','Build muscle 🏋️'],['endurance','Improve endurance 🏃'],['general','General fitness ⚡']].map(([v,l])=>(
          <button key={v} onClick={()=>set('goal',v)} className="w-full text-left p-4 mb-3 font-bold text-sm" style={{background:state.goal===v?'rgba(59,130,246,.12)':'var(--card)',border:`1px solid ${state.goal===v?'var(--acc)':'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',color:state.goal===v?'var(--acc)':'var(--text)'}}>
            {l}
          </button>
        ))}
      </div>}

      {step === 1 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">Your sex</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">Used for strength standards</p>
        {[['male','Male'],['female','Female'],['other','Prefer not to say']].map(([v,l])=>(
          <button key={v} onClick={()=>set('gender',v)} className="w-full text-left p-4 mb-3 font-bold text-sm" style={{background:state.gender===v?'rgba(59,130,246,.12)':'var(--card)',border:`1px solid ${state.gender===v?'var(--acc)':'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',color:state.gender===v?'var(--acc)':'var(--text)'}}>
            {l}
          </button>
        ))}
      </div>}

      {step === 2 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">Units</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">Weight and distance units</p>
        {[['imperial','Imperial (lbs, ft)'],['metric','Metric (kg, cm)']].map(([v,l])=>(
          <button key={v} onClick={()=>set('units',v)} className="w-full text-left p-4 mb-3 font-bold text-sm" style={{background:state.units===v?'rgba(59,130,246,.12)':'var(--card)',border:`1px solid ${state.units===v?'var(--acc)':'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',color:state.units===v?'var(--acc)':'var(--text)'}}>
            {l}
          </button>
        ))}
      </div>}

      {step === 3 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">Your height</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">Used for BMI calculations</p>
        {state.units === 'imperial' ? (
          <div className="flex gap-3">
            <div className="flex-1"><p className="section-label mb-2">Feet</p><input type="number" value={state.height_ft} onChange={e=>set('height_ft',e.target.value)} className="input-gow text-center text-2xl gm" placeholder="5"/></div>
            <div className="flex-1"><p className="section-label mb-2">Inches</p><input type="number" value={state.height_in} onChange={e=>set('height_in',e.target.value)} className="input-gow text-center text-2xl gm" placeholder="10"/></div>
          </div>
        ) : (
          <div><p className="section-label mb-2">Centimetres</p><input type="number" value={state.height_cm} onChange={e=>set('height_cm',e.target.value)} className="input-gow text-center text-2xl gm" placeholder="178"/></div>
        )}
      </div>}

      {step === 4 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">Your weight</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">Used for strength ratios and BMI</p>
        <p className="section-label mb-2">{state.units === 'imperial' ? 'Pounds (lbs)' : 'Kilograms (kg)'}</p>
        <input type="number" value={state.weight} onChange={e=>set('weight',e.target.value)} className="input-gow text-center text-4xl gm" placeholder={state.units==='imperial'?'185':'84'}/>
      </div>}

      {step === 5 && <div>
        <h2 className="text-2xl font-black text-[var(--text)] mb-1">Push notifications</h2>
        <p className="text-sm text-[var(--subtext)] mb-8">Workout reminders, PR celebrations, XP alerts</p>
        {[['true','Yes, keep me on track 🔔'],['false','No thanks']].map(([v,l])=>(
          <button key={v} onClick={()=>set('notifications',v==='true')} className="w-full text-left p-4 mb-3 font-bold text-sm" style={{background:String(state.notifications)===v?'rgba(59,130,246,.12)':'var(--card)',border:`1px solid ${String(state.notifications)===v?'var(--acc)':'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',color:String(state.notifications)===v?'var(--acc)':'var(--text)'}}>
            {l}
          </button>
        ))}
      </div>}

      {/* Nav */}
      <div className="mt-auto flex flex-col gap-2">
        <button onClick={next} disabled={loading} className="btn-primary">{loading?'Setting up…':step===STEPS.length-1?'Get started':'Continue'}</button>
        {step > 0 && <button onClick={back} className="btn-ghost">Back</button>}
        {step < STEPS.length-1 && <button onClick={finish} className="text-xs text-[var(--subtext)] text-center py-2">Skip for now</button>}
      </div>
    </div>
  )
}
