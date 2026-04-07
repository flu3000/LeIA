import {
  View, Text, SectionList, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/src/context/ThemeContext'
import { useCategoryDetail } from '@/src/hooks/usePillars'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import { BookCard } from './components/BookCard'
import type { Book } from '@/src/types/library'

export default function CategoryDetailScreen({ categoryId }: { categoryId: string }) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const router     = useRouter()
  const navigation = useNavigation()

  const { data, isLoading } = useCategoryDetail(categoryId)
  const { isSaved, getSavedByBook, saveBook, unsaveBook } = useSavedBooks()

  useEffect(() => {
    if (data?.category) navigation.setOptions({ title: data.category.category_name })
  }, [data, navigation])

  const handleBook = async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/library/book/${book.book_id}`)
  }

  const handleToggleSave = async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const saved = getSavedByBook(book.book_id)
    if (saved) {
      await unsaveBook(saved.saved_book_id)
    } else {
      const editionId = book.book_editions?.[0]?.edition_id
      if (editionId) await saveBook(editionId)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    )
  }

  // Adapt API sections to SectionList format
  const sections = (data?.sections ?? []).map((s) => ({
    title: s.tag,
    data: s.books,
  }))

  return (
    <View style={styles.container}>
      {/* Cabeçalho da categoria */}
      {data?.category && (
        <View style={styles.catHeader}>
          <Text style={styles.catName}>{data.category.category_name}</Text>
          {data.category.pillars?.pillar_name && (
            <View style={styles.pillarBadge}>
              <Text style={styles.pillarBadgeText}>{data.category.pillars.pillar_name}</Text>
            </View>
          )}
        </View>
      )}

      {/* Lista agrupada por tags */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.book_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => handleBook(item)}
            isSaved={isSaved(item.book_id)}
            onToggleSave={() => handleToggleSave(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={theme.dimmed} />
            <Text style={styles.emptyText}>Nenhum livro nesta categoria</Text>
          </View>
        }
      />
    </View>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  catHeader: {
    padding: 16,
    paddingBottom: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  catName: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
  },
  pillarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.accentDim,
  },
  pillarBadgeText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    color: theme.dimmed,
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: theme.dimmed,
    fontSize: 14,
  },
})
