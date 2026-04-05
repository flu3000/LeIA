import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native'
import { useRef, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

import InsightsTab, { type InsightSubTab } from '@/src/screens/social/InsightsTab'
import RankingsTab from '@/src/screens/social/RankingsTab'
import CommunitiesTab from '@/src/screens/social/CommunitiesTab'
import { colors } from '@/src/constants/colors'

// ── Constants ─────────────────────────────────────────────────────────────────

type MainTab = 'insights' | 'rankings' | 'communities'

const MAIN_TABS = [
  { key: 'insights'    as const, icon: 'sparkles'    as const, color: '#8B5CF6', label: 'Insights'    },
  { key: 'rankings'   as const, icon: 'trophy'       as const, color: '#E7FF21', label: 'Rankings'    },
  { key: 'communities' as const, icon: 'people'       as const, color: '#14B8A6', label: 'Comunidades' },
]

const INSIGHT_SUB_TABS: { key: InsightSubTab; label: string }[] = [
  { key: 'todos',    label: 'Todos'    },
  { key: 'seguindo', label: 'Seguindo' },
  { key: 'curtidos', label: 'Curtidos' },
  { key: 'seus',     label: 'Seus'     },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function SocialScreen() {
  const [mainTab, setMainTab]     = useState<MainTab>('insights')
  const [subTabIdx, setSubTabIdx] = useState(0)
  const [subBarWidth, setSubBarWidth] = useState(0)

  // Fade animation for main tab content switch (React Native Animated)
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Spring indicator for sub-tabs (Reanimated)
  const indicatorX = useSharedValue(0)
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  const tabWidth = subBarWidth / INSIGHT_SUB_TABS.length

  // ── Handlers ───────────────────────────────────────────────────────────────

  const switchMainTab = useCallback((tab: MainTab) => {
    if (tab === mainTab) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true })
      .start(() => {
        setMainTab(tab)
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start()
      })
  }, [mainTab, fadeAnim])

  const switchSubTab = useCallback((idx: number) => {
    setSubTabIdx(idx)
    indicatorX.value = withTiming(idx * tabWidth, { duration: 200, easing: Easing.out(Easing.quad) })
    Haptics.selectionAsync()
  }, [indicatorX, tabWidth])

  // ── Active tab theme ────────────────────────────────────────────────────────

  const activeColor = MAIN_TABS.find((t) => t.key === mainTab)?.color ?? '#8B5CF6'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Nível 1: Ícones grandes das abas principais ── */}
      <View style={[styles.mainTabBar, { borderBottomColor: activeColor + '33' }]}>
        {MAIN_TABS.map((tab) => {
          const isActive = mainTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.mainTabBtn}
              onPress={() => switchMainTab(tab.key)}
              activeOpacity={0.75}
            >
              {/* Glow circle when active */}
              <View style={[
                styles.mainTabIconWrap,
                isActive && { backgroundColor: tab.color + '22' },
              ]}>
                <Ionicons
                  name={tab.icon}
                  size={isActive ? 28 : 24}
                  color={isActive ? tab.color : '#4A5568'}
                />
              </View>
              <Text style={[styles.mainTabLabel, isActive && { color: tab.color }]}>
                {tab.label}
              </Text>
              {/* Active underline */}
              {isActive && (
                <View style={[styles.mainTabUnderline, { backgroundColor: tab.color }]} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Nível 2: Sub-abas de texto (só para Insights) ── */}
      {mainTab === 'insights' && (
        <View
          style={styles.subTabBar}
          onLayout={(e) => setSubBarWidth(e.nativeEvent.layout.width)}
        >
          {INSIGHT_SUB_TABS.map((tab, idx) => {
            const isActive = subTabIdx === idx
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.subTabBtn}
                onPress={() => switchSubTab(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}

          {/* Spring indicator */}
          {subBarWidth > 0 && (
            <Reanimated.View
              style={[
                styles.subTabIndicator,
                indicatorStyle,
                { width: tabWidth },
              ]}
            />
          )}
        </View>
      )}

      {/* ── Content ── */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {mainTab === 'insights' && (
          <InsightsTab subTab={INSIGHT_SUB_TABS[subTabIdx].key} />
        )}
        {mainTab === 'rankings' && <RankingsTab />}
        {mainTab === 'communities' && <CommunitiesTab />}
      </Animated.View>

    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Main tab bar (Nível 1) ────────────────────────────────────────────────

  mainTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  mainTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    gap: 4,
    position: 'relative',
  },
  mainTabIconWrap: {
    width: 52,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTabLabel: {
    fontSize: 10,
    color: '#4A5568',
    letterSpacing: 0.2,
    fontFamily: 'ClashDisplay-Medium',
  },
  mainTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    borderRadius: 1,
  },

  // ── Sub-tab bar (Nível 2) ─────────────────────────────────────────────────

  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  subTabText: {
    fontSize: 13,
    color: '#4A5568',
    fontFamily: 'ClashDisplay-Medium',
  },
  subTabTextActive: {
    color: '#8B5CF6',
    fontFamily: 'ClashDisplay-Semibold',
  },
  subTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#8B5CF6',
  },

  // ── Content ───────────────────────────────────────────────────────────────

  content: {
    flex: 1,
  },
})
