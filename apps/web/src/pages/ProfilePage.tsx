import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, BookMarked, Timer, Library, MessageSquare, ChevronRight, Bell, ShieldCheck, Palette, Trash2, Sun, Moon, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useTheme } from '../context/ThemeContext'
import { useXP } from '../hooks/useXP'
import { getProgressToNext } from '../data/levels'
import MedalsSection from '../components/MedalsSection'
import LeaderboardComponent from '../components/LeaderboardComponent'
import Button from '../components/ui/Button'

function Avatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  const sizeClass = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-16 h-16 text-2xl' }[size]
  return (
    <div className={`${sizeClass} rounded-full bg-brand-accent/20 border-2 border-brand-accent/40 flex items-center justify-center font-bold text-brand-accent shrink-0`}>
      {initials}
    </div>
  )
}

function SettingRow({ icon, label, description, action, danger = false, onClick }: {
  icon: React.ReactNode; label: string; description?: string
  action?: React.ReactNode; danger?: boolean; onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag {...(onClick ? { onClick, type: 'button' as const } : {})}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors rounded-xl ${onClick ? (danger ? 'hover:bg-rose-400/10 cursor-pointer' : 'hover:bg-slate-700/50 cursor-pointer') : ''}`}>
      <span className={`shrink-0 ${danger ? 'text-pomodoro-focus' : 'text-brand-text'}`}>{icon}</span>
      <div className="flex-1 text-left min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-pomodoro-focus' : 'text-slate-200'}`}>{label}</p>
        {description && <p className="text-xs text-brand-text mt-0.5">{description}</p>}
      </div>
      {action ?? (onClick && !danger && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />)}
    </Tag>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-secondary border border-slate-700 hover:border-slate-600 transition-colors">
      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-brand-accent" />}
      <span className="text-xs text-slate-300 font-medium">{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { savedCards } = useApp()
  const { theme } = useTheme()
  const { stats } = useXP()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'ranking'>('overview')

  if (!user) return null

  const joinedDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(user.joinedAt))
  const favoritesCount = savedCards.filter((c) => c.isFavorite).length
  const readCount = savedCards.filter((c) => c.isRead).length
  const { current: level, next, progress } = getProgressToNext(stats.totalXP)
  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={user.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-100 truncate">{user.name}</h1>
            <p className="text-sm text-brand-text truncate">{user.email}</p>
            <p className="text-xs text-slate-600 mt-0.5">Membro desde {joinedDate}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${level.color}`}>{level.title}</p>
            <p className="text-xs text-slate-500">Nível {level.level}</p>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-accent" />
              <span className="text-xs text-brand-text font-medium">{stats.totalXP.toLocaleString('pt-BR')} XP</span>
            </div>
            {next && <span className="text-xs text-slate-600">{next.minXP.toLocaleString('pt-BR')} XP → {next.title}</span>}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full ${level.color.replace('text-', 'bg-')} transition-all duration-700`}
              style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <MessageSquare className="w-5 h-5" />, label: 'Sessões',  value: stats.sessionsCount,  color: 'text-brand-accent',   bg: 'bg-brand-accent/10' },
          { icon: <BookMarked    className="w-5 h-5" />, label: 'Salvos',   value: savedCards.length,    color: 'text-brand-accent',   bg: 'bg-brand-accent/10' },
          { icon: <Library       className="w-5 h-5" />, label: 'Lidos',    value: readCount,            color: 'text-pomodoro-break', bg: 'bg-emerald-400/10' },
          { icon: <Timer         className="w-5 h-5" />, label: 'Favoritos',value: favoritesCount,       color: 'text-pomodoro-focus', bg: 'bg-rose-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-brand-primary border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <span className="text-xl font-bold text-slate-100">{stat.value}</span>
            <span className="text-xs text-brand-text">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-brand-primary p-1 rounded-xl w-fit border border-slate-700">
        {(['overview', 'ranking'] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === s ? 'bg-slate-700 text-slate-100' : 'text-brand-text hover:text-slate-200'}`}>
            {s === 'overview' ? 'Medalhas' : '🏆 Ranking'}
          </button>
        ))}
      </div>

      {activeSection === 'overview' ? (
        <MedalsSection isOwner={true} />
      ) : (
        <LeaderboardComponent />
      )}

      {/* Settings */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferências</p>
        </div>
        <div className="divide-y divide-slate-700/60">
          <SettingRow icon={<Palette className="w-4 h-4" />} label="Aparência"
            description={theme === 'dark' ? 'Tema escuro ativo' : 'Tema claro ativo'} action={<ThemeToggle />} />
          <SettingRow icon={<Bell className="w-4 h-4" />} label="Notificações" description="Alertas e lembretes de estudo"
            action={<span className="text-xs text-brand-text bg-slate-700 px-2 py-0.5 rounded-full">Em breve</span>} />
          <SettingRow icon={<ShieldCheck className="w-4 h-4" />} label="Segurança" description="Alterar senha e sessões ativas"
            action={<span className="text-xs text-brand-text bg-slate-700 px-2 py-0.5 rounded-full">Em breve</span>} />
        </div>
      </div>

      <div className="bg-brand-primary border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conta</p>
        </div>
        <div className="divide-y divide-slate-700/60">
          <SettingRow icon={<LogOut className="w-4 h-4" />} label="Sair da conta" description="Encerrar sessão neste dispositivo" onClick={() => setShowConfirm(true)} />
          <SettingRow icon={<Trash2 className="w-4 h-4" />} label="Excluir conta" description="Remove permanentemente todos os dados" danger
            action={<span className="text-xs text-brand-text bg-slate-700 px-2 py-0.5 rounded-full">Em breve</span>} />
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-brand-secondary/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl shadow-black/50">
            <h2 className="text-base font-semibold text-slate-100 mb-1">Sair da conta?</h2>
            <p className="text-sm text-brand-text mb-5">Você precisará entrar novamente para acessar o Portal.</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button className="flex-1 !bg-pomodoro-focus hover:!bg-rose-600" onClick={handleLogout}>
                <LogOut className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
