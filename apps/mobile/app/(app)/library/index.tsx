import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/src/context/ThemeContext'
import AcervoScreen  from '@/src/screens/library/AcervoScreen'
import PilaresScreen from '@/src/screens/library/PilaresScreen'
import PessoalScreen from '@/src/screens/library/PessoalScreen'

type Tab = 'acervo' | 'pilares' | 'pessoal'

const TABS: { key: Tab; label: string }[] = [
  { key: 'acervo',  label: 'Acervo' },
  { key: 'pilares', label: 'Pilares' },
  { key: 'pessoal', label: 'Pessoal' },
]

export default function LibraryScreen() {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<Tab>('acervo')
  const [barWidth, setBarWidth] = useState(0)
  const indicatorX = useSharedValue(0)

  // const style = styles(colors)

  const tabWidth = barWidth > 0 ? (barWidth - 8) / TABS.length : 0

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  const handleTabPress = async (tab: Tab, idx: number) => {
    if (tab === activeTab) return
    await Haptics.selectionAsync()
    indicatorX.value = withTiming(idx * tabWidth, { duration: 200, easing: Easing.out(Easing.quad) })
    setActiveTab(tab)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toggle de 3 abas */}
      <View
        style={styles.toggleBar}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 && (
          <Reanimated.View style={[styles.toggleIndicator, indicatorStyle, { width: tabWidth }]} />
        )}
        {TABS.map(({ key, label }, idx) => (
          <TouchableOpacity
            key={key}
            style={styles.toggleBtn}
            onPress={() => handleTabPress(key, idx)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, activeTab === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo da aba ativa */}
      <View style={styles.content}>
        {activeTab === 'acervo'  && <AcervoScreen />}
        {activeTab === 'pilares' && <PilaresScreen />}
        {activeTab === 'pessoal' && <PessoalScreen />}
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  toggleBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
    backgroundColor: theme.accent,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    color: theme.dimmed,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'ClashDisplay-Medium',
  },
  toggleTextActive: {
    color: '#fff',
    fontFamily: 'ClashDisplay-Bold',
  },
  content: {
    flex: 1,
  },
})
