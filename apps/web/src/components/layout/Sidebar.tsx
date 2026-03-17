import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MessageSquare, BookOpen, Library, Timer, BookMarked, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Chat' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/library', icon: Library, label: 'Biblioteca' },
  { to: '/pomodoro', icon: Timer, label: 'Estudo Focado' },
]

function UserAvatar({ name }: { name: string }) {
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
  const labelClass = `overflow-hidden whitespace-nowrap transition-all duration-300 ${
    collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-xs'
  }`

  return (
    <aside
      className={`hidden md:flex flex-col bg-brand-primary shrink-0 transition-all duration-300 overflow-hidden ${
        collapsed ? 'w-16 cursor-pointer' : 'w-60'
      }`}
      onClick={collapsed ? () => setCollapsed(false) : undefined}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-5 border-b border-white/10 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
          <BookMarked className="w-6 h-6 text-brand-accent shrink-0" />
          <span className={`text-sm font-semibold text-white leading-tight ${labelClass}`}>
            Portal do Conhecimento
          </span>
        </div>
        <div className={`shrink-0 ${labelClass}`}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setCollapsed(true) }}
            aria-label="Recolher menu"
            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
          >
            <UserAvatar name={user.name} />
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
