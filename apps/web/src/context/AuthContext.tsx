import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
  username?: string
  bio?: string
  city?: string
  state?: string
}

export type OAuthProvider = 'google' | 'apple'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: { name?: string; username?: string; bio?: string; avatarUrl?: string; city?: string; state?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// user_settings is the SOLE source of truth for display_name, username, avatar_url, bio, city, state.
// auth.user_metadata is used as fallback ONLY when user_settings has no display_name yet.
async function loadUser(supabaseUser: SupabaseUser): Promise<User> {
  const meta = supabaseUser.user_metadata ?? {}
  const metaName = meta.full_name ?? meta.name ?? supabaseUser.email?.split('@')[0] ?? 'Usuário'

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('display_name, username, avatar_url, bio, city, state')
    .eq('id', supabaseUser.id)
    .maybeSingle()

  if (settingsError) console.error('[loadUser] user_settings fetch:', settingsError)

  // If display_name is missing from user_settings (old account / just registered),
  // back-fill it once so other users can read their name too.
  if (settings && !settings.display_name) {
    await supabase
      .from('user_settings')
      .update({ display_name: metaName })
      .eq('id', supabaseUser.id)
  }

  return {
    id: supabaseUser.id,
    name: settings?.display_name ?? metaName,
    email: supabaseUser.email ?? '',
    avatarUrl: settings?.avatar_url ?? undefined,
    joinedAt: supabaseUser.created_at,
    username: settings?.username ?? undefined,
    bio: settings?.bio ?? undefined,
    city: settings?.city ?? undefined,
    state: settings?.state ?? undefined,
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

  const loginWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
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

  const updateProfile = async (data: { name?: string; username?: string; bio?: string; avatarUrl?: string; city?: string; state?: string }) => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (!supaUser) throw new Error('Not authenticated')

    // ── Step 1: Persist to user_settings (source of truth) ──────────────
    const settingsUpdate: Record<string, string> = {}
    if (data.name      !== undefined) settingsUpdate.display_name = data.name.trim()
    if (data.username  !== undefined) settingsUpdate.username     = data.username.toLowerCase().trim()
    if (data.bio       !== undefined) settingsUpdate.bio          = data.bio
    if (data.avatarUrl !== undefined) settingsUpdate.avatar_url   = data.avatarUrl
    if (data.city      !== undefined) settingsUpdate.city         = data.city.trim()
    if (data.state     !== undefined) settingsUpdate.state        = data.state.trim()

    if (Object.keys(settingsUpdate).length > 0) {
      const { error: dbError } = await supabase
        .from('user_settings')
        .upsert({ id: supaUser.id, ...settingsUpdate }, { onConflict: 'id' })

      if (dbError) {
        console.error('Erro detalhado do Supabase (user_settings):', dbError)
        if (
          dbError.code === '23505' ||
          dbError.message?.toLowerCase().includes('duplicate') ||
          dbError.message?.toLowerCase().includes('unique')
        ) {
          const err = new Error('USERNAME_TAKEN') as Error & { code: string }
          err.code = 'USERNAME_TAKEN'
          throw err
        }
        throw dbError
      }
    }

    // ── Step 2: Sync cache in auth.user_metadata ─────────────────────────
    const metaUpdate: Record<string, string> = {}
    if (data.name      !== undefined) { metaUpdate.full_name = data.name; metaUpdate.name = data.name }
    if (data.username  !== undefined) metaUpdate.username  = data.username.toLowerCase().trim()
    if (data.bio       !== undefined) metaUpdate.bio       = data.bio
    if (data.avatarUrl !== undefined) metaUpdate.avatar_url = data.avatarUrl

    if (Object.keys(metaUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({ data: metaUpdate })
      // Non-fatal: DB was already saved; just log the cache miss
      if (authError) console.error('Aviso: cache auth.user_metadata não sincronizado:', authError)
    }

    await refreshUser()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithOAuth, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
