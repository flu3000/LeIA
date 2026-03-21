import { useState, useEffect } from 'react'
import { Heart, Send, Sparkles, Users, ExternalLink, CheckCircle, Trash2, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useInsights, type Insight } from '../hooks/useInsights'
import { useAuth } from '../context/AuthContext'
import PostCitationModal from '../components/PostCitationModal'

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return <span>agora</span>
  if (mins < 60) return <span>{mins}min</span>
  const hours = Math.floor(mins / 60)
  if (hours < 24) return <span>{hours}h</span>
  return <span>{Math.floor(hours / 24)}d</span>
}

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border border-brand-accent/30 shrink-0"
      />
    )
  }
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
      {initials}
    </div>
  )
}

function InsightCard({
  insight,
  currentUserId,
  onLike,
  onDelete,
}: {
  insight: Insight
  currentUserId?: string
  onLike: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isOwner = insight.userId === currentUserId
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-colors"
    >
      {/* Author (poster) — links to /profile/:userId */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          to={`/profile/${insight.profileHandle}`}
          className="flex items-center gap-3 flex-1 min-w-0 group/author"
          onClick={(e) => e.stopPropagation()}
        >
          <AuthorAvatar name={insight.displayName} avatarUrl={insight.avatarUrl} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate group-hover/author:text-brand-accent transition-colors">
              {insight.displayName}
            </p>
            <p className="text-xs text-slate-500">@{insight.username}</p>
          </div>
        </Link>
        <span className="text-xs text-slate-600 shrink-0">
          <TimeAgo date={insight.createdAt} />
        </span>
      </div>

      {/* Quote content */}
      <blockquote className="font-serif text-slate-200 text-sm italic leading-relaxed mb-2 border-l-2 border-brand-accent/40 pl-3">
        "{insight.content}"
      </blockquote>

      {/* Book attribution (author / book_title) */}
      {(insight.author || insight.bookTitle) && (
        <div className="flex items-center gap-1.5 pl-3 mb-3">
          <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
          <p className="text-xs text-slate-500">
            {insight.bookTitle && <span className="italic">{insight.bookTitle}</span>}
            {insight.bookTitle && insight.author && <span className="mx-1">·</span>}
            {insight.author && <span>{insight.author}</span>}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {insight.materialLink ? (
          <a
            href={insight.materialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-accent transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver fonte
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {/* Like */}
          <button
            onClick={() => onLike(insight.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              insight.isLiked ? 'text-pomodoro-focus' : 'text-slate-500 hover:text-pomodoro-focus'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${insight.isLiked ? 'fill-current scale-110' : ''}`}
            />
            {insight.likesCount > 0 && insight.likesCount}
          </button>

          {/* Delete — owner only, two-tap confirmation */}
          {isOwner && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Excluir?</span>
                <button
                  onClick={() => { onDelete(insight.id); setConfirmDelete(false) }}
                  className="text-xs text-pomodoro-focus hover:text-rose-400 font-medium transition-colors"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-slate-600 hover:text-pomodoro-focus transition-colors"
                aria-label="Excluir insight"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function InsightsPage() {
  const { user } = useAuth()
  const { explorar, seguindo, isLoading, fetchExplorar, fetchSeguindo, toggleLike, publish, deleteQuote, refresh } = useInsights()
  const [tab, setTab] = useState<'explorar' | 'seguindo'>('explorar')
  const [draft, setDraft] = useState('')
  const [materialLink, setMaterialLink] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => { fetchExplorar() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'seguindo') fetchSeguindo() }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublish = async () => {
    if (!draft.trim()) return
    setPublishing(true)
    const ok = await publish(draft, materialLink.trim() ? { materialLink: materialLink.trim() } : undefined)
    if (ok) {
      setDraft('')
      setMaterialLink('')
      setShowCompose(false)
      await refresh()
    }
    setPublishing(false)
  }

  const handleCitationSuccess = async () => {
    setModalOpen(false)
    await refresh()
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const feed = tab === 'explorar' ? explorar : seguindo

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-brand-primary border border-pomodoro-break/40 text-pomodoro-break text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Insight compartilhado com sucesso!
        </div>
      )}

      <PostCitationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCitationSuccess}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Insights</h1>
          <p className="text-sm text-brand-text">Citações e reflexões da comunidade</p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-sm font-medium hover:bg-brand-accent/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Citar livro
            </button>
            <button
              onClick={() => setShowCompose((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-600 hover:text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              Texto livre
            </button>
          </div>
        )}
      </div>

      {/* Compose panel */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-brand-primary border border-slate-700 rounded-2xl p-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder='"Compartilhe uma citação ou reflexão…"'
                maxLength={400}
                rows={3}
                className="w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent resize-none transition-colors font-serif italic"
              />
              <input
                value={materialLink}
                onChange={(e) => setMaterialLink(e.target.value)}
                placeholder="Link do material (opcional)"
                className="mt-2 w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-600">{draft.length}/400</span>
                <button
                  onClick={handlePublish}
                  disabled={!draft.trim() || publishing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                  Publicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit mb-6 border border-slate-700">
        {([['explorar', 'Explorar', Sparkles], ['seguindo', 'Seguindo', Users]] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-slate-700 text-slate-100' : 'text-brand-text hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-brand-text">
          <Sparkles className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium text-slate-300">
            {tab === 'seguindo'
              ? 'Siga outros leitores para ver os insights deles.'
              : 'Nenhum insight publicado ainda. Seja o primeiro!'}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="flex flex-col gap-3">
            {feed.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                currentUserId={user?.id}
                onLike={toggleLike}
                onDelete={deleteQuote}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
