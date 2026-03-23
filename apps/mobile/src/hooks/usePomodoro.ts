import { useState, useEffect, useCallback, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export type PomodoroMode = 'focus' | 'break'

export interface PomodoroDurations {
  focus: number  // minutes
  break: number  // minutes
}

export interface FocusSessionData {
  durationMinutes: number
  maintainedFocus: boolean
}

const DEFAULT_DURATIONS: PomodoroDurations = { focus: 25, break: 5 }

export function usePomodoro(onFocusComplete?: (data: FocusSessionData) => void) {
  const [durations, setDurationsState] = useState<PomodoroDurations>(DEFAULT_DURATIONS)
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [focusInterrupted, setFocusInterrupted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appLeftRef = useRef(false)
  const durationAtStartRef = useRef(DEFAULT_DURATIONS.focus)

  // Keep callback ref fresh
  const onFocusCompleteRef = useRef(onFocusComplete)
  useEffect(() => { onFocusCompleteRef.current = onFocusComplete }, [onFocusComplete])

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  // Mobile app-background anti-cheat
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && isRunning && mode === 'focus') {
        setIsRunning(false)
        appLeftRef.current = true
        setFocusInterrupted(true)
      }
    })
    return () => subscription.remove()
  }, [isRunning, mode])

  // Timer tick
  useEffect(() => {
    if (!isRunning) { clearTimer(); return }

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer()
          setIsRunning(false)
          setMode((currentMode) => {
            if (currentMode === 'focus') {
              setSessions((s) => s + 1)
              onFocusCompleteRef.current?.({
                durationMinutes: durationAtStartRef.current,
                maintainedFocus: !appLeftRef.current,
              })
            }
            const next: PomodoroMode = currentMode === 'focus' ? 'break' : 'focus'
            setDurationsState((d) => {
              setTimeLeft(d[next] * 60)
              return d
            })
            return next
          })
          return 0
        }
        return t - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning])

  const start = useCallback(() => {
    if (mode === 'focus') {
      appLeftRef.current = false
      setFocusInterrupted(false)
      setDurationsState((d) => { durationAtStartRef.current = d.focus; return d })
    }
    setIsRunning(true)
  }, [mode])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setFocusInterrupted(false)
    appLeftRef.current = false
    setDurationsState((d) => { setTimeLeft(d[mode] * 60); return d })
  }, [mode])

  const switchMode = useCallback((m: PomodoroMode) => {
    setIsRunning(false)
    setMode(m)
    setFocusInterrupted(false)
    appLeftRef.current = false
    setDurationsState((d) => { setTimeLeft(d[m] * 60); return d })
  }, [])

  const loadDurations = useCallback((d: PomodoroDurations) => {
    setIsRunning(false)
    setMode('focus')
    setDurationsState(d)
    setTimeLeft(d.focus * 60)
  }, [])

  const setDuration = useCallback((m: PomodoroMode, minutes: number) => {
    const min = m === 'focus' ? 5 : 1
    const clamped = Math.max(min, Math.min(90, minutes))
    setDurationsState((prev) => {
      const next = { ...prev, [m]: clamped }
      setMode((currentMode) => {
        if (currentMode === m && !isRunning) setTimeLeft(clamped * 60)
        return currentMode
      })
      return next
    })
  }, [isRunning])

  const dismissInterrupted = useCallback(() => setFocusInterrupted(false), [])

  const totalSeconds = durations[mode] * 60
  const minutes  = Math.floor(timeLeft / 60)
  const seconds  = timeLeft % 60
  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 0

  return {
    mode, durations, minutes, seconds, isRunning, sessions, progress,
    focusInterrupted,
    start, pause, reset, switchMode, setDuration, loadDurations, dismissInterrupted,
  }
}
