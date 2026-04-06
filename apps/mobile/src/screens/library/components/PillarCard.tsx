import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from '@/src/constants/colors'
const colors = useColors()
import type { Pillar } from '@/src/types/library'

interface PillarCardProps {
  pillar: Pillar
  onPress: () => void
}

export function PillarCard({ pillar, onPress }: PillarCardProps) {
  const catCount = pillar.categories?.length ?? 0

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Ícone padrão */}
      <Ionicons name="library-outline" size={28} color={colors.accent} />

      {/* Nome */}
      <Text style={styles.name} numberOfLines={2}>{pillar.pillar_name}</Text>

      {/* Rodapé */}
      <View style={styles.footer}>
        {catCount > 0 && (
          <Text style={styles.footerText}>{catCount} categorias</Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={colors.dimmed} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  name: {
    color: colors.text,
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
    color: colors.dimmed,
    fontSize: 11,
    fontWeight: '600',
  },
})
