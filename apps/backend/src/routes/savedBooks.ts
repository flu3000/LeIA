import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const upsertSchema = z.object({
  saved_as: z.enum(['a ler', 'lendo', 'lido']),
  pages_read: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})

// GET /saved-books — all saved books for the user with book details
router.get('/:userId', async (req, res) => {
  // console.log(req);
  const { userId } = req.params;
  console.log('User ID do token:', userId);
  if (!userId || userId === 'undefined') {
    return res.status(401).json({ error: "Usuário não identificado no token." });
  }

  const { data, error } = await supabase
    .from('saved_books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/saved-books]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

// GET /api/saved-books/:bookId — single saved entry
router.get('/:bookId', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('saved_books')
    .select('*')
    .eq('user_id', req.params.userId)
    .eq('book_id', req.params.bookId)
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data ?? null)
})

// PUT /api/saved-books/:bookId — upsert status/progress/notes
router.put('/:bookId', requireAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { saved_as, pages_read, notes } = parsed.data
  const payload: Record<string, unknown> = {
    user_id: req.params.userId,
    book_id: req.params.bookId,
    saved_as,
  }
  if (pages_read !== undefined) payload.pages_read = pages_read
  if (notes      !== undefined) payload.notes      = notes

  const { data, error } = await supabase
    .from('saved_books')
    .upsert(payload, { onConflict: 'user_id,book_id' })
    .select()
    .single()

  if (error) {
    console.error('[PUT /api/saved-books/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.json(data)
})

// DELETE /api/saved-books/:bookId
router.delete('/:bookId', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('saved_books')
    .delete()
    .eq('user_id', req.params.userId)
    .eq('book_id', req.params.bookId)

  if (error) {
    console.error('[DELETE /api/saved-books/:bookId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

export default router
