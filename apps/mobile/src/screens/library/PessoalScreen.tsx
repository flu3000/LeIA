import {
  View, Text, TouchableOpacity, FlatList, Image,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useTheme } from '@/src/context/ThemeContext'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import type { SavedBook, ReadStatus } from '@/src/types/library'

// ── Labels de status ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReadStatus, string> = {
  'a ler': 'Quero ler',
  'lendo': 'Lendo',
  'lido':  'Concluído',
}

const STATUS_COLOR: Record<ReadStatus, string> = {
  'a ler': useTheme().muted,
  'lendo': useTheme().accent,
  'lido':  useTheme().success,
}

type FilterTab = 'todos' | ReadStatus

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos',  label: 'Todos' },
  { key: 'a ler',  label: 'Quero ler' },
  { key: 'lendo',  label: 'Lendo' },
  { key: 'lido',   label: 'Concluídos' },
]

// ── Card de livro salvo ───────────────────────────────────────────────────────

function SavedBookCard({
  item,
  onPress,
  onUnsave,
  onUpdateStatus,
}: {
  item: SavedBook
  onPress: () => void
  onUnsave: () => void
  onUpdateStatus: (s: ReadStatus) => void
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const book    = item.book_editions?.books
  const edition = item.book_editions
  const cover   = edition?.cover_url
  const status  = item.saved_as

  return (
    <Animated.View entering={FadeInDown.duration(250).springify()}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        {/* Capa */}
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Ionicons name="book" size={24} color={theme.dimmed} />
          </View>
        )}

        {/* Dados */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {book?.title ?? 'Livro desconhecido'}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {book?.author ?? '—'}
          </Text>
          {edition?.publisher && (
            <Text style={styles.publisher} numberOfLines={1}>
              {edition.publisher}{edition.publish_year ? ` · ${edition.publish_year}` : ''}
            </Text>
          )}

          {/* Status de leitura */}
          <View style={styles.statusRow}>
            {(['a ler', 'lendo', 'lido'] as ReadStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  status === s && { backgroundColor: STATUS_COLOR[s] + '22', borderColor: STATUS_COLOR[s] },
                ]}
                onPress={() => onUpdateStatus(s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.statusText, status === s && { color: STATUS_COLOR[s] }]}>
                  {STATUS_LABEL[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão remover */}
        <TouchableOpacity
          style={styles.unsaveBtn}
          onPress={onUnsave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={22} color={theme.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function PessoalScreen() {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const router = useRouter()
  const { savedBooks, isLoading, isSyncing, unsaveBook, updateStatus, refetch } = useSavedBooks()
  const [activeFilter, setActiveFilter] = useState<FilterTab>('todos')

  const filtered = savedBooks.filter((sb) =>
    activeFilter === 'todos' ? true : sb.saved_as === activeFilter
  )

  const handlePress = async (item: SavedBook) => {
    const bookId = item.book_editions?.books?.book_id
    if (!bookId) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/book/${bookId}`)
  }

  const handleUnsave = async (item: SavedBook) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    unsaveBook(item.saved_book_id)
  }

  const handleUpdateStatus = async (item: SavedBook, status: ReadStatus) => {
    await Haptics.selectionAsync()
    updateStatus(item.saved_book_id, status)
  }

  return (
    <View style={styles.container}>
      {/* Abas de filtro */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterTab, activeFilter === key && styles.filterTabActive]}
            onPress={() => setActiveFilter(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Refresh */}
        <TouchableOpacity onPress={refetch} style={styles.refreshBtn}>
          {isSyncing
            ? <ActivityIndicator size="small" color={theme.accent} />
            : <Ionicons name="refresh" size={18} color={theme.muted} />
          }
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(sb) => sb.saved_book_id}
          renderItem={({ item }) => (
            <SavedBookCard
              item={item}
              onPress={() => handlePress(item)}
              onUnsave={() => handleUnsave(item)}
              onUpdateStatus={(s) => handleUpdateStatus(item, s)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={theme.dimmed} />
              <Text style={styles.emptyTitle}>
                {activeFilter === 'todos' ? 'Nenhum livro salvo' : `Nenhum livro em "${FILTER_TABS.find(f => f.key === activeFilter)?.label}"`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'todos'
                  ? 'Explore o Acervo e salve os livros que quiser ler.'
                  : 'Altere o status dos seus livros salvos.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
    flexWrap: 'nowrap',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterTabActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  filterText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  refreshBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  cover: {
    width: 60,
    height: 84,
    borderRadius: 8,
  },
  coverPlaceholder: {
    backgroundColor: theme.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  author: {
    color: theme.muted,
    fontSize: 13,
  },
  publisher: {
    color: theme.dimmed,
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: theme.surfaceDeep,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusText: {
    color: theme.dimmed,
    fontSize: 11,
    fontWeight: '600',
  },
  unsaveBtn: {
    padding: 4,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: theme.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
