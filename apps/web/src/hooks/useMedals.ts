/**
 * Manages medal unlocking and featured selection.
 *
 * Supabase table:
 *   user_medals (
 *     user_id UUID,
 *     medal_key TEXT,
 *     unlocked_at TIMESTAMPTZ DEFAULT NOW(),
 *     is_featured BOOLEAN DEFAULT FALSE,
 *     PRIMARY KEY (user_id, medal_key)
 *   )
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { MEDALS, type Medal } from '../data/medals'

export interface UserMedal extends Medal {
  unlockedAt: string
  isFeatured: boolean
}

export interface MedalCheckInput {
  sessionsCount: number
  focusedSessions: number
  streak: number
  totalXP: number
  totalPages: number
  isFirstFollow?: boolean
  isFirstInsight?: boolean
}

export function checkMedalConditions(input: MedalCheckInput, alreadyUnlocked: Set<string>): string[] {
  const toUnlock: string[] = []
  const check = (key: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.has(key)) toUnlock.push(key)
  }

  check('first_session',  input.sessionsCount >= 1)
  check('sessions_10',    input.sessionsCount >= 10)
  check('sessions_50',    input.sessionsCount >= 50)
  check('focus_pure',     input.focusedSessions >= 1)
  check('streak_3',       input.streak >= 3)
  check('streak_7',       input.streak >= 7)
  check('streak_30',      input.streak >= 30)
  check('xp_100',         input.totalXP >= 100)
  check('xp_500',         input.totalXP >= 500)
  check('xp_2000',        input.totalXP >= 2000)
  check('xp_10000',       input.totalXP >= 10000)
  check('pages_100',      input.totalPages >= 100)
  check('social_follow',  !!input.isFirstFollow)
  check('insight_first',  !!input.isFirstInsight)

  return toUnlock
}

export function useMedals() {
  const { user } = useAuth()
  const [unlocked, setUnlocked] = useState<UserMedal[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_medals')
      .select('medal_key, unlocked_at, is_featured')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        const medals: UserMedal[] = data.flatMap((row) => {
          const def = MEDALS.find((m) => m.key === row.medal_key)
          if (!def) return []
          return [{ ...def, unlockedAt: row.unlocked_at, isFeatured: row.is_featured }]
        })
        setUnlocked(medals)
      })
  }, [user?.id])

  const unlockMedals = useCallback(
    async (keys: string[]): Promise<Medal[]> => {
      if (!user || keys.length === 0) return []
      const rows = keys.map((key) => ({ user_id: user.id, medal_key: key, is_featured: false }))
      await supabase.from('user_medals').upsert(rows, { onConflict: 'user_id,medal_key', ignoreDuplicates: true })
      const newMedals = keys.flatMap((key) => MEDALS.find((m) => m.key === key) ?? [])
      setUnlocked((prev) => [
        ...prev,
        ...newMedals.map((m) => ({ ...m, unlockedAt: new Date().toISOString(), isFeatured: false })),
      ])
      return newMedals
    },
    [user]
  )

  const toggleFeatured = useCallback(
    async (medalKey: string) => {
      if (!user) return
      const medal = unlocked.find((m) => m.key === medalKey)
      if (!medal) return
      const featuredCount = unlocked.filter((m) => m.isFeatured).length
      if (!medal.isFeatured && featuredCount >= 5) return // max 5 featured

      const newFeatured = !medal.isFeatured
      await supabase
        .from('user_medals')
        .update({ is_featured: newFeatured })
        .eq('user_id', user.id)
        .eq('medal_key', medalKey)

      setUnlocked((prev) =>
        prev.map((m) => (m.key === medalKey ? { ...m, isFeatured: newFeatured } : m))
      )
    },
    [user, unlocked]
  )

  const unlockedKeys = new Set(unlocked.map((m) => m.key))
  const featured = unlocked.filter((m) => m.isFeatured)

  return { unlocked, featured, unlockedKeys, unlockMedals, toggleFeatured }
}
