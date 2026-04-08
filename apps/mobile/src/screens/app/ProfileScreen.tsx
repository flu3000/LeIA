import {
  View, Text, TouchableOpacity, ScrollView, Alert, Image,
  ActivityIndicator, StyleSheet, TextInput, Modal, Switch,
  Pressable, Animated,
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { Ionicons, Feather } from '@expo/vector-icons'

import { useRouter } from 'expo-router'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { BACKEND_URL } from '@/src/lib/apiClient'
import { useUserContent } from '@/src/hooks/useUserContent'
import { getLevelForXP, getProgressToNext } from '@/src/data/levels'
import MedalsSection from '@/src/components/MedalsSection'
import { useTheme } from '@/src/context/ThemeContext'
import { ColorSpace } from 'react-native-reanimated'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UserStats {
  total_xp: number
  sessions_count: number
  focused_sessions: number
}

// ---------------------------------------------------------------------------
// XP Ring (SVG circular progress)
// ---------------------------------------------------------------------------

function XPRing({
  progress,
  color,
  size,
  strokeWidth,
  children,
}: {
  progress: number
  color: string
  size: number
  strokeWidth: number
  children: React.ReactNode
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1))

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        {/* Track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Avatar (foto ou iniciais)
// ---------------------------------------------------------------------------

function Avatar({
  name,
  avatarUrl,
  size = 80,
  isUploading = false,
  onPress,
}: {
  name: string
  avatarUrl?: string
  size?: number
  isUploading?: boolean
  onPress?: () => void
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const BADGE = Math.round(size * 0.28)
  return (
    <View style={{ width: size, height: size }}>
      <TouchableOpacity
        onPress={isUploading ? undefined : onPress}
        activeOpacity={0.85}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          opacity: isUploading ? 0.45 : 1,
        }}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} resizeMode="cover" />
        ) : (
          <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{initials || '?'}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isUploading && (
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color={theme.accent} size="small" />
        </View>
      )}

      {!isUploading && !!onPress && (
        <View style={[styles.cameraBadge, { width: BADGE, height: BADGE, borderRadius: BADGE / 2, bottom: 2, right: 2 }]}>
          <Feather name="edit-2" size={BADGE * 0.46} color="#fff" />
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// StatCard (2-column, 3D depth, scale press)
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  value,
  label,
  accentColor,
  onPress,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  accentColor: string
  onPress?: () => void
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const scale = useRef(new Animated.Value(1)).current

  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }).start()
  const onPressOut = () =>
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start()

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} style={styles.statCardWrapper}>
      <Animated.View style={[styles.statCard, { borderBottomColor: accentColor, transform: [{ scale }] }]}>
        <View style={[styles.statIconWrap, { backgroundColor: accentColor + '18' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

// ---------------------------------------------------------------------------
// SettingsRow
// ---------------------------------------------------------------------------

function SettingsRow({
  iconName,
  label,
  description,
  value,
  onPress,
  danger = false,
  rightElement,
}: {
  iconName: string
  label: string
  description?: string
  value?: string
  onPress?: () => void
  danger?: boolean
  rightElement?: React.ReactNode
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.settingsIconWrap, danger && styles.settingsIconDanger]}>
        <Ionicons name={iconName as never} size={16} color={danger ? theme.danger : theme.muted} />
      </View>
      <View style={styles.settingsLabelWrap}>
        <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
        {description ? <Text style={styles.settingsDescription}>{description}</Text> : null}
      </View>
      <View style={styles.settingsRight}>
        {rightElement ?? (
          <>
            {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
            {onPress && !danger && <Ionicons name="chevron-forward" size={14} color={theme.muted} />}
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ---------------------------------------------------------------------------
// Modal de edição de perfil
// ---------------------------------------------------------------------------

function EditProfileModal({
  visible,
  initialName,
  initialUsername,
  initialBio,
  onClose,
  onSave,
}: {
  visible: boolean
  initialName: string
  initialUsername: string
  initialBio: string
  onClose: () => void
  onSave: (name: string, username: string, bio: string) => Promise<void>
}) {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [name,     setName]     = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [bio,      setBio]      = useState(initialBio)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (visible) {
      setName(initialName)
      setUsername(initialUsername)
      setBio(initialBio)
      setError('')
    }
  }, [visible, initialName, initialUsername, initialBio])

  const handleSave = async () => {
    if (!name.trim()) { setError('O nome não pode estar vazio.'); return }
    if (username && !/^[a-z0-9_]{3,20}$/.test(username.toLowerCase())) {
      setError('Username: 3–20 caracteres, apenas letras, números e _.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(name.trim(), username.trim().toLowerCase(), bio.trim())
      onClose()
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'USERNAME_TAKEN') {
        setError('Este username já está em uso.')
      } else {
        setError('Erro ao salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHandle} />

        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar Perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.modalSaveBtn}>
            {saving
              ? <ActivityIndicator size="small" color="#0EA5E9" />
              : <Text style={styles.modalSaveText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-triangle" size={14} color="#fbbf24" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Nome de exibição</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#4B6070"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>Username</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameAt}>@</Text>
            <TextInput
              style={[styles.fieldInput, styles.usernameInput]}
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="seu_username"
              placeholderTextColor="#4B6070"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={20}
            />
          </View>
          <Text style={styles.fieldHint}>3–20 caracteres, letras minúsculas, números e _</Text>

          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.fieldInput, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Conte um pouco sobre você..."
            placeholderTextColor="#4B6070"
            multiline
            numberOfLines={3}
            maxLength={160}
            returnKeyType="done"
          />
          <Text style={styles.fieldHint}>{bio.length}/160</Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Tela principal
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const theme = useTheme();
  // Memoriza os estilos para performance
  const styles = useMemo(() => createStyles(theme), [theme]);

  const router = useRouter()
  const { user, logout, updateProfile, patchUser } = useAuth()
  const { items } = useUserContent()

  const [userStats,       setUserStats]       = useState<UserStats | null>(null)
  const [isLoggingOut,    setIsLoggingOut]    = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [darkMode,        setDarkMode]        = useState(user?.theme !== 'light')

  const handleThemeToggle = useCallback(async (value: boolean) => {
    const newTheme = value ? 'dark' : 'light'
    setDarkMode(value)
    patchUser({ theme: newTheme })
    await updateProfile({ theme: newTheme })
  }, [patchUser, updateProfile])

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stats')
      .select('total_xp, sessions_count, focused_sessions')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setUserStats(data) })
  }, [user?.id])

  // ---------------------------------------------------------------------------
  // Avatar upload
  // ---------------------------------------------------------------------------
  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'O acesso à galeria é necessário para trocar a foto de perfil. Habilite nas Configurações do dispositivo.',
        [{ text: 'OK' }],
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploadingAvatar(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const formData = new FormData()
      formData.append('avatar', {
        uri:  asset.uri,
        name: `avatar.${ext}`,
        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      } as unknown as Blob)

      const { data: { session: authSession } } = await supabase.auth.getSession()
      const authHeader = authSession?.access_token
        ? { Authorization: `Bearer ${authSession.access_token}` }
        : {}

      const res = await fetch(`${BACKEND_URL}/api/user/avatar`, {
        method:  'POST',
        headers: { ...authHeader },
        body:    formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err?.error ?? `HTTP ${res.status}`)
      }

      const { avatarUrl } = await res.json()
      patchUser({ avatarUrl })
    } catch (e) {
      console.error('[Avatar upload]', e)
      const msg = e instanceof Error ? e.message : 'Tente novamente.'
      Alert.alert('Erro no upload', msg)
    } finally {
      setUploadingAvatar(false)
    }
  }, [patchUser])

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair', style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true)
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            try { await logout() } catch { setIsLoggingOut(false) }
          },
        },
      ]
    )
  }

  // ---------------------------------------------------------------------------
  // Derivados
  // ---------------------------------------------------------------------------
  const totalXP    = userStats?.total_xp ?? 0
  const { current: lvl, next: nextLvl, progress: xpProgress } = getProgressToNext(totalXP)
  const savedCount = items.filter((i) => i.is_favourite).length
  const readCount  = items.filter((i) => i.is_read).length

  const joinedDate = user
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
        .format(new Date(user.joinedAt))
    : ''

  if (!user) return null

  // Ring size slightly larger than avatar to show the arc outside
  const RING_SIZE = 120
  const AVATAR_SIZE = 96
  const STROKE = 4

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* XP Ring + Avatar */}
          <XPRing progress={xpProgress} color={lvl.color} size={RING_SIZE} strokeWidth={STROKE}>
            <Avatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              size={AVATAR_SIZE}
              isUploading={uploadingAvatar}
              onPress={handlePickAvatar}
            />
          </XPRing>

          {/* Level pill */}
          <View style={[styles.levelPill, { borderColor: lvl.color + '55', backgroundColor: lvl.color + '18' }]}>
            <Text style={[styles.levelPillText, { color: lvl.color }]}>
              Nível {lvl.level} · {lvl.title}
            </Text>
          </View>

          {/* XP progress text */}
          <Text style={styles.xpText}>
            {totalXP.toLocaleString('pt-BR')} XP
            {nextLvl ? `  →  ${nextLvl.minXP.toLocaleString('pt-BR')} XP para ${nextLvl.title}` : '  · Nível máximo'}
          </Text>

          {/* Name */}
          <Text style={styles.heroName}>{user.name}</Text>

          {/* Username & email */}
          {user.username && (
            <Text style={styles.heroUsername}>@{user.username}</Text>
          )}
          <Text style={styles.heroEmail}>{user.email}</Text>
          <Text style={styles.heroJoined}>Membro desde {joinedDate}</Text>

          {/* Bio */}
          {user.bio ? (
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>"{user.bio}"</Text>
            </View>
          ) : null}

          {/* Followers row */}
          <View style={styles.followRow}>
            <TouchableOpacity style={styles.followChip} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>Seguidores</Text>
            </TouchableOpacity>
            <View style={styles.followDivider} />
            <TouchableOpacity style={styles.followChip} activeOpacity={0.7}>
              <Text style={styles.followCount}>0</Text>
              <Text style={styles.followLabel}>Seguindo</Text>
            </TouchableOpacity>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={13} color="#0EA5E9" />
            <Text style={styles.editBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats 2x2 ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon={<Ionicons name="chatbubbles-outline" size={22} color="#00D1FF" />}
              value={userStats?.sessions_count ?? 0}
              label="Sessões"
              accentColor="#00D1FF"
              onPress={() => router.push('/(app)/chat')}
            />
            <StatCard
              icon={<Ionicons name="bookmark-outline" size={22} color="#00DB80" />}
              value={savedCount}
              label="Salvos"
              accentColor="#00DB80"
              onPress={() => router.push('/(app)/library')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon={<Ionicons name="book-outline" size={22} color="#A855F7" />}
              value={readCount}
              label="Lidos"
              accentColor="#A855F7"
              onPress={() => router.push('/(app)/library')}
            />
            <StatCard
              icon={<Ionicons name="trophy-outline" size={22} color="#FBBF24" />}
              value={totalXP.toLocaleString('pt-BR')}
              label="XP Total"
              accentColor="#FBBF24"
            />
          </View>
        </View>

        {/* ── Medalhas ── */}
        <View style={{ marginHorizontal: 16 }}>
          <MedalsSection />
        </View>

        {/* ── Preferências ── */}
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            iconName="color-palette-outline"
            label="Aparência"
            description={darkMode ? 'Tema escuro ativo' : 'Tema claro ativo'}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: theme.muted, true: theme.accentDim }}
                thumbColor={darkMode ? theme.accent : theme.accentDim}
              />
            }
          />
          <SettingsRow
            iconName="notifications-outline"
            label="Notificações"
            description="Alertas e lembretes de estudo"
            value="Em breve"
          />
          <SettingsRow
            iconName="shield-checkmark-outline"
            label="Segurança"
            description="Alterar senha e dados da conta"
            onPress={() => Alert.alert('Em breve', 'Redefinição de senha disponível em breve.')}
          />
        </View>

        {/* ── Conta ── */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            iconName="information-circle-outline"
            label="Sobre o LeIA"
            description="Versão 1.0"
            onPress={() => Alert.alert('LeIA v1.0', 'Seu Bibliotecário Inteligente.\n\n© 2025 Todos os direitos reservados.')}
          />
          <SettingsRow
            iconName="log-out-outline"
            label={isLoggingOut ? 'Saindo...' : 'Sair da conta'}
            description="Encerrar sessão neste dispositivo"
            onPress={handleLogout}
            danger
          />
        </View>

        <Text style={styles.version}>LeIA v1.0 • Todos os direitos reservados</Text>
      </ScrollView>

      {/* ── Modal de edição ── */}
      <EditProfileModal
        visible={editModalOpen}
        initialName={user.name}
        initialUsername={user.username ?? ''}
        initialBio={user.bio ?? ''}
        onClose={() => setEditModalOpen(false)}
        onSave={async (name, username, bio) => {
          await updateProfile({ name, username, bio })
        }}
      />
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    paddingBottom: 48,
  },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 20,
  },
  levelPill: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  levelPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  xpText: {
    color: theme.dimmed,
    fontSize: 11,
    marginBottom: 14,
    textAlign: 'center',
  },
  heroName: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'ClashDisplay-Semibold',
  },
  heroUsername: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  heroEmail: {
    color: theme.dimmed,
    fontSize: 12,
    marginBottom: 2,
  },
  heroJoined: {
    color: theme.dimmed,
    fontSize: 11,
    marginBottom: 14,
  },

  // Bio card
  bioCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 16,
    width: '100%',
  },
  bioText: {
    color: theme.muted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
    textAlign: 'center',
  },

  // Followers
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 0,
  },
  followChip: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  followCount: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  followLabel: {
    color: theme.dimmed,
    fontSize: 11,
    marginTop: 1,
  },
  followDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.border,
  },

  // Edit button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editBtnText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Avatar ──
  avatarFallback: {
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: "#fff",
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },

  // ── Stats 2x2 ──
  statsGrid: {
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surfaceDeep,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomWidth: 3,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Settings ──
  sectionTitle: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 20,
    marginTop: 4,
    fontFamily: 'ClashDisplay-Semibold',
  },
  settingsGroup: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginBottom: 24,
    marginHorizontal: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconDanger: {
    backgroundColor: theme.danger + '1F',
  },
  settingsLabelWrap: {
    flex: 1,
  },
  settingsLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'ClashDisplay-Medium',
  },
  settingsLabelDanger: {
    color: theme.danger,
  },
  settingsDescription: {
    color: theme.dimmed,
    fontSize: 11,
    marginTop: 1,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsValue: {
    color: theme.muted,
    fontSize: 12,
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  version: {
    color: theme.dimmed,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Modal de edição ──
  modalRoot: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.borderStrong,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSaveBtn: {
    width: 64,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: theme.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.warning + '1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.warning + '40',
  },
  errorText: {
    color: theme.warning,
    fontSize: 13,
    flex: 1,
  },
  fieldLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    backgroundColor: theme.surfaceDeep,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameAt: {
    color: theme.dimmed,
    fontSize: 16,
    fontWeight: '700',
  },
  usernameInput: {
    flex: 1,
  },
  bioInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldHint: {
    color: theme.dimmed,
    fontSize: 11,
    marginTop: 4,
  },
})
