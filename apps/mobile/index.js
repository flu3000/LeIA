// Polyfill de crypto.getRandomValues() — deve vir ANTES de qualquer import
// do Supabase ou expo-auth-session para que o PKCE (sha256) funcione no Hermes.
import 'react-native-get-random-values'
import 'expo-router/entry'