'use client'
// components/rewards/XPToast.tsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'

interface Toast { id: string; amount: number; label: string }
const Ctx = createContext<{ showXP:(amount:number,label?:string)=>void }>({ showXP:()=>{} })
export const useXPToast = () => useContext(Ctx)

export function XPToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const ref = useRef(0)

  const showXP = useCallback((amount: number, label = 'XP earned') => {
    const id = `xp-${++ref.current}`
    setToasts(p=>[...p,{id,amount,label}])
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 2500)
  }, [])

  return (
    <Ctx.Provider value={{ showXP }}>
      {children}
      <div style={{position:'fixed',bottom:70,right:16,zIndex:999,display:'flex',flexDirection:'column-reverse',gap:8,pointerEvents:'none'}}>
        {toasts.map(t=>(
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'rgba(26,29,46,.97)',border:'1px solid rgba(34,197,94,.35)',clipPath:'polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px))',animation:'xpIn .25s cubic-bezier(.34,1.56,.64,1) both'}}>
            <style>{`@keyframes xpIn{from{opacity:0;transform:translateX(40px) scale(.8)}to{opacity:1;transform:none}}`}</style>
            <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#22C55E" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#22C55E" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="#22C55E"/></svg>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:'#22C55E',fontFamily:"'Courier New',monospace",lineHeight:1.2}}>+{t.amount} XP</div>
              <div style={{fontSize:9,color:'#6E7191',textTransform:'uppercase',letterSpacing:'.08em',fontWeight:700}}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
