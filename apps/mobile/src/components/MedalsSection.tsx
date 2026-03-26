import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useMedals } from '@/src/hooks/useMedals'
import { MEDALS, MEDAL_RARITY } from '@/src/data/medals'
import type { Medal } from '@/src/data/medals'

type Tab = 'destaque' | 'colecao'

function MedalTile({
  medal,
  unlocked,
  featured,
  canFeature,
  onToggle,
}: {
  medal: Medal
  unlocked: boolean
  featured: boolean
  canFeature: boolean
  onToggle?: () => void
}) {
  const rarity = MEDAL_RARITY[medal.rarity]
  const canPress = unlocked && (featured || canFeature)

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        { borderColor: unlocked ? rarity.border : '#1E303A' },
        featured && styles.tileFeatured,
      ]}
      onPress={canPress ? onToggle : undefined}
      activeOpacity={canPress ? 0.7 : 1}
    >
      {featured && (
        <View style={styles.starBadge}>
          <Text style={styles.starText}>★</Text>
        </View>
      )}
      <Text style={[styles.tileEmoji, !unlocked && styles.tileLocked]}>
        {unlocked ? medal.emoji : '🔒'}
      </Text>
      <Text
        style={[styles.tileName, { color: unlocked ? '#E2E8F0' : '#334155' }]}
        numberOfLines={2}
      >
        {medal.name}
      </Text>
      {unlocked && (
        <Text style={[styles.tileRarity, { color: rarity.text }]}>{rarity.label}</Text>
      )}
    </TouchableOpacity>
  )
}

export default function MedalsSection() {
  const { unlocked, featured, unlockedKeys, toggleFeatured } = useMedals()
  const [tab, setTab] = useState<Tab>('destaque')
  const featuredKeys = new Set(featured.map((m) => m.key))
  const canFeature = featured.length < 5

  return (
    <View style={styles.container}>
      {/* Header tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medalhas</Text>
        <View style={styles.tabs}>
          {(['destaque', 'colecao'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'destaque'
                  ? `⭐ Destaque (${featured.length}/5)`
                  : `🎖 Coleção (${unlocked.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {tab === 'destaque' ? (
        <View style={styles.grid}>
          {featured.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="ribbon-outline" size={32} color="#334155" />
              <Text style={styles.emptyText}>
                Selecione até 5 medalhas na Coleção para exibir aqui.
              </Text>
            </View>
          ) : (
            featured.map((medal) => (
              <MedalTile
                key={medal.key}
                medal={medal}
                unlocked
                featured
                canFeature={canFeature}
                onToggle={() => toggleFeatured(medal.key)}
              />
            ))
          )}
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.collectionScroll}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {MEDALS.map((medal) => (
              <MedalTile
                key={medal.key}
                medal={medal}
                unlocked={unlockedKeys.has(medal.key)}
                featured={featuredKeys.has(medal.key)}
                canFeature={canFeature}
                onToggle={() => toggleFeatured(medal.key)}
              />
            ))}
          </ScrollView>
          <Text style={styles.hint}>
            Toque em uma medalha desbloqueada para colocá-la em destaque (máx. 5).
          </Text>
        </>
      )}
    </View>
  )
}

const TILE_SIZE = 72

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#F0EEE6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#243640',
  },
  tabText: {
    color: '#4B6070',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F0EEE6',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  collectionScroll: {
    maxHeight: 320,
  },
  tile: {
    width: TILE_SIZE,
    minHeight: TILE_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#131f24',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  tileFeatured: {
    backgroundColor: 'rgba(251,191,36,0.08)',
  },
  tileLocked: {
    opacity: 0.5,
  },
  tileEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  tileName: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  tileRarity: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  starBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  starText: {
    fontSize: 9,
    color: '#000',
    fontWeight: '800',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyText: {
    color: '#4B6070',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  hint: {
    color: '#334155',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
})
