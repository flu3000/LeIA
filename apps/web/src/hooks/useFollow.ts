/**
 * Follow/unfollow and user search.
 *
 * Supabase tables:
 *   follows (
 *     follower_id UUID REFERENCES auth.users,
 *     following_id UUID REFERENCES auth.users,
 *     created_at TIMESTAMPTZ DEFAULT NOW(),
 *     PRIMARY KEY (follower_id, following_id)
 *   )
 *
 *   profiles (
 *     id UUID PRIMARY KEY REFERENCES auth.users,
 *     username TEXT UNIQUE,
 *     display_name TEXT,
 *     avatar_url TEXT,
 *     total_xp INTEGER DEFAULT 0
 *   )
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
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
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowingIds(new Set(data.map((r) => r.following_id)))
      })
  }, [user?.id])

  const toggleFollow = useCallback(
    async (targetId: string) => {
      if (!user || targetId === user.id) return
      const isFollowing = followingIds.has(targetId)

      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
        setFollowingIds((prev) => { const s = new Set(prev); s.delete(targetId); return s })
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
        setFollowingIds((prev) => new Set([...prev, targetId]))
      }
    },
    [user, followingIds]
  )

  const searchUsers = useCallback(
    async (query: string): Promise<PublicProfile[]> => {
      if (!query.trim()) return []
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, total_xp')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .neq('id', user?.id ?? '')
        .limit(20)

      return (data ?? []).map((r) => ({
        id: r.id,
        username: r.username ?? '',
        displayName: r.display_name ?? r.username ?? 'Usuário',
        avatarUrl: r.avatar_url,
        totalXP: r.total_xp ?? 0,
        isFollowing: followingIds.has(r.id),
      }))
    },
    [user?.id, followingIds]
  )

  const getLeaderboard = useCallback(async (): Promise<PublicProfile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_xp')
      .order('total_xp', { ascending: false })
      .limit(50)

    return (data ?? []).map((r) => ({
      id: r.id,
      username: r.username ?? '',
      displayName: r.display_name ?? r.username ?? 'Usuário',
      avatarUrl: r.avatar_url,
      totalXP: r.total_xp ?? 0,
      isFollowing: followingIds.has(r.id),
    }))
  }, [followingIds])

  return { followingIds, toggleFollow, searchUsers, getLeaderboard }
}
