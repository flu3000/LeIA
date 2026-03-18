import { Heart, ExternalLink } from 'lucide-react'
import type { SaveItem } from '../../hooks/useUserContent'

export interface Material {
  id_externo?: string
  titulo: string
  tipo: string
  link: string
  dificuldade: string
  autor_canal?: string
  por_que_estudar?: string
}

interface MaterialCardProps {
  material: Material
  isFavourite: boolean
  onToggleSave: (item: SaveItem) => void
}

const TYPE_EMOJI: Record<string, string> = {
  livro: '📚', vídeo: '🎬', video: '🎬',
  podcast: '🎙️', artigo: '📄', curso: '🎓',
}

const DIFFICULTY_STYLE: Record<string, string> = {
  'Iniciante':     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Intermediário': 'text-amber-400   bg-amber-400/10   border-amber-400/20',
  'Avançado':      'text-rose-400    bg-rose-400/10    border-rose-400/20',
}

export default function MaterialCard({ material, isFavourite, onToggleSave }: MaterialCardProps) {
  const emoji = TYPE_EMOJI[material.tipo?.toLowerCase()] ?? '📌'
  const diffStyle = DIFFICULTY_STYLE[material.dificuldade] ?? 'text-brand-text bg-slate-700 border-slate-600'

  const cardId = material.id_externo
    ?? material.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)

  const saveItem: SaveItem = {
    card_id: cardId,
    title: material.titulo,
    category: material.tipo,
  }

  const handleOpen = () => window.open(material.link, '_blank', 'noopener,noreferrer')

  return (
    <div
      className="w-52 shrink-0 flex flex-col bg-brand-secondary border border-slate-700 hover:border-slate-600 rounded-xl p-3.5 transition-all hover:shadow-md hover:shadow-black/20 cursor-pointer group"
      onClick={handleOpen}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1 mb-2.5">
        <span className="text-xl leading-none">{emoji}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(saveItem) }}
          className="p-1 rounded-lg hover:bg-slate-700 transition-all duration-150 active:scale-90 shrink-0"
          aria-label={isFavourite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          title={isFavourite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isFavourite ? 'fill-brand-accent text-brand-accent' : 'text-slate-500 hover:text-brand-accent'
            }`}
          />
        </button>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug mb-1 flex-1">
        {material.titulo}
      </p>

      {/* Author */}
      {material.autor_canal && (
        <p className="text-xs text-brand-text truncate mb-2">{material.autor_canal}</p>
      )}

      {/* Why study */}
      {material.por_que_estudar && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
          {material.por_que_estudar}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/50">
        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${diffStyle}`}>
          {material.dificuldade}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-brand-accent transition-colors">
          <ExternalLink className="w-3 h-3" />
          Abrir
        </span>
      </div>
    </div>
  )
}
