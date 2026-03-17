import { Quote, ExternalLink, Sparkles } from 'lucide-react'

const reference = {
  quote: 'Uma biblioteca é o hospital da mente.',
  author: 'Richard de Bury',
  book: 'Philobiblon',
  recommendation: {
    titulo: 'Como Ler Livros',
    autor: 'Mortimer J. Adler',
    link: 'https://www.amazon.com.br/Como-Ler-Livros-Mortimer-Adler/dp/8562409030',
    descricao:
      'O guia definitivo para extrair o máximo de qualquer leitura — do iniciante ao leitor avançado.',
  },
}

export default function ReferenceOfTheDay() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-brand-accent" />
        <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
          Referência do Dia
        </span>
      </div>

      <div className="mb-4">
        <Quote className="w-5 h-5 text-brand-accent/30 mb-2" />
        <blockquote className="text-slate-200 text-sm italic leading-relaxed mb-2 font-medium">
          "{reference.quote}"
        </blockquote>
        <p className="text-xs text-brand-text">
          — {reference.author}, <span className="italic">{reference.book}</span>
        </p>
      </div>

      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
          Leitura Recomendada
        </p>
        <a
          href={reference.recommendation.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start justify-between gap-2 group"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-accent transition-colors">
              {reference.recommendation.titulo}
            </p>
            <p className="text-xs text-brand-text mb-1">{reference.recommendation.autor}</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {reference.recommendation.descricao}
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-accent shrink-0 transition-colors mt-0.5" />
        </a>
      </div>
    </div>
  )
}
