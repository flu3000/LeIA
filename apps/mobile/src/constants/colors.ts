import { useAuth } from "@/src/context/AuthContext"

export type ThemeColors = {
  background: string;
  bg95?: string;
  bg90?: string;
  bg88?: string;
  bg80?: string;
  surface: string;
  surfaceDeep: string;
  accent: string;
  accentOrange: string;
  accentDim: string;
  text: string;
  muted: string;
  dimmed: string;
  danger: string;
  success: string;
  warning: string;
  violet: string;
  pomodoroFocus: string;
  pomodoroBreak: string;
  border: string;
  borderStrong: string;
  borderDim: string; // Adicionei aqui para garantir que o Light também tenha
};

export const theme: { light: ThemeColors; dark: ThemeColors } = {
  // DARK THEME
  dark: {

    // Fundos
    background:        '#001015',
    bg95:      '#0D1C21', // background 95% opacidade no branco
    bg90:      '#1A282D', // background 90% opacidade no branco
    bg88:      '#1F2D31', // background 88% opacidade no branco
    bg80:      '#334044', // background 80% opacidade no branco

    surface:           '#0D1C21', // background 95% opacidade no branco
    surfaceDeep:       '#1A282D', // background 90% opacidade no branco

    // Destaque
    accent:            '#00BCF6',
    accentDim:         '#003342', // accent 20% opacidade no background
    accentOrange:      '#FF4519',

    // Texto
    text:              '#F1EDE3',
    muted:             '#606968', // text 40% opacidade no background
    dimmed:            '#303C3E', // text 20% opacidade no background

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
    background:   '#F1EDE3',
    bg95: '#E5E1D8', // background 95% opacidade no preto
    bg90: '#D9D5CC', // background 90% opacidade no preto
    bg88: '#D4D1C8', // background 88% opacidade no preto
    bg80: '#C1BEB6', // background 80% opacidade no preto

    surface:      '#E5E1D8', // background 95% opacidade no preto
    surfaceDeep:  '#D9D5CC', // background 90% opacidade no preto
  
    // Destaque
    accent:        '#0093C1',
    accentDim:     '#C1DBDD', // accent 20% opacidade no background
    accentOrange:  '#FF4519',
  
    // Texto
    text:          '#001015',
    muted:         '#919490', // text 40% opacidade no background
    dimmed:        '#C1C1BA', // text 20% opacidade no background
  
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
    borderDim:     '#E5E1D8', // background 95% opacidade no preto
  },

}

// export function useColors() {
//  const { user } = useAuth();
//  const theme = user?.theme === 'light' ? 'light' : 'dark';
//  return palette[theme];
//}

//export type ThemeType = keyof typeof palette;
//export type ColorPalette = typeof palette.dark;
