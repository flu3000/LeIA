/**
 * Quotes / insight feed with likes, delete, and realtime.
 *
 * Data operations go through the LeIA backend (/api/insights) via chatApi (port 3001).
 * Realtime subscription uses the Supabase client directly
 * (Supabase Realtime requires the SDK — it cannot be proxied via REST).
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/src/lib/supabase'
import { chatApi } from '@/src/lib/apiClient'
import { useAuth } from '@/src/context/AuthContext'

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

export function useInsights() {
  const { user } = useAuth()
  const [explorar, setExplorar] = useState<Insight[]>([])
  const [seguindo, setSeguindo] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchExplorar = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await chatApi.get<Insight[]>('/api/insights?tab=explorar')
      setExplorar(data)
    } catch (err) {
      console.error('[useInsights] fetchExplorar:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchSeguindo = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await chatApi.get<Insight[]>('/api/insights?tab=seguindo')
      setSeguindo(data)
    } catch (err) {
      console.error('[useInsights] fetchSeguindo:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Realtime: new quotes from other users
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel('quotes-realtime-mobile')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quotes' },
        async (payload) => {
          const q = payload.new as {
            id: string
            user_id: string
            content: string
            author: string | null
            book_title: string | null
            material_link: string | null
            created_at: string
          }
          if (q.user_id === user?.id) return

          const { data } = await supabase
            .from('user_settings')
            .select('id, display_name, username, avatar_url')
            .eq('id', q.user_id)
            .maybeSingle()

          const insight: Insight = {
            id: q.id,
            userId: q.user_id,
            username: data?.username ?? 'leitor',
            displayName: data?.display_name ?? data?.username ?? 'Usuário LeIA',
            avatarUrl: data?.avatar_url ?? undefined,
            content: q.content,
            author: q.author ?? undefined,
            bookTitle: q.book_title ?? undefined,
            materialLink: q.material_link ?? undefined,
            likesCount: 0,
            isLiked: false,
            createdAt: q.created_at,
            profileHandle: data?.username ?? q.user_id,
          }
          setExplorar((prev) => [insight, ...prev])
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const toggleLike = useCallback(
    async (insightId: string) => {
      if (!user) return
      const toggle = (list: Insight[]) =>
        list.map((i) =>
          i.id !== insightId
            ? i
            : {
                ...i,
                isLiked: !i.isLiked,
                likesCount: i.likesCount + (i.isLiked ? -1 : 1),
              }
        )
      setExplorar(toggle)
      setSeguindo(toggle)
      try {
        await chatApi.post(`/api/insights/${insightId}/like`)
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
        await chatApi.post('/api/insights', {
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
      await chatApi.delete(`/api/insights/${insightId}`)
      setExplorar((prev) => prev.filter((i) => i.id !== insightId))
      setSeguindo((prev) => prev.filter((i) => i.id !== insightId))
      return true
    } catch (err) {
      console.error('[useInsights] deleteQuote:', err)
      return false
    }
  }, [])

  const refresh = useCallback(() => fetchExplorar(), [fetchExplorar])

  return {
    explorar,
    seguindo,
    isLoading,
    fetchExplorar,
    fetchSeguindo,
    toggleLike,
    publish,
    deleteQuote,
    refresh,
  }
}
