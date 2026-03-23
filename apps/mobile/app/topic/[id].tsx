import {
  View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet,
} from 'react-native'
import { useState, useMemo } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Linking } from 'react-native'

import { topics, tipoColors, dificuldadeColors, type Reference } from '@/src/data/topics'

type TipoFilter      = 'todos' | 'livro' | 'video' | 'podcast' | 'artigo' | 'curso'
type DifFilter       = 'todos' | 'Iniciante' | 'Intermediário' | 'Avançado'

const tipoEmoji: Record<string, string> = {
  livro: '📚', video: '🎬', podcast: '🎙️', artigo: '📄', curso: '🎓',
}

function FilterChip({
  label, active, onPress,
}: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

function ReferenceCard({ item: r, index }: { item: Reference; index: number }) {
  const tipo     = r.tipo?.toLowerCase() ?? 'artigo'
  const tipoC    = tipoColors[tipo]  ?? tipoColors.artigo
  const difC     = r.dificuldade ? (dificuldadeColors[r.dificuldade] ?? dificuldadeColors['Iniciante']) : null

  const handleLink = () => {
    if (r.link) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      Linking.openURL(r.link)
    }
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
      <View style={styles.refCard}>
        {/* Type + Difficulty */}
        <View style={styles.refTags}>
          <View style={[styles.refBadge, { backgroundColor: tipoC.bg }]}>
            <Text style={[styles.refBadgeText, { color: tipoC.text }]}>
              {tipoEmoji[tipo] ?? '📄'} {tipo}
            </Text>
          </View>
          {difC && r.dificuldade && (
            <View style={[styles.refBadge, { backgroundColor: difC.bg }]}>
              <Text style={[styles.refBadgeText, { color: difC.text }]}>
                {r.dificuldade}
              </Text>
            </View>
          )}
        </View>

        {/* Title + Author */}
        <Text style={styles.refTitle}>{r.titulo}</Text>
        <Text style={styles.refAuthor}>{r.autor}</Text>
        {r.descricao && (
          <Text style={styles.refDesc}>{r.descricao}</Text>
        )}

        {/* Link */}
        {r.link && (
          <TouchableOpacity
            style={styles.refLinkBtn}
            onPress={handleLink}
            activeOpacity={0.8}
          >
            <Text style={styles.refLinkText}>Acessar →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const topic = useMemo(() => topics.find((t) => t.id === id), [id])

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')
  const [difFilter,  setDifFilter]  = useState<DifFilter>('todos')

  // Set header title
  useEffect(() => {
    if (topic) {
      navigation.setOptions({ title: `${topic.emoji} ${topic.tema}` })
    }
  }, [topic, navigation])

  const filteredRefs = useMemo(() => {
    if (!topic) return []
    return topic.todasReferencias.filter((r) => {
      const tipoOk = tipoFilter === 'todos' || r.tipo === tipoFilter
      const difOk  = difFilter  === 'todos' || r.dificuldade === difFilter
      return tipoOk && difOk
    })
  }, [topic, tipoFilter, difFilter])

  if (!topic) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Tema não encontrado</Text>
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={filteredRefs}
      keyExtractor={(r, i) => `${r.titulo}-${i}`}
      renderItem={({ item, index }) => <ReferenceCard item={item} index={index} />}
      ListHeaderComponent={
        <>
          {/* Hero */}
          <View style={[styles.hero, { borderLeftColor: topic.accentColor }]}>
            <Text style={styles.heroEmoji}>{topic.emoji}</Text>
            <Text style={styles.heroTitle}>{topic.tema}</Text>
            <Text style={styles.heroDesc}>{topic.descricaoLonga}</Text>
          </View>

          {/* Conceitos */}
          <View style={styles.conceptsSection}>
            <Text style={styles.sectionLabel}>Conceitos principais</Text>
            <View style={styles.conceptsRow}>
              {topic.conceitos.map((c) => (
                <View key={c} style={styles.conceptChip}>
                  <Text style={styles.conceptText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* References header + filters */}
          <View style={styles.refsSection}>
            <Text style={styles.sectionLabel}>
              Referências ({filteredRefs.length})
            </Text>

            {/* Tipo filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {(['todos', 'livro', 'video', 'podcast', 'artigo', 'curso'] as TipoFilter[]).map((f) => (
                <FilterChip
                  key={f}
                  label={f === 'todos' ? 'Todos' : `${tipoEmoji[f] ?? ''} ${f}`}
                  active={tipoFilter === f}
                  onPress={() => setTipoFilter(f)}
                />
              ))}
            </ScrollView>

            {/* Dificuldade filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
            >
              {(['todos', 'Iniciante', 'Intermediário', 'Avançado'] as DifFilter[]).map((f) => (
                <FilterChip
                  key={f}
                  label={f === 'todos' ? 'Qualquer nível' : f}
                  active={difFilter === f}
                  onPress={() => setDifFilter(f)}
                />
              ))}
            </ScrollView>
          </View>
        </>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma referência com este filtro</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  content: {
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    backgroundColor: '#131f24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  hero: {
    padding: 20,
    paddingBottom: 16,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#1B2C33',
    borderRadius: 16,
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#F0EEE6',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroDesc: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
  },
  conceptsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  conceptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conceptChip: {
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  conceptText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '500',
  },
  refsSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filtersRow: {
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1B2C33',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  refCard: {
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  refTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  refBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  refTitle: {
    color: '#F0EEE6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 20,
  },
  refAuthor: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },
  refDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  refLinkBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14,165,233,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refLinkText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#4B6070',
    fontSize: 14,
  },
})
