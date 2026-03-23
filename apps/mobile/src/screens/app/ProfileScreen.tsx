import {
  View, Text, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'

import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'

interface UserStats {
  total_xp: number
  sessions_count: number
  focused_sessions: number
}

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>{initials || '?'}</Text>
    </View>
  )
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

interface SettingsRowProps {
  icon: string
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  chevron?: boolean
}

function SettingsRow({ icon, label, value, onPress, danger, chevron = true }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Ionicons name={icon as never} size={16} color={danger ? '#E11D48' : '#94A3B8'} />
      </View>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
        {chevron && onPress && (
          <Ionicons name="chevron-forward" size={14} color="#4B6070" />
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stats')
      .select('total_xp, sessions_count, focused_sessions')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserStats(data)
      })
  }, [user?.id])

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true)
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            try {
              await logout()
              router.replace('/(auth)/login')
            } catch {
              setIsLoggingOut(false)
            }
          },
        },
      ]
    )
  }

  // XP level calculation
  const totalXP     = userStats?.total_xp ?? 0
  const level       = Math.floor(totalXP / 500) + 1
  const xpInLevel   = totalXP % 500
  const xpProgress  = xpInLevel / 500

  if (!user) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* User info */}
        <View style={styles.userSection}>
          <AvatarCircle name={user.name} />
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.username && (
            <Text style={styles.userHandle}>@{user.username}</Text>
          )}
        </View>

        {/* XP + Level */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Nível {level}</Text>
            <Text style={styles.xpValue}>{totalXP} XP total</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.floor(xpProgress * 100)}%` as `${number}%` }]} />
          </View>
          <Text style={styles.xpSub}>{xpInLevel} / 500 XP para o próximo nível</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard icon="🎯" value={userStats?.sessions_count ?? 0} label="Sessões" />
          <StatCard icon="⚡" value={userStats?.focused_sessions ?? 0} label="Com foco" />
          <StatCard icon="✨" value={totalXP} label="XP total" />
          <StatCard icon="🏆" value={`Nv ${level}`} label="Nível" />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="person-outline"
              label="Editar perfil"
              onPress={() => {/* TODO: navigate to edit profile */}}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notificações"
              value="Em breve"
              chevron={false}
            />
            <SettingsRow
              icon="shield-checkmark-outline"
              label="Segurança"
              onPress={() => {/* TODO */}}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.settingsGroup}>
            <SettingsRow
              icon="information-circle-outline"
              label="Sobre o LeIA"
              onPress={() => {/* TODO */}}
            />
            <SettingsRow
              icon="log-out-outline"
              label={isLoggingOut ? 'Saindo...' : 'Sair da conta'}
              onPress={handleLogout}
              danger
              chevron={false}
            />
          </View>
        </View>

        <Text style={styles.version}>LeIA v1.0 • Todos os direitos reservados</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#F0EEE6',
    fontSize: 26,
    fontWeight: '800',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(14,165,233,0.3)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: '#F0EEE6',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 2,
  },
  userHandle: {
    color: '#0EA5E9',
    fontSize: 13,
  },
  xpSection: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    color: '#F0EEE6',
    fontSize: 16,
    fontWeight: '700',
  },
  xpValue: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: '600',
  },
  xpBar: {
    height: 8,
    backgroundColor: '#131f24',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 4,
  },
  xpSub: {
    color: '#4B6070',
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    color: '#F0EEE6',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
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
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  settingsIcon: {
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
  settingsLabel: {
    flex: 1,
    color: '#F0EEE6',
    fontSize: 14,
    fontWeight: '500',
  },
  settingsLabelDanger: {
    color: '#E11D48',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsValue: {
    color: '#4B6070',
    fontSize: 13,
  },
  version: {
    color: '#4B6070',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
})
