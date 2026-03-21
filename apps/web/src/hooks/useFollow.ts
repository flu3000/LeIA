import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export interface PublicProfile {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  totalXP: number
  isFollowing: boolean
}

export function useFollow() {
  const { user } = useAuth()
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    api.get<string[]>('/api/social/following')
      .then((ids) => setFollowingIds(new Set(ids)))
      .catch((err) => console.error('[useFollow] init:', err))
  }, [user?.id])

  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!user || targetId === user.id) return
      const isFollowing = followingIds.has(targetId)

      if (isFollowing) {
        setFollowingIds((prev) => { const s = new Set(prev); s.delete(targetId); return s })
        await api.delete(`/api/social/follow/${targetId}`)
      } else {
        setFollowingIds((prev) => new Set([...prev, targetId]))
        await api.post(`/api/social/follow/${targetId}`)
      }
    },
    [user, followingIds]
  )

  const searchUsers = useCallback(
    async (query: string): Promise<PublicProfile[]> => {
      if (!query.trim()) return []
      try {
        return await api.get<PublicProfile[]>(`/api/social/users?q=${encodeURIComponent(query)}`)
      } catch {
        return []
      }
    },
    []
  )

  const getLeaderboard = useCallback(async (): Promise<PublicProfile[]> => {
    try {
      return await api.get<PublicProfile[]>('/api/social/leaderboard')
    } catch {
      return []
    }
  }, [])

  return { followingIds, toggleFollow, searchUsers, getLeaderboard }
}
