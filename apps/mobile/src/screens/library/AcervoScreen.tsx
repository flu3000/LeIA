import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { colors } from '@/src/constants/colors'
import { useBooks } from '@/src/hooks/useBooks'
import { usePillars } from '@/src/hooks/usePillars'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import { BookCard } from './components/BookCard'
import { FilterModal } from './components/FilterModal'
import type { Book, BookFilters, Pillar } from '@/src/types/library'

// ── Chips de filtros ativos ───────────────────────────────────────────────────

function ActiveFilterChips({
  filters,
  pillars,
  onRemove,
}: {
  filters: BookFilters
  pillars: Pillar[]
  onRemove: (key: keyof BookFilters) => void
}) {
  const chips: { key: keyof BookFilters; label: string }[] = []
  if (filters.difficulty) chips.push({ key: 'difficulty', label: filters.difficulty })
  if (filters.pillar_id) {
    const p = pillars.find((x) => x.pillar_id === filters.pillar_id)
    if (p) chips.push({ key: 'pillar_id', label: p.pillar_name })
  }
  if (chips.length === 0) return null

  return (
    <View style={styles.chipRow}>
      {chips.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={styles.chip}
          onPress={() => onRemove(key)}
          activeOpacity={0.8}
        >
          <Text style={styles.chipText}>{label}</Text>
          <Ionicons name="close" size={12} color={colors.accent} />
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function AcervoScreen() {
  const router  = useRouter()
  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState<BookFilters>({})
  const [showFilter, setShowFilter] = useState(false)

  const { books, isLoading, isLoadingMore, hasMore, fetchMore } = useBooks(search, filters)
  const { pillars }     = usePillars()
  const { isSaved, getSavedByBook, saveBook, unsaveBook } = useSavedBooks()

  const hasActiveFilters = Boolean(filters.pillar_id || filters.difficulty || filters.category_id)

  const handlePress = useCallback(async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/book/${book.book_id}`)
  }, [router])

  const handleToggleSave = useCallback(async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const saved = getSavedByBook(book.book_id)
    if (saved) {
      await unsaveBook(saved.saved_book_id)
    } else {
      const firstEditionId = book.book_editions?.[0]?.edition_id
      if (firstEditionId) {
        await saveBook(firstEditionId)
      }
    }
  }, [getSavedByBook, unsaveBook, saveBook])

  const removeFilter = (key: keyof BookFilters) =>
    setFilters((prev) => { const next = { ...prev }; delete next[key]; return next })

  return (
    <View style={styles.container}>
      {/* Barra de busca */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.dimmed} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título ou autor..."
            placeholderTextColor={colors.dimmed}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={16} color={colors.dimmed} />
            </TouchableOpacity>
          )}
        </View>

        {/* Botão de filtro */}
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options"
            size={20}
            color={hasActiveFilters ? '#fff' : colors.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Chips de filtros ativos */}
      <ActiveFilterChips
        filters={filters}
        pillars={pillars}
        onRemove={removeFilter}
      />

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.book_id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(250).springify()}>
              <BookCard
                book={item}
                onPress={() => handlePress(item)}
                isSaved={isSaved(item.book_id)}
                onToggleSave={() => handleToggleSave(item)}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? fetchMore : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator color={colors.accent} style={{ paddingVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color={colors.dimmed} />
              <Text style={styles.emptyTitle}>Nenhum livro encontrado</Text>
              <Text style={styles.emptySubtitle}>
                {hasActiveFilters || search
                  ? 'Tente ajustar os filtros ou a busca.'
                  : 'O acervo ainda não possui livros.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de filtros */}
      <FilterModal
        visible={showFilter}
        filters={filters}
        pillars={pillars}
        onApply={setFilters}
        onClose={() => setShowFilter(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 11,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  chipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
})
