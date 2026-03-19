import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function applyTheme(t: Theme) {
  if (t === 'light') {
    document.documentElement.classList.add('light')
  } else {
    document.documentElement.classList.remove('light')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>('dark')

  // Apply cached theme immediately to avoid flash on page load
  useEffect(() => {
    const cached = localStorage.getItem('leia_theme') as Theme | null
    if (cached === 'light' || cached === 'dark') {
      setThemeState(cached)
      applyTheme(cached)
    }
  }, [])

  // Sync with Supabase once user is authenticated
  useEffect(() => {
    if (!user) return
    supabase
      .from('user_settings')
      .select('theme')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const t: Theme = data?.theme === 'light' ? 'light' : 'dark'
        setThemeState(t)
        applyTheme(t)
        localStorage.setItem('leia_theme', t)
      })
  }, [user?.id])

  const setTheme = async (t: Theme) => {
    setThemeState(t)
    applyTheme(t)
    localStorage.setItem('leia_theme', t)
    if (!user) return
    await supabase
      .from('user_settings')
      .upsert({ id: user.id, theme: t }, { onConflict: 'id' })
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
