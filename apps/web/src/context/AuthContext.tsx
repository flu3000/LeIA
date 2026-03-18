import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
}

export type OAuthProvider = 'google' | 'apple'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function mapUser(supabaseUser: SupabaseUser): User {
  const meta = supabaseUser.user_metadata ?? {}
  const rawName: string =
    meta.full_name ?? meta.name ?? supabaseUser.email?.split('@')[0] ?? 'Usuário'

  return {
    id: supabaseUser.id,
    name: rawName,
    email: supabaseUser.email ?? '',
    avatarUrl: meta.avatar_url ?? meta.picture ?? undefined,
    joinedAt: supabaseUser.created_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load existing session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ? mapUser(session.user) : null)
      })
      .catch(() => {
        // Supabase não configurado ou erro de rede — continua sem usuário
      })
      .finally(() => {
        setIsLoading(false)
      })

    // Listen for auth state changes (login, logout, token refresh, OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, full_name: name } },
    })
    if (error) throw error
  }

  const loginWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
    // Supabase redirects the browser to the provider — no further action needed here
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
