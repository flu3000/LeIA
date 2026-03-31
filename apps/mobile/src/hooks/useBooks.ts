import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/src/lib/apiClient'
import type { Book, BookFilters, BooksResponse } from '@/src/types/library'

const PAGE_SIZE = 20

function buildQuery(offset: number, search: string, filters: BookFilters): string {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (filters.pillar_id) params.set('pillar_id', String(filters.pillar_id))
  if (filters.category_id) params.set('category_id', String(filters.category_id))
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.tags?.length) params.set('tags', filters.tags.join(','))
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String(offset))
  return `/books/getAll?${params.toString()}`
}

export function useBooks(search: string = '', filters: BookFilters = {}) {
  const [books, setBooks]               = useState<Book[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore]           = useState(false)
  const pageRef = useRef(0)

  // Stable key for filter deps (avoids object reference churn)
  const filterKey = [
    filters.pillar_id,
    filters.category_id,
    filters.difficulty,
    filters.tags?.join(','),
  ].join('|')

  const fetchBooks = useCallback(async () => {
    setIsLoading(true)
    pageRef.current = 0
    try {
      const result = await api.get<BooksResponse>(buildQuery(0, search, filters))
      setBooks(result.books)
      setHasMore(result.hasMore)
    } catch (e) {
      console.error('[useBooks] fetchBooks:', e)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterKey])

  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const nextPage = pageRef.current + 1
    try {
      const result = await api.get<BooksResponse>(buildQuery(nextPage * PAGE_SIZE, search, filters))
      setBooks((prev) => [...prev, ...result.books])
      setHasMore(result.hasMore)
      pageRef.current = nextPage
    } catch (e) {
      console.error('[useBooks] fetchMore:', e)
    } finally {
      setIsLoadingMore(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, hasMore, search, filterKey])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  return { books, isLoading, isLoadingMore, hasMore, fetchMore, refetch: fetchBooks }
}

// ── Detalhe de um livro ───────────────────────────────────────────────────────

export function useBookDetail(bookId: string) {
  const [book, setBook]           = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!bookId) return
    setIsLoading(true)
    api.get<Book>(`/library/books/${bookId}`)
      .then(setBook)
      .catch((e) => console.error('[useBookDetail]', e))
      .finally(() => setIsLoading(false))
  }, [bookId])

  return { book, isLoading }
}
