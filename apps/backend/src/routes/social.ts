import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const reportSchema = z.object({
  reported_id: z.string().uuid(),
  reason:      z.string().min(1),
})

// GET /social/users?q= — search users by name or username
router.get('/users', requireAuth, async (req, res) => {
  const q = (req.query.q as string)?.trim()
  if (!q) {
    res.status(400).json({ error: 'Query param "q" is required' })
    return
  }

  const [usersRes, followsRes] = await Promise.all([
    supabase
      .from('user_settings')
      .select('id, display_name, username, avatar_url')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', req.userId)
      .limit(20),
    supabase.from('follows').select('following_id').eq('follower_id', req.userId),
  ])

  const followingSet = new Set((followsRes.data ?? []).map((r: { following_id: string }) => r.following_id))

  res.json(
    (usersRes.data ?? []).map((u: Record<string, unknown>) => ({
      id:          u.id,
      username:    u.username ?? '',
      displayName: u.display_name ?? u.username ?? 'Usuário LeIA',
      avatarUrl:   u.avatar_url ?? null,
      isFollowing: followingSet.has(u.id as string),
    }))
  )
})

// GET /api/social/leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  const [lbRes, followsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, total_xp')
      .order('total_xp', { ascending: false })
      .limit(50),
    supabase.from('follows').select('following_id').eq('follower_id', req.userId),
  ])

  if (lbRes.error) {
    res.status(500).json({ error: lbRes.error.message })
    return
  }

  const followingSet = new Set((followsRes.data ?? []).map((r: { following_id: string }) => r.following_id))

  res.json(
    (lbRes.data ?? []).map((u: Record<string, unknown>) => ({
      id:          u.id,
      username:    u.username ?? '',
      displayName: u.display_name ?? u.username ?? 'Usuário',
      avatarUrl:   u.avatar_url ?? null,
      totalXP:     u.total_xp ?? 0,
      isFollowing: followingSet.has(u.id as string),
    }))
  )
})

// GET /api/social/following — current user's following IDs
router.get('/following', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', req.userId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json((data ?? []).map((r: { following_id: string }) => r.following_id))
})

// GET /api/social/profile/:handle — profile by username or UUID
router.get('/profile/:handle', requireAuth, async (req, res) => {
  const { handle } = req.params
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  let userId: string | null = null

  if (UUID_RE.test(handle)) {
    userId = handle
  } else {
    const { data } = await supabase
      .from('user_settings')
      .select('id')
      .eq('username', handle)
      .maybeSingle()
    userId = data?.id ?? null
  }

  if (!userId) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const [settingsRes, followerRes, followingRes, followRes, blockRes] = await Promise.all([
    supabase.from('user_settings')
      .select('id, display_name, username, avatar_url, bio, city, state, is_public')
      .eq('id', userId).maybeSingle(),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    supabase.from('follows').select('following_id')
      .eq('follower_id', req.userId).eq('following_id', userId).maybeSingle(),
    supabase.from('blocks').select('blocked_id')
      .eq('blocker_id', req.userId).eq('blocked_id', userId).maybeSingle(),
  ])

  const s = settingsRes.data
  res.json({
    id:             userId,
    username:       s?.username ?? 'leitor',
    displayName:    s?.display_name ?? s?.username ?? 'Usuário LeIA',
    avatarUrl:      s?.avatar_url ?? null,
    bio:            s?.bio ?? null,
    city:           s?.city ?? null,
    state:          s?.state ?? null,
    isPublic:       s?.is_public !== false,
    followerCount:  followerRes.count ?? 0,
    followingCount: followingRes.count ?? 0,
    isFollowing:    !!followRes.data,
    isBlocked:      !!blockRes.data,
  })
})

// POST /api/social/follow/:targetId
router.post('/follow/:targetId', requireAuth, async (req, res) => {
  const { targetId } = req.params
  if (targetId === req.userId) {
    res.status(400).json({ error: 'Cannot follow yourself' })
    return
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: req.userId, following_id: targetId })

  if (error) {
    // 23505 = unique_violation (already following)
    if (error.code === '23505') {
      res.status(409).json({ error: 'Already following' })
    } else {
      res.status(500).json({ error: error.message })
    }
    return
  }
  res.status(201).json({ ok: true })
})

// DELETE /api/social/follow/:targetId
router.delete('/follow/:targetId', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', req.userId)
    .eq('following_id', req.params.targetId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

// POST /api/social/report
router.post('/report', requireAuth, async (req, res) => {
  const parsed = reportSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }
  if (parsed.data.reported_id === req.userId) {
    res.status(400).json({ error: 'Cannot report yourself' })
    return
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: req.userId,
    reported_id: parsed.data.reported_id,
    reason:      parsed.data.reason,
  })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json({ ok: true })
})

// POST /api/social/block/:targetId
router.post('/block/:targetId', requireAuth, async (req, res) => {
  const { targetId } = req.params
  if (targetId === req.userId) {
    res.status(400).json({ error: 'Cannot block yourself' })
    return
  }

  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: req.userId, blocked_id: targetId }, { onConflict: 'blocker_id,blocked_id' })

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

// DELETE /api/social/block/:targetId
router.delete('/block/:targetId', requireAuth, async (req, res) => {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', req.userId)
    .eq('blocked_id', req.params.targetId)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }
  res.json({ ok: true })
})

export default router
