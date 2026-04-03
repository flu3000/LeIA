import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /user/profile — returns profile merged with auth data
router.get('/', async (req, res) => {
  const { id, email, created_at, user_metadata } = req.supabaseUser
  const metaName = user_metadata?.full_name ?? user_metadata?.name ?? email?.split('@')[0] ?? 'Usuário'

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('display_name, username, avatar_url, bio')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[GET /user/profile]', error)
    res.status(500).json({ error: error.message })
    return
  }

  // Auto-seed display_name on first load
  if (settings && !settings.display_name) {
    await supabase
      .from('user_settings')
      .update({ display_name: metaName })
      .eq('id', id)
  }

  res.json({
    id,
    email:        email ?? '',
    created_at,
    display_name: settings?.display_name ?? metaName,
    username:     settings?.username     ?? null,
    avatar_url:   settings?.avatar_url   ?? null,
    bio:          settings?.bio          ?? null,
  })
})

const UpdateProfileSchema = z.object({
  name:      z.string().optional(),
  username:  z.string().optional(),
  bio:       z.string().optional(),
  avatarUrl: z.string().optional(),
  city:      z.string().optional(),
  state:     z.string().optional(),
  country:   z.string().optional(),
  isPublic:  z.boolean().optional(),
  theme:     z.string().optional(),
})

// PATCH /user/profile — upserts user_settings
router.patch('/', async (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const data = parsed.data
  const settingsUpdate: Record<string, unknown> = {}
  if (data.name      !== undefined) settingsUpdate.display_name = data.name.trim()
  if (data.username  !== undefined) settingsUpdate.username     = data.username.toLowerCase().trim()
  if (data.bio       !== undefined) settingsUpdate.bio          = data.bio
  if (data.avatarUrl !== undefined) settingsUpdate.avatar_url   = data.avatarUrl
  if (data.city      !== undefined) settingsUpdate.city         = data.city
  if (data.state     !== undefined) settingsUpdate.state        = data.state
  if (data.country   !== undefined) settingsUpdate.country      = data.country
  if (data.isPublic  !== undefined) settingsUpdate.is_public    = data.isPublic
  if (data.theme     !== undefined) settingsUpdate.theme        = data.theme

  if (Object.keys(settingsUpdate).length === 0) {
    res.status(400).json({ error: 'No fields to update' })
    return
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({ id: req.userId, ...settingsUpdate }, { onConflict: 'id' })

  if (error) {
    console.error('[PATCH /user/profile]', error)
    if (error.code === '23505' || error.message?.toLowerCase().includes('unique')) {
      res.status(409).json({ error: 'USERNAME_TAKEN', code: 'USERNAME_TAKEN' })
      return
    }
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).end()
})

export default router
