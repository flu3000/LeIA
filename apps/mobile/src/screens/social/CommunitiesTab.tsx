import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/src/context/ThemeContext'
import { useMemo } from 'react'

const TEAL = '#14B8A6'

// ── Placeholder clubs ─────────────────────────────────────────────────────────

const CLUBS = [
  {
    id: '1',
    name: 'Clube da Leitura Filosófica',
    description: 'Debates mensais sobre obras de filosofia, ética e pensamento crítico.',
    members: 128,
    icon: 'telescope-outline' as const,
    color: '#8B5CF6',
  },
  {
    id: '2',
    name: 'Leitores de Ciência',
    description: 'Para quem ama divulgação científica, física quântica e astronomia.',
    members: 94,
    icon: 'flask-outline' as const,
    color: '#00D1FF',
  },
  {
    id: '3',
    name: 'Maratona de Clássicos',
    description: 'Um clássico da literatura por mês, com resenhas e discussões.',
    members: 212,
    icon: 'book-outline' as const,
    color: '#FF9F1C',
  },
  {
    id: '4',
    name: 'Investidores que Leem',
    description: 'Livros de finanças, negócios e empreendedorismo.',
    members: 67,
    icon: 'trending-up-outline' as const,
    color: '#00DB80',
  },
]

// ── Club Card ─────────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: typeof CLUBS[0] }) {
  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])
  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  return (
    <View style={styles.card}>
      <View style={[styles.clubIcon, { backgroundColor: club.color + '22' }]}>
        <Ionicons name={club.icon} size={26} color={club.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.clubDesc} numberOfLines={2}>{club.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.membersRow}>
            <Ionicons name="people-outline" size={13} color={theme.muted} />
            <Text style={styles.membersText}>{club.members} membros</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin} activeOpacity={0.8}>
            <Text style={styles.joinBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommunitiesTab() {
  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Coming soon banner */}
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name="people" size={32} color={TEAL} />
        </View>
        <Text style={styles.bannerTitle}>Comunidades em breve</Text>
        <Text style={styles.bannerSubtitle}>
          Clubes de leitura colaborativos com metas compartilhadas, desafios e encontros ao vivo.
        </Text>
        <View style={styles.badge}>
          <Ionicons name="construct-outline" size={12} color={TEAL} />
          <Text style={styles.badgeText}>Em desenvolvimento</Text>
        </View>
      </View>

      {/* Preview clubs */}
      <Text style={styles.sectionLabel}>Prévia das comunidades</Text>

      {CLUBS.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}

      {/* Create club CTA */}
      <TouchableOpacity style={styles.createBtn} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={20} color={TEAL} />
        <Text style={styles.createBtnText}>Criar minha comunidade</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  banner: {
    backgroundColor: theme.surfaceDeep,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderStrong,
    gap: 8,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${TEAL}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${TEAL}22`,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${TEAL}55`,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: TEAL,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEAL,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: theme.surfaceDeep,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    alignItems: 'flex-start',
  },
  clubIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  clubName: { fontSize: 15, fontWeight: '700', color: '#F0EEE6' },
  clubDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 17 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  membersText: { fontSize: 12, color: '#4B6070' },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: `${TEAL}22`,
    borderWidth: 1,
    borderColor: `${TEAL}55`,
  },
  joinBtnText: { fontSize: 12, fontWeight: '700', color: TEAL },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${TEAL}44`,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: TEAL },
})
