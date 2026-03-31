import '../global.css'
import 'react-native-reanimated'

import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { supabase } from '@/src/lib/supabase'

import { AuthProvider, useAuth } from '@/src/context/AuthContext'
import { LoadingScreen } from '@/src/components/LoadingScreen'

// Mantém o splash nativo visível até o Gatekeeper dar o sinal verde
SplashScreen.preventAutoHideAsync()

// ── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** true se a URL contiver tokens de auth (implicit ou PKCE). */
function hasAuthTokens(url: string): boolean {
  return url.includes('access_token=') || url.includes('code=')
}

/**
 * Processa uma URL de deep link de autenticação.
 *
 * - Implicit flow: extrai #access_token= e #refresh_token= do hash
 * - PKCE fallback: extrai ?code= dos query params
 * - Retry automático (até 3x, backoff 500 ms) em caso de Network request failed
 * - Fallback: se setSession falhar mas getSession() já tem sessão → ok silencioso
 */
async function handleAuthUrl(url: string): Promise<void> {
  console.log('[DeepLink] processando:', url)

  const retrySetSession = async (access_token: string, refresh_token: string): Promise<void> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) throw error
        console.log('[DeepLink] sessão via implicit flow criada com sucesso')
        return
      } catch (e) {
        const isNetwork = e instanceof Error && e.message.toLowerCase().includes('network')
        if (isNetwork && attempt < 3) {
          console.warn(`[DeepLink] rede instável, tentativa ${attempt}/3 em ${500 * attempt}ms…`)
          await sleep(500 * attempt)
        } else {
          throw e
        }
      }
    }
  }

  const retryExchangeCode = async (): Promise<void> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(url)
        if (error) throw error
        console.log('[DeepLink] sessão via PKCE criada com sucesso')
        return
      } catch (e) {
        const isNetwork = e instanceof Error && e.message.toLowerCase().includes('network')
        if (isNetwork && attempt < 3) {
          console.warn(`[DeepLink] rede instável (PKCE), tentativa ${attempt}/3 em ${500 * attempt}ms…`)
          await sleep(500 * attempt)
        } else {
          throw e
        }
      }
    }
  }

  try {
    // Implicit flow — tokens no hash fragment
    const hashIndex = url.indexOf('#')
    if (hashIndex !== -1) {
      const hash   = url.slice(hashIndex + 1)
      const params = new URLSearchParams(hash)
      const access_token  = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await retrySetSession(access_token, refresh_token)
        return
      }
    }

    // PKCE fallback — code nos query params
    const queryIndex = url.indexOf('?')
    if (queryIndex !== -1) {
      const query  = url.slice(queryIndex + 1)
      const params = new URLSearchParams(query)
      if (params.get('code')) {
        await retryExchangeCode()
        return
      }
    }

    console.warn('[DeepLink] URL sem tokens nem code:', url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[DeepLink] erro:', msg)

    // Fallback: talvez o setSession tenha falhado mas a sessão foi
    // salva silenciosamente. Se getSession() retornar uma sessão válida,
    // o onAuthStateChange já vai cuidar do resto — não exibimos erro.
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[DeepLink] sessão recuperada via getSession() após erro de rede')
        return
      }
    } catch {
      // getSession também falhou — sessão realmente não existe
    }

    Alert.alert('Erro de autenticação', msg, [{ text: 'OK' }])
  }
}

// ── Gatekeeper ───────────────────────────────────────────────────────────────

function RootLayoutNav() {
  const { user, isLoading } = useAuth()
  const segments = useSegments()
  const router   = useRouter()

  /**
   * null  → ainda verificando a URL inicial (estado indeterminado)
   * true  → processando tokens de deep link (aguardar confirmação do Supabase)
   * false → nenhum link pendente
   */
  const [isProcessingLink, setIsProcessingLink] = useState<boolean | null>(null)

  /**
   * false → navegação ainda não foi decidida (Stack não deve aparecer)
   * true  → rota correta foi definida, Stack pode ser renderizada
   */
  const [isReady, setIsReady] = useState(false)

  // Portão combinado:
  //   isLoading         → AuthContext ainda aguarda confirmação da sessão + perfil
  //   isProcessingLink  → deep link ainda sendo processado (null = incerto = bloqueado)
  //   !isReady          → router.replace() ainda não foi chamado
  const isGated = isLoading || isProcessingLink !== false || !isReady

  // ── Cold-start: app estava fechado quando o link chegou ──────────────────
  // getInitialURL() NUNCA pode ficar pendente indefinidamente — usamos um timeout
  // de 1,5 s como segurança. Se jogar erro ou demorar demais, liberamos o portão.
  useEffect(() => {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))

    Promise.race([Linking.getInitialURL(), timeout])
      .then((url) => {
        if (url && hasAuthTokens(url)) {
          setIsProcessingLink(true)
          handleAuthUrl(url).finally(() => setIsProcessingLink(false))
        } else {
          setIsProcessingLink(false)
        }
      })
      .catch(() => setIsProcessingLink(false))
  }, [])

  // ── Foreground: app estava aberto quando o link chegou ───────────────────
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && hasAuthTokens(url)) {
        setIsProcessingLink(true)
        handleAuthUrl(url).finally(() => setIsProcessingLink(false))
      }
    })
    return () => sub.remove()
  }, [])

  // ── Decisão de rota ───────────────────────────────────────────────────────
  // Só executa quando TODOS os portões estiverem abertos:
  //   1. isLoading = false   (sessão + perfil confirmados)
  //   2. isProcessingLink = false   (nenhum deep link em voo)
  useEffect(() => {
    if (isLoading || isProcessingLink !== false) return

    const inAuthGroup = segments[0] === '(auth)'
    const inAppGroup  = segments[0] === '(app)'


    if (!user) {
      if (!inAuthGroup) {
        console.log('[Nav] → /(auth)/login');
        router.replace('/(auth)/login');
      }
    } else {
      console.log(
        '[Nav] user:', user.email,
        '| hasProfile:', user.hasCompletedProfile,
        '| seg:', segments.join('/') || '(root)',
      )
      if (inAuthGroup || !inAppGroup) {
        const target = user.hasCompletedProfile ? '/(app)' : '/(auth)/onboarding'
        console.log('[Nav] →', target, 'teste terminal')
        router.replace(target as never)
      }
    }

    // Esconde o splash nativo DEPOIS que a navegação foi decidida.
    // setIsReady(true) libera a Stack — que já estará na rota correta.
    SplashScreen.hideAsync().catch(() => {})
    setIsReady(true)
  }, [user, isLoading, isProcessingLink, segments])

  // LoadingScreen cobre todos os estados de espera:
  //   - sessão Supabase ainda carregando
  //   - deep link sendo processado (incluindo retries de rede)
  //   - router.replace() ainda não foi chamado
  if (isGated) return <LoadingScreen />

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)"  options={{ headerShown: false }} />
        <Stack.Screen
          name="topic/[id]"
          options={{
            headerShown:      true,
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="insights"
          options={{
            headerShown:      true,
            title:            'Insights',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="library/book/[id]"
          options={{
            headerShown:      true,
            title:            '',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="library/pillar/[id]"
          options={{
            headerShown:      true,
            title:            '',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="library/category/[id]"
          options={{
            headerShown:      true,
            title:            '',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#131f24' }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
