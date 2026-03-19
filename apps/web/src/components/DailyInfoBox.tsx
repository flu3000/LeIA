import { useState } from 'react'
import { ChevronRight, Quote, ExternalLink, Sparkles } from 'lucide-react'

const DAILY = {
  quote: 'Uma biblioteca é o hospital da mente.',
  author: 'Richard de Bury',
  book: 'Philobiblon',
  recommendation: {
    titulo: 'Como Ler Livros',
    autor: 'Mortimer J. Adler',
    link: 'https://www.amazon.com.br/Como-ler-livros-cl%C3%A1ssico-inteligente/dp/8594090781',
    descricao:
      'O guia definitivo para extrair o máximo de qualquer leitura — do iniciante ao leitor avançado.',
  },
}

export default function DailyInfoBox() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <>
      {/* Trigger pill — appears when the panel is collapsed */}
      <button
        onClick={() => setIsVisible(true)}
        aria-label="Mostrar referência do dia"
        className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full
          bg-brand-secondary/90 backdrop-blur-sm border border-slate-700/60
          text-brand-accent shadow-lg shadow-black/20
          transition-all duration-300"
        style={{
          opacity: isVisible ? 0 : 1,
          pointerEvents: isVisible ? 'none' : 'auto',
          transform: isVisible ? 'scale(0.8) translateX(0.5rem)' : 'scale(1) translateX(0)',
        }}
      >
        <Quote className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold tracking-wide">Referência</span>
      </button>

      {/* Floating panel */}
      <div
        className="fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] transition-all duration-300 ease-in-out"
        style={{
          transform: isVisible ? 'translateX(0)' : 'translateX(calc(100% + 1.5rem))',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <div className="bg-brand-secondary/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">
                Referência do Dia
              </span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Recolher painel"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-text hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">

            {/* Quote */}
            <div className="mb-4">
              <Quote className="w-5 h-5 text-brand-accent/30 mb-2" />
              <blockquote className="font-serif text-slate-200 text-sm italic leading-relaxed mb-2">
                "{DAILY.quote}"
              </blockquote>
              <p className="text-xs text-brand-text">
                — {DAILY.author},{' '}
                <span className="font-serif italic">{DAILY.book}</span>
              </p>
            </div>

            {/* Recommendation */}
            <div className="border-t border-slate-700/60 pt-4">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
                Leitura Recomendada
              </p>
              <a
                href={DAILY.recommendation.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-2 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-accent transition-colors">
                    {DAILY.recommendation.titulo}
                  </p>
                  <p className="text-xs text-brand-text mb-1">
                    {DAILY.recommendation.autor}
                  </p>
                  <p className="font-serif text-xs text-slate-500 italic leading-relaxed">
                    {DAILY.recommendation.descricao}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-brand-accent shrink-0 transition-colors mt-0.5" />
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
