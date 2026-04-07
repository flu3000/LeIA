import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useTheme } from '@/src/context/ThemeContext' 
import { usePillars } from '@/src/hooks/usePillars'
import { PillarCard } from './components/PillarCard'
import type { Pillar } from '@/src/types/library'
import { useMemo } from 'react'

export default function PilaresScreen() {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const router = useRouter()
  const { pillars, isLoading } = usePillars()

  const handlePress = async (pillar: Pillar) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/pillar/${pillar.pillar_id}`)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  return (
    <FlatList
      data={pillars}
      keyExtractor={(p) => String(p.pillar_id)}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <Animated.View
          style={styles.cardWrap}
          entering={FadeInDown.delay(index * 60).duration(280).springify()}
        >
          <PillarCard pillar={item} onPress={() => handlePress(item)} />
        </Animated.View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum pilar encontrado</Text>
        </View>
      }
    />
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  cardWrap: {
    flex: 1,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.dimmed,
    fontSize: 14,
    fontFamily: 'ClashDisplay-Medium',
  },
})
