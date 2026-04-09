import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Linking, StyleSheet,
} from 'react-native'
import { useState, useCallback, useMemo } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/src/context/ThemeContext'
import { useBookDetail } from '@/src/hooks/useBooks'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import { EditionModal } from './components/EditionModal'
import type { Edition, Difficulty } from '@/src/types/library'

// ── Badge de dificuldade ──────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Iniciante:     useTheme().success,
  Intermediário: useTheme().warning,
  Avançado:      useTheme().danger,
}

interface Props {
  id: string;
}
// ── Tela ─────────────────────────────────────────────────────────────────────

export default function BookDetailScreen({ id }: Props) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation()

  const { book, isLoading } = useBookDetail(id)
  const { getSavedByBook, saveBook, unsaveBook } = useSavedBooks()

  const editions = book?.all_editions ?? [];
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null)
  const [showEditions, setShowEditions]       = useState(false)

  // Pré-seleciona a primeira edição ao carregar
  //useEffect(() => {
  //  if (editions.length > 0 && !selectedEdition) {
  //    setSelectedEdition(editions[0])
  //  }
  //}, [editions])

  // Atualiza título do header
  useEffect(() => {
    if (book) navigation.setOptions({ title: book.title })
  }, [book, navigation])

  const savedEntry  = getSavedByBook(id)
  const isSaved     = Boolean(savedEntry)
  const cover       = selectedEdition?.cover_url

  const handleToggleSave = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (isSaved && savedEntry) {
      await unsaveBook(savedEntry.saved_book_id)
    } else {
      // const editionId = selectedEdition?.edition_id ?? editions[0]?.edition_id
      // if (!editionId) return
      // await saveBook(editionId)
    }
  }, [isSaved, savedEntry, selectedEdition, editions, saveBook, unsaveBook])

  const handleAmazon = () => {
    const amazonLink = selectedEdition?.amazon_link
    if (amazonLink) Linking.openURL(amazonLink)
  }

  if (isLoading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    )
  }

  if (!book) {
    return (
      <View style={styles.loadingCenter}>
        <Text style={styles.errorText}>Livro não encontrado</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho: capa + título + autor */}
        <View style={styles.hero}>
          {/* Capa clicável — abre seletor de edições */}
          <TouchableOpacity
            onPress={() => editions.length > 1 && setShowEditions(true)}
            activeOpacity={editions.length > 1 ? 0.8 : 1}
          >
            {cover ? (
              <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverPlaceholder]}>
                <Ionicons name="book" size={48} color={theme.dimmed} />
              </View>
            )}
            {editions.length > 1 && (
              <View style={styles.editionBadge}>
                <Text style={styles.editionBadgeText}>{editions.length} edições</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.heroMeta}>
            <Text style={styles.heroTitle}>{book.title}</Text>
            <Text style={styles.heroAuthor}>{book.author}</Text>

            {/* Badges */}
            <View style={styles.badgeRow}>
              {book.difficulty && (
                <View style={[styles.badge, {
                  backgroundColor: DIFFICULTY_COLOR[book.difficulty] + '22',
                }]}>
                  <Text style={[styles.badgeText, { color: DIFFICULTY_COLOR[book.difficulty] }]}>
                    {book.difficulty}
                  </Text>
                </View>
              )}
              {book.categories?.category_name && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{book.categories.category_name}</Text>
                </View>
              )}
            </View>

            {/* Edição selecionada */}
            {selectedEdition && (
              <TouchableOpacity
                style={styles.editionSelector}
                onPress={() => editions.length > 0 && setShowEditions(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="layers-outline" size={14} color={theme.muted} />
                <Text style={styles.editionSelectorText}>
                  {selectedEdition.publisher ?? 'Edição'}
                  {selectedEdition.publish_year ? ` · ${selectedEdition.publish_year}` : ''}
                </Text>
                {editions.length > 1 && (
                  <Ionicons name="chevron-down" size={14} color={theme.dimmed} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Ações */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isSaved && styles.actionBtnSaved]}
            onPress={handleToggleSave}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={18}
              color={isSaved ? theme.danger : theme.text}
            />
            <Text style={[styles.actionBtnText, isSaved && { color: theme.danger }]}>
              {isSaved ? 'Salvo' : 'Salvar'}
            </Text>
          </TouchableOpacity>

          {selectedEdition?.amazon_link && (
            <TouchableOpacity
              style={styles.amazonBtn}
              onPress={handleAmazon}
              activeOpacity={0.85}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.amazonBtnText}>Ver na Amazon</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Descrição */}
        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre o livro</Text>
            <Text style={styles.descriptionText}>{book.description}</Text>
          </View>
        )}

        {/* Tags */}
        {book.tags && book.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagRow}>
              {book.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detalhes da edição selecionada */}
        {selectedEdition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalhes da edição</Text>
            <View style={styles.detailGrid}>
              {selectedEdition.publisher && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Editora</Text>
                  <Text style={styles.detailValue}>{selectedEdition.publisher}</Text>
                </View>
              )}
              {selectedEdition.publish_year && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ano</Text>
                  <Text style={styles.detailValue}>{selectedEdition.publish_year}</Text>
                </View>
              )}
              {selectedEdition.pages > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Páginas</Text>
                  <Text style={styles.detailValue}>{selectedEdition.pages}</Text>
                </View>
              )}
              {selectedEdition.isbn_13 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ISBN-13</Text>
                  <Text style={styles.detailValue}>{selectedEdition.isbn_13}</Text>
                </View>
              )}
              {selectedEdition.translator && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tradução</Text>
                  <Text style={styles.detailValue}>{selectedEdition.translator}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de edições */}
      { /*<EditionModal
        visible={showEditions}
        // editions={editions}
        selectedId={selectedEdition?.edition_id ?? null}
        onSelect={(ed) => setSelectedEdition(ed)}
        onClose={() => setShowEditions(false)}
      /> */}
    </>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  errorText: {
    color: theme.muted,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingBottom: 40,
  },
  // Hero
  hero: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  cover: {
    width: 110,
    height: 154,
    borderRadius: 10,
  },
  coverPlaceholder: {
    backgroundColor: theme.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editionBadge: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  editionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 25,
  },
  heroAuthor: {
    color: theme.muted,
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.accentDim,
  },
  categoryBadgeText: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  editionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  editionSelectorText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  // Ações
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionBtnSaved: {
    backgroundColor: 'rgba(225,29,72,0.12)',
    borderColor: theme.danger + '55',
  },
  actionBtnText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  amazonBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF9900',
  },
  amazonBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Seções
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  descriptionText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tagText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  detailGrid: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailLabel: {
    color: theme.dimmed,
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
})
