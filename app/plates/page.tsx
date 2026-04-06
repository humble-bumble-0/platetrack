'use client'
import { useState, useCallback } from 'react'

const PLATES = [
  {lbs:45,color:'#EF4444'},{lbs:35,color:'#EAB308'},{lbs:25,color:'#22C55E'},
  {lbs:10,color:'#D1D5DB'},{lbs:5,color:'#3B82F6'},{lbs:2.5,color:'#9CA3AF'},
]
const BAR_OPTIONS = [{lbs:45,label:"Men's 45 lb"},{lbs:35,label:"Women's 35 lb"},{lbs:15,label:"EZ Bar 15 lb"},{lbs:0,label:"No bar"}]

function pH(lbs:number){if(lbs>=45)return 46;if(lbs>=35)return 40;if(lbs>=25)return 34;if(lbs>=10)return 23;if(lbs>=5)return 16;return 11}
function pW(lbs:number){if(lbs>=45)return 13;if(lbs>=35)return 11;if(lbs>=25)return 9;if(lbs>=10)return 7;if(lbs>=5)return 5;return 4}

export default function PlatesPage() {
  const [counts, setCounts] = useState<Record<number,number>>({45:0,35:0,25:0,10:0,5:0,2.5:0})
  const [bar, setBar]       = useState(45)

  const add = (lbs:number) => setCounts(p=>({...p,[lbs]:(p[lbs]||0)+1}))
  const rem = (lbs:number) => setCounts(p=>({...p,[lbs]:Math.max(0,(p[lbs]||0)-1)}))
  const clear = () => setCounts({45:0,35:0,25:0,10:0,5:0,2.5:0})

  const plates = PLATES.flatMap(p=>Array(counts[p.lbs]||0).fill(p.lbs))
  const perSide = plates.reduce((a,b)=>a+b,0)
  const total   = Math.round((bar+perSide*2)*10)/10

  // Draw barbell SVG
  const W=460,H=60,CY=30,KX=198,KW=64,GAP=1.5
  const parts:string[]=[]
  parts.push(`<rect x="0" y="${CY-2.5}" width="${W}" height="5" rx="1.5" fill="rgba(175,180,200,.38)"/>`)
  parts.push(`<rect x="14" y="${CY-6}" width="${KX-14}" height="12" rx="2" fill="rgba(150,158,185,.28)"/>`)
  parts.push(`<rect x="${KX+KW}" y="${CY-6}" width="${W-14-(KX+KW)}" height="12" rx="2" fill="rgba(150,158,185,.28)"/>`)
  let lx=KX
  for(const lbs of plates){const pw=pW(lbs),ph=pH(lbs),pc=PLATES.find(x=>x.lbs===lbs)?.color||'#888';lx-=pw;parts.push(`<rect x="${lx.toFixed(1)}" y="${(CY-ph/2).toFixed(1)}" width="${pw}" height="${ph}" rx="1.5" fill="${pc}" opacity=".93"/>`);parts.push(`<ellipse cx="${(lx+pw/2).toFixed(1)}" cy="${CY}" rx="1.3" ry="3" fill="rgba(0,0,0,.38)"/>`);lx-=GAP}
  const lColX=lx-9-1;parts.push(`<rect x="${lColX.toFixed(1)}" y="${CY-12}" width="9" height="24" rx="2.5" fill="rgba(95,105,125,.88)"/>`)
  let rx=KX+KW
  for(const lbs of plates){const pw=pW(lbs),ph=pH(lbs),pc=PLATES.find(x=>x.lbs===lbs)?.color||'#888';parts.push(`<rect x="${rx.toFixed(1)}" y="${(CY-ph/2).toFixed(1)}" width="${pw}" height="${ph}" rx="1.5" fill="${pc}" opacity=".93"/>`);parts.push(`<ellipse cx="${(rx+pw/2).toFixed(1)}" cy="${CY}" rx="1.3" ry="3" fill="rgba(0,0,0,.38)"/>`);rx+=pw+GAP}
  const rColX=rx+1;parts.push(`<rect x="${rColX.toFixed(1)}" y="${CY-12}" width="9" height="24" rx="2.5" fill="rgba(95,105,125,.88)"/>`)
  parts.push(`<rect x="${KX}" y="${CY-10}" width="${KW}" height="20" rx="3" fill="rgba(190,198,220,.82)"/>`)
  for(let i=0;i<9;i++){const kx=KX+6+i*6;parts.push(`<line x1="${kx}" y1="${CY-7}" x2="${kx}" y2="${CY+7}" stroke="rgba(60,70,95,.5)" stroke-width="1.5"/>`)}
  parts.push(`<rect x="0" y="${CY-5}" width="14" height="10" rx="2" fill="rgba(120,128,150,.75)"/>`)
  parts.push(`<rect x="${W-14}" y="${CY-5}" width="14" height="10" rx="2" fill="rgba(120,128,150,.75)"/>`)

  return (
    <div className="px-4 pt-12 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--acc)" strokeWidth="2.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="var(--acc)" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="var(--acc)"/></svg>
          <div><p className="gl">Load the bar</p><h1 className="text-xl font-black text-[var(--text)]">Weight Plates</h1></div>
        </div>
        <button onClick={clear} className="text-xs font-bold px-3 py-1.5 text-[var(--red)]" style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>Clear</button>
      </div>

      {/* Bar selector */}
      <div className="mb-4">
        <p className="section-label mb-2">Bar weight</p>
        <div className="flex gap-2 flex-wrap">
          {BAR_OPTIONS.map(b=><button key={b.lbs} onClick={()=>setBar(b.lbs)} className="text-xs font-bold px-3 py-2" style={{background:bar===b.lbs?'rgba(59,130,246,.15)':'var(--card)',border:`1px solid ${bar===b.lbs?'var(--acc)':'var(--border)'}`,color:bar===b.lbs?'var(--acc)':'var(--subtext)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{b.label}</button>)}
        </div>
      </div>

      {/* Plate toggles */}
      <div className="mb-4">
        <p className="section-label mb-2">Plates per side — tap + to add</p>
        <div className="grid grid-cols-3 gap-3">
          {PLATES.map(p=>{
            const cnt=counts[p.lbs]||0
            return <div key={p.lbs} className="flex flex-col items-center gap-2 p-3" style={{background:'var(--card)',border:`1.5px solid ${cnt>0?p.color:'var(--border)'}`,clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
              <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke={p.color} strokeWidth="3"/><circle cx="16" cy="16" r="7" fill="none" stroke={p.color} strokeWidth="1.5"/><circle cx="16" cy="16" r="3" fill={cnt>0?p.color:'rgba(110,113,145,.3)'}/></svg>
              <span className="text-xs font-black gm" style={{color:cnt>0?p.color:'var(--subtext)'}}>{p.lbs} lb</span>
              <div className="flex items-center gap-2">
                <button onClick={()=>rem(p.lbs)} disabled={cnt===0} className="w-7 h-7 flex items-center justify-center text-lg font-bold" style={{background:'var(--muted)',color:cnt===0?'var(--subtext)':'var(--text)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>−</button>
                <span className="gm text-lg font-bold min-w-[20px] text-center" style={{color:cnt>0?p.color:'var(--subtext)'}}>{cnt}</span>
                <button onClick={()=>add(p.lbs)} className="w-7 h-7 flex items-center justify-center text-lg font-bold text-white" style={{background:p.color,clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>+</button>
              </div>
            </div>
          })}
        </div>
      </div>

      {/* Barbell */}
      <div className="p-4 mb-4" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
        <svg width="100%" height="60" viewBox="0 0 460 60" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{__html:parts.join('')}}/>
      </div>

      {/* Total */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <p className="section-label mb-1">Total on bar</p>
            {plates.length>0 && <p className="text-xs text-[var(--subtext)] mt-0.5">{bar > 0 ? `${bar} lb bar + ` : ''}{perSide} lbs × 2 sides · {plates.length} plate{plates.length!==1?'s':''} per side</p>}
          </div>
          <p className="gm text-3xl font-black" style={{color:total>0?'var(--green)':'var(--subtext)'}}>{total} <span className="text-sm">lbs</span></p>
        </div>
        {plates.length>0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="section-label mb-2">Each plate (per side)</p>
            {plates.map((lbs,i)=>{
              const pd=PLATES.find(x=>x.lbs===lbs)
              return <div key={i} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs gm text-[var(--subtext)]">#{i+1}</span>
                  <svg width="16" height="16" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke={pd?.color||'#888'} strokeWidth="3"/><circle cx="16" cy="16" r="7" fill="none" stroke={pd?.color||'#888'} strokeWidth="1.5"/><circle cx="16" cy="16" r="3" fill={pd?.color||'#888'}/></svg>
                  <span className="text-sm font-bold text-[var(--text)]">{lbs} lb plate</span>
                </div>
                <span className="gm text-sm" style={{color:pd?.color}}>{lbs} lbs</span>
              </div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
