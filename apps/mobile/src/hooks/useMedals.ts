import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/src/lib/supabase'
import { useAuth } from '@/src/context/AuthContext'
import { MEDALS, type Medal } from '@/src/data/medals'

export interface UserMedal extends Medal {
  unlockedAt: string
  isFeatured: boolean
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

  const toggleFeatured = useCallback(
    async (medalKey: string) => {
      if (!user) return
      const medal = unlocked.find((m) => m.key === medalKey)
      if (!medal) return
      const featuredCount = unlocked.filter((m) => m.isFeatured).length
      if (!medal.isFeatured && featuredCount >= 5) return

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

  return { unlocked, featured, unlockedKeys, toggleFeatured }
}
