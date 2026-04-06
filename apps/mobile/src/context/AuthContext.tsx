/* import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import Constants from 'expo-constants';
import { supabase } from '@/src/lib/supabase'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
  username?: string
  bio?: string
  hasCompletedProfile: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithEmail: (email: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  patchUser: (patch: Partial<User>) => void
  updateProfile: (data: {
    name?: string
    username?: string
    bio?: string
    avatarUrl?: string
    city?: string
    state?: string
    country?: string
    isPublic?: boolean
    theme?: string
  }) => Promise<void>
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

  const username = settings?.username ?? undefined
  const hasCompletedProfile = Boolean(username && username.trim().length > 0)

  return {
    id:                  supabaseUser.id,
    name:                settings?.display_name ?? metaName,
    email:               supabaseUser.email ?? '',
    avatarUrl:           settings?.avatar_url ?? undefined,
    joinedAt:            supabaseUser.created_at,
    username,
    bio:                 settings?.bio ?? undefined,
    hasCompletedProfile,
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Padrão recomendado pelo Supabase para React Native:
    // onAuthStateChange dispara INITIAL_SESSION ao subscribir, mesmo sem sessão ativa.
    // Isso garante que setIsLoading(false) SEMPRE é chamado, independente do SecureStore.
    // NÃO chamamos getSession() separadamente — evita race condition e travamento de Keychain.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth]', event, session?.user?.id ?? 'no user')

        if (!session?.user) {
          await sleep(1000)
          setUser(null)
          setIsLoading(false)
          return
        }

        // Atualizações silenciosas — token refresh ou alteração de dados do usuário.
        // Não bloqueiam a UI: apenas atualizam o user em background.
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          loadUser(session.user)
            .then(setUser)
            .catch((e) => console.warn('[Auth] silent reload:', e))
          return
        }

        // INITIAL_SESSION / SIGNED_IN
        // Prioridade 1: user básico do JWT — sem I/O, sem rede.
        // Destrava a tela imediatamente; hasCompletedProfile = false até o DB confirmar.
        
        // testando comentar isso aqui pra arrumar a bosta da tela piscando
        // const meta = session.user.user_metadata ?? {}
        //setUser({
        //  id:                  session.user.id,
        //  email:               session.user.email ?? '',
        //  name:                meta.full_name ?? meta.name ?? session.user.email?.split('@')[0] ?? 'Usuário',
        //  joinedAt:            session.user.created_at,
        //  hasCompletedProfile: false,
        //})

        // Prioridade 2: perfil completo do banco — isLoading cai no finally,
        // garantindo que o portão sempre abre, mesmo se o DB falhar.
        loadUser(session.user)
          .then((full) => {
            console.log('[Auth] Finalizando loading. User:', true, 'HasProfile:', full.hasCompletedProfile)
            setUser(full)
          })
          .catch((e) => {
            console.warn('[Auth] loadUser falhou, mantendo dados do JWT:', e)
            console.log('[Auth] Finalizando loading. User:', true, 'HasProfile:', false)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const debuggerHost = Constants.expoConfig?.hostUri;

  const redirectTo = debuggerHost 
  ? `exp://${debuggerHost}:8081/(app)` 
  : `https://google.com`;

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Linking.createURL('/') gera exp://IP:8081/--/ no Expo Go.
      // Evita "Unmatched route" — rota '/' existe; tokens chegam no hash '#'.
      options: { emailRedirectTo: redirectTo },
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

  const updateProfile = async (data: {
    name?: string
    username?: string
    bio?: string
    avatarUrl?: string
    city?: string
    state?: string
    country?: string
    isPublic?: boolean
    theme?: string
  }) => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (!supaUser) throw new Error('Not authenticated')

    const settingsUpdate: Record<string, unknown> = {}
    if (data.name      !== undefined) settingsUpdate.display_name = data.name.trim()
    if (data.username  !== undefined) settingsUpdate.username     = data.username.toLowerCase().trim()
    if (data.bio       !== undefined) settingsUpdate.bio          = data.bio
    if (data.avatarUrl !== undefined) settingsUpdate.avatar_url   = data.avatarUrl
    if (data.city      !== undefined) settingsUpdate.city         = data.city
    if (data.state     !== undefined) settingsUpdate.state        = data.state
    if (data.country   !== undefined) settingsUpdate.country      = data.country
    if (data.isPublic  !== undefined) settingsUpdate.is_public    = data.isPublic
    if (data.theme     !== undefined) settingsUpdate.theme        = data.theme

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

  const patchUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, logout, refreshUser, patchUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
} */

  import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import Constants from 'expo-constants';
