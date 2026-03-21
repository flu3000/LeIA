import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, BookMarked, CheckCircle2, Library,
  Search, X, ChevronDown, Trash2,
} from 'lucide-react'
import { useSavedBooks } from '../hooks/useSavedBooks'
import type { SavedAs } from '../hooks/useBookDetail'
import type { SavedBookItem } from '../hooks/useSavedBooks'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_TABS: { value: SavedAs; label: string; icon: React.ReactNode }[] = [
  { value: 'a ler', label: 'a ler',  icon: <BookOpen    className="w-3.5 h-3.5" /> },
  { value: 'lendo', label: 'lendo',  icon: <BookMarked  className="w-3.5 h-3.5" /> },
  { value: 'lido',  label: 'lido',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
]

const DIFF_STYLE: Record<string, string> = {
  Iniciante:     'bg-pomodoro-break/15 text-pomodoro-break border-pomodoro-break/30',
  Intermediário: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Avançado:      'bg-pomodoro-focus/15 text-pomodoro-focus border-pomodoro-focus/30',
}

// ── Book card ─────────────────────────────────────────────────────────────────

function BookCard({
  item,
  onChangeStatus,
  onRemove,
}: {
  item: SavedBookItem
  onChangeStatus: (bookId: string, status: SavedAs) => void
  onRemove: (bookId: string) => void
}) {
  const [coverError, setCoverError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const book = item.books

  // Guard: if FK join returned null, render a minimal fallback
  if (!book) {
    return (
      <div className="bg-brand-primary border border-slate-700 rounded-xl p-4 flex items-center gap-3 text-slate-500 text-sm">
        <BookOpen className="w-5 h-5 shrink-0" />
        <span>Livro não encontrado (book_id: {item.book_id})</span>
      </div>
    )
  }

  const progressPct =
    item.saved_as === 'lendo' && book.pages && item.pages_read
      ? Math.min(100, Math.round((item.pages_read / book.pages) * 100))
      : 0

  return (
    <div className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex gap-4 transition-colors group">
      {/* Cover */}
      <Link to={`/books/${book.book_id}`} className="shrink-0">
        {book.cover_url && !coverError ? (
          <img
            src={book.cover_url}
            alt={book.title}
            onError={() => setCoverError(true)}
            className="w-14 h-20 object-cover rounded-lg border border-slate-700"
          />
        ) : (
          <div className="w-14 h-20 rounded-lg border border-slate-700 bg-brand-secondary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/books/${book.book_id}`}
              className="text-sm font-semibold text-slate-200 hover:text-brand-accent transition-colors line-clamp-2 leading-snug"
            >
              {book.title}
            </Link>
            <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
          </div>

          {/* Status + remove menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 transition-colors"
            >
              {item.saved_as}
              <ChevronDown className="w-3 h-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-40 w-36 bg-brand-primary border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  {STATUS_TABS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => { onChangeStatus(book.book_id, value); setMenuOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
                        item.saved_as === value
                          ? 'text-brand-accent bg-brand-accent/10'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                  <div className="border-t border-slate-700">
                    <button
                      onClick={() => { onRemove(book.book_id); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-pomodoro-focus hover:bg-pomodoro-focus/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {book.theme && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
              {book.theme}
            </span>
          )}
          {book.sub_theme && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600">
              {book.sub_theme}
            </span>
          )}
          {book.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_STYLE[book.difficulty] ?? ''}`}>
              {book.difficulty}
            </span>
          )}
        </div>

        {/* Progress bar (Lendo only) */}
        {item.saved_as === 'lendo' && book.pages && (
          <div className="mt-0.5 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>{item.pages_read ?? 0} / {book.pages} páginas</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-brand-primary border border-slate-700 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-accent transition-colors cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { items, isLoading, updateStatus, remove } = useSavedBooks()
  const [activeTab, setActiveTab] = useState<SavedAs>('a ler')
  const [filterTheme, setFilterTheme] = useState('')
  const [filterSubTheme, setFilterSubTheme] = useState('')
  const [filterAuthor, setFilterAuthor] = useState('')

  // Unique filter options derived from the full saved list
  const themes = useMemo(
    () => [...new Set(items.map((i) => i.books?.theme).filter(Boolean) as string[])].sort(),
    [items]
  )
  const subThemes = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter((i) => !filterTheme || i.books?.theme === filterTheme)
            .map((i) => i.books?.sub_theme)
            .filter(Boolean) as string[]
        ),
      ].sort(),
    [items, filterTheme]
  )
  const authors = useMemo(
    () => [...new Set(items.map((i) => i.books?.author).filter(Boolean) as string[])].sort(),
    [items]
  )

  // Apply tab + cumulative filters
  const visible = useMemo(() => {
    return items.filter((i) => {
      if (i.saved_as !== activeTab) return false
      if (filterTheme    && i.books?.theme    !== filterTheme)    return false
      if (filterSubTheme && i.books?.sub_theme !== filterSubTheme) return false
      if (filterAuthor   && i.books?.author    !== filterAuthor)   return false
      return true
    })
  }, [items, activeTab, filterTheme, filterSubTheme, filterAuthor])

  const hasFilters = !!(filterTheme || filterSubTheme || filterAuthor)

  const countByTab = (status: SavedAs) => items.filter((i) => i.saved_as === status).length

  const clearFilters = () => {
    setFilterTheme('')
    setFilterSubTheme('')
    setFilterAuthor('')
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Biblioteca</h1>
        <p className="text-sm text-brand-text">
          {isLoading ? 'Carregando…' : `${items.length} livro${items.length !== 1 ? 's' : ''} na sua coleção`}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit border border-slate-700">
        {STATUS_TABS.map(({ value, label, icon }) => {
          const count = countByTab(value)
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === value
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-brand-text hover:text-slate-200'
              }`}
            >
              {icon}
              {label}
              {count > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium leading-none ${
                  activeTab === value ? 'bg-brand-accent/20 text-brand-accent' : 'bg-slate-700 text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      {!isLoading && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Tema"
            value={filterTheme}
            options={themes}
            onChange={(v) => { setFilterTheme(v); setFilterSubTheme('') }}
          />
          <FilterSelect
            label="Sub-tema"
            value={filterSubTheme}
            options={subThemes}
            onChange={setFilterSubTheme}
          />
          <FilterSelect
            label="Autor"
            value={filterAuthor}
            options={authors}
            onChange={setFilterAuthor}
          />

          {/* Author free-text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              placeholder="Buscar autor…"
              className="bg-brand-primary border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-accent transition-colors w-44"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-2 rounded-lg hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty states */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 text-brand-text">
          <Library className="w-12 h-12 opacity-20" />
          <p className="font-medium text-slate-300">Sua biblioteca está vazia</p>
          <p className="text-sm max-w-xs">
            Acesse a página de um livro e adicione-o à sua lista de leitura.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-brand-text">
          <BookOpen className="w-10 h-10 opacity-20" />
          <p className="text-sm">
            {hasFilters
              ? 'Nenhum livro com esses filtros nesta aba.'
              : `Nenhum livro na aba "${activeTab}" ainda.`}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-brand-accent hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Book list */}
      {!isLoading && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <BookCard
              key={item.book_id}
              item={item}
              onChangeStatus={updateStatus}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
