import axios, { type InternalAxiosRequestConfig } from 'axios'
import Constants from 'expo-constants'
import { supabase } from '@/src/lib/supabase'

// Em modo --lan o Metro expõe o IP real da máquina em hostUri.
// Isso permite que dispositivos físicos alcancem o servidor sem configuração manual.
function devBaseUrl(port: number): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${port}`
  }
  return `http://localhost:${port}`
}

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? devBaseUrl(3002)
export const CHAT_URL    = process.env.EXPO_PUBLIC_CHAT_URL    ?? devBaseUrl(3001)

if (__DEV__) {
  console.log('[Axios] BACKEND_URL:', BACKEND_URL)
  console.log('[Axios] CHAT_URL   :', CHAT_URL)
}

// Interceptor compartilhado: injeta o JWT do Supabase Auth em toda requisição
async function authInterceptor(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
}

// Instância principal — aponta para o backend de dados (porta 3002)
export const api = axios.create({ baseURL: BACKEND_URL })
api.interceptors.request.use(authInterceptor)

// Instância para o serviço de chat (porta 3001)
export const chatAxios = axios.create({ baseURL: CHAT_URL })
chatAxios.interceptors.request.use(authInterceptor)
