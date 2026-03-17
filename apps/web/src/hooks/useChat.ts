import { useState, useCallback } from 'react'
import type { Message } from '../components/chat/ChatMessage'

const WELCOME: Message = {
  id: '0',
  role: 'assistant',
  content:
    'Olá! Sou o Bibliotecário Virtual do Portal do Conhecimento. Qual tema você gostaria de explorar hoje? Posso indicar livros, vídeos, podcasts e artigos curados especialmente para você.',
}

// Mock response while the real API is not connected
const mockResponse = (query: string): Message => ({
  id: Date.now().toString(),
  role: 'assistant',
  content: `Ótima escolha explorar "${query}"! Selecionei algumas referências que vão do nível introdutório ao avançado para você construir uma base sólida.`,
  sources: [
    {
      tipo: 'livro',
      titulo: 'A Arte de Aprender',
      autor_canal: 'Josh Waitzkin',
      dificuldade: 'Iniciante',
      link: 'https://www.amazon.com.br',
      por_que_estudar:
        'Um guia prático sobre como desenvolver habilidades com profundidade — ideal para iniciar qualquer jornada de estudo.',
    },
    {
      tipo: 'video',
      titulo: 'Learning How to Learn',
      autor_canal: 'Coursera / Barbara Oakley',
      dificuldade: 'Iniciante',
      link: 'https://www.coursera.org',
      por_que_estudar:
        'O curso mais popular do mundo sobre técnicas de aprendizagem baseadas em neurociência.',
    },
    {
      tipo: 'artigo',
      titulo: 'The Feynman Technique',
      autor_canal: 'Farnam Street',
      dificuldade: 'Intermediário',
      link: 'https://fs.blog/feynman-technique/',
      por_que_estudar:
        'Aprenda a técnica de aprendizagem do gênio da física para fixar qualquer conceito complexo.',
    },
  ],
})

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // TODO: Replace with real API call to /buscar
    await new Promise((r) => setTimeout(r, 1400))
    const reply = mockResponse(text)
    setMessages((prev) => [...prev, reply])
    setLoading(false)
  }, [loading])

  return { messages, loading, sendMessage }
}
