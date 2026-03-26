import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
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
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'apple') => Promise<void>
  signInWithGoogleNative: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthStateChange]', event, session?.user?.id ?? null)
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

  const loginWithOAuth = async (provider: 'google' | 'apple') => {
    // String fixa — elimina qualquer variação de IP/porta gerada pelo makeRedirectUri.
    // Deve estar cadastrado no Supabase → Auth → Redirect URLs
    // e no Google Console → Authorized redirect URIs.
    const redirectTo = 'leia-app://auth-callback'

    console.log('[OAuth] provider:', provider)
    console.log('[OAuth] redirectTo:', redirectTo)

    const queryParams: Record<string, string> = {
      access_type: 'offline',
      prompt:      'select_account',
    }

    if (provider === 'google') {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      if (webClientId) {
        queryParams.client_id = webClientId
      } else {
        console.warn('[OAuth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não definido no .env')
      }
    }

    // skipBrowserRedirect: false — o SDK não tenta abrir o browser sozinho em RN
    // (no-op em React Native), mas garante que o flow state é gravado no storage
    // antes de retornar, sem qualquer otimização que pule o await interno.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams,
      },
    })
    if (error) throw error
    if (!data.url) throw new Error('OAuth URL não gerada')

    // Log detalhado — confirma redirect_uri, client_id e code_challenge_method
    console.log('[OAuth] parâmetros da URL enviada ao Google:')
    try {
      const parsed = new URL(data.url)
      ;['redirect_uri', 'client_id', 'code_challenge_method', 'response_type', 'scope'].forEach(k => {
        const v = parsed.searchParams.get(k)
        if (v) console.log(`  ${k} = ${k === 'client_id' ? v.slice(0, 24) + '…' : v}`)
      })
    } catch {
      console.log(' ', data.url)
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    console.log('[OAuth] browser result:', result.type, (result as { url?: string }).url ?? '')

    if (result.type === 'success' && result.url) {
      // Aguarda o sistema de arquivos do iOS/iPad processar os chunks do SecureStore
      // antes de tentar ler o code_verifier para o exchange.
      await new Promise<void>((resolve) => setTimeout(resolve, 500))

      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url)
      if (sessionError) {
        console.error('[OAuth] exchangeCodeForSession error:', sessionError.message)
        throw sessionError
      }
      console.log('[OAuth] sessão criada, user:', sessionData.session?.user?.id ?? null)
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[OAuth] usuário cancelou o fluxo')
    }
  }

  const signInWithGoogleNative = async () => {
    // Configura na primeira chamada — idempotente se já estiver configurado.
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      // scopes extras se precisar de acesso a APIs Google além do perfil básico:
      // scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })

    // Verifica disponibilidade do Google Play Services (Android).
    // No iOS/iPadOS sempre retorna true — a chamada é necessária para a API.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

    const response = await GoogleSignin.signIn()

    // O SDK retorna o idToken dentro de `data` na v14+
    const idToken = response.data?.idToken
    if (!idToken) {
      throw new Error('Google Sign-In não retornou idToken.')
    }

    console.log('[GoogleNative] idToken obtido, enviando ao Supabase…')

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token:    idToken,
    })
    if (error) throw error

    console.log('[GoogleNative] sessão Supabase criada com sucesso.')
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithOAuth, signInWithGoogleNative, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
