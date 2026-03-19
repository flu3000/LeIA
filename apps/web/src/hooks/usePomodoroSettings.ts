import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import type { PomodoroDurations } from './usePomodoro'
import { calcXP } from './useXP'
import { checkMedalConditions } from './useMedals'
import { MEDALS, type Medal } from '../data/medals'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEFAULT: PomodoroDurations = { focus: 25, break: 5 }
const DEFAULT_GOAL = 4

export interface StreakStats {
  streak: number
  sessionsToday: number
  dailyGoal: number
  lastSessionDate: string | null
  goalJustReached: boolean
}

export interface SessionPayload {
  durationMinutes: number
  pages: number
  chapters: number
  maintainedFocus: boolean
}

export interface SessionResult {
  xpGained: number
  newMedals: Medal[]
}

export function usePomodoroSettings() {
  const { user } = useAuth()
  const [initialDurations, setInitialDurations] = useState<PomodoroDurations>(DEFAULT)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stats, setStats] = useState<StreakStats>({
    streak: 0, sessionsToday: 0, dailyGoal: DEFAULT_GOAL, lastSessionDate: null, goalJustReached: false,
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { setIsLoadingSettings(false); return }
    supabase
      .from('user_settings')
      .select('pomodoro_focus_time, pomodoro_break_time, daily_sessions_goal, current_streak, last_session_date, sessions_completed_today')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setInitialDurations({
            focus: data.pomodoro_focus_time ?? DEFAULT.focus,
            break: data.pomodoro_break_time ?? DEFAULT.break,
          })
          const today = new Date().toISOString().slice(0, 10)
          const sessionsToday = data.last_session_date === today ? (data.sessions_completed_today ?? 0) : 0
          setStats({
            streak: data.current_streak ?? 0,
            sessionsToday,
            dailyGoal: data.daily_sessions_goal ?? DEFAULT_GOAL,
            lastSessionDate: data.last_session_date ?? null,
            goalJustReached: false,
          })
        }
        setIsLoadingSettings(false)
      })
  }, [user?.id])

  const saveDurations = (durations: PomodoroDurations) => {
    if (!user) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase.from('user_settings').upsert(
        { id: user.id, pomodoro_focus_time: durations.focus, pomodoro_break_time: durations.break },
        { onConflict: 'id' }
      )
      if (error) { setSaveStatus('error'); return }
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 800)
  }

  const saveDailyGoal = useCallback((goal: number) => {
    if (!user) return
    const clamped = Math.max(1, Math.min(20, goal))
    setStats((prev) => ({ ...prev, dailyGoal: clamped }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase.from('user_settings').upsert(
        { id: user.id, daily_sessions_goal: clamped },
        { onConflict: 'id' }
      )
      if (error) { setSaveStatus('error'); return }
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 800)
  }, [user])

  // Called after the focus session + user fills in pages/chapters
  const completeSession = useCallback(async (payload: SessionPayload): Promise<SessionResult> => {
    if (!user) return { xpGained: 0, newMedals: [] }

    const xpGained = calcXP(payload.durationMinutes, payload.pages, payload.chapters, payload.maintainedFocus)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

    // ── Fetch current user_stats to check medal conditions ──
    const { data: currentStats } = await supabase
      .from('user_stats')
      .select('total_xp, sessions_count, focused_sessions, total_pages')
      .eq('user_id', user.id)
      .single()

    const prevXP = currentStats?.total_xp ?? 0
    const newXP = prevXP + xpGained
    const newSessions = (currentStats?.sessions_count ?? 0) + 1
    const newFocused = (currentStats?.focused_sessions ?? 0) + (payload.maintainedFocus ? 1 : 0)
    const newPages = (currentStats?.total_pages ?? 0) + payload.pages

    // ── Upsert user_stats ──
    await supabase.from('user_stats').upsert(
      {
        user_id: user.id,
        total_xp: newXP,
        sessions_count: newSessions,
        focused_sessions: newFocused,
        total_pages: newPages,
        total_chapters: payload.chapters,
      },
      { onConflict: 'user_id' }
    )

    // ── Update streak ──
    let newStreak = stats.streak
    let newSessionsToday: number
    if (stats.lastSessionDate === today) {
      newSessionsToday = stats.sessionsToday + 1
    } else if (stats.lastSessionDate === yesterday) {
      newStreak = stats.streak + 1
      newSessionsToday = 1
    } else {
      newStreak = 1
      newSessionsToday = 1
    }
    const goalJustReached = newSessionsToday === stats.dailyGoal

    await supabase.from('user_settings').upsert(
      { id: user.id, current_streak: newStreak, sessions_completed_today: newSessionsToday, last_session_date: today },
      { onConflict: 'id' }
    )

    setStats((prev) => ({
      ...prev, streak: newStreak, sessionsToday: newSessionsToday, lastSessionDate: today, goalJustReached,
    }))

    // ── Check medals ──
    const { data: existingMedals } = await supabase
      .from('user_medals')
      .select('medal_key')
      .eq('user_id', user.id)

    const alreadyUnlocked = new Set((existingMedals ?? []).map((r: { medal_key: string }) => r.medal_key))
    const toUnlock = checkMedalConditions({
      sessionsCount: newSessions,
      focusedSessions: newFocused,
      streak: newStreak,
      totalXP: newXP,
      totalPages: newPages,
      isFirstFollow: false,
      isFirstInsight: false,
    }, alreadyUnlocked)

    if (toUnlock.length > 0) {
      await supabase.from('user_medals').upsert(
        toUnlock.map((key) => ({ user_id: user.id, medal_key: key, is_featured: false })),
        { onConflict: 'user_id,medal_key', ignoreDuplicates: true }
      )
    }

    const newMedals = toUnlock.flatMap((key) => MEDALS.find((m) => m.key === key) ?? [])
    return { xpGained, newMedals }
  }, [user, stats])

  useEffect(() => {
    if (!stats.goalJustReached) return
    const t = setTimeout(() => setStats((prev) => ({ ...prev, goalJustReached: false })), 5000)
    return () => clearTimeout(t)
  }, [stats.goalJustReached])

  return { initialDurations, isLoadingSettings, saveStatus, saveDurations, stats, saveDailyGoal, completeSession }
}
