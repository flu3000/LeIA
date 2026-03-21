import { useState, useEffect, useCallback } from 'react'
import { Users, UserMinus, UserPlus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useFollow } from '../hooks/useFollow'

interface FriendProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-brand-accent/30 shrink-0"
      />
    )
  }
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-sm font-bold text-brand-accent shrink-0">
      {initials}
    </div>
  )
}

function FriendCard({
  profile,
  isFollowing,
  onToggle,
}: {
  profile: FriendProfile
  isFollowing: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-3 transition-colors">
      <Link to={`/profile/${profile.username || profile.id}`} className="shrink-0">
        <Avatar name={profile.displayName} url={profile.avatarUrl} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${profile.username || profile.id}`}
          className="text-sm font-semibold text-slate-200 truncate hover:text-brand-accent transition-colors block"
        >
          {profile.displayName}
        </Link>
        <p className="text-xs text-slate-500">@{profile.username || profile.id.slice(0, 8)}</p>
      </div>
      <button
        onClick={() => onToggle(profile.id)}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors shrink-0 ${
          isFollowing
            ? 'border-slate-600 text-slate-400 hover:border-pomodoro-focus hover:text-pomodoro-focus'
            : 'border-brand-accent/40 text-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10'
        }`}
      >
        {isFollowing
          ? <><UserMinus className="w-3.5 h-3.5" />Seguindo</>
          : <><UserPlus className="w-3.5 h-3.5" />Seguir</>}
      </button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-brand-text">
      <Users className="w-10 h-10 mb-3 opacity-20" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}

async function fetchProfiles(ids: string[]): Promise<FriendProfile[]> {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('user_settings')
    .select('id, display_name, username, avatar_url')
    .in('id', ids)
  return (data ?? []).map((r) => ({
    id: r.id,
    username: r.username ?? '',
    displayName: r.display_name ?? r.username ?? 'Usuário LeIA',
    avatarUrl: r.avatar_url ?? undefined,
  }))
}

export default function SocialPage() {
  const { user } = useAuth()
  const { followingIds, toggleFollow } = useFollow()
  const [tab, setTab] = useState<'seguindo' | 'seguidores'>('seguindo')
  const [following, setFollowing] = useState<FriendProfile[]>([])
  const [followers, setFollowers] = useState<FriendProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')

  const loadFollowing = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    const ids = (data ?? []).map((r: { following_id: string }) => r.following_id)
    setFollowing(await fetchProfiles(ids))
    setIsLoading(false)
  }, [user?.id])

  const loadFollowers = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id)
    const ids = (data ?? []).map((r: { follower_id: string }) => r.follower_id)
    setFollowers(await fetchProfiles(ids))
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => { loadFollowing() }, [loadFollowing])
  useEffect(() => { if (tab === 'seguidores') loadFollowers() }, [tab, loadFollowers])

  const handleToggle = async (id: string) => {
    await toggleFollow(id)
    // Optimistically update lists
    setFollowing((prev) =>
      followingIds.has(id)
        ? prev.filter((p) => p.id !== id)
        : prev
    )
  }

  if (!user) return null

  const list = tab === 'seguindo' ? following : followers
  const filtered = query.trim()
    ? list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(query.toLowerCase()) ||
          p.username.toLowerCase().includes(query.toLowerCase())
      )
    : list

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Amigos</h1>
        <p className="text-sm text-brand-text">Seus seguidores e quem você segue</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit mb-5 border border-slate-700">
        {([
          ['seguindo', `Seguindo${following.length ? ` · ${following.length}` : ''}`],
          ['seguidores', `Seguidores${followers.length ? ` · ${followers.length}` : ''}`],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-slate-700 text-slate-100' : 'text-brand-text hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      {list.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nome ou @username…"
            className="w-full bg-brand-primary border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            query.trim()
              ? 'Nenhum usuário encontrado para esse filtro.'
              : tab === 'seguindo'
              ? 'Você ainda não segue ninguém. Explore os rankings!'
              : 'Nenhum seguidor ainda.'
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <FriendCard
              key={p.id}
              profile={p}
              isFollowing={followingIds.has(p.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}
