import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()

const VIEW_COLS =
  'id, user_id, content, author, book_title, material_link, created_at, display_name, username, avatar_url, likes_count'

const publishSchema = z.object({
  content:       z.string().min(1).max(400),
  author:        z.string().optional(),
  book_title:    z.string().optional(),
  material_link: z.string().url().optional().or(z.literal('')),
})

// GET /api/insights?tab=explorar|seguindo
router.get('/', requireAuth, async (req, res) => {
  const tab = req.query.tab === 'seguindo' ? 'seguindo' : 'explorar'

  let followingIds: string[] = []
  if (tab === 'seguindo') {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', req.userId)
    followingIds = (data ?? []).map((r: { following_id: string }) => r.following_id)
    if (followingIds.length === 0) {
      res.json([])
      return
    }
  }

  let viewQuery = supabase
    .from('quotes_with_stats')
    .select(VIEW_COLS)
    .order('created_at', { ascending: false })
    .limit(50)

  if (tab === 'seguindo') {
    viewQuery = viewQuery.in('user_id', followingIds)
  }

  const [viewRes, likedRes] = await Promise.all([
    viewQuery,
    supabase.from('quote_likes').select('quote_id').eq('user_id', req.userId),
  ])

  if (viewRes.error) {
    console.error('[GET /api/insights]', viewRes.error)
    res.status(500).json({ error: viewRes.error.message })
    return
  }

  const likedIds = new Set((likedRes.data ?? []).map((r: { quote_id: string }) => r.quote_id))

  const insights = (viewRes.data ?? []).map((row: Record<string, unknown>) => ({
    id:            row.id,
    userId:        row.user_id,
    username:      row.username ?? 'leitor',
    displayName:   row.display_name ?? row.username ?? 'Usuário LeIA',
    avatarUrl:     row.avatar_url ?? null,
    content:       row.content,
    author:        row.author ?? null,
    bookTitle:     row.book_title ?? null,
    materialLink:  row.material_link ?? null,
    likesCount:    Number(row.likes_count ?? 0),
    isLiked:       likedIds.has(row.id as string),
    createdAt:     row.created_at,
    profileHandle: row.username ?? row.user_id,
  }))

  res.json(insights)
})

// POST /api/insights — publish a quote
router.post('/', requireAuth, async (req, res) => {
  const parsed = publishSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { content, author, book_title, material_link } = parsed.data
  const payload: Record<string, string> = { user_id: req.userId, content: content.trim() }
  if (author?.trim())        payload.author        = author.trim()
  if (book_title?.trim())    payload.book_title    = book_title.trim()
  if (material_link?.trim()) payload.material_link = material_link.trim()

  const { data, error } = await supabase.from('quotes').insert(payload).select('id').single()
  if (error) {
    console.error('[POST /api/insights]', error)
    res.status(500).json({ error: error.message })
    return
  }
  res.status(201).json({ id: data.id })
})

// DELETE /api/insights/:quoteId
router.delete('/:quoteId', requireAuth, async (req, res) => {
  const { error, count } = await supabase
    .from('quotes')
    .delete({ count: 'exact' })
    .eq('id', req.params.quoteId)
    .eq('user_id', req.userId) // ownership enforced explicitly (service role bypasses RLS)

  if (error) {
    console.error('[DELETE /api/insights/:quoteId]', error)
    res.status(500).json({ error: error.message })
    return
  }
  if (count === 0) {
    res.status(404).json({ error: 'Quote not found or not owned by user' })
    return
  }
  res.json({ ok: true })
})

// POST /api/insights/:quoteId/like — toggle like
router.post('/:quoteId/like', requireAuth, async (req, res) => {
  const { quoteId } = req.params

  const { data: existing } = await supabase
    .from('quote_likes')
    .select('quote_id')
    .eq('user_id', req.userId)
    .eq('quote_id', quoteId)
    .maybeSingle()

  if (existing) {
    await supabase.from('quote_likes').delete()
      .eq('user_id', req.userId).eq('quote_id', quoteId)
    res.json({ liked: false })
  } else {
    await supabase.from('quote_likes').insert({ user_id: req.userId, quote_id: quoteId })
    res.json({ liked: true })
  }
})

export default router
