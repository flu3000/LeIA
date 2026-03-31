// ── Baseado no schema real do Supabase ───────────────────────────────────────
// pillars:      pillar_id (smallint), pillar_name
// categories:   category_id (bigint), pillar_id, category_name
// books:        book_id (uuid), title, author, difficulty, description, tags[], category_id
// book_editions:edition_id (uuid), book_id, publisher, cover_url, amazon_link,
//               pages, publish_year, translator, isbn_13, isbn_10
// saved_books:  saved_book_id (uuid), user_id, edition_id, saved_as, pages_read, notes

// ── Pilares & Categorias ──────────────────────────────────────────────────────

export interface Pillar {
  pillar_id: number
  pillar_name: string
  categories?: Pick<Category, 'category_id' | 'category_name'>[]
}

export interface Category {
  category_id: number
  pillar_id: number
  category_name: string
  pillars?: Pick<Pillar, 'pillar_id' | 'pillar_name'>
  books?: Book[]
}

// ── Livros & Edições ──────────────────────────────────────────────────────────

export type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado'

export interface Book {
  book_id: string
  title: string
  author: string
  difficulty: Difficulty | null
  description: string | null
  tags: string[] | null
  category_id: number | null
  categories?: {
    category_id: number
    category_name: string
    pillar_id: number
    pillars?: Pick<Pillar, 'pillar_id' | 'pillar_name'>
  }
  book_editions?: Edition[]
}

export interface Edition {
  edition_id: string
  book_id?: string
  publisher: string
  cover_url: string | null
  amazon_link: string
  pages: number
  publish_year: number | null
  translator: string | null
  isbn_13: string
  isbn_10: string
}

// ── Livros Salvos ─────────────────────────────────────────────────────────────

/** Valores permitidos pelo CHECK constraint do Supabase */
export type ReadStatus = 'a ler' | 'lendo' | 'lido'

export interface SavedBook {
  saved_book_id: string
  user_id?: string
  edition_id: string
  saved_as: ReadStatus | null
  pages_read: number
  notes: string | null
  created_at?: string
  updated_at?: string
  book_editions?: Edition & {
    books?: Book
  }
}

// ── Filtros ───────────────────────────────────────────────────────────────────

export interface BookFilters {
  pillar_id?: number | string
  category_id?: number | string
  difficulty?: Difficulty
  tags?: string[]
}

// ── Respostas da API ──────────────────────────────────────────────────────────

export interface BooksResponse {
  books: Book[]
  hasMore: boolean
}

export interface PillarDetail {
  pillar_id: number
  pillar_name: string
  categories_with_books: Array<Category & { books: Book[] }>
  featured_books: Book[]
}

export interface CategoryDetail {
  category: Category
  sections: Array<{ tag: string; books: Book[] }>
  total_books: number
}
