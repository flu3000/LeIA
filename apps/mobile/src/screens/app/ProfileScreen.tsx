import {
  View, Text, TouchableOpacity, ScrollView, Alert, Image,
  ActivityIndicator, StyleSheet, TextInput, Modal, Switch,
  Pressable, Animated,
} from 'react-native'
import React, { useState, useEffect, useCallback, useRef, use } from 'react'
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
import { colors } from '@/src/constants/colors'

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
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const BADGE = Math.round(size * 0.28)
  const color = colors()
  const style = styles(color)
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
          <View style={[style.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[style.avatarInitials, { fontSize: size * 0.34 }]}>{initials || '?'}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isUploading && (
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator color="#0EA5E9" size="small" />
        </View>
      )}

      {!isUploading && !!onPress && (
        <View style={[style.cameraBadge, { width: BADGE, height: BADGE, borderRadius: BADGE / 2, bottom: 2, right: 2 }]}>
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
  const scale = useRef(new Animated.Value(1)).current

  const onPressIn = () =>
    Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }).start()
  const onPressOut = () =>
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start()

  const color = colors()
  const style = styles(color)
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} style={style.statCardWrapper}>
      <Animated.View style={[style.statCard, { borderBottomColor: accentColor, transform: [{ scale }] }]}>
        <View style={[style.statIconWrap, { backgroundColor: accentColor + '18' }]}>
          {icon}
        </View>
        <Text style={style.statValue}>{value}</Text>
        <Text style={style.statLabel}>{label}</Text>
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
  const color = colors()
  const style = styles(color)
  return (
    <TouchableOpacity
      style={style.settingsRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={[style.settingsIconWrap, danger && style.settingsIconDanger]}>
        <Ionicons name={iconName as never} size={16} color={danger ? '#E11D48' : '#94A3B8'} />
      </View>
      <View style={style.settingsLabelWrap}>
        <Text style={[style.settingsLabel, danger && style.settingsLabelDanger]}>{label}</Text>
        {description ? <Text style={style.settingsDescription}>{description}</Text> : null}
      </View>
      <View style={style.settingsRight}>
        {rightElement ?? (
          <>
            {value ? <Text style={style.settingsValue}>{value}</Text> : null}
            {onPress && !danger && <Ionicons name="chevron-forward" size={14} color="#4B6070" />}
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
  const [name,     setName]     = useState(initialName)
  const [username, setUsername] = useState(initialUsername)
  const [bio,      setBio]      = useState(initialBio)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const color = colors()
  const style = styles(color)

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

  const handleTheme = async () => {
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
      <View style={style.modalRoot}>
        <View style={style.modalHandle} />

        <View style={style.modalHeader}>
          <TouchableOpacity onPress={onClose} style={style.modalCloseBtn}>
            <Ionicons name="close" size={22} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={style.modalTitle}>Editar Perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={style.modalSaveBtn}>
            {saving
              ? <ActivityIndicator size="small" color="#0EA5E9" />
              : <Text style={style.modalSaveText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={style.modalBody} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={style.errorBanner}>
              <Feather name="alert-triangle" size={14} color="#fbbf24" />
              <Text style={style.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={style.fieldLabel}>Nome de exibição</Text>
          <TextInput
            style={style.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor="#4B6070"
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={style.fieldLabel}>Username</Text>
          <View style={style.usernameRow}>
            <Text style={style.usernameAt}>@</Text>
            <TextInput
              style={[style.fieldInput, style.usernameInput]}
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
          <Text style={style.fieldHint}>3–20 caracteres, letras minúsculas, números e _</Text>

          <Text style={style.fieldLabel}>Bio</Text>
          <TextInput
            style={[style.fieldInput, style.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Conte um pouco sobre você..."
            placeholderTextColor="#4B6070"
            multiline
            numberOfLines={3}
            maxLength={160}
            returnKeyType="done"
          />
          <Text style={style.fieldHint}>{bio.length}/160</Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Tela principal
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const router = useRouter()
  const { user, logout, updateProfile, patchUser } = useAuth()
  const { items } = useUserContent()
  const color = colors()
  const style = styles(color)

  const [userStats,       setUserStats]       = useState<UserStats | null>(null)
  const [isLoggingOut,    setIsLoggingOut]    = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [darkMode,        setDarkMode]        = useState(user?.theme === 'dark' ? true : false)

  const [theme,           setTheme]           = useState(user?.theme)
  useEffect(() => {
    if (darkMode === true) {
    setTheme('dark')
  } else {
    setTheme('light')
  }
  }, [darkMode])

  useEffect(() => {
    if (!user?.theme || user?.theme === undefined) return
    updateProfile({ theme: theme })
  }, [theme])

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
    <SafeAreaView style={style.container} edges={['top']}>
      <ScrollView contentContainerStyle={style.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={style.hero}>
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
          <View style={[style.levelPill, { borderColor: lvl.color + '55', backgroundColor: lvl.color + '18' }]}>
            <Text style={[style.levelPillText, { color: lvl.color }]}>
              Nível {lvl.level} · {lvl.title}
            </Text>
          </View>

          {/* XP progress text */}
          <Text style={style.xpText}>
            {totalXP.toLocaleString('pt-BR')} XP
            {nextLvl ? `  →  ${nextLvl.minXP.toLocaleString('pt-BR')} XP para ${nextLvl.title}` : '  · Nível máximo'}
          </Text>

          {/* Name */}
          <Text style={style.heroName}>{user.name}</Text>

          {/* Username & email */}
          {user.username && (
            <Text style={style.heroUsername}>@{user.username}</Text>
          )}
          <Text style={style.heroEmail}>{user.email}</Text>
          <Text style={style.heroJoined}>Membro desde {joinedDate}</Text>

          {/* Bio */}
          {user.bio ? (
            <View style={style.bioCard}>
              <Text style={style.bioText}>"{user.bio}"</Text>
            </View>
          ) : null}

          {/* Followers row */}
          <View style={style.followRow}>
            <TouchableOpacity style={style.followChip} activeOpacity={0.7}>
              <Text style={style.followCount}>0</Text>
              <Text style={style.followLabel}>Seguidores</Text>
            </TouchableOpacity>
            <View style={style.followDivider} />
            <TouchableOpacity style={style.followChip} activeOpacity={0.7}>
              <Text style={style.followCount}>0</Text>
              <Text style={style.followLabel}>Seguindo</Text>
            </TouchableOpacity>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            style={style.editBtn}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={13} color="#0EA5E9" />
            <Text style={style.editBtnText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats 2x2 ── */}
        <View style={style.statsGrid}>
          <View style={style.statsRow}>
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
          <View style={style.statsRow}>
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
        <Text style={style.sectionTitle}>Preferências</Text>
        <View style={style.settingsGroup}>
          <SettingsRow
            iconName="color-palette-outline"
            label="Aparência"
            description={darkMode ? 'Tema escuro ativo' : 'Tema claro ativo'}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#334155', true: color.accentDim }}
                thumbColor={darkMode ? color.accent : '#94A3B8'}
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
        <Text style={style.sectionTitle}>Conta</Text>
        <View style={style.settingsGroup}>
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

        <Text style={style.version}>LeIA v1.0 • Todos os direitos reservados</Text>
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
const styles = (color: any ) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    color: '#4B6070',
    fontSize: 11,
    marginBottom: 14,
    textAlign: 'center',
  },
  heroName: {
    color: '#F0EEE6',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'ClashDisplay-Semibold',
  },
  heroUsername: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  heroEmail: {
    color: '#4B6070',
    fontSize: 12,
    marginBottom: 2,
  },
  heroJoined: {
    color: '#344554',
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
    color: '#64748B',
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
    color: '#F0EEE6',
    fontSize: 18,
    fontWeight: '800',
  },
  followLabel: {
    color: '#4B6070',
    fontSize: 11,
    marginTop: 1,
  },
  followDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Edit button
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.35)',
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  editBtnText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Avatar ──
  avatarFallback: {
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#131f24',
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
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: '#F0EEE6',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Settings ──
  sectionTitle: {
    color: '#94A3B8',
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
    // borderRadius: 16,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconDanger: {
    backgroundColor: 'rgba(225,29,72,0.12)',
  },
  settingsLabelWrap: {
    flex: 1,
  },
  settingsLabel: {
    color: '#F0EEE6',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'ClashDisplay-Medium',
  },
  settingsLabelDanger: {
    color: '#E11D48',
  },
  settingsDescription: {
    color: '#4B6070',
    fontSize: 11,
    marginTop: 1,
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsValue: {
    color: '#4B6070',
    fontSize: 12,
    backgroundColor: '#243640',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  version: {
    color: '#4B6070',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Modal de edição ──
  modalRoot: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
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
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    color: '#F0EEE6',
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
    color: '#0EA5E9',
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
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  errorText: {
    color: '#fbbf24',
    fontSize: 13,
    flex: 1,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#F0EEE6',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameAt: {
    color: '#4B6070',
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
    color: '#4B6070',
    fontSize: 11,
    marginTop: 4,
  },
})
