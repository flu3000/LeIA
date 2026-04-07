import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/src/context/ThemeContext'
import type { Pillar } from '@/src/types/library'

interface PillarCardProps {
  pillar: Pillar
  onPress: () => void
}

export function PillarCard({ pillar, onPress }: PillarCardProps) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const catCount = pillar.categories?.length ?? 0

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Ícone padrão */}
      <Ionicons name="library-outline" size={28} color={theme.accent} />

      {/* Nome */}
      <Text style={styles.name} numberOfLines={2}>{pillar.pillar_name}</Text>

      {/* Rodapé */}
      <View style={styles.footer}>
        {catCount > 0 && (
          <Text style={styles.footerText}>{catCount} categorias</Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={theme.dimmed} />
      </View>
    </TouchableOpacity>
  )
}

function createStyles(theme: any) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    name: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    footerText: {
      color: theme.dimmed,
      fontSize: 11,
      fontWeight: '600',
    },
  })
}
