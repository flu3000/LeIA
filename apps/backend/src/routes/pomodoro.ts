import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

// GET /pomodoro/settings — pomodoro config + streak stats for the current user
router.get('/settings', async (req, res) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('pomodoro_focus_time, pomodoro_break_time, daily_sessions_goal, current_streak, last_session_date, sessions_completed_today')
    .eq('id', req.id)
    .maybeSingle()

  if (error) {
    console.error('[GET /pomodoro/settings]', error)
    res.status(500).json({ error: error.message })
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  const sessionsToday = data?.last_session_date === today ? (data.sessions_completed_today ?? 0) : 0

  res.json({
    focusTime:      data?.pomodoro_focus_time     ?? 25,
    breakTime:      data?.pomodoro_break_time     ?? 5,
    dailyGoal:      data?.daily_sessions_goal     ?? 4,
    streak:         data?.current_streak          ?? 0,
    sessionsToday,
    lastSessionDate: data?.last_session_date      ?? null,
  })
})

const DurationsSchema = z.object({
  focus: z.number().int().min(1).max(90),
  break: z.number().int().min(1).max(90),
})

// PUT /pomodoro/settings — save focus/break durations
router.put('/settings', async (req, res) => {
  const parsed = DurationsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { focus, break: breakTime } = parsed.data
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { id: req.id, pomodoro_focus_time: focus, pomodoro_break_time: breakTime },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[PUT /pomodoro/settings]', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).end()
})

const GoalSchema = z.object({ goal: z.number().int().min(1).max(20) })

// PUT /pomodoro/goal — save daily sessions goal
router.put('/goal', async (req, res) => {
  const parsed = GoalSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { id: req.id, daily_sessions_goal: parsed.data.goal },
      { onConflict: 'id' }
    )

  if (error) {
    console.error('[PUT /pomodoro/goal]', error)
    res.status(500).json({ error: error.message })
    return
  }

  res.status(204).end()
})

const SessionSchema = z.object({
  durationMinutes: z.number().int().min(1).max(90),
  maintainedFocus: z.boolean(),
})

// POST /pomodoro/sessions — record a completed focus session, update XP + streak
router.post('/sessions', async (req, res) => {
  const parsed = SessionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { durationMinutes, maintainedFocus } = parsed.data
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  // Read current streak state
  const { data: settings } = await supabase
    .from('user_settings')
    .select('current_streak, last_session_date, sessions_completed_today, daily_sessions_goal')
    .eq('id', req.id)
    .maybeSingle()

  const currentStreak    = settings?.current_streak          ?? 0
  const lastSessionDate  = settings?.last_session_date       ?? null
  const sessionsToday    = lastSessionDate === today ? (settings?.sessions_completed_today ?? 0) : 0
  const dailyGoal        = settings?.daily_sessions_goal     ?? 4

  // Compute new streak
  let newStreak: number
  let newSessionsToday: number
  if (lastSessionDate === today) {
    newStreak        = currentStreak
    newSessionsToday = sessionsToday + 1
  } else if (lastSessionDate === yesterday) {
    newStreak        = currentStreak + 1
    newSessionsToday = 1
  } else {
    newStreak        = 1
    newSessionsToday = 1
  }

  // XP calculation
  const xpBase   = Math.floor(durationMinutes / 5) * 10
  const xpGained = maintainedFocus ? Math.floor(xpBase * 1.5) : xpBase

  const goalJustReached = newSessionsToday === dailyGoal

  // Read + update user_stats
  const { data: statsRow } = await supabase
    .from('user_stats')
    .select('total_xp, sessions_count, focused_sessions')
    .eq('user_id', req.id)
    .maybeSingle()

  await supabase.from('user_stats').upsert(
    {
      user_id:          req.id,
      total_xp:         (statsRow?.total_xp         ?? 0) + xpGained,
      sessions_count:   (statsRow?.sessions_count   ?? 0) + 1,
      focused_sessions: (statsRow?.focused_sessions ?? 0) + (maintainedFocus ? 1 : 0),
    },
    { onConflict: 'user_id' }
  )

  // Update streak in user_settings
  await supabase.from('user_settings').upsert(
    { id: req.id, current_streak: newStreak, sessions_completed_today: newSessionsToday, last_session_date: today },
    { onConflict: 'id' }
  )

  res.json({
    streak:          newStreak,
    sessionsToday:   newSessionsToday,
    dailyGoal,
    lastSessionDate: today,
    goalJustReached,
    xpGained,
  })
})

export default router
