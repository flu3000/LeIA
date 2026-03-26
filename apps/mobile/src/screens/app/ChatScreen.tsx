import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState, useRef, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useChat, type Message, type Fonte } from '@/src/hooks/useChat'
import { useUserContent } from '@/src/hooks/useUserContent'
import SourceCard from '@/src/components/SourceCard'

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

        {/* Source cards */}
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

        {/* Citations */}
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

export default function ChatScreen() {
  const { messages, isTyping, isClearing, sendMessage, clearHistory } = useChat()
  const [input, setInput] = useState('')
  const listRef = useRef<FlatList>(null)

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    sendMessage(text)
  }, [input, isTyping, sendMessage])

  const handleClear = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    clearHistory()
  }, [clearHistory])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LeIA</Text>
          <Text style={styles.headerSub}>Bibliotecário Inteligente</Text>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          disabled={isClearing}
          activeOpacity={0.7}
        >
          {isClearing
            ? <ActivityIndicator size="small" color="#0EA5E9" />
            : <Text style={styles.clearBtnText}>Nova Conversa</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
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

        {/* Input bar */}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1C22',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#131f24',
  },
  headerTitle: {
    color: '#F0EEE6',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0EA5E9',
    minWidth: 90,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 12,
  },
  userRow: {
    alignItems: 'flex-end',
  },
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
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText:      { color: '#fff' },
  assistantText: { color: '#F0EEE6' },
  sourcesContainer: {
    marginTop: 10,
  },
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
  citationText: {
    color: '#4B6070',
    fontSize: 10,
  },
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
  sendBtnDisabled: {
    backgroundColor: '#243640',
  },
})
