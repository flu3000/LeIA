import { Stack } from 'expo-router'

// Registra o grupo (auth) como navigator — sem esse arquivo o Expo Router
// não reconhece o segmento "(auth)" e emite o aviso "No route named (auth)".
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
