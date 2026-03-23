/** Paleta Oxford Modern — LeIA Mobile */
export const colors = {
  // Fundos
  background:  '#131f24',
  surface:     '#1B2C33',
  surfaceDeep: '#243640',
  dark:        '#0F1C22',

  // Destaque
  accent:      '#0EA5E9',
  accentDim:   'rgba(14,165,233,0.15)',

  // Texto
  text:        '#F0EEE6',
  muted:       '#94A3B8',
  dimmed:      '#4B6070',

  // Semânticos
  danger:      '#E11D48',
  success:     '#10B981',
  warning:     '#F59E0B',
  violet:      '#8B5CF6',

  // Pomodoro
  pomodoroFocus: '#E11D48',
  pomodoroBreak: '#10B981',

  // Bordas
  border:        'rgba(255,255,255,0.06)',
  borderSubtle:  'rgba(255,255,255,0.04)',
  borderStrong:  'rgba(255,255,255,0.12)',
} as const

export type Color = keyof typeof colors
