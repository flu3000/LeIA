import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /medals — all unlocked medals for the current user
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('user_medals')
    .select('medal_key, unlocked_at, is_featured')
    .eq('user_id', req.userId)

  if (error) {
    console.error('[GET /medals]', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.json(data ?? [])
})

const ToggleFeaturedSchema = z.object({ is_featured: z.boolean() })

// PATCH /medals/:medalKey — toggle featured status (max 5 featured enforced on frontend)
router.patch('/:medalKey', async (req, res) => {
  const parsed = ToggleFeaturedSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { medalKey } = req.params
  const { error } = await supabase
    .from('user_medals')
    .update({ is_featured: parsed.data.is_featured })
    .eq('user_id', req.userId)
    .eq('medal_key', medalKey)

  if (error) {
    console.error('[PATCH /medals/:medalKey]', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).end()
})

export default router
