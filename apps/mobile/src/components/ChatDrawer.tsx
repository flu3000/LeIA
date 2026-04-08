import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, StyleSheet, Dimensions, Image,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/src/context/ThemeContext'

import { type ChatSession } from '@/src/hooks/useChatSessions'

// ── Constants ──────────────────────────────────────────────────────────────────

const SCREEN_WIDTH  = Dimensions.get('window').width
const DRAWER_WIDTH  = SCREEN_WIDTH * 0.82
const CYAN        = '#00D1FF'
const SLIDE_IN    = { duration: 280, easing: Easing.out(Easing.exp) } as const
const SLIDE_OUT   = { duration: 250, easing: Easing.out(Easing.exp) } as const

// ── Date grouping ─────────────────────────────────────────────────────────────

type Group = { label: string; data: ChatSession[] }

function groupByDate(sessions: ChatSession[]): Group[] {
  const now        = new Date()
  const todayStr   = now.toDateString()
  const yestStr    = new Date(now.getTime() - 86_400_000).toDateString()
  const weekAgo    = now.getTime() - 7 * 86_400_000

  const today: ChatSession[]     = []
  const yesterday: ChatSession[] = []
  const week: ChatSession[]      = []

  for (const s of sessions) {
    const ds = new Date(s.updated_at).toDateString()
    if (ds === todayStr)   today.push(s)
    else if (ds === yestStr) yesterday.push(s)
    else if (new Date(s.updated_at).getTime() >= weekAgo) week.push(s)
  }

  const groups: Group[] = []
  if (today.length)     groups.push({ label: 'Hoje',           data: today })
  if (yesterday.length) groups.push({ label: 'Ontem',          data: yesterday })
  if (week.length)      groups.push({ label: 'Últimos 7 dias', data: week })
  return groups
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatDrawerProps {
  isOpen:           boolean
  onClose:          () => void
  sessions:         ChatSession[]
  isLoadingSessions: boolean
  currentSessionId: string | null
  onSelectSession:  (id: string) => void
  onNewSession:     () => void
  onRenameSession:  (id: string, title: string) => Promise<void>
  onDeleteSession:  (id: string) => Promise<void>
}

// ── Session item ──────────────────────────────────────────────────────────────

function SessionItem({
  session,
  isActive,
  onPress,
  onMenu,
  isRenaming,
  renameText,
  onRenameTextChange,
  onRenameSubmit,
}: {
  session: ChatSession
  isActive: boolean
  onPress: () => void
  onMenu: () => void
  isRenaming: boolean
  renameText: string
  onRenameTextChange: (t: string) => void
  onRenameSubmit: () => void
}) {
  const theme = useTheme()
  const styles = createStyles(theme)

  return (
    <TouchableOpacity
      style={[styles.sessionItem, isActive && styles.sessionItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {isActive && <View style={styles.activeBar} />}

      <Ionicons
        name="chatbubble-outline"
        size={15}
        color={isActive ? CYAN : '#4B6070'}
        style={{ marginTop: 1, flexShrink: 0 }}
      />

      <View style={styles.sessionBody}>
        {isRenaming ? (
          <TextInput
            style={styles.renameInput}
            value={renameText}
            onChangeText={onRenameTextChange}
            onSubmitEditing={onRenameSubmit}
            onBlur={onRenameSubmit}
            autoFocus
            maxLength={60}
            returnKeyType="done"
          />
        ) : (
          <Text
            style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
            numberOfLines={1}
          >
            {session.title}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuBtn} onPress={onMenu} hitSlop={8}>
        <Ionicons name="ellipsis-horizontal" size={16} color="#4B6070" />
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ChatDrawer({
  isOpen,
  onClose,
  sessions,
  isLoadingSessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
}: ChatDrawerProps) {
  const theme = useTheme()
  const styles = createStyles(theme)

  const [visible,     setVisible]     = useState(false)
  const [renamingId,  setRenamingId]  = useState<string | null>(null)
  const [renameText,  setRenameText]  = useState('')

  const translateX    = useSharedValue(-DRAWER_WIDTH)
  const overlayOpacity = useSharedValue(0)

  // ── Open / close animation ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      translateX.value     = withTiming(0, SLIDE_IN)
      overlayOpacity.value = withTiming(0.55, { duration: 250 })
    } else {
      translateX.value     = withTiming(-DRAWER_WIDTH, SLIDE_OUT, () => runOnJS(setVisible)(false))
      overlayOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [isOpen])

  const drawerStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }))

  // ── Swipe left on drawer to close ─────────────────────────────────────────

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-25, 25])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value    = Math.max(-DRAWER_WIDTH, e.translationX)
        overlayOpacity.value = 0.55 * (1 + e.translationX / DRAWER_WIDTH)
      }
    })
    .onEnd((e) => {
      if (e.translationX < -DRAWER_WIDTH * 0.3 || e.velocityX < -600) {
        runOnJS(onClose)()
      } else {
        translateX.value     = withTiming(0, SLIDE_IN)
        overlayOpacity.value = withTiming(0.55, { duration: 200 })
      }
    })

  // ── Rename logic ──────────────────────────────────────────────────────────

  const startRename = useCallback((session: ChatSession) => {
    setRenamingId(session.id)
    setRenameText(session.title)
  }, [])

  const submitRename = useCallback(async () => {
    if (!renamingId || !renameText.trim()) { setRenamingId(null); return }
    await onRenameSession(renamingId, renameText.trim())
    setRenamingId(null)
  }, [renamingId, renameText, onRenameSession])

  // ── Context menu (3-dot) ──────────────────────────────────────────────────

  const openMenu = useCallback((session: ChatSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert(
      session.title.length > 32 ? session.title.slice(0, 32) + '…' : session.title,
      undefined,
      [
        { text: 'Renomear', onPress: () => startRename(session) },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Excluir conversa?', 'Todas as mensagens serão apagadas permanentemente.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir',  style: 'destructive', onPress: () => onDeleteSession(session.id) },
            ]),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    )
  }, [startRename, onDeleteSession])

  // ── Grouped data ──────────────────────────────────────────────────────────

  const groups = groupByDate(sessions)

  // ── Render ────────────────────────────────────────────────────────────────

  if (!visible) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <Reanimated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} pointerEvents="auto">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Reanimated.View>

      {/* Drawer panel */}
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.drawer, drawerStyle]}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

            {/* Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.logoRow}>
                <Image 
                  source={require('../assets/logo_definitiva_core.png')} // Ajuste o caminho até a pasta da imagem
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
                <Text style={styles.logoText}>LeIA</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="chevron-back" size={20} color="#4B6070" />
              </TouchableOpacity>
            </View>

            {/* Nova Conversa */}
            <TouchableOpacity
              style={styles.newChatBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNewSession() }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={CYAN} />
              <Text style={styles.newChatText}>Nova Conversa</Text>
            </TouchableOpacity>

            {/* Session list */}
            {isLoadingSessions ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={CYAN} />
              </View>
            ) : (
              <FlatList
                data={groups}
                keyExtractor={(g) => g.label}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item: group }) => (
                  <View>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    {group.data.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === currentSessionId}
                        onPress={() => { onSelectSession(session.id); onClose() }}
                        onMenu={() => openMenu(session)}
                        isRenaming={renamingId === session.id}
                        renameText={renameText}
                        onRenameTextChange={setRenameText}
                        onRenameSubmit={submitRename}
                      />
                    ))}
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Ionicons name="chatbubbles-outline" size={32} color={theme.muted} />
                    <Text style={styles.emptyText}>Nenhuma conversa ainda.</Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </Reanimated.View>
      </GestureDetector>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    backgroundColor: '#000',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: theme.surface,
    borderRightWidth: 1,
    borderRightColor: theme.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderStrong,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: theme.accent,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent + '55',
    backgroundColor: theme.accent + '0D',
  },
  newChatText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  sessionItemActive: {
    backgroundColor: theme.accent + '12',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: theme.accent,
  },
  sessionBody: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 13,
    color: '#8DA3AF',
    fontWeight: '500',
  },
  sessionTitleActive: {
    color: '#F0EEE6',
    fontWeight: '600',
  },
  menuBtn: {
    padding: 4,
    flexShrink: 0,
  },
  renameInput: {
    color: '#F0EEE6',
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 13,
  },
  logoImage: {
    width: 22,  // Ajuste conforme necessário
    height: 22, // Ajuste conforme necessário
  },
})
