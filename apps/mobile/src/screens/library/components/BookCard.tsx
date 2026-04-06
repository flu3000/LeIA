import {
  View, Text, TouchableOpacity, Image, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/src/constants/colors'
import type { Book, Difficulty } from '@/src/types/library'

// ── Badge de dificuldade ──────────────────────────────────────────────────────
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Iniciante:     colors.success,
  Intermediário: colors.warning,
  Avançado:      colors.danger,
}

function DifficultyBadge({ level }: { level: Difficulty | null }) {
  if (!level) return null
  const color = colors()
  const style = styles(color)
  return (
    <View style={[style.badge, { backgroundColor: DIFFICULTY_COLOR[level] + '22' }]}>
      <Text style={[style.badgeText, { color: DIFFICULTY_COLOR[level] }]}>{level}</Text>
    </View>
  )
}

// ── Capa do livro ─────────────────────────────────────────────────────────────

function BookCover({ url, size = 56 }: { url: string | null | undefined; size?: number }) {
  const color = colors()
  const style = styles(color)
  return url ? (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size * 1.4, borderRadius: 6 }}
      resizeMode="cover"
    />
  ) : (
    <View style={[style.coverPlaceholder, { width: size, height: size * 1.4 }]}>
      <Ionicons name="book" size={size * 0.4} color={colors.dimmed} />
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
  const cover        = book.main_cover?.cover_url
  const categoryName = book.categories?.category_name
  const categoryId   = book.category_id
  const color = colors()
  const style = styles(color)

  return (
    <TouchableOpacity style={style.card} onPress={onPress} activeOpacity={0.8}>
      <BookCover url={cover} size={56} />
      <View style={style.info}>
        <Text style={style.title} numberOfLines={2}>{book.title}</Text>
        <Text style={style.author} numberOfLines={1}>{book.author}</Text>

        <View style={style.metaRow}>
          <DifficultyBadge level={book.difficulty} />
          {categoryId && (
            <View style={style.categoryBadge}>
              <Text style={style.categoryText} numberOfLines={1}>{categoryId}</Text>
            </View>
          )}
        </View>
      </View>

      {onToggleSave !== undefined && (
        <TouchableOpacity
          style={style.heartBtn}
          onPress={onToggleSave}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={22}
            color={isSaved ? colors.danger : colors.dimmed}
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
  const cover = book.book_editions?.[0]?.cover_url
  const color = colors()
  const style = styles(color)

  return (
    <TouchableOpacity style={style.smallCard} onPress={onPress} activeOpacity={0.8}>
      <BookCover url={cover} size={72} />
      <Text style={style.smallTitle} numberOfLines={2}>{book.title}</Text>
      <Text style={style.smallAuthor} numberOfLines={1}>{book.author}</Text>
    </TouchableOpacity>
  )
}

const styles = (color: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: color.border,
    gap: 14,
  },
  coverPlaceholder: {
    borderRadius: 6,
    backgroundColor: color.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  author: {
    color: color.muted,
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
    backgroundColor: color.accentDim,
  },
  categoryText: {
    color: color.accent,
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
    color: color.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    lineHeight: 16,
  },
  smallAuthor: {
    color: color.muted,
    fontSize: 11,
    marginTop: 2,
  },
})
