import { supabase } from '../lib/supabase.js'

// ── Constantes ────────────────────────────────────────────────────────────────

const BOOKS_PAGE_SIZE_MAX = 50

// Campos padrão de um livro na listagem
const BOOK_LIST_SELECT = `
  book_id, title, author, difficulty, description, tags, category_id,
  categories (
    category_id, category_name,
    pillars ( pillar_id, pillar_name )
  ),
  book_editions (
    edition_id, publisher, cover_url, amazon_link,
    publish_year, pages, isbn_13, isbn_10
  )
`.trim()

// Campos completos de um livro (detalhe)
const BOOK_DETAIL_SELECT = `
  book_id, title, author, difficulty, description, tags, category_id,
  categories (
    category_id, category_name,
    pillars ( pillar_id, pillar_name )
  ),
  book_editions (
    edition_id, publisher, cover_url, amazon_link,
    publish_year, pages, translator, isbn_13, isbn_10, created_at
  )
`.trim()

// Livro salvo com join completo
const SAVED_BOOK_SELECT = `
  saved_book_id, edition_id, saved_as, pages_read, notes, created_at, updated_at,
  book_editions (
    edition_id, publisher, cover_url, amazon_link, publish_year, pages, isbn_13, isbn_10,
    books (
      book_id, title, author, difficulty, description, tags,
      categories (
        category_id, category_name,
        pillars ( pillar_id, pillar_name )
      )
    )
  )
`.trim()

// ── Acervo ────────────────────────────────────────────────────────────────────

/**
 * Lista paginada de livros com busca e filtros.
 * Zero N+1: uma query única com JOINs via PostgREST.
 */
export async function getBooks({ search, pillar_id, category_id, tags, limit, offset }) {
  const pageSize = Math.min(Number(limit) || 20, BOOKS_PAGE_SIZE_MAX)
  const pageOffset = Number(offset) || 0

  // Se filtrando por pilar, resolve category_ids em paralelo para evitar subquery N+1
  let categoryIds = null
  if (pillar_id) {
    const { data: cats, error } = await supabase
      .from('categories')
      .select('category_id')
      .eq('pillar_id', pillar_id)
    if (error) throw error
    categoryIds = cats?.map((c) => c.category_id) ?? []
    if (categoryIds.length === 0) return { books: [], hasMore: false }
  }

  let q = supabase
    .from('books')
    .select(BOOK_LIST_SELECT, { count: 'exact' })
    .range(pageOffset, pageOffset + pageSize - 1)
    .order('title')

  // Busca por título ou autor
  if (search?.trim()) {
    const s = search.trim()
    q = q.or(`title.ilike.%${s}%,author.ilike.%${s}%`)
  }

  // Filtro por categoria (direto)
  if (category_id) {
    q = q.eq('category_id', category_id)
  }

  // Filtro por pilar (via category_ids pré-resolvidos)
  if (categoryIds !== null) {
    q = q.in('category_id', categoryIds)
  }

  // Filtro por tags (array contains — o livro deve ter ao menos uma das tags)
  if (tags) {
    const tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tagList.length > 0) q = q.overlaps('tags', tagList)
  }

  const { data, error, count } = await q
  if (error) throw error

  return {
    books: data ?? [],
    hasMore: (count ?? 0) > pageOffset + pageSize,
  }
}

// ── Detalhe do livro ──────────────────────────────────────────────────────────

export async function getBookById(bookId) {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_DETAIL_SELECT)
    .eq('book_id', bookId)
    .single()

  if (error) throw error
  return data
}

// ── Pilares ───────────────────────────────────────────────────────────────────

export async function getPillars() {
  const { data, error } = await supabase
    .from('pillars')
    .select(`
      pillar_id, pillar_name,
      categories ( category_id, category_name )
    `)
    .order('pillar_name')

  if (error) throw error
  return data ?? []
}

