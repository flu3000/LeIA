import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/src/services/api'
import { useAuth } from '@/src/context/AuthContext'
import type { PomodoroDurations, FocusSessionData } from './usePomodoro'

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

interface PomodoroSettingsResponse {
  focusTime: number
  breakTime: number
  dailyGoal: number
  streak: number
  sessionsToday: number
  lastSessionDate: string | null
}

interface CompleteSessionResponse {
  streak: number
  sessionsToday: number
  dailyGoal: number
  lastSessionDate: string
  goalJustReached: boolean
  xpGained: number
}

export function usePomodoroSettings() {
  const { user } = useAuth()
  const [initialDurations, setInitialDurations] = useState<PomodoroDurations>(DEFAULT)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stats, setStats] = useState<StreakStats>({
    streak: 0, sessionsToday: 0, dailyGoal: DEFAULT_GOAL, lastSessionDate: null, goalJustReached: false,
  })
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { setIsLoadingSettings(false); return }

    api.get<PomodoroSettingsResponse>('/pomodoro/settings')
      .then(({ data }) => {
        setInitialDurations({ focus: data.focusTime, break: data.breakTime })
        setStats({
          streak:          data.streak,
          sessionsToday:   data.sessionsToday,
          dailyGoal:       data.dailyGoal,
          lastSessionDate: data.lastSessionDate,
          goalJustReached: false,
        })
      })
      .catch((err) => console.error('[usePomodoroSettings] load:', err))
      .finally(() => setIsLoadingSettings(false))
  }, [user?.id])

  const saveDurations = (durations: PomodoroDurations) => {
    if (!user) return
    if (debounceRef.current)   clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await api.put('/pomodoro/settings', { focus: durations.focus, break: durations.break })
        setSaveStatus('saved')
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
      } catch (err) {
        console.error('[usePomodoroSettings] saveDurations:', err)
        setSaveStatus('error')
      }
    }, 800)
  }

  const saveDailyGoal = useCallback((goal: number) => {
    if (!user) return
    const clamped = Math.max(1, Math.min(20, goal))
    setStats((prev) => ({ ...prev, dailyGoal: clamped }))
    if (debounceRef.current)   clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(async () => {
      try {
        await api.put('/pomodoro/goal', { goal: clamped })
        setSaveStatus('saved')
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
      } catch (err) {
        console.error('[usePomodoroSettings] saveDailyGoal:', err)
        setSaveStatus('error')
      }
    }, 800)
  }, [user])

  const completeSession = useCallback(async (sessionData: FocusSessionData): Promise<void> => {
    if (!user) return

    try {
      const { data } = await api.post<CompleteSessionResponse>('/pomodoro/sessions', {
        durationMinutes: sessionData.durationMinutes,
        maintainedFocus: sessionData.maintainedFocus,
      })

      setStats((prev) => ({
        ...prev,
        streak:          data.streak,
        sessionsToday:   data.sessionsToday,
        dailyGoal:       data.dailyGoal,
        lastSessionDate: data.lastSessionDate,
        goalJustReached: data.goalJustReached,
      }))
    } catch (err) {
      console.error('[usePomodoroSettings] completeSession:', err)
    }
  }, [user])

  // Auto-clear goalJustReached after 5s
  useEffect(() => {
    if (!stats.goalJustReached) return
    const t = setTimeout(() => setStats((prev) => ({ ...prev, goalJustReached: false })), 5000)
    return () => clearTimeout(t)
  }, [stats.goalJustReached])

  return { initialDurations, isLoadingSettings, saveStatus, saveDurations, stats, saveDailyGoal, completeSession }
}
