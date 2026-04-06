'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  { href:'/dashboard',      label:'Home',          icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', filled:true },
  { href:'/workout/start',  label:'Workout',       icon:'M0 8h4v8H0M20 8h4v8h-4M5 5h4v14H5M15 5h4v14h-4M9 12h6', filled:false },
  { href:'/exercises',      label:'Exercises',     icon:'M3 3h7v7H3M14 3h7v7h-7M3 14h7v7H3M14 14h7v7h-7', filled:false },
  { href:'/standards',      label:'Standards',     icon:'M22 12h-4l-3 9L9 3l-3 9H2', filled:false },
  { href:'/progress',       label:'Progress',      icon:'M18 20V10M12 20V4M6 20v-6', filled:false },
  { href:'/bmi',            label:'BMI & Body',    icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', filled:false },
  { href:'/nutrition',      label:'Nutrition',     icon:'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3', accent:'#8B5CF6', filled:false },
  { href:'/activity',       label:'Track Activity', icon:'M22 12h-4l-3 9L9 3l-3 9H2', accent:'#22C55E', filled:false },
  { href:'/feed',            label:'Activity Feed', icon:'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z', filled:false },
  { href:'/friends',        label:'Friends',       icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', filled:false },
  { href:'/challenges',     label:'Challenges',    icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', filled:false },
  { href:'/rewards',        label:'Rewards & XP',  icon:'M12 8a6 6 0 100 8 6 6 0 000-8zM15.477 12.89L17 22l-5-3-5 3 1.523-9.11', accent:'#F59E0B', filled:false },
]

export function SideMenu() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const pathname = usePathname()
  const supabase  = createClient()

  useEffect(() => {
    supabase.from('profiles').select('username,plan,total_xp,current_level').single().then(({data})=>{ if(data) setProfile(data) })
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if(e.key==='Escape') setOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const signOut = useCallback(async() => {
    await supabase.auth.signOut(); window.location.href='/login'
  }, [supabase])

  return (
    <>
      <button onClick={()=>setOpen(true)} aria-label="Menu" className="fixed top-4 right-4 z-40 p-2.5 flex flex-col gap-1.5" style={{background:'rgba(26,29,46,.9)',border:'1px solid rgba(59,130,246,.2)',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>
        <span style={{width:16,height:1.5,background:'#3B82F6',display:'block'}}/>
        <span style={{width:11,height:1.5,background:'#3B82F6',display:'block'}}/>
        <span style={{width:16,height:1.5,background:'#3B82F6',display:'block'}}/>
      </button>

      {open && <div className="fixed inset-0 z-50 bg-black/70" onClick={()=>setOpen(false)}/>}

      <aside className="fixed top-0 left-0 bottom-0 z-50 flex flex-col" style={{width:230,background:'#0E1018',borderRight:'1px solid rgba(59,130,246,.25)',transform:open?'translateX(0)':'translateX(-100%)',transition:'transform .25s cubic-bezier(.4,0,.2,1)'}}>
        <div style={{padding:'28px 14px 12px',borderBottom:'1px solid rgba(59,130,246,.15)',display:'flex',alignItems:'center',gap:9}}>
          <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#3B82F6" strokeWidth="2.5"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#3B82F6" strokeWidth="1.5"/><circle cx="12" cy="12" r="2" fill="#3B82F6"/></svg>
          <span style={{fontSize:14,fontWeight:800,color:'#60A5FA',letterSpacing:'.06em',textTransform:'uppercase'}}>PlateTrack</span>
        </div>

        <nav style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
          {NAV.map(item => {
            const active = pathname===item.href||pathname.startsWith(item.href+'/')
            const color  = active?(item.accent||'#3B82F6'):(item.accent||'#9AA0BC')
            return (
              <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',borderLeft:`2px solid ${active?color:'transparent'}`,background:active?(item.accent?item.accent+'14':'rgba(59,130,246,.08)'):'transparent',textDecoration:'none',transition:'all .1s'}}>
                {item.icon==='circle'
                  ? <svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.5"/><circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth="1.5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>
                  : <svg width="13" height="13" fill={item.filled?color:'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={item.icon}/></svg>
                }
                <span style={{fontSize:10,fontWeight:active?800:700,color,textTransform:'uppercase',letterSpacing:'.1em'}}>{item.label}</span>
              </Link>
            )
          })}
          <div style={{height:1,background:'rgba(59,130,246,.15)',margin:'6px 14px'}}/>
          <Link href="/settings" style={{display:'flex',alignItems:'center',gap:9,padding:'7px 14px',textDecoration:'none'}}>
            <svg width="13" height="13" fill="none" stroke="#6E7191" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span style={{fontSize:10,fontWeight:600,color:'#6E7191',textTransform:'uppercase',letterSpacing:'.1em'}}>Settings</span>
          </Link>
        </nav>

        {profile && (
          <div style={{padding:'10px 14px',borderTop:'1px solid rgba(59,130,246,.15)'}}>
            <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
              <div style={{width:30,height:30,background:'#3B82F6',clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>
                {profile.username?.[0]?.toUpperCase()||'U'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:700,color:'#F0F0F5',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile.username}</div>
                <div style={{fontSize:9,color:'#6E7191',marginTop:1}}>
                  {profile.current_level} · {(profile.total_xp||0).toLocaleString()} XP
                  {profile.plan==='pro'&&<span style={{marginLeft:5,background:'rgba(245,158,11,.2)',color:'#F59E0B',padding:'1px 5px',borderRadius:10,fontSize:7,fontWeight:700}}>PRO</span>}
                </div>
              </div>
            </div>
            <button onClick={signOut} style={{width:'100%',background:'transparent',border:'1px solid rgba(239,68,68,.2)',color:'#F87171',fontSize:9,fontWeight:700,padding:6,cursor:'pointer',textTransform:'uppercase',letterSpacing:'.08em',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
