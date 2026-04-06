import { Router } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth' // Importe o middleware

const router = Router()

// TODAS as rotas abaixo desta linha exigirão o Bearer Token
router.use(requireAuth)

const BOOK_SUMMARY_COLS =
  'book_id, title, author, difficulty, tags, category_id, main_cover:book_editions!best_seller_edition (cover_url)'

const BOOK_DETAIL_COLS =
  'book_id, title, author, difficulty, description, tags, category_id, main_cover:book_editions!best_seller_edition (cover_url)'

// GET /books — list with optional filters
router.get('/getAll', async (req, res) => {
  const { category_id, difficulty, search } = req.query as Record<string, string>
  const page = parseInt(req.query.page as string) || 0;
  const limit = 20;

  // Cálculo do intervalo: 
  // Página 0: de 0 até 24
  // Página 1: de 25 até 49
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase.from('books').select(BOOK_SUMMARY_COLS)

  if (category_id)      query = query.eq('category_id', category_id)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (search)     query = query.ilike('title', `%${search}%`)

  query = query.order('title', { ascending: true }).range(from, to)
  
  const { data, error } = await query

  if (error) {
    console.error('[GET /api/books/getAll]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

// GET /api/books/getById/:bookId — full detail
router.get('/getById/:bookId', async (req, res) => {
  const { bookId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_DETAIL_COLS)
    .eq('book_id', bookId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getById/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'Book not found' })
    return
  }
  res.json(data)
})

router.get('/getByCategory/:categoryId', async (req, res) => {
  const { categoryId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SUMMARY_COLS)
    .eq('category_id', categoryId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getByCategory/:categotyId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'No books found in the category' })
    return
  }
  res.json(data)
})

router.get('/getBook/:categoryId', async (req, res) => {
  const { categoryId } = req.params
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SUMMARY_COLS)
    .eq('category_id', categoryId)
    .maybeSingle()

  if (error) {
    console.error('[GET /api/books/getByCategory/:categotyId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'No books found in the category' })
    return
  }
  res.json(data)
})

export default router
