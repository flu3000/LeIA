import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/apiClient'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import type { Insight } from './useInsights'

export interface UserProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  city?: string
  state?: string
  isPublic: boolean
  followerCount: number
  followingCount: number
  quoteCount: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const VIEW_SELECT =
  'id, user_id, content, author, book_title, material_link, created_at, display_name, username, avatar_url, likes_count'

type ViewRow = {
  id: string; user_id: string; content: string
  author: string | null; book_title: string | null
  material_link: string | null; created_at: string
  display_name: string | null; username: string | null
  avatar_url: string | null; likes_count: number | null
}
type LikeRow = { quote_id: string }

function mapRow(row: ViewRow, likedIds: Set<string>): Insight {
  return {
    id: row.id, userId: row.user_id,
    username: row.username ?? 'leitor',
    displayName: row.display_name ?? row.username ?? 'Usuário LeIA',
    avatarUrl: row.avatar_url ?? undefined,
    content: row.content, author: row.author ?? undefined,
    bookTitle: row.book_title ?? undefined, materialLink: row.material_link ?? undefined,
    likesCount: Number(row.likes_count ?? 0), isLiked: likedIds.has(row.id),
    createdAt: row.created_at, profileHandle: row.username ?? row.user_id,
  }
}

interface ProfileApiResponse extends UserProfile {
  isFollowing: boolean
  isBlocked: boolean
}

/** Accepts either a UUID or a @username (without @). */
export function useUserProfile(handle: string) {
  const { user: currentUser } = useAuth()
  // undefined = resolving | null = not found | string = UUID
  const [resolvedId, setResolvedId] = useState<string | null | undefined>(undefined)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [quotes, setQuotes] = useState<Insight[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  // Resolve handle → profile via backend
  useEffect(() => {
    if (!handle) return
    setResolvedId(undefined)
    setIsLoading(true)

    api.get<ProfileApiResponse>(`/api/social/profile/${encodeURIComponent(handle)}`)
      .then((data) => {
        setResolvedId(data.id)
        setIsFollowing(data.isFollowing)
        setIsBlocked(data.isBlocked)
        setProfile(data)
      })
      .catch(() => {
        setResolvedId(null)
        setProfile(null)
      })
      .finally(() => setIsLoading(false))
  }, [handle, currentUser?.id])

  // Fetch quotes via Supabase directly (quotes_with_stats view is readable by auth users)
  useEffect(() => {
    if (!resolvedId) return
    const userId = resolvedId

    const run = async () => {
      if (!profile?.isPublic && currentUser?.id !== userId) {
        setQuotes([])
        return
      }
      const [quotesRes, likedRes] = await Promise.all([
        supabase.from('quotes_with_stats').select(VIEW_SELECT)
          .eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        currentUser
          ? supabase.from('quote_likes').select('quote_id').eq('user_id', currentUser.id)
          : Promise.resolve({ data: [] as LikeRow[] }),
      ])
      const likedIds = new Set((likedRes.data ?? []).map((r: LikeRow) => r.quote_id))
      const mapped = (quotesRes.data ?? []).map((r) => mapRow(r as ViewRow, likedIds))
      setQuotes(mapped)
      setProfile((p) => p ? { ...p, quoteCount: mapped.length } : p)
    }

    run()
  }, [resolvedId, currentUser?.id])

  const isOwnProfile = !!currentUser && typeof resolvedId === 'string' && currentUser.id === resolvedId

  const toggleFollow = useCallback(async () => {
    if (!currentUser || isOwnProfile || followLoading || !resolvedId) return
    setFollowLoading(true)
    if (isFollowing) {
      setIsFollowing(false)
      setProfile((p) => p ? { ...p, followerCount: Math.max(0, p.followerCount - 1) } : p)
      await api.delete(`/api/social/follow/${resolvedId}`)
    } else {
      setIsFollowing(true)
      setProfile((p) => p ? { ...p, followerCount: p.followerCount + 1 } : p)
      await api.post(`/api/social/follow/${resolvedId}`)
    }
    setFollowLoading(false)
  }, [currentUser, isOwnProfile, followLoading, isFollowing, resolvedId])

  const toggleLike = useCallback(async (insightId: string) => {
    if (!currentUser) return
    setQuotes((prev) =>
      prev.map((i) => i.id !== insightId ? i
        : { ...i, isLiked: !i.isLiked, likesCount: i.likesCount + (i.isLiked ? -1 : 1) })
    )
    await api.post(`/api/insights/${insightId}/like`)
  }, [currentUser])

  const deleteQuote = useCallback(async (insightId: string) => {
    try {
      await api.delete(`/api/insights/${insightId}`)
      setQuotes((prev) => prev.filter((i) => i.id !== insightId))
      setProfile((p) => p ? { ...p, quoteCount: Math.max(0, p.quoteCount - 1) } : p)
      return true
    } catch { return false }
  }, [])

  const report = useCallback(async (reason: string): Promise<boolean> => {
    if (!currentUser || !resolvedId) return false
    try {
      await api.post('/api/social/report', { reported_id: resolvedId, reason })
      return true
    } catch { return false }
  }, [currentUser, resolvedId])

  const block = useCallback(async (): Promise<boolean> => {
    if (!currentUser || !resolvedId) return false
    try {
      await api.post(`/api/social/block/${resolvedId}`)
      setIsBlocked(true)
      return true
    } catch { return false }
  }, [currentUser, resolvedId])

  return {
    profile, quotes, isFollowing, isBlocked, isLoading,
    followLoading, isOwnProfile,
    toggleFollow, toggleLike, deleteQuote, report, block,
  }
}
