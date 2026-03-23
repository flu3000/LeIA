import {
  View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState } from 'react'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'

import { useUserContent, type UserContent } from '@/src/hooks/useUserContent'

type Filter = 'todos' | 'favoritos' | 'lidos'

const tipoEmoji: Record<string, string> = {
  livro: '📚', video: '🎬', podcast: '🎙️', artigo: '📄', curso: '🎓',
}

function ContentCard({ item, onToggleFav, onToggleRead }: {
  item: UserContent
  onToggleFav: () => void
  onToggleRead: () => void
}) {
  return (
    <Animated.View entering={FadeInDown.duration(250).springify()}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>
            {tipoEmoji[item.category?.toLowerCase()] ?? '📄'}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.is_favourite && (
            <View style={styles.favBadge}>
              <Text style={styles.favBadgeText}>❤️ Favorito</Text>
            </View>
          )}
          {item.is_read && (
            <View style={styles.readBadge}>
              <Text style={styles.readBadgeText}>✓ Lido</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, item.is_favourite && styles.actionBtnActive]}
            onPress={onToggleFav}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14 }}>{item.is_favourite ? '❤️' : '🤍'}</Text>
            <Text style={[styles.actionText, item.is_favourite && styles.actionTextActive]}>
              {item.is_favourite ? 'Salvo' : 'Salvar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, item.is_read && styles.actionBtnRead]}
            onPress={onToggleRead}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.is_read ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={16}
              color={item.is_read ? '#10B981' : '#4B6070'}
            />
            <Text style={[styles.actionText, item.is_read && styles.actionTextRead]}>
              {item.is_read ? 'Lido' : 'Marcar lido'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

export default function UserSection() {
  const { items, isSyncing, toggleSave, toggleRead, fetchLibrary } = useUserContent()
  const [filter, setFilter] = useState<Filter>('todos')

  const filtered = items.filter((item) => {
    if (filter === 'favoritos') return item.is_favourite
    if (filter === 'lidos')     return item.is_read
    return true
  })

  const handleToggleFav = async (item: UserContent) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleSave({ card_id: item.card_id, title: item.title, category: item.category })
  }

  const handleToggleRead = async (item: UserContent) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleRead({ card_id: item.card_id, title: item.title, category: item.category })
  }

  return (
    <>
      {/* Refresh + filter row */}
      <View style={styles.controlRow}>
        <View style={styles.filterRow}>
          {(['todos', 'favoritos', 'lidos'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'todos' ? 'Todos' : f === 'favoritos' ? '❤️ Favoritos' : '✓ Lidos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={fetchLibrary} style={styles.refreshBtn}>
          {isSyncing
            ? <ActivityIndicator size="small" color="#0EA5E9" />
            : <Ionicons name="refresh" size={20} color="#94A3B8" />
          }
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.card_id}
        renderItem={({ item }) => (
          <ContentCard
            item={item}
            onToggleFav={() => handleToggleFav(item)}
            onToggleRead={() => handleToggleRead(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Nenhum conteúdo salvo</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'todos'
                ? 'Converse com o LeIA e salve fontes que te interessam.'
                : `Nenhum item marcado como ${filter}.`
              }
            </Text>
          </View>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
    marginBottom: 12,
    gap: 8,
  },
  filterRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1B2C33',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterTabActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: { color: '#fff' },
  refreshBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  cardEmoji: { fontSize: 24, lineHeight: 28 },
  cardTitle: {
    flex: 1,
    color: '#F0EEE6',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: '#0EA5E9',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  favBadge: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  favBadgeText: { color: '#fb7185', fontSize: 11, fontWeight: '600' },
  readBadge: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionBtnActive: { backgroundColor: 'rgba(239,68,68,0.12)' },
  actionBtnRead:   { backgroundColor: 'rgba(16,185,129,0.12)' },
  actionText: { color: '#4B6070', fontSize: 12, fontWeight: '600' },
  actionTextActive: { color: '#fb7185' },
  actionTextRead:   { color: '#10B981' },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: '#F0EEE6',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
