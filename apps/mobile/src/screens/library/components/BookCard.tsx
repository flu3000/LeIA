import {
  View, Text, TouchableOpacity, Image, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/src/context/ThemeContext' 
import type { Book, Difficulty } from '@/src/types/library'
import { useMemo } from 'react'

// ── Badge de dificuldade ──────────────────────────────────────────────────────
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Iniciante:     useTheme().success,
  Intermediário: useTheme().warning,
  Avançado:      useTheme().danger,
}

function DifficultyBadge({ level }: { level: Difficulty | null }) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!level) return null

  return (
    <View style={[styles.badge, { backgroundColor: DIFFICULTY_COLOR[level] + '22' }]}>
      <Text style={[styles.badgeText, { color: DIFFICULTY_COLOR[level] }]}>{level}</Text>
    </View>
  )
}

// ── Capa do livro ─────────────────────────────────────────────────────────────

function BookCover({ url, size = 56 }: { url: string | null | undefined; size?: number }) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  return url ? (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size * 1.4, borderRadius: 6 }}
      resizeMode="cover"
    />
  ) : (
    <View style={[styles.coverPlaceholder, { width: size, height: size * 1.4 }]}>
      <Ionicons name="book" size={size * 0.4} color={theme.dimmed} />
    </View>
  )
}

// ── Card principal ────────────────────────────────────────────────────────────

interface BookCardProps {
  book: Book
  onPress: () => void
  isSaved?: boolean
  onToggleSave?: () => void
}

export function BookCard({ book, onPress, isSaved, onToggleSave }: BookCardProps) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cover        = book.cover_url
  const categoryName = book.categories?.category_name
  const categoryId   = book.category_id

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <BookCover url={cover} size={56} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>

        <View style={styles.metaRow}>
          <DifficultyBadge level={book.difficulty} />
          {categoryId && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText} numberOfLines={1}>{categoryId}</Text>
            </View>
          )}
        </View>
      </View>

      {onToggleSave !== undefined && (
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={onToggleSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={22}
            color={isSaved ? theme.danger : theme.dimmed}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

// ── Card horizontal (carrossel) ───────────────────────────────────────────────

interface BookCardSmallProps {
  book: Book
  onPress: () => void
}

export function BookCardSmall({ book, onPress }: BookCardSmallProps) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const cover = book.cover_url

  return (
    <TouchableOpacity style={styles.smallCard} onPress={onPress} activeOpacity={0.8}>
      <BookCover url={cover} size={72} />
      <Text style={styles.smallTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={styles.smallAuthor} numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  coverPlaceholder: {
    borderRadius: 6,
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
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
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
  categoryText: {
    color: theme.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  heartBtn: {
    padding: 4,
  },
  // Small card (carrossel)
  smallCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  smallTitle: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 16,
  },
  smallAuthor: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 2,
  },
})
