import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

const UpsertSchema = z.object({
  card_id:      z.string(),
  title:        z.string(),
  category:     z.string(),
  is_favourite: z.boolean().optional(),
  is_read:      z.boolean().optional(),
})

// GET /api/user-content — all items for the current user
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('user_content')
    .select('card_id, title, category, is_favourite, is_read')
    .eq('user_id', req.userId)
  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

// PUT /api/user-content — upsert a single item (toggles is_favourite or is_read)
router.put('/', async (req, res) => {
  const parsed = UpsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { card_id, title, category, is_favourite, is_read } = parsed.data

  const { data: existing } = await supabase
    .from('user_content')
    .select('is_favourite, is_read')
    .eq('user_id', req.userId)
    .eq('card_id', card_id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('user_content')
    .upsert(
      {
        user_id:      req.userId,
        card_id,
        title,
        category,
        is_favourite: is_favourite ?? existing?.is_favourite ?? false,
        is_read:      is_read      ?? existing?.is_read      ?? false,
      },
      { onConflict: 'user_id,card_id' }
    )
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
})

export default router
