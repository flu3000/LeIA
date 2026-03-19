import { useState, useEffect } from 'react'
import { Heart, Send, Sparkles, Users, ExternalLink, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

function InsightCard({ insight, onLike }: { insight: Insight; onLike: (id: string) => void }) {
  const initials = insight.displayName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-colors"
    >
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{insight.displayName}</p>
          <p className="text-xs text-slate-500">@{insight.username}</p>
        </div>
        <span className="text-xs text-slate-600 shrink-0"><TimeAgo date={insight.createdAt} /></span>
      </div>

      {/* Content */}
      <blockquote className="font-serif text-slate-200 text-sm italic leading-relaxed mb-3 border-l-2 border-brand-accent/40 pl-3">
        "{insight.content}"
      </blockquote>

      {/* Footer */}
      <div className="flex items-center justify-between">
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
        ) : <span />}
        <button
          onClick={() => onLike(insight.id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            insight.isLiked ? 'text-pomodoro-focus' : 'text-slate-500 hover:text-pomodoro-focus'
          }`}
        >
          <Heart className={`w-4 h-4 transition-transform ${insight.isLiked ? 'fill-current scale-110' : ''}`} />
          {insight.likesCount > 0 && insight.likesCount}
        </button>
      </div>
    </motion.div>
  )
}

export default function InsightsPage() {
  const { user } = useAuth()
  const { explorar, seguindo, isLoading, fetchExplorar, fetchSeguindo, toggleLike, publish, refresh } = useInsights()
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
    const ok = await publish(draft, materialLink || undefined)
    if (ok) { setDraft(''); setMaterialLink(''); setShowCompose(false) }
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

      {/* Compose */}
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
                placeholder='Compartilhe uma citação ou reflexão… "A leitura é para a mente o que o exercício é para o corpo." — Addison'
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
                  {publishing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
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
            {tab === 'seguindo' ? 'Siga outros leitores para ver os insights deles.' : 'Nenhum insight publicado ainda.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((insight) => (
            <InsightCard key={insight.id} insight={insight} onLike={toggleLike} />
          ))}
        </div>
      )}
    </div>
  )
}
