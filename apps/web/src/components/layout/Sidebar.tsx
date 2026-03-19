import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MessageSquare, BookOpen, Library, Timer, PanelLeft, Users, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Chat' },
  { to: '/topics', icon: BookOpen, label: 'Temas' },
  { to: '/library', icon: Library, label: 'Biblioteca' },
  { to: '/pomodoro', icon: Timer, label: 'Estudo Focado' },
  { to: '/insights', icon: Sparkles, label: 'Insights' },
  { to: '/social', icon: Users, label: 'Social' },
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
          <svg 
            viewBox="0 0 24 28" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-8 h-8 text-brand-accent shrink-0 bg-transparent"
          >
            <path d="M11.5173 16.7831L21.5173 11.1829" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M12.3173 8.05552L15.2208 7.30087" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 10.9537L12.5526 7.20595" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M21.5173 20.483V11.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 26.483L11.5173 16.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 26.483L21.5173 20.8828" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 16.7831L1.51729 11.1829" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M10.7173 8.05552L7.81374 7.30087" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 10.9537L10.482 7.20595" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M1.51728 20.483L1.51728 11.483" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 26.483L1.51729 20.8828" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 7.08325L21.5173 1.48302" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M11.5173 7.08325L1.51729 1.48302" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M21.4875 11.0344L18.5461 3.1956" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M1.54708 11.0344L4.48845 3.1956" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
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
