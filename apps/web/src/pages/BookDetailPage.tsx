import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShoppingBag, BookOpen, BookMarked, CheckCircle2,
  FileText, Loader2, Check, AlertCircle,
} from 'lucide-react'
import { useBookDetail, type SavedAs } from '../hooks/useBookDetail'
import { useAuth } from '../context/AuthContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

const difficultyConfig = {
  Iniciante:     { label: 'Iniciante',     bg: 'bg-pomodoro-break/15',    text: 'text-pomodoro-break',  border: 'border-pomodoro-break/30'  },
  Intermediário: { label: 'Intermediário', bg: 'bg-amber-500/15',         text: 'text-amber-400',        border: 'border-amber-500/30'        },
  Avançado:      { label: 'Avançado',      bg: 'bg-pomodoro-focus/15',    text: 'text-pomodoro-focus',   border: 'border-pomodoro-focus/30'   },
}

const STATUS_OPTIONS: { value: SavedAs; label: string; icon: React.ReactNode }[] = [
  { value: 'a ler', label: 'a ler',  icon: <BookOpen    className="w-3.5 h-3.5" /> },
  { value: 'lendo', label: 'lendo',  icon: <BookMarked  className="w-3.5 h-3.5" /> },
  { value: 'lido',  label: 'lido',   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
]

function Badge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'accent' }) {
  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
        variant === 'accent'
          ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30'
          : 'bg-slate-700/60 text-slate-300 border-slate-600'
      }`}
    >
      {label}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    book, saved, isLoading, isSaving, noteSaved,
    updateStatus, updatePagesRead, updateNotes,
  } = useBookDetail(id ?? '')

  const [localNotes, setLocalNotes] = useState<string | null>(null)
  const [coverError, setCoverError] = useState(false)

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-3 text-brand-text">
        <AlertCircle className="w-8 h-8 opacity-40" />
        <p className="text-sm">Livro não encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-brand-accent text-sm hover:underline"
        >
          ← Voltar
        </button>
      </div>
    )
  }

  const diff = book.difficulty ? difficultyConfig[book.difficulty] : null
  const progressPct =
    book.pages && saved?.pages_read
      ? Math.min(100, Math.round((saved.pages_read / book.pages) * 100))
      : 0

  const notes = localNotes ?? saved?.notes ?? ''

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-brand-text hover:text-slate-100 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm">Voltar</span>
      </button>

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Cover */}
          <div className="shrink-0 self-start">
            {book.cover_url && !coverError ? (
              <img
                src={book.cover_url}
                alt={book.title}
                onError={() => setCoverError(true)}
                className="w-36 h-52 object-cover rounded-xl border border-slate-700 shadow-lg"
              />
            ) : (
              <div className="w-36 h-52 rounded-xl border border-slate-700 bg-brand-secondary flex flex-col items-center justify-center gap-2 text-slate-600">
                <BookOpen className="w-10 h-10" />
                <span className="text-xs">Sem capa</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 leading-tight">{book.title}</h1>
              <p className="text-base text-slate-400 mt-0.5">{book.author}</p>
              {book.translator && (
                <p className="text-xs text-slate-500 mt-0.5">Tradução: {book.translator}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {book.publisher       && <span>{book.publisher}</span>}
              {book.publishing_year && <span>{book.publishing_year}</span>}
              {book.pages           && <span>{book.pages} páginas</span>}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {book.theme     && <Badge label={book.theme}     variant="accent" />}
              {book.sub_theme && <Badge label={book.sub_theme} />}
              {diff && (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium ${diff.bg} ${diff.text} ${diff.border}`}
                >
                  {diff.label}
                </span>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <p className="text-sm text-slate-300 leading-relaxed">{book.description}</p>
            )}

            {/* Amazon */}
            {book.amazon_link && (
              <a
                href={book.amazon_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Comprar na Amazon
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress card (logged-in only) ───────────────────────────────── */}
      {user && (
        <div className="bg-brand-primary border border-slate-700 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Meu progresso</h2>
            {isSaving && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Salvando…
              </span>
            )}
          </div>

          {/* Status selector */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label, icon }) => {
                const active = saved?.saved_as === value
                return (
                  <button
                    key={value}
                    onClick={() => updateStatus(value)}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-60 ${
                      active
                        ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-accent'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    {icon}
                    {label}
                    {active && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pages read + progress bar (only when "Lendo") */}
          {saved?.saved_as === 'lendo' && book.pages && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Páginas lidas</p>
                <span className="text-xs text-slate-400">
                  {saved.pages_read ?? 0} / {book.pages} ({progressPct}%)
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-accent rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <input
                type="number"
                min={0}
                max={book.pages}
                value={saved.pages_read ?? 0}
                onChange={(e) => updatePagesRead(Number(e.target.value))}
                className="w-32 bg-brand-secondary border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Minhas notas
              </p>
              {noteSaved && (
                <span className="flex items-center gap-1 text-xs text-pomodoro-break">
                  <Check className="w-3 h-3" />
                  Notas salvas
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => {
                setLocalNotes(e.target.value)
                updateNotes(e.target.value)
              }}
              placeholder="Adicione suas anotações, citações favoritas ou reflexões sobre o livro…"
              rows={4}
              className="w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accent resize-none transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  )
}
