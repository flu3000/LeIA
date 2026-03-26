export type MedalRarity = 'comum' | 'raro' | 'épico' | 'lendário'

export interface Medal {
  key: string
  name: string
  description: string
  emoji: string
  rarity: MedalRarity
}

export const MEDALS: Medal[] = [
  { key: 'first_session',  name: 'Primeiros Passos', emoji: '🌱', rarity: 'comum',    description: 'Concluiu sua primeira sessão de foco.' },
  { key: 'focus_pure',     name: 'Mente Imóvel',     emoji: '🎯', rarity: 'raro',     description: 'Completou uma sessão sem sair da aba.' },
  { key: 'streak_3',       name: 'Em Chamas',        emoji: '🔥', rarity: 'comum',    description: 'Manteve um streak de 3 dias consecutivos.' },
  { key: 'streak_7',       name: 'Semana Perfeita',  emoji: '📅', rarity: 'raro',     description: '7 dias consecutivos de estudo.' },
  { key: 'streak_30',      name: 'Monge do Saber',   emoji: '🧘', rarity: 'épico',    description: '30 dias consecutivos de estudo.' },
  { key: 'sessions_10',    name: 'Devorador',        emoji: '📚', rarity: 'comum',    description: '10 sessões de foco concluídas.' },
  { key: 'sessions_50',    name: 'Incansável',       emoji: '⚙️', rarity: 'raro',     description: '50 sessões de foco concluídas.' },
  { key: 'xp_100',         name: 'Centelha',         emoji: '⚡', rarity: 'comum',    description: 'Acumulou 100 XP.' },
  { key: 'xp_500',         name: 'Erudito',          emoji: '🎓', rarity: 'raro',     description: 'Acumulou 500 XP.' },
  { key: 'xp_2000',        name: 'Sábio',            emoji: '🏆', rarity: 'épico',    description: 'Acumulou 2.000 XP.' },
  { key: 'xp_10000',       name: 'Iluminado',        emoji: '✨', rarity: 'lendário', description: 'Acumulou 10.000 XP.' },
  { key: 'pages_100',      name: 'Voraz',            emoji: '📖', rarity: 'raro',     description: 'Leu 100 páginas no total.' },
  { key: 'social_follow',  name: 'Conectado',        emoji: '👥', rarity: 'comum',    description: 'Seguiu seu primeiro usuário.' },
  { key: 'insight_first',  name: 'Voz Própria',      emoji: '💬', rarity: 'comum',    description: 'Publicou seu primeiro Insight.' },
]

export const MEDAL_RARITY: Record<MedalRarity, { border: string; label: string; text: string }> = {
  comum:    { border: '#334155', label: 'Comum',    text: '#94A3B8' },
  raro:     { border: '#0EA5E9', label: 'Raro',     text: '#0EA5E9' },
  épico:    { border: '#A78BFA', label: 'Épico',    text: '#A78BFA' },
  lendário: { border: '#FBBF24', label: 'Lendário', text: '#FBBF24' },
}
