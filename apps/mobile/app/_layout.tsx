import '../global.css'
import 'react-native-reanimated'

import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AuthProvider, useAuth } from '@/src/context/AuthContext'

function RootLayoutNav() {
  const { user, isLoading } = useAuth()
  const segments  = useSegments()
  const router    = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(app)')
    }
  }, [user, isLoading, segments])

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
