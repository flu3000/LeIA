// src/context/ThemeContext.tsx
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { theme } from '../constants/colors';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(theme.light);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // 'light' ou 'dark'
  // const currentTheme = theme[colorScheme ?? 'light'];
  const { user } = useAuth(); // Pega o usuário logado
  console.log('[ThemeProvider] user theme:', user?.theme, 'system theme:', systemScheme);

  // 1. Se o usuário tem preferência salva, usa ela. 
  // 2. Se não, usa a do sistema.
  // 3. Se não tiver nada, fallback para dark.
  const userThemeSelection = user?.theme || systemScheme || 'dark';
  const currentTheme = theme[userThemeSelection as 'light' | 'dark'];

  return (
    <ThemeContext.Provider value={currentTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// O Hook customizado para uso interno
export const useTheme = () => useContext(ThemeContext);