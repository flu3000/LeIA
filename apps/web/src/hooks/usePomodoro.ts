import { useState, useEffect, useCallback, useRef } from 'react'

export type PomodoroMode = 'focus' | 'break'

export interface PomodoroDurations {
  focus: number // minutes
  break: number // minutes
}

export interface FocusSessionData {
  durationMinutes: number
  maintainedFocus: boolean // true if user never left the tab
}

const DEFAULT_DURATIONS: PomodoroDurations = { focus: 25, break: 5 }

export function usePomodoro(onFocusComplete?: (data: FocusSessionData) => void) {
  const [durations, setDurationsState] = useState<PomodoroDurations>(DEFAULT_DURATIONS)
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [tabLeft, setTabLeft] = useState(false)          // true if user left tab at least once during focus
  const [focusInterrupted, setFocusInterrupted] = useState(false)  // shown as warning UI
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tabLeftRef = useRef(false)                       // ref for use inside setInterval callback
  const durationAtStartRef = useRef(DEFAULT_DURATIONS.focus) // minutes at focus start

  // Keep callback ref fresh to avoid stale closures
  const onFocusCompleteRef = useRef(onFocusComplete)
  useEffect(() => { onFocusCompleteRef.current = onFocusComplete }, [onFocusComplete])

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  // ── Tab visibility anti-cheat ──────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunning && mode === 'focus') {
        // Pause the timer and flag that focus was broken
        setIsRunning(false)
        setTabLeft(true)
        setFocusInterrupted(true)
        tabLeftRef.current = true
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRunning, mode])

  // ── Timer tick ─────────────────────────────────────────
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
                maintainedFocus: !tabLeftRef.current,
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
    // Record focus start state
    if (mode === 'focus') {
      tabLeftRef.current = false
      setTabLeft(false)
      setFocusInterrupted(false)
      setDurationsState((d) => { durationAtStartRef.current = d.focus; return d })
    }
    setIsRunning(true)
  }, [mode])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTabLeft(false)
    setFocusInterrupted(false)
    tabLeftRef.current = false
    setDurationsState((d) => { setTimeLeft(d[mode] * 60); return d })
  }, [mode])

  const switchMode = useCallback((m: PomodoroMode) => {
    setIsRunning(false)
    setMode(m)
    setTabLeft(false)
    setFocusInterrupted(false)
    tabLeftRef.current = false
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
        if (currentMode === m) {
          setIsRunning((running) => { if (!running) setTimeLeft(clamped * 60); return running })
        }
        return currentMode
      })
      return next
    })
  }, [])

  const dismissInterrupted = useCallback(() => setFocusInterrupted(false), [])

  const totalSeconds = durations[mode] * 60
  const minutes  = Math.floor(timeLeft / 60)
  const seconds  = timeLeft % 60
  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 0

  return {
    mode, durations, minutes, seconds, isRunning, sessions, progress,
    tabLeft, focusInterrupted,
    start, pause, reset, switchMode, setDuration, loadDurations, dismissInterrupted,
  }
}
