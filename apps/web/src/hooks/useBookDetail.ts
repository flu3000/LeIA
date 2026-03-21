import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../services/apiClient'
import { useAuth } from '../context/AuthContext'

export interface Book {
  book_id: string
  title: string
  author: string
  publisher?: string
  publishing_year?: number
  cover_url?: string
  theme?: string
  sub_theme?: string
  difficulty?: 'Iniciante' | 'Intermediário' | 'Avançado'
  description?: string
  translator?: string
  amazon_link?: string
  pages?: number
}

export type SavedAs = 'a ler' | 'lendo' | 'lido'

export interface SavedBook {
  id?: string
  book_id: string
  user_id: string
  saved_as: SavedAs
  pages_read: number
  notes: string
}

export function useBookDetail(bookId: string) {
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [saved, setSaved] = useState<SavedBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!bookId) return
    setIsLoading(true)

    const fetchBook = api.get<Book>(`/api/books/${bookId}`).catch(() => null)
    const fetchSaved = user
      ? api.get<SavedBook | null>(`/api/saved-books/${bookId}`).catch(() => null)
      : Promise.resolve(null)

    Promise.all([fetchBook, fetchSaved]).then(([b, s]) => {
      setBook(b)
      setSaved(s)
      setIsLoading(false)
    })
  }, [bookId, user?.id])

  const upsert = useCallback(
    async (patch: Partial<Omit<SavedBook, 'book_id' | 'user_id'>>) => {
      if (!user) return
      setIsSaving(true)
      const current = saved ?? { book_id: bookId, user_id: user.id, saved_as: 'a ler' as SavedAs, pages_read: 0, notes: '' }
      const next = { ...current, ...patch }
      setSaved(next)
      try {
        await api.put(`/api/saved-books/${bookId}`, {
          saved_as:   next.saved_as,
          pages_read: next.pages_read,
          notes:      next.notes,
        })
      } catch (err) {
        console.error('[useBookDetail] upsert:', err)
      }
      setIsSaving(false)
    },
    [user, saved, bookId]
  )

  const updateStatus    = useCallback((s: SavedAs)    => upsert({ saved_as: s }),            [upsert])
  const updatePagesRead = useCallback((p: number)     => upsert({ pages_read: Math.max(0, p) }), [upsert])

  const updateNotes = useCallback(
    (notes: string) => {
      setSaved((prev) => (prev ? { ...prev, notes } : null))
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
      noteTimerRef.current = setTimeout(async () => {
        await upsert({ notes })
        setNoteSaved(true)
        setTimeout(() => setNoteSaved(false), 2000)
      }, 1000)
    },
    [upsert]
  )

  return { book, saved, isLoading, isSaving, noteSaved, updateStatus, updatePagesRead, updateNotes }
}
