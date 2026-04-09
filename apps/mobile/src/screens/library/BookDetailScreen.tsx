import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Linking, StyleSheet, Pressable,
} from 'react-native'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/src/context/ThemeContext'
import { useBookDetail } from '@/src/hooks/useBooks'
import { useSavedBooks } from '@/src/hooks/useSavedBooks'
import type { Edition, Difficulty } from '@/src/types/library'

interface Props {
  id: string;
}

// ── Dropdown de edições ───────────────────────────────────────────────────────

interface EditionDropdownProps {
  editions: Edition[]
  selectedId: string | null
  onSelect: (ed: Edition) => void
  onClose: () => void
  theme: any
  styles: ReturnType<typeof createStyles>
}

function EditionDropdown({ editions, selectedId, onSelect, onClose, theme, styles }: EditionDropdownProps) {
  return (
    <>
      {/* Backdrop transparente — fecha o dropdown ao tocar fora */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      <View style={styles.dropdown}>
        {editions.map((ed, index) => {
          const isSelected = ed.edition_id === selectedId
          const isLast = index === editions.length - 1

          return (
            <TouchableOpacity
              key={ed.edition_id}
              style={[
                styles.dropdownItem,
                isSelected && styles.dropdownItemSelected,
                !isLast && styles.dropdownItemBorder,
              ]}
              onPress={() => onSelect(ed)}
              activeOpacity={0.75}
            >
              {/* Capa miniatura */}
              {ed.cover_url ? (
                <Image
                  source={{ uri: ed.cover_url }}
                  style={styles.dropdownCover}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.dropdownCover, styles.dropdownCoverPlaceholder]}>
                  <Ionicons name="book-outline" size={16} color={theme.dimmed} />
                </View>
              )}

              {/* Informações */}
              <View style={styles.dropdownInfo}>
                <Text style={[styles.dropdownPublisher, isSelected && { color: theme.accent }]} numberOfLines={1}>
                  {ed.publisher ?? 'Editora desconhecida'}
                  {ed.publication_year ? `  ·  ${ed.publication_year}` : ''}
                </Text>
                <Text style={styles.dropdownMeta} numberOfLines={1}>
                  {ed.pages > 0 ? `${ed.pages} páginas` : ''}
                  {ed.pages > 0 && ed.isbn_13 ? '  ·  ' : ''}
                  {ed.isbn_13 ? `ISBN ${ed.isbn_13}` : ''}
                  {!ed.pages && !ed.isbn_13 ? 'Sem detalhes' : ''}
                </Text>
              </View>

              {/* Check de selecionado */}
              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </>
  )
}

// ── Tela principal ────────────────────────────────────────────────────────────

export default function BookDetailScreen({ id }: Props) {
  const theme  = useTheme()
  const navigation = useNavigation()
  const styles = useMemo(() => createStyles(theme), [theme])

  const { book, isLoading } = useBookDetail(id)
  const { getSavedByBook, saveBook, unsaveBook } = useSavedBooks()

  const editions = useMemo(() => book?.all_editions || [], [book])

  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null)
  const [showEditions, setShowEditions]       = useState(false)

  // Hidrata selectedEdition assim que o livro carrega.
  // Prioriza a edição best-seller; caso contrário usa a primeira disponível.
  useEffect(() => {
    if (editions.length === 0) return
    const best = editions.find(e => e.is_best_seller) ?? editions[0]
    setSelectedEdition(best)
  }, [book?.book_id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (book) navigation.setOptions({ title: book.title })
  }, [book, navigation])

  const savedEntry = getSavedByBook(id)
  const isSaved    = Boolean(savedEntry)

  const cover = selectedEdition?.cover_url ?? book?.main_cover?.cover_url ?? null

  const handleSelectEdition = useCallback((ed: Edition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedEdition(ed)
    setShowEditions(false)
  }, [])

  const handleToggleSave = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (isSaved && savedEntry) {
      await unsaveBook(savedEntry.saved_book_id)
    } else {
      const editionId = selectedEdition?.edition_id ?? editions[0]?.edition_id
      if (!editionId) return
      await saveBook(editionId)
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      // Fecha o dropdown ao começar a rolar
      onScrollBeginDrag={() => setShowEditions(false)}
    >
      {/* Cabeçalho: capa + título + autor */}
      <View style={styles.hero}>
        <TouchableOpacity
          onPress={() => editions.length > 1 && setShowEditions(v => !v)}
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

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.success + '22' }]}>
              <Text style={[styles.badgeText, { color: theme.success }]}>
                {book.difficulty}
              </Text>
            </View>
            {book.categories?.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{book.categories.category_name}</Text>
              </View>
            )}
          </View>

          {/* Botão seletor de edição — só aparece se houver edições carregadas */}
          {selectedEdition && (
            <TouchableOpacity
              style={[styles.editionSelector, showEditions && styles.editionSelectorOpen]}
              onPress={() => setShowEditions(v => !v)}
              activeOpacity={0.8}
            >
              <Ionicons name="layers-outline" size={14} color={showEditions ? theme.accent : theme.muted} />
              <Text style={[styles.editionSelectorText, showEditions && { color: theme.accent }]}>
                {selectedEdition.publisher ?? 'Edição'}
                {selectedEdition.publication_year ? ` · ${selectedEdition.publication_year}` : ''}
              </Text>
              <Ionicons
                name={showEditions ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={showEditions ? theme.accent : theme.dimmed}
              />
            </TouchableOpacity>
          )}

          {/* Dropdown — renderizado inline abaixo do botão para evitar
              problemas de posicionamento absoluto dentro de ScrollView */}
          {showEditions && editions.length > 0 && (
            <EditionDropdown
              editions={editions}
              selectedId={selectedEdition?.edition_id ?? null}
              onSelect={handleSelectEdition}
              onClose={() => setShowEditions(false)}
              theme={theme}
              styles={styles}
            />
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
            {selectedEdition.publication_year && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ano</Text>
                <Text style={styles.detailValue}>{selectedEdition.publication_year}</Text>
              </View>
            )}
            {selectedEdition.pages > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Páginas</Text>
                <Text style={styles.detailValue}>{selectedEdition.pages}</Text>
              </View>
            )}
            {selectedEdition.language && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Idioma</Text>
                <Text style={styles.detailValue}>{selectedEdition.language}</Text>
              </View>
            )}
            {selectedEdition.isbn_13 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ISBN-13</Text>
                <Text style={styles.detailValue}>{selectedEdition.isbn_13}</Text>
              </View>
            )}
            {selectedEdition.isbn_10 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ISBN-10</Text>
                <Text style={styles.detailValue}>{selectedEdition.isbn_10}</Text>
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
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────

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
    bottom: 0,
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
    // backgroundColor: 'purple',
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

  // ── Seletor de edição ─────────────────────────────────────────────────────

  editionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surface,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  editionSelectorOpen: {
    borderWidth: 0,
    backgroundColor: theme.accentDim,
    // Quadrado inferior quando o dropdown está aberto
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  editionSelectorText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Dropdown ──────────────────────────────────────────────────────────────

  dropdown: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: theme.surface,
    overflow: 'hidden',
    // elevation: 0,
    marginTop: -6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemSelected: {
    backgroundColor: theme.accentDim,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownCover: {
    width: 36,
    height: 50,
    borderRadius: 4,
    flexShrink: 0,
  },
  dropdownCoverPlaceholder: {
    backgroundColor: theme.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownInfo: {
    flex: 1,
    gap: 3,
  },
  dropdownPublisher: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownMeta: {
    color: theme.muted,
    fontSize: 11,
  },

  // ── Ações ─────────────────────────────────────────────────────────────────

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

  // ── Seções de conteúdo ────────────────────────────────────────────────────

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
