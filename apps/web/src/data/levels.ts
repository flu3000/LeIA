export interface Level {
  level: number
  title: string
  minXP: number
  color: string
}

export const LEVELS: Level[] = [
  { level: 1,  title: 'Aprendiz',   minXP: 0,     color: 'text-slate-400' },
  { level: 2,  title: 'Estudante',  minXP: 100,   color: 'text-slate-300' },
  { level: 3,  title: 'Leitor',     minXP: 300,   color: 'text-brand-accent' },
  { level: 4,  title: 'Explorador', minXP: 600,   color: 'text-brand-accent' },
  { level: 5,  title: 'Pensador',   minXP: 1000,  color: 'text-pomodoro-break' },
  { level: 6,  title: 'Erudito',    minXP: 1500,  color: 'text-pomodoro-break' },
  { level: 7,  title: 'Sábio',      minXP: 2500,  color: 'text-purple-400' },
  { level: 8,  title: 'Mestre',     minXP: 4000,  color: 'text-purple-400' },
  { level: 9,  title: 'Filósofo',   minXP: 6000,  color: 'text-amber-400' },
  { level: 10, title: 'Iluminado',  minXP: 10000, color: 'text-amber-400' },
]

export function getLevelForXP(xp: number): Level {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl
  }
  return current
}

export function getProgressToNext(xp: number): { current: Level; next: Level | null; progress: number } {
  const current = getLevelForXP(xp)
  const nextIndex = LEVELS.findIndex((l) => l.level === current.level + 1)
  if (nextIndex === -1) return { current, next: null, progress: 1 }
  const next = LEVELS[nextIndex]
  const progress = (xp - current.minXP) / (next.minXP - current.minXP)
  return { current, next, progress: Math.min(progress, 1) }
}
