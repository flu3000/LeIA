import { useState, useEffect } from 'react'
import { api } from '../services/apiClient'

export interface BookSummary {
  book_id: string
  title: string
  author: string
  cover_url?: string
  theme?: string
  sub_theme?: string
  difficulty?: 'Iniciante' | 'Intermediário' | 'Avançado'
  publishing_year?: number
  publisher?: string
  amazon_link?: string
}

export function useBooks() {
  const [books, setBooks] = useState<BookSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<BookSummary[]>('/api/books')
      .then((data) => setBooks(data))
      .catch((err) => console.error('[useBooks]', err))
      .finally(() => setIsLoading(false))
  }, [])

  const themes = [...new Set(books.map((b) => b.theme).filter(Boolean) as string[])].sort()

  function booksByTheme(theme: string): Record<string, BookSummary[]> {
    const groups: Record<string, BookSummary[]> = {}
    for (const book of books.filter((b) => b.theme === theme)) {
      const key = book.sub_theme ?? 'Geral'
      if (!groups[key]) groups[key] = []
      groups[key].push(book)
    }
    return groups
  }

  function countByTheme(theme: string) {
    return books.filter((b) => b.theme === theme).length
  }

  return { books, themes, isLoading, booksByTheme, countByTheme }
}
