import { useState, useCallback } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { chatApi } from '@/src/lib/apiClient'

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function useChatSessions() {
  const { user } = useAuth()
  const [sessions, setSessions]   = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSessions = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const data = await chatApi.get<ChatSession[]>(`/api/chat/sessions?userId=${user.id}`)
      setSessions(data)
    } catch (e) {
      console.error('[useChatSessions] fetch:', e)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const createSession = useCallback(async (): Promise<ChatSession | null> => {
    if (!user?.id) return null
    try {
      const session = await chatApi.post<ChatSession>('/api/chat/sessions', { userId: user.id })
      setSessions((prev) => [session, ...prev])
      return session
    } catch (e) {
      console.error('[useChatSessions] create:', e)
      return null
    }
  }, [user?.id])

  const renameSession = useCallback(async (id: string, title: string) => {
    if (!user?.id) return
    try {
      const updated = await chatApi.patch<ChatSession>(`/api/chat/sessions/${id}`, { title, userId: user.id })
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)))
    } catch (e) {
      console.error('[useChatSessions] rename:', e)
    }
  }, [user?.id])

  const deleteSession = useCallback(async (id: string) => {
    if (!user?.id) return
    try {
      await chatApi.delete(`/api/chat/sessions/${id}?userId=${user.id}`)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      console.error('[useChatSessions] delete:', e)
    }
  }, [user?.id])

  // Atualiza título localmente (para refletir auto-título após primeira mensagem)
  const patchSessionTitle = useCallback((id: string, title: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title, updated_at: new Date().toISOString() } : s)))
  }, [])

  return { sessions, isLoading, fetchSessions, createSession, renameSession, deleteSession, patchSessionTitle }
}
