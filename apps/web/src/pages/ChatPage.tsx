import { useState, useRef, useEffect } from 'react'
import { Send, BookMarked } from 'lucide-react'
import ChatMessage from '../components/chat/ChatMessage'
import ReferenceOfTheDay from '../components/ReferenceOfTheDay'
import Button from '../components/ui/Button'
import { useChat } from '../hooks/useChat'

export default function ChatPage() {
  const { messages, loading, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="flex h-full">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="px-6 py-4 bg-brand-primary border-b border-slate-700 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-secondary flex items-center justify-center">
            <BookMarked className="w-4 h-4 text-brand-accent" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-100 leading-tight">
              Bibliotecário Virtual
            </h1>
            <p className="text-xs text-brand-text">Curadoria de conhecimento com IA</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pomodoro-break"></span>
            <span className="text-xs text-brand-text">Online</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-brand-secondary">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0">
                <span className="flex gap-0.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1 h-1 rounded-full bg-brand-accent animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </div>
              <span className="text-xs text-brand-text">O Bibliotecário está pesquisando...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 bg-brand-primary border-t border-slate-700 shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Sobre qual tema você quer aprender hoje?"
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-colors disabled:opacity-60"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="rounded-xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>

      {/* Reference sidebar */}
      <aside className="hidden lg:block w-80 border-l border-slate-700 bg-brand-secondary p-5 overflow-y-auto shrink-0">
        <ReferenceOfTheDay />
      </aside>
    </div>
  )
}
