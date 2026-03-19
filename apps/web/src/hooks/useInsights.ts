/**
 * Quote/insight feed with likes.
 *
 * Supabase tables:
 *   quotes (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     user_id UUID REFERENCES auth.users,
 *     content TEXT NOT NULL,
 *     material_link TEXT,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   )
 *
 *   quote_likes (
 *     user_id UUID REFERENCES auth.users,
 *     quote_id UUID REFERENCES quotes,
 *     PRIMARY KEY (user_id, quote_id)
 *   )
 *
 *   -- Expose a view: quotes_with_stats
 *   CREATE VIEW quotes_with_stats AS
 *   SELECT q.*, p.display_name, p.username, p.avatar_url,
 *          COUNT(ql.quote_id) as likes_count
 *   FROM quotes q
 *   JOIN profiles p ON p.id = q.user_id
 *   LEFT JOIN quote_likes ql ON ql.quote_id = q.id
 *   GROUP BY q.id, p.display_name, p.username, p.avatar_url;
 */
import { useState, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export interface Insight {
  id: string
  userId: string
  username: string
  displayName: string
  content: string
  materialLink?: string
  likesCount: number
  isLiked: boolean
  createdAt: string
}

export function useInsights() {
  const { user } = useAuth()
  const [explorar, setExplorar] = useState<Insight[]>([])
  const [seguindo, setSeguindo] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const mapRow = useCallback(
    (row: Record<string, unknown>, likedIds: Set<string>): Insight => ({
      id: String(row.id),
      userId: String(row.user_id),
      username: String(row.username ?? ''),
      displayName: String(row.display_name ?? row.username ?? 'Usuário'),
      content: String(row.content),
      materialLink: row.material_link ? String(row.material_link) : undefined,
      likesCount: Number(row.likes_count ?? 0),
      isLiked: likedIds.has(String(row.id)),
      createdAt: String(row.created_at),
    }),
    []
  )

  const fetchExplorar = useCallback(async () => {
    setIsLoading(true)
    const [quotesRes, likesRes] = await Promise.all([
      supabase.from('quotes_with_stats').select('*').order('created_at', { ascending: false }).limit(50),
      user ? supabase.from('quote_likes').select('quote_id').eq('user_id', user.id) : { data: [] },
    ])
    const likedIds = new Set((likesRes.data ?? []).map((r: { quote_id: string }) => r.quote_id))
    setExplorar((quotesRes.data ?? []).map((r) => mapRow(r, likedIds)))
    setIsLoading(false)
  }, [user?.id, mapRow])

  const fetchSeguindo = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    const [followsRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
    ])
    const followingIds = (followsRes.data ?? []).map((r: { following_id: string }) => r.following_id)
    if (followingIds.length === 0) { setSeguindo([]); setIsLoading(false); return }

    const [quotesRes, likesRes] = await Promise.all([
      supabase.from('quotes_with_stats').select('*').in('user_id', followingIds).order('created_at', { ascending: false }).limit(50),
      supabase.from('quote_likes').select('quote_id').eq('user_id', user.id),
    ])
    const likedIds = new Set((likesRes.data ?? []).map((r: { quote_id: string }) => r.quote_id))
    setSeguindo((quotesRes.data ?? []).map((r) => mapRow(r, likedIds)))
    setIsLoading(false)
  }, [user?.id, mapRow])

  const toggleLike = useCallback(
    async (insightId: string) => {
      if (!user) return
      const update = (list: Insight[]) =>
        list.map((i) =>
          i.id !== insightId ? i
          : { ...i, isLiked: !i.isLiked, likesCount: i.likesCount + (i.isLiked ? -1 : 1) }
        )
      setExplorar(update)
      setSeguindo(update)

      const existing = await supabase.from('quote_likes').select('quote_id').eq('user_id', user.id).eq('quote_id', insightId).single()
      if (existing.data) {
        await supabase.from('quote_likes').delete().eq('user_id', user.id).eq('quote_id', insightId)
      } else {
        await supabase.from('quote_likes').insert({ user_id: user.id, quote_id: insightId })
      }
    },
    [user]
  )

  const publish = useCallback(
    async (content: string, materialLink?: string): Promise<boolean> => {
      if (!user || !content.trim()) return false
      const { error } = await supabase.from('quotes').insert({
        user_id: user.id,
        content: content.trim(),
        material_link: materialLink ?? null,
      })
      if (!error) await fetchExplorar()
      return !error
    },
    [user, fetchExplorar]
  )

  const refresh = useCallback(async () => {
    await fetchExplorar()
  }, [fetchExplorar])

  return { explorar, seguindo, isLoading, fetchExplorar, fetchSeguindo, toggleLike, publish, refresh }
}
