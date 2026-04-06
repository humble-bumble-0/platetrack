'use client'
// components/layout/BottomNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href:'/dashboard',     label:'Home',      d:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', filled:true, center:false, accent:'#3B82F6' },
  { href:'/nutrition',     label:'Nutrition', d:'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3', filled:false, center:false, accent:'#8B5CF6' },
  { href:'/workout/start', label:'Workout',   d:'M0 8h4v8H0M20 8h4v8h-4M5 5h4v14H5M15 5h4v14h-4M9 12h6', filled:false, center:true, accent:'#3B82F6' },
  { href:'/progress',      label:'Progress',  d:'M18 20V10M12 20V4M6 20v-6', filled:false, center:false, accent:'#22C55E' },
  { href:'/profile',       label:'Profile',   d:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z', filled:false, center:false, accent:'#F59E0B' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around pb-safe" style={{height:60,background:'rgba(13,15,28,.98)',borderTop:'1px solid rgba(59,130,246,.15)'}}>
      {TABS.map(t => {
        const active = pathname===t.href||pathname.startsWith(t.href+'/')
        const color  = active ? (t.accent||'#3B82F6') : '#6E7191'
        if (t.center) {
          return (
            <Link key={t.href} href={t.href} className="flex flex-col items-center justify-center" style={{width:52,height:52,marginTop:-18,background:'var(--acc)',clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',textDecoration:'none'}}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={t.d}/></svg>
              <span style={{fontSize:7,fontWeight:800,color:'#fff',textTransform:'uppercase',letterSpacing:'.06em',marginTop:1}}>Workout</span>
            </Link>
          )
        }
        return (
          <Link key={t.href} href={t.href} className="flex flex-col items-center gap-0.5" style={{color,textDecoration:'none',minWidth:48}}>
            <svg width="18" height="18" fill={active&&t.filled?color:'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={t.d}/></svg>
            <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em'}}>{t.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
