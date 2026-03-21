/**
 * Manages user XP and level in `user_stats` table.
 *
 * Supabase table required:
 *   user_stats (
 *     user_id UUID PRIMARY KEY,
 *     total_xp INTEGER DEFAULT 0,
 *     sessions_count INTEGER DEFAULT 0,
 *     focused_sessions INTEGER DEFAULT 0,  -- sessions with no tab switch
 *     total_pages INTEGER DEFAULT 0,
 *     total_chapters INTEGER DEFAULT 0
 *   )
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { getLevelForXP, type Level } from '../data/levels'

export interface UserStats {
  totalXP: number
  sessionsCount: number
  focusedSessions: number
  totalPages: number
  totalChapters: number
  level: Level
}

const DEFAULT_STATS: UserStats = {
  totalXP: 0, sessionsCount: 0, focusedSessions: 0,
  totalPages: 0, totalChapters: 0, level: { level: 1, title: 'Aprendiz', minXP: 0, color: 'text-slate-400' },
}

export function calcXP(minutes: number, pages: number, chapters: number, maintainedFocus: boolean) {
  const base = minutes * 2 + pages * 5 + chapters * 50
  return Math.round(maintainedFocus ? base * 1.5 : base)
}

export function useXP() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_stats')
      .select('total_xp, sessions_count, focused_sessions, total_pages, total_chapters')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        setStats({
          totalXP: data.total_xp ?? 0,
          sessionsCount: data.sessions_count ?? 0,
          focusedSessions: data.focused_sessions ?? 0,
          totalPages: data.total_pages ?? 0,
          totalChapters: data.total_chapters ?? 0,
          level: getLevelForXP(data.total_xp ?? 0),
        })
      })
  }, [user?.id])

  const addXP = useCallback(
    async (xp: number, sessionData: { pages: number; chapters: number; focused: boolean }) => {
      if (!user) return

      const newStats = await supabase.rpc('increment_user_stats', {
        p_user_id: user.id,
        p_xp: xp,
        p_pages: sessionData.pages,
        p_chapters: sessionData.chapters,
        p_focused: sessionData.focused,
      })

      // Optimistic update if RPC isn't set up yet
      if (newStats.error) {
        setStats((prev) => {
          const newXP = prev.totalXP + xp
          return {
            totalXP: newXP,
            sessionsCount: prev.sessionsCount + 1,
            focusedSessions: prev.focusedSessions + (sessionData.focused ? 1 : 0),
            totalPages: prev.totalPages + sessionData.pages,
            totalChapters: prev.totalChapters + sessionData.chapters,
            level: getLevelForXP(newXP),
          }
        })

        // Fallback upsert
        await supabase.from('user_stats').upsert(
          {
            user_id: user.id,
            total_xp: stats.totalXP + xp,
            sessions_count: stats.sessionsCount + 1,
            focused_sessions: stats.focusedSessions + (sessionData.focused ? 1 : 0),
            total_pages: stats.totalPages + sessionData.pages,
            total_chapters: stats.totalChapters + sessionData.chapters,
          },
          { onConflict: 'user_id' }
        )
      }
    },
    [user, stats]
  )

  return { stats, addXP }
}
