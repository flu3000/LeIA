import React, { useMemo } from 'react'
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable,
} from 'react-native'
import Animated, { SlideInDown, SlideOutDown, Easing, runOnJS, useAnimatedStyle } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/src/context/ThemeContext'
import type { Pillar, Difficulty, BookFilters } from '@/src/types/library'

const DIFFICULTIES: Difficulty[] = ['Iniciante', 'Intermediário', 'Avançado']

// Semânticos são iguais em ambos os temas — constante segura no nível de módulo
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Iniciante:     '#10B981',
  Intermediário: '#F59E0B',
  Avançado:      '#E11D48',
}

interface FilterModalProps {
  visible: boolean
  filters: BookFilters
  pillars: Pillar[]
  onApply: (f: BookFilters) => void
  onClose: () => void
}

export function FilterModal({ visible, filters, pillars, onApply, onClose }: FilterModalProps) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [local, setLocal] = React.useState<BookFilters>(filters)

  // Controla se o Modal nativo está montado.
  // Só desmonta DEPOIS que a animação de saída terminar.
  const [modalMounted, setModalMounted] = React.useState(visible)

  // Controla se o Animated.View está renderizado (e portanto animando).
  const [sheetVisible, setSheetVisible] = React.useState(visible)

  React.useEffect(() => {
    if (visible) {
      // Abre: monta o Modal primeiro, depois mostra o sheet (dispara entering)
      setModalMounted(true)
      // Pequeno delay para garantir que o Modal já está montado antes do entering
      requestAnimationFrame(() => setSheetVisible(true))
    } else {
      // Fecha: esconde o sheet (dispara exiting), Modal desmonta no callback
      setSheetVisible(false)
    }
  }, [visible])

  React.useEffect(() => {
    if (visible) setLocal(filters)
  }, [visible, filters])

  // Chamado pelo reanimated quando a animação exiting termina
  const onExitingFinished = () => {
    setModalMounted(false)
  }

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
    <Modal
      visible={modalMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {sheetVisible && (
          <Animated.View
            entering={SlideInDown.duration(280).easing(Easing.out(Easing.exp))}
            exiting={SlideOutDown
              .duration(200)
              .easing(Easing.in(Easing.exp))
              .withCallback((finished) => {
                'worklet'
                if (finished) runOnJS(onExitingFinished)()
              })}
            style={styles.sheet}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filtros</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.muted} />
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
                            active && { backgroundColor: theme.accent + '33', borderColor: theme.accent },
                          ]}
                          onPress={() => togglePillar(p.pillar_id)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && { color: theme.accent }]}>
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
        )}
      </Pressable>
    </Modal>
  )
}

function createStyles(theme: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
      maxHeight: '80%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.borderStrong,
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
      borderBottomColor: theme.border,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '700',
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    sectionTitle: {
      color: theme.muted,
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
      backgroundColor: theme.surfaceDeep,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    chipText: {
      color: theme.muted,
      fontSize: 13,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    btn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    btnSecondary: {
      backgroundColor: theme.surfaceDeep,
    },
    btnPrimary: {
      backgroundColor: theme.accent,
    },
    btnText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.muted,
    },
    btnTextPrimary: {
      color: '#fff',
    },
    btnTextDisabled: {
      opacity: 0.4,
    },
  })
}
