import { useState, useEffect } from 'react'
import { Search, UserPlus, UserMinus, Users, PenLine, CheckCircle2 } from 'lucide-react'
import { useFollow, type PublicProfile } from '../hooks/useFollow'
import { useAuth } from '../context/AuthContext'
import { getLevelForXP } from '../data/levels'
import LeaderboardComponent from '../components/LeaderboardComponent'
import PostCitationModal from '../components/PostCitationModal'

function UserCard({ profile, onToggleFollow }: { profile: PublicProfile; onToggleFollow: (id: string) => void }) {
  const initials = profile.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const level = getLevelForXP(profile.totalXP)
  return (
    <div className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-3 transition-colors">
      <div className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-sm font-bold text-brand-accent shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate">{profile.displayName}</p>
        <p className="text-xs text-slate-500 truncate">@{profile.username}</p>
        <p className={`text-xs font-medium ${level.color}`}>{level.title} · {profile.totalXP.toLocaleString('pt-BR')} XP</p>
      </div>
      <button
        onClick={() => onToggleFollow(profile.id)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 ${
          profile.isFollowing
            ? 'border-slate-600 text-slate-400 hover:border-pomodoro-focus hover:text-pomodoro-focus'
            : 'border-brand-accent/40 text-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10'
        }`}
      >
        {profile.isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Seguindo</> : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
      </button>
    </div>
  )
}

export default function SocialPage() {
  const { user } = useAuth()
  const { searchUsers, toggleFollow, followingIds } = useFollow()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      const data = await searchUsers(query)
      setResults(data)
      setIsSearching(false)
      setSearched(true)
    }, 400)
    return () => clearTimeout(t)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (id: string) => {
    await toggleFollow(id)
    setResults((prev) => prev.map((p) => p.id === id ? { ...p, isFollowing: !p.isFollowing } : p))
  }

  const handleCitationSuccess = () => {
    setModalOpen(false)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  if (!user) return null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Social</h1>
        <p className="text-sm text-brand-text">Conecte-se com outros leitores e suba no ranking</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar usuários por nome ou @username…"
          className="w-full bg-brand-primary border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-brand-primary border border-pomodoro-break/40 text-pomodoro-break text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Insight compartilhado com sucesso!
        </div>
      )}

      {/* Search results */}
      {query.trim() ? (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {searched ? `${results.length} resultado${results.length !== 1 ? 's' : ''}` : 'Buscando…'}
          </h2>
          {results.length === 0 && searched ? (
            <div className="flex flex-col items-center justify-center py-10 text-brand-text">
              <Users className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Nenhum usuário encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((p) => (
                <UserCard key={p.id} profile={{ ...p, isFollowing: followingIds.has(p.id) }} onToggleFollow={handleToggle} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <LeaderboardComponent />
      )}

      {/* FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-brand-accent hover:bg-sky-500 text-white rounded-2xl shadow-lg shadow-brand-accent/30 transition-all active:scale-95 font-medium text-sm"
        aria-label="Publicar citação"
      >
        <PenLine className="w-4 h-4" />
        <span className="hidden sm:inline">Publicar Citação</span>
      </button>

      <PostCitationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCitationSuccess}
      />
    </div>
  )
}
