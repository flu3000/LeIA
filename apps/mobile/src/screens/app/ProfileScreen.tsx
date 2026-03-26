import {
  View, Text, TouchableOpacity, ScrollView, Alert, Image,
  ActivityIndicator, StyleSheet, TextInput, Modal, Switch,
} from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { Ionicons, Feather } from '@expo/vector-icons'

import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { useUserContent } from '@/src/hooks/useUserContent'
import { getLevelForXP, getProgressToNext } from '@/src/data/levels'
import MedalsSection from '@/src/components/MedalsSection'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface UserStats {
  total_xp: number
  sessions_count: number
  focused_sessions: number
}

// ---------------------------------------------------------------------------
// Avatar (foto ou iniciais)
// ---------------------------------------------------------------------------

function Avatar({
  name,
  avatarUrl,
  size = 80,
  onPress,
}: {
  name: string
  avatarUrl?: string
  size?: number
  onPress?: () => void
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const circle: object = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 3,
    borderColor: 'rgba(14,165,233,0.4)',
    overflow: 'hidden',
    position: 'relative',
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1} style={circle}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      ) : (
        <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{initials || '?'}</Text>
        </View>
      )}
      {onPress && (
        <View style={styles.avatarOverlay}>
          <Feather name="camera" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  )
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View style={[styles.settingsIconWrap, danger && styles.settingsIconDanger]}>
        <Ionicons name={iconName as never} size={16} color={danger ? '#E11D48' : '#94A3B8'} />
      </View>
      <View style={styles.settingsLabelWrap}>
        <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
        {description ? <Text style={styles.settingsDescription}>{description}</Text> : null}
      </View>
      <View style={styles.settingsRight}>
        {rightElement ?? (
          <>
            {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
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

  // sync with latest values when opening
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
        {/* Handle bar */}
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
  const { user, logout, updateProfile, refreshUser } = useAuth()
  const { items } = useUserContent()

  const [userStats,       setUserStats]       = useState<UserStats | null>(null)
  const [isLoggingOut,    setIsLoggingOut]    = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editModalOpen,   setEditModalOpen]   = useState(false)
  const [darkMode,        setDarkMode]        = useState(true)

  // Fetch stats
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
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.')
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
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // Fetch blob
      const response = await fetch(asset.uri)
      const blob     = await response.blob()
      const ext      = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path     = `avatars/${user!.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('user-avatars').getPublicUrl(path)
      // cache-bust para forçar recarregamento
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

      await updateProfile({ avatarUrl })
    } catch (e) {
      console.error('[Avatar upload]', e)
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.')
    } finally {
      setUploadingAvatar(false)
    }
  }, [user, updateProfile])

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
    ? new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(user.joinedAt))
    : ''

  if (!user) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <Text style={styles.pageTitle}>Perfil</Text>

        {/* ── Cartão do usuário ── */}
        <View style={styles.userCard}>
          <View style={styles.userCardTop}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {uploadingAvatar && (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color="#0EA5E9" />
                </View>
              )}
              <Avatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                size={80}
                onPress={handlePickAvatar}
              />
            </View>

            {/* Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              {user.username && (
                <Text style={styles.userHandle}>@{user.username}</Text>
              )}
              <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
              <Text style={styles.userJoined}>Membro desde {joinedDate}</Text>
            </View>

            {/* Nível */}
            <View style={styles.levelBadge}>
              <Text style={[styles.levelTitle, { color: lvl.color }]}>{lvl.title}</Text>
              <Text style={styles.levelNum}>Nível {lvl.level}</Text>
            </View>
          </View>

          {/* Bio */}
          {user.bio ? (
            <Text style={styles.userBio}>"{user.bio}"</Text>
          ) : null}

          {/* Botão editar */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditModalOpen(true)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={13} color="#0EA5E9" />
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>

          {/* XP bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpHeader}>
              <View style={styles.xpLeft}>
                <Feather name="zap" size={13} color="#0EA5E9" />
                <Text style={styles.xpXPText}>{totalXP.toLocaleString('pt-BR')} XP</Text>
              </View>
              {nextLvl && (
                <Text style={styles.xpNext}>→ {nextLvl.minXP.toLocaleString('pt-BR')} XP · {nextLvl.title}</Text>
              )}
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${Math.round(xpProgress * 100)}%` as `${number}%`, backgroundColor: lvl.color }]} />
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Feather name="message-square" size={20} color="#0EA5E9" />}
            value={userStats?.sessions_count ?? 0}
            label="Sessões"
          />
          <StatCard
            icon={<Feather name="bookmark" size={20} color="#0EA5E9" />}
            value={savedCount}
            label="Salvos"
          />
          <StatCard
            icon={<Feather name="book-open" size={20} color="#10B981" />}
            value={readCount}
            label="Lidos"
          />
          <StatCard
            icon={<Ionicons name="trophy-outline" size={20} color="#FBBF24" />}
            value={`Nv ${lvl.level}`}
            label="Nível"
          />
        </View>

        {/* ── Medalhas ── */}
        <MedalsSection />

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
                onValueChange={setDarkMode}
                trackColor={{ false: '#334155', true: 'rgba(14,165,233,0.4)' }}
                thumbColor={darkMode ? '#0EA5E9' : '#94A3B8'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  pageTitle: {
    color: '#F0EEE6',
    fontSize: 26,
    fontWeight: '800',
    paddingTop: 8,
    paddingBottom: 16,
  },

  // ── Cartão do usuário ──
  userCard: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarFallback: {
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontWeight: '800',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#131f24',
  },
  avatarLoading: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: '#F0EEE6',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  userHandle: {
    color: '#0EA5E9',
    fontSize: 13,
    marginBottom: 2,
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  userJoined: {
    color: '#4B6070',
    fontSize: 11,
  },
  levelBadge: {
    alignItems: 'flex-end',
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  levelNum: {
    color: '#4B6070',
    fontSize: 11,
    marginTop: 2,
  },
  userBio: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  editBtnText: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '600',
  },

  // XP bar
  xpSection: {},
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpXPText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  xpNext: {
    color: '#4B6070',
    fontSize: 11,
  },
  xpBar: {
    height: 6,
    backgroundColor: '#131f24',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Stats ──
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    color: '#F0EEE6',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },

  // ── Settings ──
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
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
