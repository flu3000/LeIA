import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

import { colors } from '@/src/constants/colors'
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
  const [activeTab, setActiveTab] = useState<Tab>('acervo')

  const handleTabPress = async (tab: Tab) => {
    if (tab === activeTab) return
    await Haptics.selectionAsync()
    setActiveTab(tab)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Biblioteca</Text>
      </View>

      {/* Toggle de 3 abas */}
      <View style={styles.toggleBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleBtn, activeTab === key && styles.toggleBtnActive]}
            onPress={() => handleTabPress(key)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  toggleBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    color: colors.dimmed,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
})
