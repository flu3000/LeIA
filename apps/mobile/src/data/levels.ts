export interface Level {
  level: number
  title: string
  minXP: number
  color: string   // hex — não usa classes Tailwind no mobile
}

export const LEVELS: Level[] = [
  { level: 1,  title: 'Aprendiz',   minXP: 0,     color: '#94A3B8' },
  { level: 2,  title: 'Estudante',  minXP: 100,   color: '#CBD5E1' },
  { level: 3,  title: 'Leitor',     minXP: 300,   color: '#0EA5E9' },
  { level: 4,  title: 'Explorador', minXP: 600,   color: '#0EA5E9' },
  { level: 5,  title: 'Pensador',   minXP: 1000,  color: '#10B981' },
  { level: 6,  title: 'Erudito',    minXP: 1500,  color: '#10B981' },
  { level: 7,  title: 'Sábio',      minXP: 2500,  color: '#A78BFA' },
  { level: 8,  title: 'Mestre',     minXP: 4000,  color: '#A78BFA' },
  { level: 9,  title: 'Filósofo',   minXP: 6000,  color: '#FBBF24' },
  { level: 10, title: 'Iluminado',  minXP: 10000, color: '#FBBF24' },
]

export function getLevelForXP(xp: number): Level {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl
  }
  return current
}

export function getProgressToNext(xp: number): {
  current: Level
  next: Level | null
  progress: number
} {
  const current = getLevelForXP(xp)
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1)
  if (nextIndex === -1) return { current, next: null, progress: 1 }
  const next = LEVELS[nextIndex]
  const progress = (xp - current.minXP) / (next.minXP - current.minXP)
  return { current, next, progress: Math.min(progress, 1) }
}
