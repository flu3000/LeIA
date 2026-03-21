/**
 * Centralised API client for the LeIA backend (http://localhost:3002).
 *
 * All requests automatically attach the Supabase session JWT in the
 * Authorization header. The Supabase auth SDK stays client-side for
 * login/register/OAuth; this client is only used for data operations.
 */
import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3002'

async function getAuthHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${BASE_URL}${path}`, {
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

  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string)                    => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown)    => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown)    => request<T>('PUT',    path, body),
  delete: <T>(path: string)                    => request<T>('DELETE', path),
}
