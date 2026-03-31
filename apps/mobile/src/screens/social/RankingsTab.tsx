import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useFollow, type PublicProfile } from '@/src/hooks/useFollow'
import { useAuth } from '@/src/context/AuthContext'

// ── Medal colors ──────────────────────────────────────────────────────────────

const POSITION_STYLE: Record<number, { color: string; label: string }> = {
  1: { color: '#FFD700', label: '🥇' },
  2: { color: '#C0C0C0', label: '🥈' },
  3: { color: '#CD7F32', label: '🥉' },
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()
}

// ── User Row ──────────────────────────────────────────────────────────────────

function UserRow({
  profile,
  position,
  isFollowing,
  isCurrentUser,
  onToggleFollow,
}: {
  profile: PublicProfile
  position: number
  isFollowing: boolean
  isCurrentUser: boolean
  onToggleFollow: (id: string) => void
}) {
  const medal = POSITION_STYLE[position]

  return (
    <View style={[styles.userRow, isCurrentUser && styles.userRowSelf]}>
      {/* Position */}
      <View style={styles.positionWrap}>
        {medal ? (
          <Text style={styles.medal}>{medal.label}</Text>
        ) : (
          <Text style={[styles.position, position <= 10 && { color: '#E7FF21' }]}>
            {position}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatar, isCurrentUser && styles.avatarSelf]}>
        <Text style={[styles.avatarText, isCurrentUser && styles.avatarTextSelf]}>
          {getInitials(profile.displayName)}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName} numberOfLines={1}>
          {profile.displayName}{isCurrentUser ? ' (Você)' : ''}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>

      {/* XP */}
      <View style={styles.xpBadge}>
        <Ionicons name="star" size={12} color="#E7FF21" />
        <Text style={styles.xpText}>{profile.totalXP.toLocaleString('pt-BR')}</Text>
      </View>

      {/* Follow */}
      {!isCurrentUser && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onToggleFollow(profile.id)
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Seguindo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RankingsTab() {
  const { user } = useAuth()
  const { followingIds, toggleFollow, searchUsers, getLeaderboard } = useFollow()

  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([])
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([])
  const [query, setQuery]           = useState('')
  const [isLoading, setIsLoading]   = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // Load leaderboard on mount
  useEffect(() => {
    getLeaderboard()
      .then(setLeaderboard)
      .catch((e) => console.error('[RankingsTab]', e))
      .finally(() => setIsLoading(false))
  }, [])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchUsers(query)
      setSearchResults(results)
      setIsSearching(false)
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  const displayList = query.trim() ? searchResults : leaderboard

  const renderItem = useCallback(({ item, index }: { item: PublicProfile; index: number }) => (
    <UserRow
      profile={item}
      position={query.trim() ? index + 1 : index + 1}
      isFollowing={followingIds.has(item.id)}
      isCurrentUser={item.id === user?.id}
      onToggleFollow={toggleFollow}
    />
  ), [followingIds, user?.id, toggleFollow, query])

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#4B6070" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar leitores..."
            placeholderTextColor="#4B6070"
            clearButtonMode="while-editing"
          />
          {isSearching && <ActivityIndicator size="small" color="#E7FF21" />}
        </View>
      </View>

      {/* Section label */}
      {!query.trim() && (
        <View style={styles.sectionLabel}>
          <Ionicons name="trophy" size={14} color="#E7FF21" />
          <Text style={styles.sectionText}>Ranking Global</Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E7FF21" />
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={40} color="#4B6070" />
              <Text style={styles.emptyText}>
                {query.trim() ? 'Nenhum leitor encontrado.' : 'Sem dados de ranking ainda.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(231,255,33,0.2)',
  },
  searchInput: {
    flex: 1,
    color: '#F0EEE6',
    fontSize: 14,
    paddingVertical: 11,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionText: {
    color: '#E7FF21',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userRowSelf: {
    borderColor: 'rgba(231,255,33,0.25)',
    backgroundColor: 'rgba(231,255,33,0.04)',
  },
  positionWrap: {
    width: 28,
    alignItems: 'center',
  },
  medal: { fontSize: 20 },
  position: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4B6070',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231,255,33,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(231,255,33,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelf: {
    backgroundColor: 'rgba(231,255,33,0.25)',
    borderColor: '#E7FF21',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#E7FF21' },
  avatarTextSelf: { color: '#131f24' },
  userInfo: { flex: 1 },
  displayName: { fontSize: 14, fontWeight: '600', color: '#F0EEE6' },
  username: { fontSize: 12, color: '#4B6070', marginTop: 1 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(231,255,33,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpText: { fontSize: 12, fontWeight: '700', color: '#E7FF21' },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(231,255,33,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(231,255,33,0.4)',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  followBtnText: { fontSize: 12, fontWeight: '700', color: '#E7FF21' },
  followingBtnText: { color: '#4B6070' },
})
