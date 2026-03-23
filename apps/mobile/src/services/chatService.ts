/**
 * Chamadas de API para o Chat (porta 3001).
 * Mantém lógica pura — use via useChat() nos componentes.
 */
import { chatApi } from '@/src/lib/apiClient'
import type { Message } from '@/src/types/chat'

export const chatService = {
  fetchHistory: (userId: string) =>
    chatApi.get<Message[]>(`/api/chat/history/${userId}`),

  sendMessage: (payload: {
    userId: string
    message: string
    history: { role: string; content: string }[]
  }) => chatApi.post('/api/chat', payload),

  clearHistory: (userId: string) =>
    chatApi.delete(`/api/chat/${userId}`),
}
