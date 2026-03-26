import '../global.css'
import 'react-native-reanimated'

import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { supabase } from '@/src/lib/supabase'

import { AuthProvider, useAuth } from '@/src/context/AuthContext'

// Mantém o splash nativo visível até decidirmos qual tela mostrar
SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { user, isLoading } = useAuth()
  const segments  = useSegments()
  const router    = useRouter()

  // Esconde o splash assim que o estado de auth for conhecido
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync()
  }, [isLoading])

  // Fallback: captura deep links OAuth que chegam enquanto o app está em foreground
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] URL recebida:', url)
      if (!url) return
      supabase.auth.exchangeCodeForSession(url)
        .then(({ data, error }) => {
          if (error) console.error('[DeepLink] exchangeCodeForSession error:', error.message)
          else       console.log('[DeepLink] sessão criada, user:', data.session?.user?.id ?? null)
        })
        .catch((e: unknown) => console.error('[DeepLink] erro inesperado:', e))
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup   = segments[0] === '(auth)'
    const inOnboarding  = segments[0] === '(auth)' && segments[1] === 'onboarding'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && !user.hasCompletedProfile && !inOnboarding) {
      router.replace('/(auth)/onboarding')
    } else if (user && user.hasCompletedProfile && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [user, isLoading, segments])

  // Enquanto o Supabase lê o token do SecureStore, mostra um spinner no escuro.
  // Isso evita qualquer flash da tela de login para usuários já autenticados.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#131f24', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    )
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)"  options={{ headerShown: false }} />
        <Stack.Screen
          name="topic/[id]"
          options={{
            headerShown: true,
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
            headerShown: true,
            title: 'Insights',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="rankings"
          options={{
            headerShown: true,
            title: 'Rankings',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="friends"
          options={{
            headerShown: true,
            title: 'Amigos',
            headerStyle:      { backgroundColor: '#131f24' },
            headerTintColor:  '#F0EEE6',
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            headerBackTitle:  'Voltar',
            presentation:     'card',
          }}
        />
        <Stack.Screen
          name="communities"
          options={{
            headerShown: true,
            title: 'Comunidades',
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#131f24' }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
