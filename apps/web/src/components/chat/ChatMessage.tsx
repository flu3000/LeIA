import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookMarked, User, Link as LinkIcon } from 'lucide-react'
import SourceCard, { type Fonte } from './SourceCard'
import type { SaveItem } from '../../hooks/useUserContent'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Fonte[]
  citations?: string[]
}

interface ChatMessageProps {
  message: Message
  isFavourite: (cardId: string) => boolean
  onToggleSave: (item: SaveItem) => void
}

// Remove citações numéricas inline como [1], [2][3] que poluem o texto
function cleanCitations(text: string): string {
  return text.replace(/(\[\d+\])+/g, '').replace(/ {2,}/g, ' ').trim()
}

// Tenta extrair JSON embutido no texto (fallback para erros de formatação da IA)
function extractEmbeddedJson(text: string): { guia_contextual?: string; fontes?: Fonte[] } | null {
  // Bloco ```json ... ```
  const block = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (block) { try { return JSON.parse(block[1]) } catch {} }
  // Objeto JSON solto com guia_contextual
  const inline = text.match(/\{[\s\S]*?"guia_contextual"[\s\S]*?\}(?=\s*$)/)
  if (inline) { try { return JSON.parse(inline[0]) } catch {} }
  return null
}

// Transforma o conteúdo da mensagem em texto limpo + fontes
function parseContent(message: Message): { text: string; sources: Fonte[] } {
  const sources = message.sources ?? []

  // 1. JSON puro
  try {
    const parsed = JSON.parse(message.content)
    if (parsed?.guia_contextual) {
      return {
        text: cleanCitations(parsed.guia_contextual),
        sources: sources.length > 0 ? sources : (parsed.fontes ?? []),
      }
    }
  } catch { /* não é JSON puro */ }

  // 2. JSON embutido no texto
  const embedded = extractEmbeddedJson(message.content)
  if (embedded?.guia_contextual) {
    return {
      text: cleanCitations(embedded.guia_contextual),
      sources: sources.length > 0 ? sources : (embedded.fontes ?? []),
    }
  }

  // 3. Markdown puro — só limpa as citações
  return { text: cleanCitations(message.content), sources }
}

// ── Markdown components ───────────────────────────────────────
const md = {
  p:          ({ children }: React.PropsWithChildren) => <p className="mb-2 last:mb-0">{children}</p>,
  strong:     ({ children }: React.PropsWithChildren) => <strong className="font-semibold text-slate-100">{children}</strong>,
  em:         ({ children }: React.PropsWithChildren) => <em className="italic text-slate-300">{children}</em>,
  ul:         ({ children }: React.PropsWithChildren) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
  ol:         ({ children }: React.PropsWithChildren) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
  li:         ({ children }: React.PropsWithChildren) => <li className="text-slate-300">{children}</li>,
  h3:         ({ children }: React.PropsWithChildren) => <h3 className="font-serif font-semibold text-slate-100 mt-3 mb-1">{children}</h3>,
  h4:         ({ children }: React.PropsWithChildren) => <h4 className="font-serif font-medium text-slate-200 mt-2 mb-1">{children}</h4>,
  code:       ({ children }: React.PropsWithChildren) => <code className="bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
  blockquote: ({ children }: React.PropsWithChildren) => <blockquote className="border-l-2 border-brand-accent/40 pl-3 text-slate-400 italic my-2">{children}</blockquote>,
  hr:         () => <hr className="border-slate-700 my-3" />,
  table:      ({ children }: React.PropsWithChildren) => <div className="overflow-x-auto my-3"><table className="text-xs w-full border-collapse">{children}</table></div>,
  th:         ({ children }: React.PropsWithChildren) => <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200 font-semibold text-left">{children}</th>,
  td:         ({ children }: React.PropsWithChildren) => <td className="border border-slate-600 px-2 py-1 text-slate-300">{children}</td>,
}

function citationHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return url }
}

export default function ChatMessage({ message, isFavourite, onToggleSave }: ChatMessageProps) {
  // ── User bubble ───────────────────────────────────────────────
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-2 max-w-xl">
          <div className="bg-brand-accent text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-4 h-4 text-brand-text" />
          </div>
        </div>
      </div>
    )
  }

  // ── Assistant bubble ──────────────────────────────────────────
  const { text, sources } = parseContent(message)
  const hasCitations = (message.citations?.length ?? 0) > 0

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-2 max-w-2xl w-full">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <BookMarked className="w-4 h-4 text-brand-accent" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Guia contextual */}
          <div className="bg-brand-primary border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 leading-relaxed mb-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
              {text}
            </ReactMarkdown>
          </div>

          {/* Estante de referências */}
          {sources.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-2.5 flex items-center gap-1.5">
                <BookMarked className="w-3 h-3" />
                <span>
                  {sources.length} referência{sources.length !== 1 ? 's' : ''} curada{sources.length !== 1 ? 's' : ''}
                  <span className="text-slate-600"> · clique para abrir · ♥ para salvar</span>
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.map((f, i) => (
                  <SourceCard
                    key={f.id_externo ?? i}
                    fonte={f}
                    index={i}
                    isFavourite={isFavourite(f.id_externo ?? '')}
                    onToggleSave={onToggleSave}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Citations */}
          {hasCitations && (
            <div className="border-t border-slate-700/60 pt-2.5">
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-2">
                <LinkIcon className="w-3 h-3" /> Fontes consultadas
              </p>
              <ol className="space-y-1">
                {message.citations!.map((url, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-xs text-slate-600 font-mono shrink-0 mt-0.5">[{i + 1}]</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-brand-accent transition-colors truncate"
                      title={url}
                    >
                      {citationHostname(url)}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
