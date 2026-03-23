import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
} from 'react-native'
import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'

import { topics, type Topic } from '@/src/data/topics'

function TopicCard({ topic, index }: { topic: Topic; index: number }) {
  const router = useRouter()

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/topic/${topic.id}`)
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300).springify()}>
      <TouchableOpacity
        style={[styles.topicCard, { borderLeftColor: topic.accentColor }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>{topic.emoji}</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{topic.tema}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{topic.descricao}</Text>
          <Text style={styles.conceptCount}>{topic.conceitos.length} conceitos</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#4B6070" />
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function CatalogSection() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => topics.filter((t) =>
      t.tema.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  return (
    <>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#4B6070" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tema..."
          placeholderTextColor="#4B6070"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={18} color="#4B6070" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item, index }) => <TopicCard topic={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum tema encontrado</Text>
          </View>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: '#F0EEE6',
    fontSize: 14,
    paddingVertical: 12,
  },
  clearIcon: { padding: 4 },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  emoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    color: '#F0EEE6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  conceptCount: {
    color: '#4B6070',
    fontSize: 11,
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#4B6070',
    fontSize: 14,
  },
})
