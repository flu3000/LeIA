import { useState, useRef, useEffect } from 'react'
import { Send, Plus, Loader2 } from 'lucide-react'
import ChatMessage from '../components/chat/ChatMessage'
import DailyInfoBox from '../components/DailyInfoBox'
import Button from '../components/ui/Button'
import { useChat } from '../hooks/useChat'
import { useUserContent } from '../hooks/useUserContent'

export default function ChatPage() {
  const { messages, isTyping, isClearing, sendMessage, clearHistory } = useChat()
  const { isFavourite, toggleSave } = useUserContent()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  return (
    <div className="flex h-full">
      <DailyInfoBox />

      {/* Chat column — full width */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-brand-secondary mx-[5%]">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isFavourite={isFavourite}
              onToggleSave={toggleSave}
            />
          ))}

          {isTyping && (
            <div className="flex items-start gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="bg-brand-primary border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-xs text-brand-text">LeIA está consultando o acervo...</p>
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-2 bg-slate-700 rounded animate-pulse"
                      style={{ width: `${[48, 64, 40, 56][i]}px`, animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 bg-brand-primary shrink-0 mx-[5%] my-2 rounded-xl">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Sobre qual tema você quer aprender hoje?"
              disabled={isTyping}
              className="flex-1 bg-brand-secondary border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-colors disabled:opacity-60"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="rounded-xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
          <button
            onClick={clearHistory}
            disabled={isClearing || isTyping}
            title="Nova Conversa"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-brand-text border border-slate-700 hover:border-brand-accent hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Plus className="w-3.5 h-3.5" />
            }
            Nova Conversa
          </button>
        </div>
      </div>
    </div>
  )
}
