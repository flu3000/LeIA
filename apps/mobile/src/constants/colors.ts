import { useAuth } from "@/src/context/AuthContext"

/** Paleta Oxford Modern — LeIA Mobile */
export const palette = {
  // DARK THEME
  dark: {

    // Fundos
    background:        '#001015',
    surface:           '#0D1C21', // background 95% opacidade no branco
    surfaceDeep:       '#1A282D', // background 90% opacidade no branco

    // Destaque
    accent:            '#00BCF6',
    accentOrange:      '#FF4519',
    accentDim:         '#003342', // accent 20% opacidade no background

    // Texto
    text:              '#F1EDE3',
    muted:             '#94A3B8',
    dimmed:            '#4B6070',

    // Semânticos
    danger:            '#E11D48',
    success:           '#10B981',
    warning:           '#F59E0B',
    violet:            '#8B5CF6',

    // Pomodoro
    pomodoroFocus:     '#E11D48',
    pomodoroBreak:     '#10B981',

    // Bordas
    border:            '#1A282D', // background 90% opacidade no branco
    borderStrong:      '#1F2D31', // background 88% opacidade no branco
    borderDim:         '#0D1C21', // background 95% opacidade no branco
  },

  light: {

    // Fundos
    background:   '#F1EDE3', // 
    surface:      '#E5E1D8', // background 95% opacidade no preto
    surfaceDeep:  '#D9D5CC', // background 90% opacidade no preto
  
    // Destaque
    accent:        '#0093C1',
    accentOrange:  '#FF4519',
    accentDim:     '#C1DBDD', // accent 20% opacidade no background
  
    // Texto
    text:          '#EAE0C8',
    muted:         '#94A3B8',
    dimmed:        '#4B6070',
  
    // Semânticos
    danger:        '#E11D48',
    success:       '#10B981',
    warning:       '#F59E0B',
    violet:        '#8B5CF6',
  
    // Pomodoro
    pomodoroFocus: '#E11D48',
    pomodoroBreak: '#10B981',
  
    // Bordas
    border:        '#D9D5CC', // background 90% opacidade no preto
    borderStrong:  '#D4D1C8', // background 88% opacidade no preto

  },

} as const

export function colors() {
  const { user } = useAuth();
  
  // Se o tema for 'light', usa light. Caso contrário (dark ou undefined), usa dark.
  const theme = user?.theme === 'light' ? 'light' : 'dark';
  
  return palette[theme];
}

export type ThemeType = keyof typeof palette;
export type ColorPalette = typeof palette.dark;
