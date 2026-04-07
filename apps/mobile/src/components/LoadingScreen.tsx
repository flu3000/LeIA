import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { useMemo } from 'react';

export function LoadingScreen() {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LeIA</Text>
      <ActivityIndicator
        size="small"
        color={theme.accent}
        style={styles.spinner}
      />
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    color: theme.text,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 4,
  },
  spinner: {
    opacity: 0.6,
  },
})
