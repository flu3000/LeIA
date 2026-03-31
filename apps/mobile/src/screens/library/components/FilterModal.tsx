import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable,
} from 'react-native'
import Animated, { SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/src/constants/colors'
import type { Pillar, Difficulty, BookFilters } from '@/src/types/library'

const DIFFICULTIES: Difficulty[] = ['Iniciante', 'Intermediário', 'Avançado']

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Iniciante:     colors.success,
  Intermediário: colors.warning,
  Avançado:      colors.danger,
}

interface FilterModalProps {
  visible: boolean
  filters: BookFilters
  pillars: Pillar[]
  onApply: (f: BookFilters) => void
  onClose: () => void
}

export function FilterModal({ visible, filters, pillars, onApply, onClose }: FilterModalProps) {
  // Estado local (só aplica ao fechar com "Aplicar")
  const [local, setLocal] = React.useState<BookFilters>(filters)

  // Sincroniza quando abre
  React.useEffect(() => {
    if (visible) setLocal(filters)
  }, [visible, filters])

  const togglePillar = (id: number) =>
    setLocal((prev) => ({ ...prev, pillar_id: prev.pillar_id === id ? undefined : id }))

  const toggleDifficulty = (d: Difficulty) =>
    setLocal((prev) => ({ ...prev, difficulty: prev.difficulty === d ? undefined : d }))

  const reset = () => setLocal({})

  const apply = () => {
    onApply(local)
    onClose()
  }

  const hasFilters = Boolean(local.pillar_id || local.difficulty || local.category_id)

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.duration(280).easing(Easing.out(Easing.exp))}
          exiting={SlideOutDown.duration(220).easing(Easing.in(Easing.exp))}
          style={styles.sheet}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Dificuldade */}
            <Text style={styles.sectionTitle}>Dificuldade</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map((d) => {
                const active = local.difficulty === d
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.chip,
                      active && { backgroundColor: DIFFICULTY_COLOR[d] + '33', borderColor: DIFFICULTY_COLOR[d] },
                    ]}
                    onPress={() => toggleDifficulty(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && { color: DIFFICULTY_COLOR[d] }]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Pilares */}
            {pillars.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Pilar</Text>
                <View style={styles.chipRow}>
                  {pillars.map((p) => {
                    const active = local.pillar_id === p.pillar_id
                    return (
                      <TouchableOpacity
                        key={p.pillar_id}
                        style={[
                          styles.chip,
                          active && { backgroundColor: colors.accent + '33', borderColor: colors.accent },
                        ]}
                        onPress={() => togglePillar(p.pillar_id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, active && { color: colors.accent }]}>
                          {p.pillar_name}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}
          </ScrollView>

          {/* Botões */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={reset}
              disabled={!hasFilters}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, !hasFilters && styles.btnTextDisabled]}>
                Limpar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={apply} activeOpacity={0.8}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

// React import necessário para useState/useEffect
import React from 'react'

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
    maxHeight: '80%',
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
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.surfaceDeep,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
  btnTextPrimary: {
    color: '#fff',
  },
  btnTextDisabled: {
    opacity: 0.4,
  },
})
