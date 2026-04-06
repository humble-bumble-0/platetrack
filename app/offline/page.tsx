'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl mb-4">📡</p>
      <h1 className="text-2xl font-black text-[var(--text)] mb-2">You're offline</h1>
      <p className="text-sm text-[var(--subtext)] leading-relaxed max-w-xs">PlateTrack is still working. Your workouts are saved locally and will sync when you're back online.</p>
      <button onClick={()=>window.location.reload()} className="btn-primary mt-6" style={{width:'auto',padding:'10px 24px'}}>Try again</button>
    </div>
  )
}
