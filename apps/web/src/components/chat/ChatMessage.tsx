import { BookMarked, User, ExternalLink } from 'lucide-react'

export interface Source {
  tipo: string
  titulo: string
  autor_canal: string
  dificuldade: string
  link: string
  por_que_estudar: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

const difficultyStyle: Record<string, string> = {
  Iniciante:     'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
  Intermediário: 'text-sky-400    bg-sky-400/10    border border-sky-400/20',
  Avançado:      'text-rose-400   bg-rose-400/10   border border-rose-400/20',
}

const tipoLabel: Record<string, string> = {
  livro:   '📚 Livro',
  video:   '🎬 Vídeo',
  podcast: '🎙️ Podcast',
  artigo:  '📄 Artigo',
}

export default function ChatMessage({ message }: { message: Message }) {
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

  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start gap-2 max-w-2xl w-full">
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <BookMarked className="w-4 h-4 text-brand-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 mb-3 leading-relaxed">
            {message.content}
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="grid gap-2">
              {message.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-800 border border-slate-700 hover:border-brand-accent/40 rounded-xl p-3.5 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-slate-200 group-hover:text-brand-accent transition-colors">
                      {source.titulo}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyStyle[source.dificuldade] ?? 'text-brand-text bg-slate-700'}`}>
                        {source.dificuldade}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-accent transition-colors" />
                    </div>
                  </div>
                  <p className="text-xs text-brand-text mb-1">
                    {tipoLabel[source.tipo] ?? source.tipo} · {source.autor_canal}
                  </p>
                  <p className="text-xs text-slate-500">{source.por_que_estudar}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
