/**
 * Quotes / insight feed with likes, delete, and realtime.
 *
 * Data operations now go through the LeIA backend (/api/insights).
 * Realtime subscription still uses the Supabase client directly
 * (Supabase Realtime requires the SDK — it cannot be proxied via REST).
 *
 * ── quotes_with_stats view (must exist in Supabase) ───────────────────────────
 *   CREATE OR REPLACE VIEW quotes_with_stats AS
 *   SELECT q.id, q.user_id, q.content, q.author, q.book_title,
 *          q.material_link, q.created_at, us.display_name, us.username,
 *          us.avatar_url, COUNT(ql.quote_id)::INTEGER AS likes_count
 *   FROM quotes q
 *   LEFT JOIN user_settings us ON us.id = q.user_id
 *   LEFT JOIN quote_likes ql   ON ql.quote_id = q.id
 *   GROUP BY q.id, q.user_id, q.content, q.author, q.book_title,
 *            q.material_link, q.created_at, us.display_name, us.username, us.avatar_url;
 *   GRANT SELECT ON quotes_with_stats TO authenticated, anon;
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { api } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export interface Insight {
  id: string
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  content: string
  author?: string
  bookTitle?: string
  materialLink?: string
  likesCount: number
  isLiked: boolean
  createdAt: string
  profileHandle: string
}

type QuoteRow = {
  id: string; user_id: string; content: string
  author: string | null; book_title: string | null
  material_link: string | null; created_at: string
}

type AuthorRow = { id: string; display_name: string | null; username: string | null; avatar_url: string | null }

async function fetchAuthorMap(userIds: string[]): Promise<Map<string, AuthorRow>> {
  const unique = [...new Set(userIds)]
  if (unique.length === 0) return new Map()
  const { data } = await supabase
    .from('user_settings')
    .select('id, display_name, username, avatar_url')
    .in('id', unique)
  const map = new Map<string, AuthorRow>()
  for (const row of (data ?? []) as AuthorRow[]) map.set(row.id, row)
  return map
}

export function useInsights() {
  const { user } = useAuth()
  const [explorar, setExplorar] = useState<Insight[]>([])
  const [seguindo, setSeguindo] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchExplorar = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await api.get<Insight[]>('/api/insights?tab=explorar')
      setExplorar(data)
    } catch (err) {
      console.error('[useInsights] fetchExplorar:', err)
    }
    setIsLoading(false)
  }, [user?.id])

  const fetchSeguindo = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await api.get<Insight[]>('/api/insights?tab=seguindo')
      setSeguindo(data)
    } catch (err) {
      console.error('[useInsights] fetchSeguindo:', err)
    }
    setIsLoading(false)
  }, [user?.id])

  // Realtime: new quotes from other users (Supabase SDK required)
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('quotes-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotes' }, async (payload) => {
        const newQuote = payload.new as QuoteRow
        if (newQuote.user_id === user?.id) return

        const authorMap = await fetchAuthorMap([newQuote.user_id])
        const a = authorMap.get(newQuote.user_id)
        const insight: Insight = {
          id: newQuote.id,
          userId: newQuote.user_id,
          username: a?.username ?? 'leitor',
          displayName: a?.display_name ?? a?.username ?? 'Usuário LeIA',
          avatarUrl: a?.avatar_url ?? undefined,
          content: newQuote.content,
          author: newQuote.author ?? undefined,
          bookTitle: newQuote.book_title ?? undefined,
          materialLink: newQuote.material_link ?? undefined,
          likesCount: 0,
          isLiked: false,
          createdAt: newQuote.created_at,
          profileHandle: a?.username ?? newQuote.user_id,
        }
        setExplorar((prev) => [insight, ...prev])
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  const toggleLike = useCallback(
    async (insightId: string) => {
      if (!user) return
      const toggle = (list: Insight[]) =>
        list.map((i) =>
          i.id !== insightId ? i
            : { ...i, isLiked: !i.isLiked, likesCount: i.likesCount + (i.isLiked ? -1 : 1) }
        )
      setExplorar(toggle)
      setSeguindo(toggle)
      try {
        await api.post(`/api/insights/${insightId}/like`)
      } catch (err) {
        console.error('[useInsights] toggleLike:', err)
        // Revert optimistic update on error
        setExplorar(toggle)
        setSeguindo(toggle)
      }
    },
    [user]
  )

  const publish = useCallback(
    async (
      content: string,
      opts?: { author?: string; bookTitle?: string; materialLink?: string }
    ): Promise<boolean> => {
      if (!user || !content.trim()) return false
      try {
        await api.post('/api/insights', {
          content: content.trim(),
          author:        opts?.author?.trim()       || undefined,
          book_title:    opts?.bookTitle?.trim()    || undefined,
          material_link: opts?.materialLink?.trim() || undefined,
        })
        return true
      } catch (err) {
        console.error('[useInsights] publish:', err)
        return false
      }
    },
    [user]
  )

  const deleteQuote = useCallback(async (insightId: string): Promise<boolean> => {
    try {
      await api.delete(`/api/insights/${insightId}`)
      setExplorar((prev) => prev.filter((i) => i.id !== insightId))
      setSeguindo((prev) => prev.filter((i) => i.id !== insightId))
      return true
    } catch (err) {
      console.error('[useInsights] deleteQuote:', err)
      return false
    }
  }, [])

  const refresh = useCallback(() => fetchExplorar(), [fetchExplorar])

  return { explorar, seguindo, isLoading, fetchExplorar, fetchSeguindo, toggleLike, publish, deleteQuote, refresh }
}
