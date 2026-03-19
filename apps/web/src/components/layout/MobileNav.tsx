import { NavLink } from 'react-router-dom'
import { MessageSquare, Library, Timer, UserCircle, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', icon: MessageSquare, label: 'Chat' },
  { to: '/library', icon: Library, label: 'Biblioteca' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro' },
  { to: '/insights', icon: Sparkles, label: 'Insights' },
  { to: '/profile', icon: UserCircle, label: 'Perfil' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary border-t border-white/10 flex z-50">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
              isActive ? 'text-brand-accent' : 'text-slate-500'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
