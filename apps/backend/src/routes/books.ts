import { Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

const BOOK_SUMMARY_COLS =
  'book_id, title, author, cover_url, theme, sub_theme, difficulty, publishing_year, publisher, amazon_link'

const BOOK_DETAIL_COLS =
  'book_id, title, author, publisher, publishing_year, cover_url, theme, sub_theme, difficulty, description, translator, amazon_link, pages'

// GET /api/books — list with optional filters
router.get('/', async (req, res) => {
  const { theme, difficulty, search } = req.query as Record<string, string>

  let query = supabase.from('books').select(BOOK_SUMMARY_COLS).order('title')

  if (theme)      query = query.eq('theme', theme)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (search)     query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/books]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

// GET /api/books/:bookId — full detail
router.get('/:bookId', async (req, res) => {
  const { bookId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_DETAIL_COLS)
    .eq('book_id', bookId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'Book not found' })
    return
  }
  res.json(data)
})

export default router
