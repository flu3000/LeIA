import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

import CatalogSection from './CatalogSection'
import UserSection from './UserSection'

type Tab = 'acervo' | 'pessoal'

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('acervo')

  const handleTabPress = async (tab: Tab) => {
    if (tab === activeTab) return
    await Haptics.selectionAsync()
    setActiveTab(tab)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toggle top bar */}
      <View style={styles.toggleBar}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'acervo' && styles.toggleBtnActive]}
          onPress={() => handleTabPress('acervo')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeTab === 'acervo' && styles.toggleTextActive]}>
            Acervo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'pessoal' && styles.toggleBtnActive]}
          onPress={() => handleTabPress('pessoal')}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, activeTab === 'pessoal' && styles.toggleTextActive]}>
            Pessoal
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'acervo' ? <CatalogSection /> : <UserSection />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  toggleBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#0EA5E9',
  },
  toggleText: {
    color: '#4B6070',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: '#fff',
  },
})
