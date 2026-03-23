import { Router } from 'express'
import { supabase } from '../lib/supabase'

const router = Router()

const BOOK_EDITIONS_SUMMARY_COLS =
  'book_id, edition_id, publisher, amazon_link, pages'

const BOOK_EDITIONS_DETAIL_COLS =
  'book_id, edition_id, publisher, publish_year, cover_url, translator, amazon_link, pages'

// GET /books — list with optional filters
router.get('/getByBookId/:bookId', async (req, res) => {
  const { bookId } = req.params
  const { cover_url, publish_year, search_publisher, search_translator, search_publish_year } = req.query as Record<string, string>

  const { data, error } = await supabase
    .from('book_editions')
    .select(BOOK_EDITIONS_DETAIL_COLS)
    .eq('book_id', bookId)
    .maybeSingle()
  if (error) {
    console.error('[GET /api/book_editions/getByBookId/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (!data) {
    res.status(404).json({ error: 'Book edition not found' })
    return
  }

  let query = supabase.from('book_editions').select(BOOK_EDITIONS_SUMMARY_COLS).order('publisher')

  if (cover_url)      query = query.eq('cover_url', cover_url)
  if (publish_year) query = query.eq('publish_year', publish_year)
  if (search_publisher)     query = query.ilike('publisher', `%${search_publisher}%`)
  if (search_translator)     query = query.ilike('translator', `%${search_translator}%`)
  if (search_publish_year)     query = query.ilike('publish_year', `%${search_publish_year}%`)

  res.json(data)
})

export default router