export async function getPillarById(pillarId) {
  // Duas queries paralelas: pillar + categorias-com-livros.
  // PostgREST faz o JOIN internamente — sem N+1.
  const [pillarRes, categoriesRes] = await Promise.all([
    supabase
      .from('pillars')
      .select('pillar_id, pillar_name')
      .eq('pillar_id', pillarId)
      .single(),

    supabase
      .from('categories')
      .select(`
        category_id, category_name,
        books (
          book_id, title, author, difficulty, tags,
          book_editions (
            edition_id, cover_url, amazon_link, publisher, publish_year
          )
        )
      `)
      .eq('pillar_id', pillarId)
      .order('category_name'),
  ])

  if (pillarRes.error) throw pillarRes.error
  if (categoriesRes.error) throw categoriesRes.error

  const pillar     = pillarRes.data
  const categories = categoriesRes.data ?? []

  // "Livros em destaque": primeiros 6 livros únicos do pilar (em ordem alfabética)
  // Para ordenação por popularidade real, utilize uma view ou função SQL com COUNT(saved_books).
  const seenIds     = new Set()
  const featuredBooks = []
  for (const cat of categories) {
    for (const book of (cat.books ?? [])) {
      if (featuredBooks.length >= 6) break
      if (!seenIds.has(book.book_id)) {
        seenIds.add(book.book_id)
        featuredBooks.push(book)
      }
    }
    if (featuredBooks.length >= 6) break
  }

  return {
    pillar_id:            pillar.pillar_id,
    pillar_name:          pillar.pillar_name,
    categories_with_books: categories,
    featured_books:       featuredBooks,
  }
}

// ── Categorias ────────────────────────────────────────────────────────────────

export async function getCategoryById(categoryId) {
  // 1. Dados da categoria (com pilar)
  const { data: cat, error: catErr } = await supabase
    .from('categories')
    .select('category_id, category_name, pillar_id, pillars ( pillar_id, pillar_name )')
    .eq('category_id', categoryId)
    .single()

  if (catErr) throw catErr

  // 2. Livros da categoria (query única com edições)
  const { data: books, error: booksErr } = await supabase
    .from('books')
    .select(`
      book_id, title, author, difficulty, description, tags,
      book_editions ( edition_id, cover_url, amazon_link, publisher, publish_year )
    `)
    .eq('category_id', categoryId)
    .order('title')

  if (booksErr) throw booksErr

  // 3. Agrupa livros por tags em JS (sem queries extras)
  const tagMap = new Map()
  const untagged = []

  for (const book of (books ?? [])) {
    if (!book.tags || book.tags.length === 0) {
      untagged.push(book)
    } else {
      for (const tag of book.tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, [])
        tagMap.get(tag).push(book)
      }
    }
  }

  const sections = []
  for (const [tag, items] of tagMap) {
    sections.push({ tag, books: items })
  }
  sections.sort((a, b) => a.tag.localeCompare(b.tag, 'pt'))
  if (untagged.length > 0) sections.push({ tag: 'Outros', books: untagged })

  return {
    category:  cat,
    sections,
    total_books: (books ?? []).length,
  }
}

// ── Favoritos ─────────────────────────────────────────────────────────────────

export async function getFavorites(userId) {
  const { data, error } = await supabase
    .from('saved_books')
    .select(SAVED_BOOK_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Salva um livro (edição específica).
 * Se o usuário já tiver a edição salva, atualiza o status em vez de duplicar.
 */
export async function saveBook(userId, editionId, savedAs = 'a ler') {
  // Verifica se já existe para evitar duplicatas (schema não tem unique em user+edition)
  const { data: existing } = await supabase
    .from('saved_books')
    .select('saved_book_id')
    .eq('user_id', userId)
    .eq('edition_id', editionId)
    .maybeSingle()

  if (existing) {
    // Atualiza o status existente
    const { data, error } = await supabase
      .from('saved_books')
      .update({ saved_as: savedAs, updated_at: new Date().toISOString() })
      .eq('saved_book_id', existing.saved_book_id)
      .select(SAVED_BOOK_SELECT)
      .single()
    if (error) throw error
    return data
  }

  // Insere novo
  const { data, error } = await supabase
    .from('saved_books')
    .insert({ user_id: userId, edition_id: editionId, saved_as: savedAs })
    .select(SAVED_BOOK_SELECT)
    .single()
  if (error) throw error
  return data
}

/**
 * Atualiza campos de um livro salvo (status, páginas lidas, notas).
 */
export async function updateFavorite(savedBookId, userId, fields) {
  const allowedFields = {}
  if (fields.saved_as   !== undefined) allowedFields.saved_as   = fields.saved_as
  if (fields.pages_read !== undefined) allowedFields.pages_read = fields.pages_read
  if (fields.notes      !== undefined) allowedFields.notes      = fields.notes
  allowedFields.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('saved_books')
    .update(allowedFields)
    .eq('saved_book_id', savedBookId)
    .eq('user_id', userId) // garante que o usuário é dono do registro
    .select(SAVED_BOOK_SELECT)
    .single()

  if (error) throw error
  return data
}

/**
 * Remove um livro salvo. Garante que só o dono pode remover.
 */
export async function unsaveBook(savedBookId, userId) {
  const { error } = await supabase
    .from('saved_books')
    .delete()
    .eq('saved_book_id', savedBookId)
    .eq('user_id', userId) // proteção de segurança

  if (error) throw error
  return { ok: true }
}
