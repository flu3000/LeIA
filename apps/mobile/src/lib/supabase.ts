import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? ''
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// ─── LargeSecureStore ────────────────────────────────────────────────────────
// ExpoSecureStore tem limite de ~2048 bytes por entrada.
// O flow state PKCE do Supabase excede esse limite, fazendo o setItem falhar
// silenciosamente e o exchange retornar "no valid flow state found".
// Solução: dividir valores grandes em chunks numerados.

const CHUNK_SIZE = 1800 // margem abaixo do limite de 2048

const largeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}.n`)
    if (countStr !== null) {
      const n      = parseInt(countStr, 10)
      const chunks = await Promise.all(
        Array.from({ length: n }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`))
      )
      // Se qualquer chunk sumiu, descarta tudo para evitar JSON corrompido
      if (chunks.some((c) => c === null)) return null
      return chunks.join('')
    }
    return SecureStore.getItemAsync(key)
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      // Valor pequeno: caminho direto, limpa chunks antigos se existirem
      await SecureStore.setItemAsync(key, value)
      await SecureStore.deleteItemAsync(`${key}.n`).catch(() => null)
      return
    }
    // Valor grande: divide em chunks
    const n = Math.ceil(value.length / CHUNK_SIZE)
    await Promise.all([
      SecureStore.setItemAsync(`${key}.n`, String(n)),
      ...Array.from({ length: n }, (_, i) =>
        SecureStore.setItemAsync(
          `${key}.${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        )
      ),
    ])
    // Remove entrada direta antiga se existir
    await SecureStore.deleteItemAsync(key).catch(() => null)
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}.n`)
    if (countStr !== null) {
      const n = parseInt(countStr, 10)
      await Promise.all([
        SecureStore.deleteItemAsync(`${key}.n`),
        ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)),
      ])
    }
    await SecureStore.deleteItemAsync(key).catch(() => null)
  },
}

// ─── Storage por plataforma ───────────────────────────────────────────────────

const webStorage = {
  getItem:    (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem:    (key: string, value: string) => { localStorage.setItem(key, value); return Promise.resolve() },
  removeItem: (key: string) => { localStorage.removeItem(key); return Promise.resolve() },
}

const storage = Platform.OS === 'web' ? webStorage : largeSecureStore

// ─── Cliente Supabase ─────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
    flowType:           'pkce',
  },
})
