import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useInsights, type Insight } from '@/src/hooks/useInsights'
import { useAuth } from '@/src/context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}m`
  return `${Math.floor(months / 12)}a`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

// ── InsightCard ────────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: Insight
  currentUserId: string | undefined
  onLike: (id: string) => void
  onDelete: (id: string) => void
}

function InsightCard({ insight, currentUserId, onLike, onDelete }: InsightCardProps) {
  const isOwner = insight.userId === currentUserId

  const handleDelete = () => {
    Alert.alert(
      'Excluir insight',
      'Tem certeza que deseja excluir este insight?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => onDelete(insight.id),
        },
      ]
    )
  }

  const handleLink = () => {
    if (insight.materialLink) {
      Linking.openURL(insight.materialLink).catch(() => {})
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getInitials(insight.displayName)}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.displayName} numberOfLines={1}>{insight.displayName}</Text>
          <Text style={styles.username}>@{insight.username} · {timeAgo(insight.createdAt)}</Text>
        </View>
      </View>

      {/* Blockquote */}
      <View style={styles.blockquote}>
        <Text style={styles.blockquoteText}>{insight.content}</Text>
      </View>

      {/* Attribution */}
      {(insight.bookTitle || insight.author) && (
        <View style={styles.attributionRow}>
          <Feather name="book-open" size={12} color="#94A3B8" />
          <Text style={styles.attribution} numberOfLines={2}>
            {[insight.bookTitle, insight.author ? `— ${insight.author}` : null]
              .filter(Boolean)
              .join(' ')}
          </Text>
        </View>
      )}

      {/* Footer actions */}
      <View style={styles.cardFooter}>
        {insight.materialLink ? (
          <TouchableOpacity style={styles.footerBtn} onPress={handleLink} activeOpacity={0.7}>
            <Ionicons name="link" size={14} color="#94A3B8" />
            <Text style={styles.footerBtnText}>Link</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <View style={styles.footerRight}>
          {/* Like */}
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onLike(insight.id)
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={insight.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={insight.isLiked ? '#E11D48' : '#94A3B8'}
            />
            {insight.likesCount > 0 && (
              <Text style={[styles.footerBtnText, insight.isLiked && styles.likedText]}>
                {insight.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Delete (owner only) */}
          {isOwner && (
            <TouchableOpacity
              style={[styles.footerBtn, styles.footerBtnDanger]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={14} color="#E11D48" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { user } = useAuth()
  const {
    explorar,
    seguindo,
    isLoading,
    fetchExplorar,
    fetchSeguindo,
    toggleLike,
    publish,
    deleteQuote,
  } = useInsights()

  const [tab, setTab] = useState<'explorar' | 'seguindo'>('explorar')
  const [composeOpen, setComposeOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [materialLink, setMaterialLink] = useState('')
  const [author, setAuthor] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const draftRef = useRef<TextInput>(null)

  useEffect(() => {
    fetchExplorar()
  }, [])

  useEffect(() => {
    if (tab === 'seguindo') {
      fetchSeguindo()
    }
  }, [tab])

  const handlePublish = useCallback(async () => {
    if (!draft.trim()) return
    setIsPublishing(true)
    const ok = await publish(draft, {
      author:      author.trim()       || undefined,
      bookTitle:   bookTitle.trim()    || undefined,
      materialLink: materialLink.trim() || undefined,
    })
    setIsPublishing(false)
    if (ok) {
      setDraft('')
      setAuthor('')
      setBookTitle('')
      setMaterialLink('')
      setComposeOpen(false)
      fetchExplorar()
    }
  }, [draft, author, bookTitle, materialLink, publish, fetchExplorar])

  const handleDelete = useCallback(async (id: string) => {
    await deleteQuote(id)
  }, [deleteQuote])

  const data = tab === 'explorar' ? explorar : seguindo

  const renderItem = useCallback(
    ({ item }: { item: Insight }) => (
      <InsightCard
        insight={item}
        currentUserId={user?.id}
        onLike={toggleLike}
        onDelete={handleDelete}
      />
    ),
    [user?.id, toggleLike, handleDelete]
  )

  const emptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      )
    }
    return (
      <View style={styles.centered}>
        <Ionicons name="sparkles-outline" size={40} color="#4B6070" />
        <Text style={styles.emptyText}>
          {tab === 'explorar'
            ? 'Nenhum insight publicado ainda.\nSeja o primeiro!'
            : 'Siga outros leitores para ver\nos insights deles.'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Insights</Text>
          <Text style={styles.screenSubtitle}>Citações e reflexões da comunidade</Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['explorar', 'seguindo'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'explorar' ? 'Explorar' : 'Seguindo'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feed */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={[styles.feedContent, data.length === 0 && styles.feedEmpty]}
          showsVerticalScrollIndicator={false}
          onRefresh={tab === 'explorar' ? fetchExplorar : fetchSeguindo}
          refreshing={isLoading}
        />

        {/* Compose panel */}
        {composeOpen && (
          <View style={styles.composePanel}>
            <TextInput
              ref={draftRef}
              style={styles.draftInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Compartilhe uma citação ou reflexão…"
              placeholderTextColor="#4B6070"
              multiline
              maxLength={400}
              textAlignVertical="top"
              autoFocus
            />
            <Text style={styles.charCount}>{draft.length}/400</Text>

            <TextInput
              style={styles.metaInput}
              value={materialLink}
              onChangeText={setMaterialLink}
              placeholder="Link do material (opcional)"
              placeholderTextColor="#4B6070"
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.metaRow}>
              <TextInput
                style={[styles.metaInput, styles.metaHalf]}
                value={author}
                onChangeText={setAuthor}
                placeholder="Autor (opcional)"
                placeholderTextColor="#4B6070"
              />
              <TextInput
                style={[styles.metaInput, styles.metaHalf]}
                value={bookTitle}
                onChangeText={setBookTitle}
                placeholder="Título do livro (opcional)"
                placeholderTextColor="#4B6070"
              />
            </View>

            <View style={styles.composeActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setComposeOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.publishBtn, (!draft.trim() || isPublishing) && styles.publishBtnDisabled]}
                onPress={handlePublish}
                disabled={!draft.trim() || isPublishing}
                activeOpacity={0.8}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.publishBtnText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FAB */}
        {!composeOpen && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              setComposeOpen(true)
              setTimeout(() => draftRef.current?.focus(), 100)
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0EEE6',
    marginBottom: 2,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0EA5E9',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B6070',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  feedEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Card
  card: {
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(14,165,233,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  cardHeaderText: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0EEE6',
  },
  username: {
    fontSize: 12,
    color: '#4B6070',
    marginTop: 1,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(14,165,233,0.4)',
    paddingLeft: 10,
  },
  blockquoteText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attribution: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  footerBtnDanger: {
    backgroundColor: 'rgba(225,29,72,0.1)',
  },
  footerBtnText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  likedText: {
    color: '#E11D48',
  },
  // Compose panel
  composePanel: {
    backgroundColor: '#1B2C33',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
  },
  draftInput: {
    backgroundColor: '#131f24',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#F0EEE6',
    fontSize: 15,
    fontStyle: 'italic',
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#4B6070',
    textAlign: 'right',
    marginTop: -4,
  },
  metaInput: {
    backgroundColor: '#131f24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#F0EEE6',
    fontSize: 13,
    padding: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaHalf: {
    flex: 1,
  },
  composeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  publishBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnDisabled: {
    opacity: 0.45,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4 8 rgba(14, 165, 233, 0.4)',
    elevation: 8,
  },
})
