import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ArrowLeft, BookOpen, ChevronRight,
  Brain, Rocket, TrendingUp, FlaskConical, Landmark, Cpu,
  Briefcase, Palette, DollarSign, Calculator, Atom, Leaf,
  Heart, Lightbulb, Globe, Feather, Scale, Music, Camera,
  Microscope, Code2, Users, Star,
} from 'lucide-react'
import { useBooks, type BookSummary } from '../hooks/useBooks'

// ── Theme → icon + colour ─────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ className?: string }>

const THEME_CONFIG: Record<string, { icon: IconComponent; accent: string; bg: string }> = {
  'Filosofia':        { icon: Brain,        accent: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-500/20'   },
  'Ficção':           { icon: Rocket,        accent: 'text-sky-400',      bg: 'bg-sky-500/10 border-sky-500/20'         },
  'Ficção Científica':{ icon: Rocket,        accent: 'text-sky-400',      bg: 'bg-sky-500/10 border-sky-500/20'         },
  'Desenvolvimento':  { icon: TrendingUp,    accent: 'text-green-400',    bg: 'bg-green-500/10 border-green-500/20'     },
  'Auto-ajuda':       { icon: Lightbulb,     accent: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20'     },
  'Ciência':          { icon: FlaskConical,  accent: 'text-cyan-400',     bg: 'bg-cyan-500/10 border-cyan-500/20'       },
  'História':         { icon: Landmark,      accent: 'text-orange-400',   bg: 'bg-orange-500/10 border-orange-500/20'   },
  'Tecnologia':       { icon: Cpu,           accent: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20'       },
  'Programação':      { icon: Code2,         accent: 'text-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20'       },
  'Psicologia':       { icon: Brain,         accent: 'text-pink-400',     bg: 'bg-pink-500/10 border-pink-500/20'       },
  'Negócios':         { icon: Briefcase,     accent: 'text-yellow-400',   bg: 'bg-yellow-500/10 border-yellow-500/20'   },
  'Arte':             { icon: Palette,       accent: 'text-rose-400',     bg: 'bg-rose-500/10 border-rose-500/20'       },
  'Literatura':       { icon: Feather,       accent: 'text-indigo-400',   bg: 'bg-indigo-500/10 border-indigo-500/20'   },
  'Economia':         { icon: DollarSign,    accent: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20' },
  'Matemática':       { icon: Calculator,    accent: 'text-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20'   },
  'Física':           { icon: Atom,          accent: 'text-teal-400',     bg: 'bg-teal-500/10 border-teal-500/20'       },
  'Biologia':         { icon: Leaf,          accent: 'text-lime-400',     bg: 'bg-lime-500/10 border-lime-500/20'       },
  'Saúde':            { icon: Heart,         accent: 'text-red-400',      bg: 'bg-red-500/10 border-red-500/20'         },
  'Sociologia':       { icon: Users,         accent: 'text-fuchsia-400',  bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
  'Política':         { icon: Scale,         accent: 'text-orange-400',   bg: 'bg-orange-500/10 border-orange-500/20'   },
  'Música':           { icon: Music,         accent: 'text-pink-400',     bg: 'bg-pink-500/10 border-pink-500/20'       },
  'Fotografia':       { icon: Camera,        accent: 'text-slate-400',    bg: 'bg-slate-500/10 border-slate-500/20'     },
  'Bioquímica':       { icon: Microscope,    accent: 'text-green-400',    bg: 'bg-green-500/10 border-green-500/20'     },
  'Linguística':      { icon: Globe,         accent: 'text-brand-accent', bg: 'bg-brand-accent/10 border-brand-accent/20'},
  'Neurociência':     { icon: Brain,         accent: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-500/20'   },
}

const DEFAULT_CONFIG = { icon: BookOpen, accent: 'text-brand-accent', bg: 'bg-brand-accent/10 border-brand-accent/20' }

function getThemeConfig(theme: string) {
  return THEME_CONFIG[theme] ?? DEFAULT_CONFIG
}

// ── Difficulty badge ──────────────────────────────────────────────────────────

const DIFF_STYLE: Record<string, string> = {
  Iniciante:     'bg-pomodoro-break/15 text-pomodoro-break border-pomodoro-break/30',
  Intermediário: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Avançado:      'bg-pomodoro-focus/15 text-pomodoro-focus border-pomodoro-focus/30',
}

// ── Book card (compact, for the sub-theme grid) ───────────────────────────────

function BookCard({ book }: { book: BookSummary }) {
  const [coverError, setCoverError] = useState(false)

  return (
    <Link
      to={`/books/${book.book_id}`}
      className="group bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-3 flex gap-3 transition-all hover:shadow-md hover:shadow-black/20"
    >
      {/* Cover thumbnail */}
      <div className="shrink-0">
        {book.cover_url && !coverError ? (
          <img
            src={book.cover_url}
            alt={book.title}
            onError={() => setCoverError(true)}
            className="w-12 h-[68px] object-cover rounded-lg border border-slate-700"
          />
        ) : (
          <div className="w-12 h-[68px] rounded-lg border border-slate-700 bg-brand-secondary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {book.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{book.author}</p>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5">
          {book.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_STYLE[book.difficulty] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
              {book.difficulty}
            </span>
          )}
          {book.publishing_year && (
            <span className="text-xs text-slate-600 ml-auto">{book.publishing_year}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Theme detail view ─────────────────────────────────────────────────────────

function ThemeDetail({
  theme,
  groups,
  onBack,
}: {
  theme: string
  groups: Record<string, BookSummary[]>
  onBack: () => void
}) {
  const cfg = getThemeConfig(theme)
  const Icon = cfg.icon
  const subThemes = Object.keys(groups).sort()
  const totalBooks = Object.values(groups).reduce((s, g) => s + g.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-brand-text hover:text-slate-100 transition-colors group mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">Todos os temas</span>
        </button>

        <div className={`flex items-center gap-4 bg-brand-primary border rounded-2xl p-5 ${cfg.bg}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-brand-secondary shrink-0`}>
            <Icon className={`w-6 h-6 ${cfg.accent}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{theme}</h1>
            <p className="text-sm text-slate-500">{totalBooks} livro{totalBooks !== 1 ? 's' : ''} · {subThemes.length} sub-tema{subThemes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Sub-themes */}
      {subThemes.map((sub) => (
        <section key={sub}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-700 inline-block" />
            {sub}
            <span className="font-normal normal-case text-slate-600">({groups[sub].length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups[sub].map((book) => (
              <BookCard key={book.book_id} book={book} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const { themes, isLoading, booksByTheme, countByTheme } = useBooks()
  const [search, setSearch] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  // Theme detail view
  if (selectedTheme) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <ThemeDetail
          theme={selectedTheme}
          groups={booksByTheme(selectedTheme)}
          onBack={() => setSelectedTheme(null)}
        />
      </div>
    )
  }

  const filteredThemes = search.trim()
    ? themes.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
    : themes

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Temas</h1>
          <p className="text-sm text-brand-text">
            {isLoading ? 'Carregando…' : `${themes.length} tema${themes.length !== 1 ? 's' : ''} disponíveis`}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tema…"
            className="w-full bg-brand-primary border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty search */}
      {!isLoading && filteredThemes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text">
          <Search className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm">Nenhum tema encontrado para "{search}"</p>
        </div>
      )}

      {/* Theme grid */}
      {!isLoading && filteredThemes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredThemes.map((theme) => {
            const cfg = getThemeConfig(theme)
            const Icon = cfg.icon
            const count = countByTheme(theme)

            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`group text-left bg-brand-primary border rounded-2xl p-5 hover:shadow-lg hover:shadow-black/20 transition-all ${cfg.bg}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-brand-secondary flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${cfg.accent}`} />
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    {count} livro{count !== 1 ? 's' : ''}
                  </span>
                </div>

                <h2 className="font-semibold text-slate-100 group-hover:text-white transition-colors mb-1">
                  {theme}
                </h2>

                <div className="flex items-center gap-1 text-xs mt-3 pt-3 border-t border-slate-700/60">
                  <Star className={`w-3 h-3 ${cfg.accent}`} />
                  <span className={`${cfg.accent} font-medium`}>Ver livros</span>
                  <ChevronRight className={`w-3 h-3 ${cfg.accent} ml-auto group-hover:translate-x-0.5 transition-transform`} />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
