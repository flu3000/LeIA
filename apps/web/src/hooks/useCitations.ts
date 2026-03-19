import { useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function useCitations() {
  const { user } = useAuth()

  const createCitation = useCallback(
    async (content: string, materialTitle?: string): Promise<boolean> => {
      if (!user || !content.trim()) return false
      const { error } = await supabase.from('quotes').insert({
        user_id: user.id,
        content: content.trim(),
        material_link: materialTitle ?? null,
      })
      if (!error) {
        await supabase.rpc('add_user_xp', { p_user_id: user.id, p_xp: 20 })
      }
      return !error
    },
    [user]
  )

  return { createCitation }
}
