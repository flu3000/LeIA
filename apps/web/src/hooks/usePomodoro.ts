import { useState, useEffect, useCallback, useRef } from 'react'

export type PomodoroMode = 'focus' | 'break'

export interface PomodoroDurations {
  focus: number // minutes
  break: number // minutes
}

const DEFAULT_DURATIONS: PomodoroDurations = { focus: 25, break: 5 }

export function usePomodoro() {
  const [durations, setDurationsState] = useState<PomodoroDurations>(DEFAULT_DURATIONS)
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!isRunning) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer()
          setIsRunning(false)
          setMode((currentMode) => {
            if (currentMode === 'focus') setSessions((s) => s + 1)
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

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setDurationsState((d) => {
      setTimeLeft(d[mode] * 60)
      return d
    })
  }, [mode])

  const switchMode = useCallback((m: PomodoroMode) => {
    setIsRunning(false)
    setMode(m)
    setDurationsState((d) => {
      setTimeLeft(d[m] * 60)
      return d
    })
  }, [])

  // Apply durations loaded from an external source (e.g. Supabase) before the timer starts
  const loadDurations = useCallback((d: PomodoroDurations) => {
    setIsRunning(false)
    setMode('focus')
    setDurationsState(d)
    setTimeLeft(d.focus * 60)
  }, [])

  // Update a single duration; resets the timer for that mode if it's currently active
  const setDuration = useCallback((m: PomodoroMode, minutes: number) => {
    const clamped = Math.max(1, Math.min(90, minutes))
    setDurationsState((prev) => {
      const next = { ...prev, [m]: clamped }
      // If we're changing the active mode and the timer is not running, update timeLeft
      setMode((currentMode) => {
        if (currentMode === m) {
          setIsRunning((running) => {
            if (!running) setTimeLeft(clamped * 60)
            return running
          })
        }
        return currentMode
      })
      return next
    })
  }, [])

  const totalSeconds = durations[mode] * 60
  const minutes  = Math.floor(timeLeft / 60)
  const seconds  = timeLeft % 60
  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 0

  return {
    mode,
    durations,
    minutes,
    seconds,
    isRunning,
    sessions,
    progress,
    start,
    pause,
    reset,
    switchMode,
    setDuration,
    loadDurations,
  }
}
