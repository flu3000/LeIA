import { useState, useEffect, useCallback } from 'react'
import { api } from '@/src/services/api'
import { useAuth } from '@/src/context/AuthContext'
import { MEDALS, type Medal } from '@/src/data/medals'

export interface UserMedal extends Medal {
  unlockedAt: string
  isFeatured: boolean
}

interface MedalRow {
  medal_key: string
  unlocked_at: string
  is_featured: boolean
}

export function useMedals() {
  const { user } = useAuth()
  const [unlocked, setUnlocked] = useState<UserMedal[]>([])

  useEffect(() => {
    if (!user) return

    api.get<MedalRow[]>('/medals')
      .then(({ data }) => {
        const medals: UserMedal[] = data.flatMap((row) => {
          const def = MEDALS.find((m) => m.key === row.medal_key)
          if (!def) return []
          return [{ ...def, unlockedAt: row.unlocked_at, isFeatured: row.is_featured }]
        })
        setUnlocked(medals)
      })
      .catch((err) => console.error('[useMedals] load:', err))
  }, [user?.id])

  const toggleFeatured = useCallback(
    async (medalKey: string) => {
      if (!user) return
      const medal = unlocked.find((m) => m.key === medalKey)
      if (!medal) return
      const featuredCount = unlocked.filter((m) => m.isFeatured).length
      if (!medal.isFeatured && featuredCount >= 5) return

      const newFeatured = !medal.isFeatured

      // Optimistic update
      setUnlocked((prev) =>
        prev.map((m) => (m.key === medalKey ? { ...m, isFeatured: newFeatured } : m))
      )

      try {
        await api.patch(`/medals/${medalKey}`, { is_featured: newFeatured })
      } catch (err) {
        console.error('[useMedals] toggleFeatured:', err)
        // Revert on error
        setUnlocked((prev) =>
          prev.map((m) => (m.key === medalKey ? { ...m, isFeatured: medal.isFeatured } : m))
        )
      }
    },
    [user, unlocked]
  )

  const unlockedKeys = new Set(unlocked.map((m) => m.key))
  const featured = unlocked.filter((m) => m.isFeatured)

  return { unlocked, featured, unlockedKeys, toggleFeatured }
}
