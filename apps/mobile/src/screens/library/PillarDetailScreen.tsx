import {
  View, Text, ScrollView, FlatList,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { colors } from '@/src/constants/colors'
import { usePillarDetail } from '@/src/hooks/usePillars'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import { BookCardSmall, BookCard } from './components/BookCard'
import type { Book, Category } from '@/src/types/library'

// ── Carrossel horizontal de uma categoria ────────────────────────────────────

function CategoryCarousel({
  category,
  onBook,
}: {
  category: Category & { books: Book[] }
  onBook: (b: Book) => void
}) {
  if (!category.books || category.books.length === 0) return null

  return (
    <View style={styles.carouselSection}>
      <Text style={styles.carouselTitle}>{category.category_name}</Text>
      <FlatList
        data={category.books.slice(0, 6)}
        keyExtractor={(b) => b.book_id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselList}
        renderItem={({ item }) => (
          <BookCardSmall book={item} onPress={() => onBook(item)} />
        )}
      />
    </View>
  )
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function PillarDetailScreen({ pillarId }: { pillarId: string }) {
  const router     = useRouter()
  const navigation = useNavigation()
  const { detail, isLoading } = usePillarDetail(pillarId)
  const { isSaved }           = useSavedBooks()

  useEffect(() => {
    if (detail) navigation.setOptions({ title: detail.pillar_name })
  }, [detail, navigation])

  const handleBook = async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/book/${book.book_id}`)
  }

  const handleCategory = async (catId: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/category/${catId}`)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    )
  }

  if (!detail) {
    return (
      <View style={styles.loadingCenter}>
        <Text style={styles.errorText}>Pilar não encontrado</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header do pilar */}
      <View style={[styles.pillarHeader, { borderLeftColor: colors.accent, borderLeftWidth: 4 }]}>
        <Ionicons name="library-outline" size={36} color={colors.accent} />
        <View style={styles.pillarMeta}>
          <Text style={styles.pillarName}>{detail.pillar_name}</Text>
        </View>
      </View>

      {/* Livros em destaque */}
      {detail.featured_books.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destaques do pilar</Text>
          {detail.featured_books.map((book) => (
            <BookCard
              key={book.book_id}
              book={book}
              onPress={() => handleBook(book)}
              isSaved={isSaved(book.book_id)}
            />
          ))}
        </View>
      )}

      {/* Categorias com carrossel */}
      {detail.categories_with_books.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
          </View>
          {detail.categories_with_books.map((cat) => (
            <View key={cat.category_id}>
              <CategoryCarousel category={cat} onBook={handleBook} />
              {/* Link "Ver todos" para a categoria */}
              {cat.books && cat.books.length > 0 && (
                <View style={styles.seeAllRow}>
                  <Text
                    style={[styles.seeAll, { color: colors.accent }]}
                    onPress={() => handleCategory(cat.category_id)}
                  >
                    Ver todos em {cat.category_name} →
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {detail.categories_with_books.length === 0 && detail.featured_books.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="library-outline" size={48} color={colors.dimmed} />
          <Text style={styles.emptyText}>Nenhum conteúdo disponível ainda</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.muted,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  pillarMeta: {
    flex: 1,
    gap: 6,
  },
  pillarName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  carouselSection: {
    marginBottom: 20,
  },
  carouselTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  carouselList: {
    paddingRight: 16,
  },
  seeAllRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: colors.dimmed,
    fontSize: 14,
  },
})
