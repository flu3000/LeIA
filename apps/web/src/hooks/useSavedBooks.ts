import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'
import type { SavedAs } from './useBookDetail'

export interface SavedBookItem {
  id?: string
  book_id: string
  user_id: string
  saved_as: SavedAs
  pages_read: number
  notes: string
  created_at?: string
  books: {
    book_id: string
    title: string
    author: string
    cover_url?: string
    theme?: string
    sub_theme?: string
    difficulty?: 'Iniciante' | 'Intermediário' | 'Avançado'
    publishing_year?: number
    publisher?: string
    pages?: number
    description?: string
    translator?: string
    amazon_link?: string
  } | null
}

export function useSavedBooks() {
  const { user } = useAuth()
  const [items, setItems] = useState<SavedBookItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setIsLoading(false); return }
    setIsLoading(true)
    try {
      const data = await api.get<SavedBookItem[]>('/api/saved-books')
      setItems(data)
    } catch (err) {
      console.error('[useSavedBooks]', err)
    }
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = useCallback(
    async (bookId: string, savedAs: SavedAs) => {
      setItems((prev) => prev.map((i) => (i.book_id === bookId ? { ...i, saved_as: savedAs } : i)))
      try {
        await api.put(`/api/saved-books/${bookId}`, { saved_as: savedAs })
      } catch (err) {
        console.error('[useSavedBooks] updateStatus:', err)
      }
    },
    []
  )

  const remove = useCallback(async (bookId: string) => {
    setItems((prev) => prev.filter((i) => i.book_id !== bookId))
    try {
      await api.delete(`/api/saved-books/${bookId}`)
    } catch (err) {
      console.error('[useSavedBooks] remove:', err)
    }
  }, [])

  return { items, isLoading, refresh: fetch, updateStatus, remove }
}
