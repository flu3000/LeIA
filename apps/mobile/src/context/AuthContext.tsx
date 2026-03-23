import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
  username?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: { name?: string; username?: string; bio?: string; avatarUrl?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function loadUser(supabaseUser: SupabaseUser): Promise<User> {
  const meta = supabaseUser.user_metadata ?? {}
  const metaName = meta.full_name ?? meta.name ?? supabaseUser.email?.split('@')[0] ?? 'Usuário'

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('display_name, username, avatar_url, bio')
    .eq('id', supabaseUser.id)
    .maybeSingle()

  if (error) console.error('[loadUser]', error)

  if (settings && !settings.display_name) {
    await supabase
      .from('user_settings')
      .update({ display_name: metaName })
      .eq('id', supabaseUser.id)
  }

  return {
    id:        supabaseUser.id,
    name:      settings?.display_name ?? metaName,
    email:     supabaseUser.email ?? '',
    avatarUrl: settings?.avatar_url ?? undefined,
    joinedAt:  supabaseUser.created_at,
    username:  settings?.username ?? undefined,
    bio:       settings?.bio ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setUser(session?.user ? await loadUser(session.user) : null)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user).then(setUser)
      } else {
        setUser(null)
      }
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

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshUser = async () => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (supaUser) setUser(await loadUser(supaUser))
  }

  const updateProfile = async (data: { name?: string; username?: string; bio?: string; avatarUrl?: string }) => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (!supaUser) throw new Error('Not authenticated')

    const settingsUpdate: Record<string, string> = {}
    if (data.name      !== undefined) settingsUpdate.display_name = data.name.trim()
    if (data.username  !== undefined) settingsUpdate.username     = data.username.toLowerCase().trim()
    if (data.bio       !== undefined) settingsUpdate.bio          = data.bio
    if (data.avatarUrl !== undefined) settingsUpdate.avatar_url   = data.avatarUrl

    if (Object.keys(settingsUpdate).length > 0) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ id: supaUser.id, ...settingsUpdate }, { onConflict: 'id' })

      if (error) {
        if (error.code === '23505' || error.message?.toLowerCase().includes('unique')) {
          const err = new Error('USERNAME_TAKEN') as Error & { code: string }
          err.code = 'USERNAME_TAKEN'
          throw err
        }
        throw error
      }
    }

    await refreshUser()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
