'use client'
import { useState, useEffect, useCallback } from 'react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)
  const handleOnline  = useCallback(()=>setOffline(false),[])
  const handleOffline = useCallback(()=>setOffline(true),[])
  useEffect(()=>{
    setOffline(!navigator.onLine)
    window.addEventListener('online',handleOnline); window.addEventListener('offline',handleOffline)
    return ()=>{ window.removeEventListener('online',handleOnline); window.removeEventListener('offline',handleOffline) }
  },[handleOnline,handleOffline])
  if (!offline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-bold text-white" style={{background:'#F59E0B'}}>
      <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/></svg>
      Offline — syncing when reconnected
    </div>
  )
}

export function Spinner() {
  return <div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/>
}

export function PageLoader() {
  return <div className="flex items-center justify-center h-screen"><Spinner/></div>
}
