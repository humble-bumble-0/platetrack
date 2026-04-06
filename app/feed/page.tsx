'use client'
import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, MapPin, Trophy } from 'lucide-react'

export default function FeedPage() {
  const [feed, setFeed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState<Record<string,string>>({})
  const [tab, setTab] = useState<'feed'|'leaderboard'>('feed')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [showComments, setShowComments] = useState<string|null>(null)

  useEffect(()=>{
    fetch('/api/feed').then(r=>r.json()).then(r=>setFeed(r.data||[])).finally(()=>setLoading(false))
    // Load activity leaderboard — total distance + workouts this month
    // Load friends + self for leaderboard
    fetch('/api/friends/leaderboard').then(r=>r.json()).then(r=>setLeaderboard(r.data||[])).catch(()=>{})
  },[])

  async function toggleLike(id: string) {
    await fetch('/api/feed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'like',activity_id:id})})
    setFeed(f=>f.map(a=>a.id===id?{...a,liked_by_me:!a.liked_by_me,like_count:a.liked_by_me?a.like_count-1:a.like_count+1}:a))
  }

  async function addComment(id: string) {
    const text = commentText[id]
    if (!text?.trim()) return
    await fetch('/api/feed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'comment',activity_id:id,content:text})})
    setCommentText(c=>({...c,[id]:''}))
    // Refresh feed
    fetch('/api/feed').then(r=>r.json()).then(r=>setFeed(r.data||[]))
  }

  function timeAgo(date: string) {
    const mins = Math.floor((Date.now()-new Date(date).getTime())/60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins/60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs/24)}d ago`
  }

  const typeIcon: Record<string,string> = { workout:'💪', pr:'🏆', achievement:'⭐', challenge:'🎯', gps_activity:'🏃' }
  const typeColor: Record<string,string> = { workout:'var(--acc)', pr:'var(--gold)', achievement:'#8B5CF6', challenge:'var(--green)', gps_activity:'#22C55E' }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-[var(--acc)] border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-black text-[var(--text)] mb-1">Activity</h1>
      <p className="text-sm text-[var(--subtext)] mb-3">See what everyone's doing</p>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {[{id:'feed' as const,label:'Feed'},{id:'leaderboard' as const,label:'Leaderboard'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 py-2 text-xs font-bold text-center" style={{
            background:tab===t.id?'var(--acc)':'var(--card)',color:tab===t.id?'#fff':'var(--subtext)',
            border:`1px solid ${tab===t.id?'var(--acc)':'var(--border)'}`,
            clipPath:'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3"><Trophy size={14} color="var(--gold)"/><span className="section-label" style={{color:'var(--gold)'}}>This week's top athletes</span></div>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-[var(--subtext)] text-center py-4">No data yet</p>
          ) : leaderboard.map((p:any,i:number)=>(
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
              <div className="w-7 h-7 flex items-center justify-center font-black text-xs gm" style={{
                background:i===0?'rgba(245,158,11,.15)':i===1?'rgba(192,192,192,.15)':i===2?'rgba(205,127,50,.15)':'var(--muted)',
                color:i===0?'var(--gold)':i===1?'#C0C0C0':i===2?'#CD7F32':'var(--subtext)',
                clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))',
              }}>{i+1}</div>
              <div className="w-7 h-7 flex items-center justify-center font-bold text-xs text-white" style={{background:i===0?'var(--gold)':'var(--muted)',clipPath:'polygon(0 0,calc(100% - 3px) 0,100% 3px,100% 100%,3px 100%,0 calc(100% - 3px))'}}>{p.username?.[0]?.toUpperCase()||'?'}</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[var(--text)]">{p.username}</p>
                <p className="text-[10px] text-[var(--subtext)]">{p.current_level} · {(p.total_xp||0).toLocaleString()} XP total</p>
              </div>
              <div className="text-right">
                <p className="gm text-sm font-black text-[var(--acc)]">+{p.xp_this_week||0}</p>
                <p className="text-[9px] text-[var(--subtext)]">XP this week</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feed */}
      {tab === 'feed' && (feed.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-bold text-[var(--text)] mb-1">No activity yet</p>
          <p className="text-xs text-[var(--subtext)]">Complete a workout or add friends to see their activity here</p>
        </div>
      ) : feed.map(a=>(
        <div key={a.id} className="card mb-3">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-xs text-white" style={{background:typeColor[a.activity_type]||'var(--acc)',clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))'}}>
              {a.profiles?.username?.[0]?.toUpperCase()||'?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text)]">{a.profiles?.username}</p>
              <p className="text-[10px] text-[var(--subtext)]">{timeAgo(a.created_at)} · {a.profiles?.current_level}</p>
            </div>
            <span className="text-lg">{typeIcon[a.activity_type]||'📌'}</span>
          </div>

          {/* Content */}
          <p className="font-bold text-sm text-[var(--text)] mb-1">{a.title}</p>
          {a.description && <p className="text-xs text-[var(--subtext)] mb-2">{a.description}</p>}

          {/* GPS map preview */}
          {a.activity_type === 'gps_activity' && a.metadata?.distance_km && (
            <div className="flex gap-3 mb-2 py-2 px-3" style={{background:'var(--muted)',clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))'}}>
              <div><p className="section-label mb-0.5">Distance</p><p className="gm text-sm font-black text-[var(--green)]">{a.metadata.distance_km.toFixed(2)} km</p></div>
              {a.metadata.duration_seconds && <div><p className="section-label mb-0.5">Time</p><p className="gm text-sm font-bold text-[var(--text)]">{Math.floor(a.metadata.duration_seconds/60)}m</p></div>}
              {a.metadata.pace_per_km && <div><p className="section-label mb-0.5">Pace</p><p className="gm text-sm font-bold text-[var(--text)]">{a.metadata.pace_per_km.toFixed(1)} /km</p></div>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
            <button onClick={()=>toggleLike(a.id)} className="flex items-center gap-1.5">
              <Heart size={16} color={a.liked_by_me?'var(--red)':'var(--subtext)'} fill={a.liked_by_me?'var(--red)':'none'} strokeWidth={2}/>
              <span className="text-xs font-bold" style={{color:a.liked_by_me?'var(--red)':'var(--subtext)'}}>{a.like_count}</span>
            </button>
            <button onClick={()=>setShowComments(showComments===a.id?null:a.id)} className="flex items-center gap-1.5">
              <MessageCircle size={16} color="var(--subtext)" strokeWidth={2}/>
              <span className="text-xs text-[var(--subtext)]">{a.comment_count}</span>
            </button>
            <button onClick={async()=>{
              const text = `${a.profiles?.username}: ${a.title}\n\nvia PlateTrack`
              if (navigator.share) await navigator.share({text}).catch(()=>{})
              else { await navigator.clipboard.writeText(text); alert('Copied!') }
            }}>
              <Share2 size={16} color="var(--subtext)" strokeWidth={2}/>
            </button>
          </div>

          {/* Comments */}
          {showComments === a.id && (
            <div className="mt-3 pt-2 border-t border-[var(--border)]">
              {(a.activity_comments||[]).map((c:any)=>(
                <div key={c.id} className="flex gap-2 mb-2">
                  <span className="text-xs font-bold text-[var(--acc)]">{c.profiles?.username}</span>
                  <span className="text-xs text-[var(--text)]">{c.content}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input value={commentText[a.id]||''} onChange={e=>setCommentText(c=>({...c,[a.id]:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addComment(a.id)} placeholder="Add a comment..." className="input-gow text-xs flex-1 py-1.5"/>
                <button onClick={()=>addComment(a.id)} className="text-xs font-bold px-3" style={{color:'var(--acc)'}}>Post</button>
              </div>
            </div>
          )}
        </div>
      )))}
    </div>
  )
}
