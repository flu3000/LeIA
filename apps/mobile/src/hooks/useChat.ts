import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { chatApi, CHAT_URL } from '@/src/lib/apiClient'
import { supabase } from '@/src/lib/supabase'

export interface Fonte {
  id_externo?: string
  tipo: 'livro' | 'video' | 'podcast' | 'artigo' | 'curso'
  titulo: string
  autor_canal: string
  dificuldade: 'Iniciante' | 'Intermediário' | 'Avançado'
  link: string
  por_que_estudar: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Fonte[]
  citations?: string[]
}

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content: 'Olá!\n\nQual tema você gostaria de explorar hoje? Posso indicar livros, vídeos, podcasts e artigos curados especialmente para você.',
}

function rowsToMessages(rows: { role: string; content: string }[]): Message[] {
  return rows.map((row, i) => ({
    id: `db-${i}`,
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))
}

export function useChat(sessionId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isTyping, setIsTyping]   = useState(false)
  const prevSessionId = useRef<string | null>(null)

  // Carrega mensagens sempre que a sessão muda
  useEffect(() => {
    if (!sessionId || sessionId === prevSessionId.current) return
    prevSessionId.current = sessionId

    setMessages([WELCOME])

    chatApi
      .get<{ role: string; content: string }[]>(`/api/chat/sessions/${sessionId}/messages`)
      .then((rows) => {
        if (rows.length > 0) setMessages([WELCOME, ...rowsToMessages(rows)])
      })
      .catch((e) => console.error('[useChat] load messages:', e))
  }, [sessionId])

  // Reset ao trocar de usuário
  useEffect(() => {
    if (!user?.id) {
      setMessages([WELCOME])
      prevSessionId.current = null
    }
  }, [user?.id])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping || !user?.id) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    const historico = messages
      .filter((m) => m.id !== '0')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const authHeader = authSession?.access_token
        ? { Authorization: `Bearer ${authSession.access_token}` }
        : {}

      const res = await fetch(`${CHAT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ mensagem: text, userId: user.id, historico, sessionId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      setMessages((prev) => [
        ...prev,
        {
          id:        (Date.now() + 1).toString(),
          role:      'assistant',
          content:   data.guia_contextual ?? data.content ?? 'Sem resposta.',
          sources:   (data.fontes ?? []) as Fonte[],
          citations: data.citations ?? [],
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[useChat]', msg)
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `Erro ao conectar com o servidor: ${msg}` },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, user?.id, messages, sessionId])

  return { messages, isTyping, sendMessage }
}
