import { useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'

export function useCitations() {
  const { user } = useAuth()

  /**
   * Creates a citation in the quotes table.
   * @param content   The quote text (required)
   * @param bookTitle The book the quote is from — maps to book_title column (optional)
   */
  const createCitation = useCallback(
    async (content: string, bookTitle?: string): Promise<boolean> => {
      if (!user || !content.trim()) return false

      // Only include optional fields when they have a value — never send null/undefined
      const payload: Record<string, string> = {
        user_id: user.id,
        content: content.trim(),
      }
      if (bookTitle?.trim()) payload.book_title = bookTitle.trim()

      const { error } = await supabase.from('quotes').insert(payload)
      if (!error) {
        await supabase.rpc('add_user_xp', { p_user_id: user.id, p_xp: 20 })
      }
      return !error
    },
    [user]
  )

  return { createCitation }
}
