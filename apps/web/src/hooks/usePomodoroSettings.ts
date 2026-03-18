import { useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import type { PomodoroDurations } from './usePomodoro'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEFAULT: PomodoroDurations = { focus: 25, break: 5 }

export function usePomodoroSettings() {
  const { user } = useAuth()
  const [initialDurations, setInitialDurations] = useState<PomodoroDurations>(DEFAULT)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load settings from Supabase when the user is available
  useEffect(() => {
    if (!user) {
      setIsLoadingSettings(false)
      return
    }

    supabase
      .from('user_settings')
      .select('pomodoro_focus_time, pomodoro_break_time')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        // PGRST116 = no rows found → use defaults (upsert happens on first save)
        if (data && !error) {
          setInitialDurations({
            focus: data.pomodoro_focus_time ?? DEFAULT.focus,
            break: data.pomodoro_break_time ?? DEFAULT.break,
          })
        }
        setIsLoadingSettings(false)
      })
  }, [user?.id])

  // Debounced upsert — called whenever the user changes a duration
  const saveDurations = (durations: PomodoroDurations) => {
    if (!user) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')

    debounceRef.current = setTimeout(async () => {
      const { error } = await supabase.from('user_settings').upsert(
        {
          id: user.id,
          pomodoro_focus_time: durations.focus,
          pomodoro_break_time: durations.break,
        },
        { onConflict: 'id' }
      )

      if (error) {
        setSaveStatus('error')
        return
      }

      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 800)
  }

  return { initialDurations, isLoadingSettings, saveStatus, saveDurations }
}
