import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'

interface NavCard {
  label: string
  description: string
  icon: string
  color: string
  route: string
}

const NAV_CARDS: NavCard[] = [
  {
    label: 'Insights',
    description: 'Citações e reflexões da comunidade',
    icon: 'sparkles',
    color: '#F59E0B',
    route: '/insights',
  },
  {
    label: 'Rankings',
    description: 'Ranking de leitura e busca de usuários',
    icon: 'trophy',
    color: '#0EA5E9',
    route: '/rankings',
  },
  {
    label: 'Amigos',
    description: 'Quem você segue e seus seguidores',
    icon: 'people',
    color: '#10B981',
    route: '/friends',
  },
  {
    label: 'Comunidades',
    description: 'Clubes de leitura para leitores',
    icon: 'library',
    color: '#8B5CF6',
    route: '/communities',
  },
]

export default function SocialScreen() {
  const router = useRouter()

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(route as never)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Social</Text>
          <Text style={styles.subtitle}>Conecte-se com outros leitores</Text>
        </View>

        {/* Navigation cards */}
        <View style={styles.cardsContainer}>
          {NAV_CARDS.map((card) => (
            <TouchableOpacity
              key={card.route}
              style={styles.card}
              onPress={() => handlePress(card.route)}
              activeOpacity={0.7}
            >
              {/* Icon circle */}
              <View style={[styles.iconCircle, { backgroundColor: `${card.color}22` }]}>
                <Ionicons name={card.icon as never} size={26} color={card.color} />
              </View>

              {/* Text content */}
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{card.label}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>

              {/* Chevron */}
              <Ionicons name="chevron-forward" size={18} color="#4B6070" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0EEE6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F0EEE6',
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
})
