import {
  Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Pressable,
} from 'react-native'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/src/constants/colors'
import type { Edition } from '@/src/types/library'

interface EditionModalProps {
  visible: boolean
  editions: Edition[]
  selectedId: string | null
  onSelect: (edition: Edition) => void
  onClose: () => void
}

export function EditionModal({
  visible,
  editions,
  selectedId,
  onSelect,
  onClose,
}: EditionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.springify().damping(18)}
          style={styles.sheet}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Selecionar edição</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Lista de edições */}
          <FlatList
            data={editions}
            keyExtractor={(e) => e.edition_id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.edition_id === selectedId
              return (
                <TouchableOpacity
                  style={[styles.editionRow, isSelected && styles.editionRowSelected]}
                  onPress={() => { onSelect(item); onClose() }}
                  activeOpacity={0.8}
                >
                  {/* Capa */}
                  {item.cover_url ? (
                    <Image
                      source={{ uri: item.cover_url }}
                      style={styles.cover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.cover, styles.coverPlaceholder]}>
                      <Ionicons name="book-outline" size={20} color={colors.dimmed} />
                    </View>
                  )}

                  {/* Meta */}
                  <View style={styles.editionInfo}>
                    <Text style={styles.publisher}>
                      {item.publisher ?? 'Editora desconhecida'}
                    </Text>
                    {item.publish_year && (
                      <Text style={styles.meta}>{item.publish_year}</Text>
                    )}
                    {item.isbn_13 && (
                      <Text style={styles.meta}>ISBN {item.isbn_13}</Text>
                    )}
                    {item.translator && (
                      <Text style={styles.meta}>Trad. {item.translator}</Text>
                    )}
                  </View>

                  {/* Check */}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhuma edição disponível</Text>
              </View>
            }
          />
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 4,
  },
  editionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    marginBottom: 8,
  },
  editionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  cover: {
    width: 44,
    height: 62,
    borderRadius: 6,
  },
  coverPlaceholder: {
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editionInfo: {
    flex: 1,
    gap: 3,
  },
  publisher: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.dimmed,
    fontSize: 14,
  },
})
