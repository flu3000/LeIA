import { Heart, ExternalLink, ShoppingCart } from 'lucide-react'
import type { SaveItem } from '../../hooks/useUserContent'

export interface Fonte {
  id_externo?: string
  titulo: string
  tipo: string
  link: string
  dificuldade: string
  autor_canal?: string
  por_que_estudar?: string
}

interface SourceCardProps {
  fonte: Fonte
  index: number
  isFavourite: boolean
  onToggleSave: (item: SaveItem) => void
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string }> = {
  livro:   { emoji: '📚', label: 'Livro' },
  vídeo:   { emoji: '🎬', label: 'Vídeo' },
  video:   { emoji: '🎬', label: 'Vídeo' },
  podcast: { emoji: '🎙️', label: 'Podcast' },
  artigo:  { emoji: '📄', label: 'Artigo' },
  curso:   { emoji: '🎓', label: 'Curso' },
}

const DIFFICULTY_STYLE: Record<string, string> = {
  'Iniciante':     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Intermediário': 'text-amber-400   bg-amber-400/10   border-amber-400/20',
  'Avançado':      'text-rose-400    bg-rose-900/30    border-rose-600/40',
}

export default function SourceCard({ fonte, index, isFavourite, onToggleSave }: SourceCardProps) {
  const typeKey = fonte.tipo?.toLowerCase()
  const typeConf = TYPE_CONFIG[typeKey] ?? { emoji: '📌', label: fonte.tipo }
  const diffStyle = DIFFICULTY_STYLE[fonte.dificuldade] ?? 'text-slate-400 bg-slate-700/50 border-slate-600'

  const cardId = fonte.id_externo
    ?? fonte.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)

  const saveItem: SaveItem = { card_id: cardId, title: fonte.titulo, category: fonte.tipo }

  const isBook = typeKey === 'livro'
  const amazonUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(fonte.titulo)}`

  return (
    <div
      className="flex flex-col bg-brand-primary border border-slate-700/80 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/40 hover:border-slate-600 transition-all duration-200"
      style={{ animation: 'fadeInUp 0.35s ease both', animationDelay: `${index * 70}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{typeConf.emoji}</span>
          <span className="text-xs text-brand-text uppercase tracking-widest font-medium">
            {typeConf.label}
          </span>
        </div>
        <button
          onClick={() => onToggleSave(saveItem)}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-all active:scale-90"
          aria-label={isFavourite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          title={isFavourite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavourite ? 'fill-brand-accent text-brand-accent' : 'text-slate-500 hover:text-rose-400'
            }`}
          />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-4 py-3 gap-1">
        <h3 className="font-serif text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
          {fonte.titulo}
        </h3>
        {fonte.autor_canal && (
          <p className="text-xs text-brand-text truncate">{fonte.autor_canal}</p>
        )}
        {fonte.por_que_estudar && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mt-1">
            {fonte.por_que_estudar}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-2 flex flex-col gap-2 mt-auto">
        <span className={`self-start text-xs px-2 py-0.5 rounded-full border font-medium ${diffStyle}`}>
          {fonte.dificuldade}
        </span>

        <a
          href={fonte.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full text-xs font-semibold text-white bg-brand-accent hover:bg-sky-400 rounded-lg py-2 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Acessar Conteúdo
        </a>

        {isBook && (
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-xs text-slate-400 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-700 border border-slate-700 rounded-lg py-1.5 transition-colors"
          >
            <ShoppingCart className="w-3 h-3" />
            Buscar na Amazon
          </a>
        )}
      </div>
    </div>
  )
}
