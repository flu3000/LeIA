import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  UserPlus, UserMinus, Settings, MoreVertical, Flag, ShieldOff,
  MapPin, Lock, Heart, BookOpen, ExternalLink, Trash2, Loader2, CheckCircle, X,
} from 'lucide-react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useAuth } from '../context/AuthContext'
import type { Insight } from '../hooks/useInsights'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm'
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover border-2 border-brand-accent/30 shrink-0`}
      />
    )
  }
  return (
    <div className={`${dim} rounded-full bg-brand-accent/20 border-2 border-brand-accent/30 flex items-center justify-center font-bold text-brand-accent shrink-0`}>
      {initials}
    </div>
  )
}

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span className="text-lg font-bold text-slate-100 leading-none">{value.toLocaleString('pt-BR')}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

// ── Report modal ──────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Conteúdo impróprio',
  'Assédio ou ameaça',
  'Spam',
  'Informação falsa',
  'Perfil falso',
  'Outro',
]

function ReportModal({
  username,
  onClose,
  onSubmit,
}: {
  username: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason || loading) return
    setLoading(true)
    await onSubmit(reason)
    setDone(true)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-brand-primary border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-pomodoro-focus" />
            <h2 className="font-semibold text-slate-100 text-sm">Denunciar @{username}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="w-8 h-8 text-pomodoro-break" />
            <p className="text-sm font-medium text-slate-200">Denúncia enviada</p>
            <p className="text-xs text-slate-500">Nossa equipe analisará o relatório em breve.</p>
            <button onClick={onClose} className="mt-2 px-4 py-2 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-sky-500 transition-colors">
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-500">Selecione o motivo da denúncia:</p>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors border ${
                    reason === r
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                      : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pomodoro-focus text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar denúncia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quote card (streamlined for profile view) ─────────────────────────────────

function ProfileQuoteCard({
  insight,
  isOwner,
  onLike,
  onDelete,
}: {
  insight: Insight
  isOwner: boolean
  onLike: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-brand-primary border border-slate-700 hover:border-slate-600 rounded-2xl p-5 transition-colors">
      <blockquote className="font-serif text-slate-200 text-sm italic leading-relaxed mb-2 border-l-2 border-brand-accent/40 pl-3">
        "{insight.content}"
      </blockquote>

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

      <div className="flex items-center justify-between gap-2 mt-3">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(insight.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              insight.isLiked ? 'text-pomodoro-focus' : 'text-slate-500 hover:text-pomodoro-focus'
            }`}
          >
            <Heart className={`w-4 h-4 ${insight.isLiked ? 'fill-current scale-110' : ''}`} />
            {insight.likesCount > 0 && insight.likesCount}
          </button>

          {isOwner && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Excluir?</span>
                <button
                  onClick={() => { onDelete(insight.id); setConfirmDelete(false) }}
                  className="text-xs text-pomodoro-focus font-medium hover:text-rose-400 transition-colors"
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
                aria-label="Excluir citação"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { handle } = useParams<{ handle: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const {
    profile, quotes, isFollowing, isBlocked, isLoading,
    followLoading, isOwnProfile,
    toggleFollow, toggleLike, deleteQuote, report, block,
  } = useUserProfile(handle ?? '')

  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockDone, setBlockDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleReport = async (reason: string) => {
    await report(reason)
    setReportOpen(false)
    showToast('Denúncia enviada. Obrigado pelo feedback.')
  }

  const handleBlock = async () => {
    setMenuOpen(false)
    const ok = await block()
    if (ok) {
      setBlockDone(true)
      showToast(`@${profile?.username} foi bloqueado.`)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-brand-text">
        <p className="text-sm">Usuário não encontrado.</p>
      </div>
    )
  }

  // ── Blocked ───────────────────────────────────────────────────────────────
  if (isBlocked || blockDone) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4 pt-20">
        <ShieldOff className="w-10 h-10 text-slate-500 mx-auto" />
        <p className="font-semibold text-slate-200">@{profile.username} está bloqueado</p>
        <p className="text-sm text-slate-500">Você não verá o conteúdo deste usuário.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-brand-primary border border-slate-700 text-slate-300 text-sm hover:bg-white/5 transition-colors"
        >
          Voltar
        </button>
      </div>
    )
  }

  const isPrivate = !profile.isPublic && !isOwnProfile

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-brand-primary border border-pomodoro-break/40 text-pomodoro-break text-sm px-4 py-2.5 rounded-xl shadow-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}

      {reportOpen && (
        <ReportModal
          username={profile.username}
          onClose={() => setReportOpen(false)}
          onSubmit={handleReport}
        />
      )}

      {/* Profile header card */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Avatar name={profile.displayName} url={profile.avatarUrl} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-100 truncate">{profile.displayName}</h1>
                <p className="text-sm text-slate-500">@{profile.username}</p>
              </div>

              {/* Three-dot menu (only for third-party profiles) */}
              {!isOwnProfile && currentUser && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
                    aria-label="Mais opções"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-9 z-40 w-44 bg-brand-primary border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                        <button
                          onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/8 hover:text-white transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5 text-slate-500" />
                          Denunciar usuário
                        </button>
                        <button
                          onClick={handleBlock}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-pomodoro-focus hover:bg-pomodoro-focus/10 transition-colors"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          Bloquear usuário
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{profile.bio}</p>
            )}
            {(profile.city || profile.state) && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-1.5">
                <MapPin className="w-3 h-3" />
                {[profile.city, profile.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-slate-700/60">
          <StatPill value={profile.followerCount} label="seguidores" />
          <div className="w-px h-6 bg-slate-700" />
          <StatPill value={profile.followingCount} label="seguindo" />
          <div className="w-px h-6 bg-slate-700" />
          <StatPill value={profile.quoteCount} label="citações" />
        </div>

        {/* Action button */}
        <div className="mt-4">
          {isOwnProfile ? (
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-slate-500 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          ) : currentUser ? (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                isFollowing
                  ? 'border border-slate-600 text-slate-300 hover:border-pomodoro-focus hover:text-pomodoro-focus bg-transparent'
                  : 'bg-brand-accent text-white hover:bg-sky-500'
              }`}
            >
              {followLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : isFollowing
                  ? <><UserMinus className="w-3.5 h-3.5" /> Seguindo</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Seguir</>}
            </button>
          ) : null}
        </div>
      </div>

      {/* Private profile notice */}
      {isPrivate ? (
        <div className="bg-brand-primary border border-slate-700 rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <Lock className="w-8 h-8 text-slate-500" />
          <p className="font-semibold text-slate-200 text-sm">Este perfil é privado</p>
          <p className="text-xs text-slate-500 max-w-xs">
            Siga este usuário para ver as citações e insights dele.
          </p>
        </div>
      ) : (
        /* Quote feed */
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Citações · {profile.quoteCount}
          </h2>

          {quotes.length === 0 ? (
            <div className="bg-brand-primary border border-slate-700 rounded-2xl p-10 flex flex-col items-center gap-2 text-center">
              <BookOpen className="w-8 h-8 text-slate-600" />
              <p className="text-sm text-slate-500">Nenhuma citação publicada ainda.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {quotes.map((q) => (
                <ProfileQuoteCard
                  key={q.id}
                  insight={q}
                  isOwner={isOwnProfile}
                  onLike={toggleLike}
                  onDelete={deleteQuote}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
