import { useEffect, useState } from 'react'
import { Flag, Trophy } from 'lucide-react'
import { useFollow, type PublicProfile } from '../hooks/useFollow'
import { useAuth } from '../context/AuthContext'
import { getLevelForXP } from '../data/levels'

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="w-7 text-center text-sm font-bold text-slate-500">{rank}</span>
}

function UserInitials({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
      {initials}
    </div>
  )
}

export default function LeaderboardComponent() {
  const { user } = useAuth()
  const { getLeaderboard, toggleFollow, followingIds } = useFollow()
  const [entries, setEntries] = useState<PublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [reported, setReported] = useState<Set<string>>(new Set())

  useEffect(() => {
    getLeaderboard().then((data) => { setEntries(data); setLoading(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const report = (id: string) => setReported((prev) => new Set([...prev, id]))

  return (
    <div className="bg-brand-primary border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700/60">
        <Trophy className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">Ranking Global</h3>
        <span className="text-xs text-brand-text ml-auto">por XP total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm text-brand-text py-10">Nenhum dado disponível ainda.</p>
      ) : (
        <div className="divide-y divide-slate-700/40 max-h-[480px] overflow-y-auto">
          {entries.map((p, i) => {
            const rank = i + 1
            const isMe = p.id === user?.id
            const level = getLevelForXP(p.totalXP)
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? 'bg-brand-accent/5' : 'hover:bg-slate-700/20'}`}
              >
                <RankMedal rank={rank} />
                <UserInitials name={p.displayName} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isMe ? 'text-brand-accent' : 'text-slate-200'}`}>
                    {p.displayName} {isMe && <span className="text-xs opacity-60">(você)</span>}
                  </p>
                  <p className={`text-xs ${level.color}`}>{level.title}</p>
                </div>
                <span className="text-sm font-bold text-slate-100 tabular-nums shrink-0">
                  {p.totalXP.toLocaleString('pt-BR')} XP
                </span>
                {!isMe && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleFollow(p.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium ${
                        followingIds.has(p.id)
                          ? 'border-slate-600 text-slate-400 hover:border-pomodoro-focus hover:text-pomodoro-focus'
                          : 'border-brand-accent/40 text-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10'
                      }`}
                    >
                      {followingIds.has(p.id) ? 'Seguindo' : 'Seguir'}
                    </button>
                    {!reported.has(p.id) && (
                      <button
                        onClick={() => report(p.id)}
                        title="Denunciar trapaça"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-pomodoro-focus hover:bg-pomodoro-focus/10 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
