import Constants from 'expo-constants'
import { supabase } from './supabase'

// Em modo --lan o Metro expõe o IP real da máquina em hostUri (ex: "192.168.1.5:8081").
// Isso permite que dispositivos físicos alcancem o servidor sem configuração manual de IP.
// Se EXPO_PUBLIC_*_URL estiver definido no .env, ele tem prioridade absoluta.
function devBaseUrl(port: number): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${port}`
  }
  return `http://localhost:${port}`
}

export const CHAT_URL    = process.env.EXPO_PUBLIC_CHAT_URL    ?? devBaseUrl(3001)
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? devBaseUrl(3002)

if (__DEV__) {
  console.log('[API] CHAT_URL   :', CHAT_URL)
  console.log('[API] BACKEND_URL:', BACKEND_URL)
}

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request<T>(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err?.error ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const chatApi = {
  get:    <T>(path: string)                 => request<T>(CHAT_URL,    'GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>(CHAT_URL,    'POST',   path, body),
  delete: <T>(path: string)                 => request<T>(CHAT_URL,    'DELETE', path),
}

export const api = {
  get:    <T>(path: string)                 => request<T>(BACKEND_URL, 'GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>(BACKEND_URL, 'POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>(BACKEND_URL, 'PUT',    path, body),
  delete: <T>(path: string)                 => request<T>(BACKEND_URL, 'DELETE', path),
}
