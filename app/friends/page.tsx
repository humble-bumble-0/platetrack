'use client'
import { useState, useEffect } from 'react'

export default function FriendsPage() {
  const [friends,   setFriends]  = useState<any[]>([])
  const [lb,        setLB]       = useState<any[]>([])
  const [username,  setUsername] = useState('')
  const [loading,   setLoading]  = useState(true)
  const [adding,    setAdding]   = useState(false)
  const [tab,       setTab]      = useState<'friends'|'leaderboard'|'activity'>('leaderboard')
  const [feedItems, setFeedItems] = useState<any[]>([])

  const load = () => {
    Promise.all([
      fetch('/api/friends').then(r=>r.json()),
      fetch('/api/friends/leaderboard').then(r=>r.json()),
      fetch('/api/feed?limit=10').then(r=>r.json()).catch(()=>({data:[]})),
    ]).then(([f, l, feed]) => {
      setFriends(f.data||[])
      setLB(l.data||[])
      setFeedItems(feed.data||[])
    }).finally(()=>setLoading(false))
  }
  useEffect(()=>{ load() },[])

  async function addFriend() {
    if (!username.trim()) return
    setAdding(true)
    const r = await fetch('/api/friends',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:username.trim()})})
    const data = await r.json()
    setAdding(false)
    if (data.success) { setUsername(''); load() }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Friends</h1>
      <p className="text-sm text-[var(--subtext)] mb-4">Compare and compete</p>

      {/* Add friend */}
      <div className="card mb-4">
        <p className="section-label mb-3">Add friend by username</p>
        <div className="flex gap-2">
          <input value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addFriend()} placeholder="@username" className="input-gow flex-1"/>
          <button onClick={addFriend} disabled={adding||!username} className="btn-primary" style={{width:'auto',padding:'0 16px'}}>{adding?'…':'Add'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--muted)] p-1 gap-1 mb-4" style={{clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
        {[['leaderboard','Leaderboard'],['activity','Activity'],['friends','Friends']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id as any)} className={`flex-1 py-2 text-xs font-bold ${tab===id?'bg-[var(--card)] text-[var(--text)]':'text-[var(--subtext)]'}`} style={{clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{label}</button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div>
          <p className="text-xs text-[var(--subtext)] mb-3">Weekly XP % — who's gaining the most relative to their level</p>
          {lb.length === 0 ? (
            <div className="card text-center py-8"><p className="text-3xl mb-2">🏆</p><p className="font-bold text-[var(--text)]">Add friends to compete</p></div>
          ) : lb.map((p:any)=>{
            const weekPct = p.total_xp > 0 ? Math.round(((p.xp_this_week||0) / p.total_xp) * 1000) / 10 : 0
            return (
              <div key={p.id} className="card mb-2 flex items-center gap-3" style={p.is_me ? {borderColor:'rgba(59,130,246,.4)',background:'rgba(59,130,246,.04)'} : {}}>
                <div className="w-8 h-8 flex items-center justify-center font-black text-sm gm" style={{background:p.rank<=3?'rgba(245,158,11,.15)':'rgba(59,130,246,.15)',color:p.rank<=3?'var(--gold)':'var(--acc)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{p.rank}</div>
                <div className="w-8 h-8 flex items-center justify-center font-bold text-sm text-white" style={{background:p.is_me?'var(--acc)':'var(--muted)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>{p.username?.[0]?.toUpperCase()||'?'}</div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[var(--text)]">{p.username}{p.is_me ? ' (you)' : ''}</p>
                  <p className="text-xs text-[var(--subtext)]">{p.current_level} · {(p.total_xp||0).toLocaleString()} XP</p>
                </div>
                <div className="text-right">
                  <p className="gm text-sm font-black text-[var(--acc)]">{weekPct}%</p>
                  <p className="gm text-xs text-[var(--subtext)]">+{(p.xp_this_week||0).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'activity' && (
        <div>
          {feedItems.length === 0 ? (
            <div className="card text-center py-8"><p className="font-bold text-[var(--text)] mb-1">No activity yet</p><p className="text-xs text-[var(--subtext)]">Complete workouts or add friends to see activity</p></div>
          ) : feedItems.map((a:any)=>{
            const typeIcon: Record<string,string> = {workout:'💪',pr:'🏆',achievement:'⭐',challenge:'🎯',gps_activity:'🏃'}
            const mins = Math.floor((Date.now()-new Date(a.created_at).getTime())/60000)
            const ago = mins<60?`${mins}m`:mins<1440?`${Math.floor(mins/60)}h`:`${Math.floor(mins/1440)}d`
            return (
              <div key={a.id} className="card mb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span>{typeIcon[a.activity_type]||'📌'}</span>
                  <p className="font-bold text-xs text-[var(--text)] flex-1">{a.profiles?.username||'User'}</p>
                  <span className="text-[10px] text-[var(--subtext)]">{ago}</span>
                </div>
                <p className="text-xs text-[var(--text)]">{a.title}</p>
                {a.description && <p className="text-[10px] text-[var(--subtext)] mt-0.5">{a.description}</p>}
              </div>
            )
          })}
          <a href="/feed" className="block text-center text-xs font-bold text-[var(--acc)] mt-3" style={{textDecoration:'none'}}>View full feed →</a>
        </div>
      )}

      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="card text-center py-8"><p className="text-3xl mb-2">👥</p><p className="font-bold text-[var(--text)]">No friends yet</p><p className="text-sm text-[var(--subtext)] mt-1">Add friends by username above</p></div>
          ) : friends.map((f:any)=>(
            <div key={f.id} className="card mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--acc)] flex items-center justify-center font-bold text-sm text-white" style={{clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))'}}>{f.friend?.username?.[0]?.toUpperCase()||'?'}</div>
              <div className="flex-1">
                <p className="font-bold text-sm text-[var(--text)]">{f.friend?.username}</p>
                <p className="text-xs text-[var(--subtext)]">{f.friend?.current_level} · {(f.friend?.total_xp||0).toLocaleString()} XP</p>
              </div>
              <p className="text-xs text-[var(--subtext)] capitalize">{f.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
