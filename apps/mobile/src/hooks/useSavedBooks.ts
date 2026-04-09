import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { api } from '@/src/lib/apiClient'
import type { SavedBook, ReadStatus } from '@/src/types/library'

export function useSavedBooks() {
  const { user } = useAuth()
  const [savedBooks, setSavedBooks]   = useState<SavedBook[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [isSyncing, setIsSyncing]     = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSavedBooks = useCallback(async () => {
    if (!user?.id) return
    setIsSyncing(true)
    try {
      const data = await api.get<SavedBook[]>(`/saved-books/${user.id}`)
      setSavedBooks(data ?? [])
    } catch (e) {
      console.error('[useSavedBooks] fetch:', e)
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.hasCompletedProfile) fetchSavedBooks()
  }, [user?.hasCompletedProfile, fetchSavedBooks])

  // ── Salvar / atualizar livro ───────────────────────────────────────────────
  const saveBook = useCallback(async (
    editionId: string,
    status: ReadStatus = 'a ler',
  ) => {
    if (!user?.id) return
    try {
      const data = await api.post<SavedBook>('/library/favorites', {
        edition_id: editionId,
        saved_as: status,
      })
      setSavedBooks((prev) => {
        const exists = prev.find((sb) => sb.edition_id === editionId)
        if (exists) {
          return prev.map((sb) => sb.edition_id === editionId ? data : sb)
        }
        return [data, ...prev]
      })
    } catch (e) {
      console.error('[useSavedBooks] saveBook:', e)
      throw e
    }
  }, [user?.id])

  // ── Remover livro salvo ───────────────────────────────────────────────────
  const unsaveBook = useCallback(async (savedBookId: string) => {
    if (!user?.id) return
    // Optimistic update
    setSavedBooks((prev) => prev.filter((sb) => sb.saved_book_id !== savedBookId))
    try {
      await api.delete(`/library/favorites/${savedBookId}`)
    } catch (e) {
      console.error('[useSavedBooks] unsaveBook:', e)
      // Reverter
      fetchSavedBooks()
      throw e
    }
  }, [user?.id, fetchSavedBooks])

  // ── Atualizar status de leitura ───────────────────────────────────────────
  const updateStatus = useCallback(async (
    savedBookId: string,
    status: ReadStatus,
  ) => {
    // Optimistic update
    setSavedBooks((prev) =>
      prev.map((sb) =>
        sb.saved_book_id === savedBookId ? { ...sb, saved_as: status } : sb
      )
    )
    try {
      await api.patch(`/library/favorites/${savedBookId}`, { saved_as: status })
    } catch (e) {
      console.error('[useSavedBooks] updateStatus:', e)
      fetchSavedBooks()
    }
  }, [fetchSavedBooks])

  // ── Helpers de estado ─────────────────────────────────────────────────────
  /** Retorna o SavedBook correspondente à edição, se salvo */
  const getSavedByEdition = useCallback((editionId: string) =>
    savedBooks.find((sb) => sb.edition_id === editionId),
  [savedBooks])

  /** Retorna o SavedBook correspondente ao livro (qualquer edição), se salvo */
  const getSavedByBook = useCallback((bookId: string) =>
    savedBooks.find((sb) => sb.book_editions?.books?.book_id === bookId),
  [savedBooks])

  const isSaved = useCallback((bookId: string) =>
    Boolean(getSavedByBook(bookId)),
  [getSavedByBook])

  return {
    savedBooks,
    isLoading,
    isSyncing,
    saveBook,
    unsaveBook,
    updateStatus,
    getSavedByEdition,
    getSavedByBook,
    isSaved,
    refetch: fetchSavedBooks,
  }
}
