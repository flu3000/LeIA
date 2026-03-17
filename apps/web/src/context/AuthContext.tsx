import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface User {
  name: string
  email: string
  joinedAt: string
}

export type OAuthProvider = 'google' | 'apple'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'portal_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      // ignore malformed data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persist = (u: User) => {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const login = async (email: string, _password: string) => {
    // TODO: replace with real Supabase auth call
    await new Promise((r) => setTimeout(r, 900))

    const name = email.split('@')[0].replace(/[._]/g, ' ')
    const capitalized = name
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

    persist({ name: capitalized, email, joinedAt: new Date().toISOString() })
  }

  const register = async (name: string, email: string, _password: string) => {
    // TODO: replace with real Supabase auth call
    await new Promise((r) => setTimeout(r, 1100))
    persist({ name, email, joinedAt: new Date().toISOString() })
  }

  const loginWithOAuth = async (provider: OAuthProvider) => {
    // TODO: replace with real Supabase OAuth call:
    //   await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } })
    await new Promise((r) => setTimeout(r, 1200))

    const mockAccounts: Record<OAuthProvider, User> = {
      google: { name: 'Usuário Google', email: 'usuario@gmail.com', joinedAt: new Date().toISOString() },
      apple:  { name: 'Usuário Apple',  email: 'usuario@icloud.com', joinedAt: new Date().toISOString() },
    }
    persist(mockAccounts[provider])
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithOAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