import { supabase } from '@/src/lib/supabase'
import { colors } from '../constants/colors';

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  joinedAt: string
  username?: string
  bio?: string
  hasCompletedProfile: boolean
  theme?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signInWithEmail: (email: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  patchUser: (patch: Partial<User>) => void
  updateProfile: (data: {
    name?: string
    username?: string
    bio?: string
    avatarUrl?: string
    city?: string
    state?: string
    country?: string
    isPublic?: boolean
    theme?: string
  }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function loadUser(supabaseUser: SupabaseUser): Promise<User> {
  const meta = supabaseUser.user_metadata ?? {}
  const metaName = meta.full_name ?? meta.name ?? supabaseUser.email?.split('@')[0] ?? 'Usuário'

  const { data: settings, error } = await supabase
    .from('user_settings')
    .select('display_name, username, avatar_url, bio, theme')
    .eq('id', supabaseUser.id)
    .maybeSingle()

  if (error) console.error('[loadUser]', error)

  if (settings && !settings.display_name) {
    await supabase
      .from('user_settings')
      .update({ display_name: metaName })
      .eq('id', supabaseUser.id)
  }

  const username = settings?.username ?? undefined
  const hasCompletedProfile = Boolean(username && username.trim().length > 0)

  return {
    id:                  supabaseUser.id,
    name:                settings?.display_name ?? metaName,
    email:               supabaseUser.email ?? '',
    avatarUrl:           settings?.avatar_url ?? undefined,
    joinedAt:            supabaseUser.created_at,
    username,
    bio:                 settings?.bio ?? undefined,
    theme:              settings?.theme ?? undefined,
    hasCompletedProfile,
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth]', event, session?.user?.id ?? 'no user')

        if (!session?.user) {
          // await sleep(1000)
          setUser(null)
          setIsLoading(false)
          return
        }

        // Atualizações silenciosas — não bloqueiam a UI.
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          loadUser(session.user)
            .then(setUser)
            .catch((e) => console.warn('[Auth] silent reload:', e))
          return
        }

        // INITIAL_SESSION / SIGNED_IN
        //
        // IMPORTANTE: setIsLoading(true) aqui garante que o Gatekeeper feche o
        // portão enquanto o perfil é buscado no banco. Sem isso, se o app já
        // passou pelo branch "sem sessão" acima (isLoading virou false + user=null)
        // e depois recebe um SIGNED_IN via deep link de magic link, o Gatekeeper
        // veria isLoading=false + user=null e navegaria para /(auth)/login antes
        // do loadUser terminar — causando o piscar de tela indesejado.
        setIsLoading(true)

        loadUser(session.user)
          .then((full) => {
            console.log('[Auth] Finalizando loading. User:', true, 'HasProfile:', full.hasCompletedProfile)
            console.log('[Auth] User token:', session.access_token ? session.access_token : 'none')
            setUser(full)
          })
          .catch((e) => {
            console.warn('[Auth] loadUser falhou, mantendo dados do JWT:', e)
            console.log('[Auth] Finalizando loading. User:', true, 'HasProfile:', false)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const debuggerHost = Constants.expoConfig?.hostUri;

  const redirectTo = debuggerHost
    ? `exp://${debuggerHost}:8081/(app)`
    : `https://google.com`;

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
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

  const updateProfile = async (data: {
    name?: string
    username?: string
    bio?: string
    avatarUrl?: string
    city?: string
    state?: string
    country?: string
    isPublic?: boolean
    theme?: string
  }) => {
    const { data: { user: supaUser } } = await supabase.auth.getUser()
    if (!supaUser) throw new Error('Not authenticated')

    const settingsUpdate: Record<string, unknown> = {}
    if (data.name      !== undefined) settingsUpdate.display_name = data.name.trim()
    if (data.username  !== undefined) settingsUpdate.username     = data.username.toLowerCase().trim()
    if (data.bio       !== undefined) settingsUpdate.bio          = data.bio
    if (data.avatarUrl !== undefined) settingsUpdate.avatar_url   = data.avatarUrl
    if (data.city      !== undefined) settingsUpdate.city         = data.city
    if (data.state     !== undefined) settingsUpdate.state        = data.state
    if (data.country   !== undefined) settingsUpdate.country      = data.country
    if (data.isPublic  !== undefined) settingsUpdate.is_public    = data.isPublic
    if (data.theme     !== undefined) settingsUpdate.theme        = data.theme

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

  const patchUser = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithEmail, logout, refreshUser, patchUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}