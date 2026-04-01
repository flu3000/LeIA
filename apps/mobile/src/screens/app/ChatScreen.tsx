import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown, runOnJS } from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Ionicons } from '@expo/vector-icons'

import { useChat, type Message, type Fonte } from '@/src/hooks/useChat'
import { useChatSessions } from '@/src/hooks/useChatSessions'
import { useUserContent } from '@/src/hooks/useUserContent'
import SourceCard from '@/src/components/SourceCard'
import ChatDrawer from '@/src/components/ChatDrawer'

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <View style={styles.typingBubble}>
      <Text style={styles.typingText}>LeIA está pensando...</Text>
      <ActivityIndicator size="small" color="#0EA5E9" style={{ marginLeft: 8 }} />
    </View>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const { toggleSave, isFavourite } = useUserContent()

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="school-outline" size={20} color="#0EA5E9" />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>

        {message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            {message.sources.map((fonte: Fonte, i: number) => (
              <SourceCard
                key={fonte.id_externo ?? i}
                fonte={fonte}
                isFavourite={isFavourite(fonte.id_externo ?? fonte.link)}
                onToggleFavourite={() =>
                  toggleSave({
                    card_id:  fonte.id_externo ?? fonte.link,
                    title:    fonte.titulo,
                    category: fonte.tipo,
                  })
                }
              />
            ))}
          </View>
        )}

        {message.citations && message.citations.length > 0 && (
          <View style={styles.citationsRow}>
            {message.citations.slice(0, 3).map((url, i) => (
              <View key={i} style={styles.citationBadge}>
                <Text style={styles.citationText} numberOfLines={1}>
                  [{i + 1}] {new URL(url).hostname}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  const {
    sessions, isLoading: isLoadingSessions,
    fetchSessions, createSession, renameSession, deleteSession,
  } = useChatSessions()

  const { messages, isTyping, sendMessage } = useChat(currentSessionId)

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    if (currentSessionId || isLoadingSessions) return
    if (sessions.length > 0) {
      setCurrentSessionId(sessions[0].id)
    } else {
      createSession().then((s) => { if (s) setCurrentSessionId(s.id) })
    }
  }, [sessions, isLoadingSessions, currentSessionId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isTyping || !currentSessionId) return
    setInput('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await sendMessage(text)
    fetchSessions()
  }, [input, isTyping, currentSessionId, sendMessage, fetchSessions])

  const handleNewSession = useCallback(async () => {
    const s = await createSession()
    if (s) { setCurrentSessionId(s.id); setDrawerOpen(false) }
  }, [createSession])

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id)
  }, [])

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSession(id)
    if (id === currentSessionId) {
      const remaining = sessions.filter((s) => s.id !== id)
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id)
      } else {
        const s = await createSession()
        if (s) setCurrentSessionId(s.id)
      }
    }
  }, [deleteSession, sessions, currentSessionId, createSession])

  // ── Drawer open (called from worklet via runOnJS) ──────────────────────────

  const openDrawer = useCallback(() => {
    Haptics.selectionAsync()
    setDrawerOpen(true)
  }, [])

  // ── Edge swipe gesture (swipe right from left edge → open drawer) ──────────

  const edgeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([8, 9999])
        .failOffsetY([-40, 40])
        .onEnd((e) => {
          if (e.translationX > 50 || e.velocityX > 400) {
            runOnJS(openDrawer)()
          }
        }),
    [openDrawer],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => { Haptics.selectionAsync(); setDrawerOpen(true) }}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>LeIA</Text>
            <Text style={styles.headerSub}>Bibliotecário Inteligente</Text>
          </View>

          {/* Espaço espelho para centralizar o título */}
          <View style={styles.headerBtn} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isTyping ? <TypingDots /> : null}
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Sobre o que quer aprender?"
              placeholderTextColor="#4B6070"
              multiline
              maxLength={600}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Left-edge swipe zone (20px wide, behind drawer) */}
      <GestureDetector gesture={edgeGesture}>
        <View style={styles.edgeZone} />
      </GestureDetector>

      {/* Drawer (absolute overlay, rendered last = on top) */}
      <ChatDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
        isLoadingSessions={isLoadingSessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={renameSession}
        onDeleteSession={handleDeleteSession}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#131f24',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F0EEE6',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'ClashDisplay-Bold',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },

  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageRow: { marginBottom: 12 },
  userRow:    { alignItems: 'flex-end' },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B2C33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.3)',
    flexShrink: 0,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#0EA5E9',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1B2C33',
    borderBottomLeftRadius: 4,
    flex: 1,
  },
  bubbleText:    { fontSize: 14, lineHeight: 20 },
  userText:      { color: '#fff' },
  assistantText: { color: '#F0EEE6' },
  sourcesContainer: { marginTop: 10 },
  citationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  citationBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 160,
  },
  citationText: { color: '#4B6070', fontSize: 10 },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B2C33',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginBottom: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#131f24',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#F0EEE6',
    fontSize: 14,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#243640' },

  edgeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
  },
})
