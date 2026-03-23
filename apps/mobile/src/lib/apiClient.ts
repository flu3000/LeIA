import { supabase } from './supabase'

export const CHAT_URL    = process.env.EXPO_PUBLIC_CHAT_URL    ?? 'http://localhost:3001'
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3002'

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
  post:   <T>(path: string, body?: unknown) => request<T>(CHAT_URL,    'POST',   path, body),
  delete: <T>(path: string)                 => request<T>(CHAT_URL,    'DELETE', path),
}

export const api = {
  get:    <T>(path: string)                 => request<T>(BACKEND_URL, 'GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>(BACKEND_URL, 'POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>(BACKEND_URL, 'PUT',    path, body),
  delete: <T>(path: string)                 => request<T>(BACKEND_URL, 'DELETE', path),
}
