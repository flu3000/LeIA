import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MessageSquare, BookOpen, Library, Timer, PanelLeft, Users, Sparkles, Building2, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Chat' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/library', icon: Library, label: 'Biblioteca' },
  { to: '/pomodoro', icon: Timer, label: 'Estudo Focado' },
  { to: '/insights', icon: Sparkles, label: 'Insights' },
  { to: '/social', icon: Users, label: 'Amigos' },
  { to: '/rankings', icon: Trophy, label: 'Rankings' },
  { to: '/communities', icon: Building2, label: 'Comunidades' },
]

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover border border-brand-accent/40 shrink-0" />
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-xs font-bold text-brand-accent shrink-0">
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // Labels fade-in/out alongside the width transition
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-200 ${
    collapsed ? 'opacity-0 max-w-xs' : 'opacity-100 max-w-xs'
  }`

  return (
    <aside
      className={`hidden md:flex flex-col bg-brand-primary shrink-0 transition-all duration-200 overflow-hidden ${
        collapsed ? 'w-16 cursor-pointer' : 'w-60'
      }`}
      onClick={collapsed ? () => setCollapsed(false) : undefined}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3 min-w-8">
        <div className="flex items-center gap-2.5 min-w-10 overflow-hidden w-100 h-8 px-1">
            
<svg className='w-8 h-8 shrink-0 bg-transparent' viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="320" height="320" rx="64" fill="#131F24"/>
<path d="M160 197L71 146" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<rect x="136" y="77" width="54" height="58" fill="#131F24"/>
<path d="M160 111L71 60" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M249 220L249 60" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M160 197L249 146" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M71 220L71 60" stroke="#131F24" stroke-width="48" stroke-linecap="round"/>
<path d="M160 271L160 111" stroke="#131F24" stroke-width="48" stroke-linecap="round"/>
<path d="M71 220L71 60" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M160 271L71 220" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M160 271L160 111" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M160 66.0001V66" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
<path d="M160 111L249 60" stroke="#EAE0C8" stroke-width="32" stroke-linecap="round"/>
</svg>
          <span className={`text-xl font-serif font-semibold text-brand-text leading-tight w-full ${labelClass}`}>
            LeIA
          </span>
        </div>
        <div className={`shrink-0 ${labelClass}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCollapsed(true) }}
            aria-label="Recolher menu"
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1 px-2 py-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className={labelClass}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile link */}
      {user && (
        <div className="px-2 pb-4 border-t border-white/10 pt-3">
          <NavLink
            to="/profile"
            title={collapsed ? user.name : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
            <div className={`min-w-0 ${labelClass}`}>
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  )
}
