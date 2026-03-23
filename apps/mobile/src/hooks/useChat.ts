import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { CHAT_URL } from '@/src/lib/apiClient'

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

function dbRowsToMessages(rows: { role: string; content: string }[]): Message[] {
  return rows.map((row, i) => ({
    id: `db-${i}`,
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))
}

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Load history from Supabase
  useEffect(() => {
    if (!user?.id || historyLoaded) return

    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data, error }) => {
        if (error) console.error('[useChat] history fetch:', error)
        if (data && data.length > 0) {
          setMessages([WELCOME, ...dbRowsToMessages(data)])
        }
        setHistoryLoaded(true)
      })
  }, [user?.id, historyLoaded])

  // Reset on user change
  useEffect(() => {
    if (!user?.id) {
      setMessages([WELCOME])
      setHistoryLoaded(false)
    }
  }, [user?.id])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    const historico = messages
      .filter((m) => m.id !== '0')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${CHAT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: text, userId: user?.id, historico }),
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
  }, [isTyping, user?.id, messages])

  const clearHistory = useCallback(async () => {
    if (!user?.id || isClearing) return
    setIsClearing(true)
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
    if (error) console.error('[useChat] clearHistory:', error)
    setMessages([WELCOME])
    setHistoryLoaded(true)
    setIsClearing(false)
  }, [user?.id, isClearing])

  return { messages, isTyping, isClearing, sendMessage, clearHistory }
}
