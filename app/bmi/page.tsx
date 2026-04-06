'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function BMIPage() {
  const [weight, setWeight] = useState<number|null>(null)
  const [height, setHeight] = useState<number|null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [newWt, setNewWt]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [bodyComp, setBodyComp] = useState<any[]>([])
  const [compForm, setCompForm] = useState({body_fat:'',waist:'',hip:'',chest:'',neck:''})
  const [showComp, setShowComp] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    Promise.all([
      fetch('/api/weight').then(r=>r.json()),
      fetch('/api/auth/profile').then(r=>r.json()),
      fetch('/api/body-composition').then(r=>r.json()),
    ]).then(([w,p,bc]) => {
      if (w.success) { setHistory(w.data||[]); if(w.data?.[0]) setWeight(w.data[0].weight_lbs) }
      if (p.success && p.data.height_cm) setHeight(p.data.height_cm)
      if (bc.success) setBodyComp(bc.data||[])
    }).finally(()=>setLoading(false))
  }, [])

  async function logWeight() {
    if (!newWt) return
    setSaving(true)
    await fetch('/api/weight',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({weight_lbs:parseFloat(newWt)})})
    const r = await fetch('/api/weight').then(r=>r.json())
    if (r.success) { setHistory(r.data||[]); if(r.data?.[0]) setWeight(r.data[0].weight_lbs) }
    setNewWt(''); setSaving(false)
  }

  const heightIn = height ? height / 2.54 : null
  const bmi = weight && heightIn ? Math.round((weight * 703) / (heightIn * heightIn) * 10) / 10 : null
  const bmiCategory = !bmi ? '—' : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy weight' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmiColor    = !bmi ? 'var(--subtext)' : bmi < 18.5 ? '#3B82F6' : bmi < 25 ? '#22C55E' : bmi < 30 ? '#F59E0B' : '#EF4444'
  const bmiPct      = bmi  ? Math.min(95, Math.max(5, ((bmi - 10) / 30) * 100)) : 50

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">BMI & Body</h1>
      <p className="text-sm text-[var(--subtext)] mb-4">Weight tracking and population comparison</p>

      {/* BMI gauge */}
      <div className="card mb-4">
        <p className="section-label mb-3">Body Mass Index</p>
        {bmi ? (
          <>
            <div className="text-center mb-4">
              <p className="gm text-5xl font-black" style={{color:bmiColor}}>{bmi}</p>
              <p className="font-bold text-sm mt-1" style={{color:bmiColor}}>{bmiCategory}</p>
            </div>
            {/* Gauge bar */}
            <div className="relative h-3 rounded-full overflow-hidden mb-2">
              <div className="absolute inset-0 flex">
                {[{w:20,c:'#3B82F6'},{w:30,c:'#22C55E'},{w:25,c:'#F59E0B'},{w:25,c:'#EF4444'}].map((s,i)=>(
                  <div key={i} style={{width:`${s.w}%`,background:s.c,opacity:.7}}/>
                ))}
              </div>
              <div className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow" style={{left:`${bmiPct}%`,transform:'translateX(-50%)'}}/>
            </div>
            <div className="flex justify-between text-xs text-[var(--subtext)]">
              <span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--subtext)] text-center py-4">Log your weight below to calculate BMI</p>
        )}
      </div>

      {/* Log weight */}
      <div className="card mb-4">
        <p className="section-label mb-3">Log weight</p>
        <div className="flex gap-3">
          <input type="number" value={newWt} onChange={e=>setNewWt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&logWeight()} placeholder="185 lbs" className="input-gow flex-1"/>
          <button onClick={logWeight} disabled={saving||!newWt} className="btn-primary" style={{width:'auto',padding:'0 20px',whiteSpace:'nowrap'}}>{saving?'…':'Log'}</button>
        </div>
      </div>

      {/* History chart */}
      {history.length > 1 && (
        <div className="card mb-4">
          <p className="section-label mb-3">Last 30 days</p>
          <div className="flex items-end gap-1" style={{height:60}}>
            {history.slice(0,30).reverse().map((h:any,i:number)=>{
              const min = Math.min(...history.map((x:any)=>x.weight_lbs))
              const max = Math.max(...history.map((x:any)=>x.weight_lbs))
              const pct = max===min ? 50 : ((h.weight_lbs-min)/(max-min))*80+10
              return <div key={i} className="flex-1 rounded-sm" style={{height:`${pct}%`,background:'var(--acc)',opacity:.7}}/>
            })}
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-[var(--subtext)] gm">{history[history.length-1]?.weight_lbs} lbs</p>
            <p className="text-xs text-[var(--subtext)] gm">{history[0]?.weight_lbs} lbs</p>
          </div>
        </div>
      )}

      {/* Body composition */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <p className="section-label">Body composition</p>
          <button onClick={()=>setShowComp(!showComp)} className="text-xs font-bold" style={{color:'var(--acc)'}}>{showComp?'Cancel':'+ Log'}</button>
        </div>
        {showComp && (
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="number" value={compForm.body_fat} onChange={e=>setCompForm(f=>({...f,body_fat:e.target.value}))} placeholder="Body fat %" className="input-gow text-sm"/>
              <input type="number" value={compForm.waist} onChange={e=>setCompForm(f=>({...f,waist:e.target.value}))} placeholder="Waist (in)" className="input-gow text-sm"/>
              <input type="number" value={compForm.hip} onChange={e=>setCompForm(f=>({...f,hip:e.target.value}))} placeholder="Hip (in)" className="input-gow text-sm"/>
              <input type="number" value={compForm.chest} onChange={e=>setCompForm(f=>({...f,chest:e.target.value}))} placeholder="Chest (in)" className="input-gow text-sm"/>
              <input type="number" value={compForm.neck} onChange={e=>setCompForm(f=>({...f,neck:e.target.value}))} placeholder="Neck (in)" className="input-gow text-sm"/>
            </div>
            <button onClick={async()=>{
              await fetch('/api/body-composition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                body_fat_pct:compForm.body_fat?parseFloat(compForm.body_fat):null,
                waist_cm:compForm.waist?parseFloat(compForm.waist)*2.54:null,
                hip_cm:compForm.hip?parseFloat(compForm.hip)*2.54:null,
                chest_cm:compForm.chest?parseFloat(compForm.chest)*2.54:null,
                neck_cm:compForm.neck?parseFloat(compForm.neck)*2.54:null,
              })})
              setShowComp(false);setCompForm({body_fat:'',waist:'',hip:'',chest:'',neck:''})
              fetch('/api/body-composition').then(r=>r.json()).then(r=>{if(r.success)setBodyComp(r.data||[])})
            }} className="btn-primary" style={{background:'var(--acc)'}}>Save</button>
          </div>
        )}
        {bodyComp.length > 0 ? (
          <div>
            {bodyComp[0]?.body_fat_pct && (
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-[var(--subtext)]">Body fat</span>
                <span className="gm text-lg font-black text-[var(--acc)]">{bodyComp[0].body_fat_pct}%</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[{k:'waist_cm',l:'Waist'},{k:'hip_cm',l:'Hip'},{k:'chest_cm',l:'Chest'},{k:'neck_cm',l:'Neck'}].map(m=>{
                const val = bodyComp[0]?.[m.k]
                return val ? (
                  <div key={m.k} className="flex justify-between text-xs py-1">
                    <span className="text-[var(--subtext)]">{m.l}</span>
                    <span className="gm font-bold text-[var(--text)]">{Math.round(val/2.54*10)/10} in</span>
                  </div>
                ) : null
              })}
            </div>
            {bodyComp.length > 1 && bodyComp[0]?.body_fat_pct && bodyComp[1]?.body_fat_pct && (
              <p className="text-xs mt-2" style={{color:bodyComp[0].body_fat_pct<=bodyComp[1].body_fat_pct?'var(--green)':'var(--red)'}}>
                {bodyComp[0].body_fat_pct<=bodyComp[1].body_fat_pct?'↓':'↑'} {Math.abs(bodyComp[0].body_fat_pct-bodyComp[1].body_fat_pct).toFixed(1)}% from last entry
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--subtext)] text-center py-2">Tap "+ Log" to track body fat and measurements</p>
        )}
      </div>

      {/* Recent entries */}
      <div className="card">
        <p className="section-label mb-3">Recent entries</p>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--subtext)] text-center py-4">No entries yet</p>
        ) : history.slice(0,7).map((h:any,i:number)=>(
          <div key={i} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
            <p className="text-sm text-[var(--subtext)]">{new Date(h.logged_date+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</p>
            <p className="gm font-bold text-[var(--text)]">{h.weight_lbs} lbs</p>
          </div>
        ))}
      </div>
    </div>
  )
}
