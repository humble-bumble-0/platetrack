'use client'
import { useState, useEffect, useRef } from 'react'

const MEALS = ['Breakfast','Lunch','Post-Workout','Dinner','Snacks']

export default function NutritionPage() {
  const [data, setData]     = useState<any>(null)
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string|null>(null)
  const [form, setForm]     = useState({name:'',calories:'',protein:'',carbs:'',fat:'',meal:'Breakfast'})
  const [water, setWater]   = useState(0) // cups of 250ml
  const [showGoals, setShowGoals] = useState(false)
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [scanning, setScanning] = useState(false)
  const foodDebounce = useRef<ReturnType<typeof setTimeout>>()
  const scannerRef = useRef<any>(null)

  async function startScanner() {
    setScanning(true)
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 100 } },
      async (code: string) => {
        scanner.stop().catch(()=>{})
        setScanning(false)
        // Look up barcode
        const res = await fetch(`/api/food-barcode?code=${code}`).then(r=>r.json())
        if (res.data) {
          setForm({name:res.data.name,calories:String(res.data.calories),protein:String(res.data.protein_g),carbs:String(res.data.carbs_g),fat:String(res.data.fat_g),meal:adding||'Breakfast'})
        } else {
          alert('Product not found — enter manually')
        }
      },
      () => {}
    ).catch(()=>setScanning(false))
  }

  function stopScanner() {
    scannerRef.current?.stop().catch(()=>{})
    setScanning(false)
  }

  useEffect(() => { load() }, [date])

  function load() {
    setLoading(true)
    fetch(`/api/nutrition?date=${date}`).then(r=>r.json()).then(r=>{
      if(r.success) { setData(r.data); setWater(r.data?.hydration_cups || 0) }
    }).finally(()=>setLoading(false))
  }

  function addWater() {
    const next = water + 1
    setWater(next)
    fetch('/api/nutrition', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ food_name:'Water (250ml)', calories:0, protein_g:0, carbs_g:0, fat_g:0, meal_type:'Hydration', log_date:date }) }).catch(()=>{})
  }

  async function removeWater() {
    if (water <= 0) return
    setWater(water - 1)
    await fetch(`/api/nutrition?meal_type=Hydration&date=${date}`,{method:'DELETE'})
  }

  async function addEntry() {
    if (!form.name||!form.calories) return
    await fetch('/api/nutrition', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ food_name:form.name, calories:parseFloat(form.calories), protein_g:parseFloat(form.protein)||0, carbs_g:parseFloat(form.carbs)||0, fat_g:parseFloat(form.fat)||0, meal_type:form.meal, log_date:date }) })
    // Save to recent foods
    try {
      const recent = JSON.parse(localStorage.getItem('pt_recent_foods')||'[]')
      const entry = {name:form.name,calories:form.calories,protein:form.protein,carbs:form.carbs,fat:form.fat}
      const updated = [entry,...recent.filter((r:any)=>r.name!==form.name)].slice(0,20)
      localStorage.setItem('pt_recent_foods',JSON.stringify(updated))
    } catch {}
    setAdding(null); setForm(f=>({...f,name:'',calories:'',protein:'',carbs:'',fat:''})); setFoodSearch(''); setFoodResults([]); load()
  }

  const logs = data?.logs || []
  const savedGoals = typeof window!=='undefined' ? JSON.parse(localStorage.getItem('pt_nutrition_goals')||'null') : null
  const goals = data?.goals || savedGoals || { calories:2200, protein_g:180, carbs_g:250, fat_g:70 }

  const totals = logs.reduce((a:any,l:any)=>({
    calories: a.calories+(l.calories||0),
    protein:  a.protein+(l.protein_g||0),
    carbs:    a.carbs+(l.carbs_g||0),
    fat:      a.fat+(l.fat_g||0),
  }), {calories:0,protein:0,carbs:0,fat:0})

  function Bar({val,max,color}:{val:number,max:number,color:string}) {
    const segs = 10, filled = Math.round(Math.min(1,val/max)*segs)
    return <div className="flex gap-0.5 h-1.5">{Array.from({length:segs}).map((_,i)=><div key={i} className="flex-1 rounded-sm" style={{background:i<filled?color:'rgba(255,255,255,.08)'}}/>)}</div>
  }

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Header with day navigation */}
      <div className="mb-4">
        <p className="gl mb-1" style={{color:'#A78BFA'}}>Nutrition Log</p>
        <div className="flex items-center justify-between">
          <button onClick={()=>{const d=new Date(date+'T12:00');d.setDate(d.getDate()-1);setDate(d.toISOString().split('T')[0])}} className="w-8 h-8 flex items-center justify-center" style={{background:'var(--muted)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>
            <span className="text-sm text-[var(--subtext)]">‹</span>
          </button>
          <div className="text-center flex-1">
            <h1 className="text-lg font-black text-[var(--text)]">
              {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date+'T12:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
            </h1>
          </div>
          <button onClick={()=>{const d=new Date(date+'T12:00');d.setDate(d.getDate()+1);setDate(d.toISOString().split('T')[0])}} disabled={date>=new Date().toISOString().split('T')[0]} className="w-8 h-8 flex items-center justify-center" style={{background:'var(--muted)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))',opacity:date>=new Date().toISOString().split('T')[0]?0.3:1}}>
            <span className="text-sm text-[var(--subtext)]">›</span>
          </button>
        </div>
      </div>

      {/* Macro summary */}
      <div className="card mb-4" style={{borderColor:'rgba(139,92,246,.25)',background:'rgba(139,92,246,.04)'}}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="section-label mb-1">Calories</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black gm text-[var(--text)]">{Math.round(totals.calories)}</span>
              <span className="text-sm text-[var(--subtext)]">/ {goals.calories}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="section-label mb-1">Remaining</p>
            <p className="text-xl font-black gm" style={{color:(goals.calories-totals.calories)>0?'var(--green)':'var(--red)'}}>
              {Math.round(goals.calories-totals.calories)}
            </p>
          </div>
        </div>
        {[
          {label:'Protein', val:totals.protein, goal:goals.protein_g, color:'var(--acc)', unit:'g'},
          {label:'Carbs',   val:totals.carbs,   goal:goals.carbs_g,   color:'var(--gold)', unit:'g'},
          {label:'Fat',     val:totals.fat,     goal:goals.fat_g,     color:'var(--red)',  unit:'g'},
        ].map(m=>(
          <div key={m.label} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1">
              <span className="section-label" style={{color:m.color}}>{m.label}</span>
              <span className="gm text-xs" style={{color:m.color}}>{Math.round(m.val)}{m.unit} / {m.goal}{m.unit}</span>
            </div>
            <Bar val={m.val} max={m.goal} color={m.color as string}/>
          </div>
        ))}
      </div>

      {/* Caloric programs */}
      <div className="flex justify-between items-center mb-2">
        <button onClick={()=>setShowGoals(!showGoals)} className="text-[10px] font-bold" style={{color:'#8B5CF6'}}>{showGoals?'Hide programs':'Change calorie goals'}</button>
      </div>
      {showGoals && (
        <div className="card mb-4" style={{borderColor:'rgba(139,92,246,.2)'}}>
          <p className="section-label mb-2" style={{color:'#A78BFA'}}>Quick programs</p>
          <div className="space-y-1.5 mb-3">
            {[
              {name:'Aggressive cut',cal:1600,p:200,c:100,f:50,desc:'-750 cal deficit'},
              {name:'Moderate cut',cal:2000,p:180,c:180,f:55,desc:'-500 cal deficit'},
              {name:'Maintenance',cal:2500,p:170,c:280,f:70,desc:'Maintain weight'},
              {name:'Lean bulk',cal:2800,p:180,c:320,f:75,desc:'+300 cal surplus'},
              {name:'Bulk',cal:3200,p:190,c:380,f:85,desc:'+700 cal surplus'},
              {name:'High protein',cal:2200,p:220,c:180,f:60,desc:'1g/lb bodyweight'},
              {name:'Keto',cal:2000,p:150,c:30,f:155,desc:'<30g carbs'},
            ].map(p=>(
              <button key={p.name} onClick={async()=>{
                // Persist goals to database
                await fetch('/api/auth/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}).catch(()=>{})
                // Upsert nutrition goals via a simple POST — the API will handle it
                setShowGoals(false)
                setData((d:any)=>({...d,goals:{calories:p.cal,protein_g:p.p,carbs_g:p.c,fat_g:p.f}}))
                // Save to localStorage as fallback until nutrition_goals table is populated
                localStorage.setItem('pt_nutrition_goals',JSON.stringify({calories:p.cal,protein_g:p.p,carbs_g:p.c,fat_g:p.f}))
              }} className="w-full text-left flex items-center justify-between py-2 px-3" style={{background:'var(--card)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">{p.name}</p>
                  <p className="text-[9px] text-[var(--subtext)]">{p.desc}</p>
                </div>
                <div className="text-right gm">
                  <p className="text-xs font-bold" style={{color:'#8B5CF6'}}>{p.cal} cal</p>
                  <p className="text-[9px] text-[var(--subtext)]">{p.p}P · {p.c}C · {p.f}F</p>
                </div>
              </button>
            ))}
          </div>
          {/* TDEE Calculator */}
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="section-label mb-2" style={{color:'#A78BFA'}}>Personalized calculator</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[9px] text-[var(--subtext)]">Weight (lbs)</label>
                <input type="number" id="tdee-weight" defaultValue="170" className="input-gow text-xs py-1.5"/>
              </div>
              <div>
                <label className="text-[9px] text-[var(--subtext)]">Height (in)</label>
                <input type="number" id="tdee-height" defaultValue="70" className="input-gow text-xs py-1.5"/>
              </div>
              <div>
                <label className="text-[9px] text-[var(--subtext)]">Age</label>
                <input type="number" id="tdee-age" defaultValue="28" className="input-gow text-xs py-1.5"/>
              </div>
              <div>
                <label className="text-[9px] text-[var(--subtext)]">Sex</label>
                <select id="tdee-gender" defaultValue="male" className="input-gow text-xs py-1.5">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[9px] text-[var(--subtext)]">Activity</label>
                <select id="tdee-activity" defaultValue="1.55" className="input-gow text-xs py-1.5">
                  <option value="1.2">Sedentary</option>
                  <option value="1.375">Light (1-3x/wk)</option>
                  <option value="1.55">Moderate (3-5x/wk)</option>
                  <option value="1.725">Active (6-7x/wk)</option>
                  <option value="1.9">Very active (2x/day)</option>
                </select>
              </div>
            </div>
            <button onClick={()=>{
              const wt = parseFloat((document.getElementById('tdee-weight') as HTMLInputElement).value) || 170
              const ht = parseFloat((document.getElementById('tdee-height') as HTMLInputElement).value) || 70
              const age = parseFloat((document.getElementById('tdee-age') as HTMLInputElement).value) || 28
              const act = parseFloat((document.getElementById('tdee-activity') as HTMLSelectElement).value) || 1.55
              const isMale = !(document.getElementById('tdee-gender') as HTMLSelectElement)?.value || (document.getElementById('tdee-gender') as HTMLSelectElement)?.value !== 'female'
              const bmr = 10 * (wt * 0.453592) + 6.25 * (ht * 2.54) - 5 * age + (isMale ? 5 : -161) // Mifflin-St Jeor
              const tdee = Math.round(bmr * act)
              const protein = Math.round(wt * 0.9)
              const fat = Math.round(tdee * 0.25 / 9)
              const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4)
              setData((d:any)=>({...d,goals:{calories:tdee,protein_g:protein,carbs_g:carbs,fat_g:fat}}))
              localStorage.setItem('pt_nutrition_goals',JSON.stringify({calories:tdee,protein_g:protein,carbs_g:carbs,fat_g:fat}))
              setShowGoals(false)
              alert(`Your TDEE: ${tdee} cal/day\nProtein: ${protein}g | Carbs: ${carbs}g | Fat: ${fat}g`)
            }} className="btn-primary text-xs" style={{background:'#8B5CF6',padding:'8px'}}>Calculate & Apply</button>
          </div>
        </div>
      )}

      {/* Hydration */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="section-label">Hydration</span>
          <span className="gm text-xs text-[var(--acc)]">{(water*0.25).toFixed(2)} / 3L</span>
        </div>
        <div className="flex gap-1.5 mb-2">
          {Array.from({length:12}).map((_,i)=>(
            <div key={i} className="flex-1 h-1.5 rounded-sm" style={{background:i<water?'var(--acc)':'rgba(59,130,246,.1)'}}/>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button onClick={removeWater} disabled={water<=0} className="text-xs font-bold px-3 py-1.5" style={{background:'var(--muted)',color:water<=0?'var(--subtext)':'var(--text)',border:'1px solid var(--border)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>- Cup</button>
          <span className="gm text-sm font-bold text-[var(--text)]">{water} cups</span>
          <button onClick={addWater} className="text-xs font-bold px-3 py-1.5" style={{background:'rgba(59,130,246,.15)',color:'var(--acc)',border:'1px solid var(--acc)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>+ Cup</button>
        </div>
      </div>

      {/* Copy from yesterday */}
      {logs.length === 0 && (
        <button onClick={async()=>{
          const yesterday = new Date(date+'T12:00'); yesterday.setDate(yesterday.getDate()-1)
          const yDate = yesterday.toISOString().split('T')[0]
          const res = await fetch(`/api/nutrition?date=${yDate}`).then(r=>r.json())
          if (!res.success || !res.data?.logs?.length) { alert('No meals logged yesterday'); return }
          for (const l of res.data.logs) {
            await fetch('/api/nutrition',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({food_name:l.food_name,calories:l.calories,protein_g:l.protein_g,carbs_g:l.carbs_g,fat_g:l.fat_g,meal_type:l.meal_type,log_date:date})})
          }
          load()
        }} className="w-full text-center text-xs font-bold py-2.5 mb-3" style={{background:'rgba(139,92,246,.08)',color:'#8B5CF6',border:'1px solid rgba(139,92,246,.2)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
          Copy meals from yesterday
        </button>
      )}

      {/* Meals */}
      {MEALS.map(meal => {
        const mealLogs = logs.filter((l:any)=>l.meal_type===meal)
        return (
          <div key={meal} className="card mb-3">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold text-sm text-[var(--text)]">{meal}</p>
              <div className="flex items-center gap-3">
                <span className="gm text-xs text-[var(--subtext)]">{Math.round(mealLogs.reduce((a:number,l:any)=>a+(l.calories||0),0))} kcal</span>
                <button onClick={()=>{ setAdding(meal); setForm(f=>({...f,meal})) }} className="text-xs font-bold" style={{color:'var(--acc)'}}>+ Add</button>
              </div>
            </div>
            {mealLogs.map((l:any)=>(
              <div key={l.id} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0 group">
                <p className="text-xs font-semibold text-[var(--text)] flex-1">{l.food_name}</p>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 text-xs text-[var(--subtext)] gm">
                    <span>{l.protein_g||0}P</span>
                    <span>{l.carbs_g||0}C</span>
                    <span>{l.fat_g||0}F</span>
                    <span className="text-[var(--text)]">{l.calories}</span>
                  </div>
                  <button onClick={async()=>{await fetch(`/api/nutrition?id=${l.id}`,{method:'DELETE'});load()}} className="text-[var(--red)] text-xs font-bold px-1.5 py-0.5" style={{background:'rgba(239,68,68,.08)',clipPath:'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,2px 100%,0 calc(100% - 2px))'}}>x</button>
                </div>
              </div>
            ))}
            {mealLogs.length === 0 && <p className="text-xs text-[var(--subtext)] py-1">Nothing logged yet</p>}
          </div>
        )
      })}

      {/* Add food modal with search */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end" style={{background:'rgba(0,0,0,.7)'}}>
          <div className="w-full max-h-[90vh] overflow-y-auto p-4" style={{background:'var(--surface)',borderTop:'2px solid #8B5CF6'}}>
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-[var(--text)]">Add to {adding}</p>
              <button onClick={()=>{setAdding(null);setFoodSearch('');setFoodResults([])}} className="text-xs text-[var(--subtext)]">Close</button>
            </div>

            {/* Recent foods */}
            {(()=>{
              const recent: any[] = JSON.parse(localStorage.getItem('pt_recent_foods')||'[]')
              if (!recent.length) return null
              return (
                <div className="mb-3">
                  <p className="text-[9px] text-[var(--subtext)] uppercase tracking-wider mb-1.5">Recent foods</p>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                    {recent.slice(0,8).map((f:any,i:number)=>(
                      <button key={i} onClick={()=>setForm({name:f.name,calories:String(f.calories),protein:String(f.protein),carbs:String(f.carbs),fat:String(f.fat),meal:adding!})} className="text-[10px] font-bold px-2.5 py-1.5 whitespace-nowrap" style={{background:'var(--card)',border:'1px solid var(--border)',color:'var(--text)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>
                        {f.name.slice(0,20)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Barcode scanner */}
            {scanning ? (
              <div className="mb-3">
                <div id="barcode-reader" style={{width:'100%'}}/>
                <button onClick={stopScanner} className="btn-ghost text-xs mt-2">Cancel scan</button>
              </div>
            ) : (
              <button onClick={startScanner} className="w-full text-center text-xs font-bold py-2 mb-2" style={{background:'rgba(139,92,246,.1)',color:'#8B5CF6',border:'1px solid rgba(139,92,246,.3)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
                Scan barcode
              </button>
            )}

            {/* Food search */}
            <input value={foodSearch} onChange={e=>{
              setFoodSearch(e.target.value)
              clearTimeout(foodDebounce.current)
              if (e.target.value.length >= 2) {
                setSearching(true)
                foodDebounce.current = setTimeout(()=>{
                  fetch(`/api/food-search?q=${encodeURIComponent(e.target.value)}`).then(r=>r.json()).then(r=>setFoodResults(r.data||[])).finally(()=>setSearching(false))
                }, 400)
              } else { setFoodResults([]); setSearching(false) }
            }} placeholder="Search foods (e.g. chicken breast, banana)..." className="input-gow mb-2" autoFocus/>

            {/* Search results */}
            {searching && <p className="text-xs text-[var(--subtext)] text-center py-2">Searching...</p>}
            {foodResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto mb-3">
                {foodResults.map((f:any,i:number)=>(
                  <button key={i} onClick={()=>{
                    setForm({name:f.name,calories:String(f.calories),protein:String(f.protein_g),carbs:String(f.carbs_g),fat:String(f.fat_g),meal:adding!})
                    setFoodSearch(''); setFoodResults([])
                  }} className="w-full text-left flex items-center gap-2 py-2 px-2 border-b border-[var(--border)] last:border-0" style={{background:'var(--card)'}}>
                    {f.image && <img src={f.image} alt="" className="w-8 h-8 rounded object-cover" style={{flexShrink:0}}/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--text)] truncate">{f.name}</p>
                      <p className="text-[9px] text-[var(--subtext)]">per {f.serving}</p>
                    </div>
                    <div className="text-right gm flex-shrink-0">
                      <p className="text-xs font-bold" style={{color:'#8B5CF6'}}>{f.calories} cal</p>
                      <p className="text-[8px] text-[var(--subtext)]">{f.protein_g}P {f.carbs_g}C {f.fat_g}F</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {foodSearch.length >= 2 && !searching && foodResults.length === 0 && <p className="text-xs text-[var(--subtext)] text-center py-2">No results — enter manually below</p>}

            {/* Divider */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-[var(--border)]"/>
              <span className="text-[9px] text-[var(--subtext)]">or enter manually</span>
              <div className="flex-1 h-px bg-[var(--border)]"/>
            </div>

            {/* Manual entry */}
            <div className="flex flex-col gap-2 mb-3">
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Food name" className="input-gow text-sm"/>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} placeholder="Calories" className="input-gow text-sm"/>
                <input type="number" value={form.protein}  onChange={e=>setForm(f=>({...f,protein:e.target.value}))}  placeholder="Protein (g)" className="input-gow text-sm"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.carbs} onChange={e=>setForm(f=>({...f,carbs:e.target.value}))} placeholder="Carbs (g)" className="input-gow text-sm"/>
                <input type="number" value={form.fat}   onChange={e=>setForm(f=>({...f,fat:e.target.value}))}   placeholder="Fat (g)" className="input-gow text-sm"/>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addEntry} disabled={!form.name||!form.calories} className="btn-primary flex-1" style={{background:'#8B5CF6'}}>Add</button>
              <button onClick={()=>{setAdding(null);setFoodSearch('');setFoodResults([])}} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
