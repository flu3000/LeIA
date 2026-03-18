import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Message } from '../components/chat/ChatMessage'
import type { Fonte } from '../components/chat/SourceCard'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const STORAGE_KEY = 'leia_chat_v1'

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content:
    'Olá! Sou o **Bibliotecário Virtual** do Portal do Conhecimento.\n\n' +
    'Qual tema você gostaria de explorar hoje? Posso indicar livros, vídeos, podcasts e artigos curados especialmente para você.',
}

// ── LocalStorage helpers ──────────────────────────────────────
function saveToStorage(messages: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, savedAt: Date.now() }))
  } catch { /* ignora erros de quota */ }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

// Converte mensagens do banco (role + content) em objetos Message do UI
function dbRowsToMessages(rows: { role: string; content: string }[]): Message[] {
  return rows.map((row, i) => ({
    id: `db-${i}`,
    role: row.role as 'user' | 'assistant',
    content: row.content,
  }))
}

// ── Hook ──────────────────────────────────────────────────────
export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega o histórico do Supabase (via backend) ao autenticar
  useEffect(() => {
    if (!user?.id || historyLoaded) return

    fetch(`${API_URL}/api/chat/history/${user.id}`)
      .then((r) => r.json())
      .then((rows: { role: string; content: string }[]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setMessages([WELCOME, ...dbRowsToMessages(rows)])
        }
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [user?.id, historyLoaded])

  // Persiste no localStorage com debounce de 500ms (fallback offline)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveToStorage(messages), 500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    // Histórico para enviar ao backend (exclui mensagem de boas-vindas estática)
    const historico = messages
      .filter((m) => m.id !== '0')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagem: text, userId: user?.id, historico }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.guia_contextual ?? data.content ?? 'Sem resposta.',
        sources: (data.fontes ?? []) as Fonte[],
        citations: data.citations ?? [],
      }

      setMessages((prev) => [...prev, reply])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[useChat]', msg)
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: `Erro: ${msg}` },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [isTyping, user?.id, messages])

  // Limpa o histórico no banco e reseta o estado local
  const clearHistory = useCallback(async () => {
    if (!user?.id || isClearing) return
    setIsClearing(true)
    try {
      await fetch(`${API_URL}/api/chat/${user.id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('[useChat] clearHistory', err)
    } finally {
      clearStorage()
      setMessages([WELCOME])
      setHistoryLoaded(true)
      setIsClearing(false)
    }
  }, [user?.id, isClearing])

  return { messages, isTyping, isClearing, sendMessage, clearHistory }
}
