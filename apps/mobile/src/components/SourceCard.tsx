import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { tipoColors, dificuldadeColors } from '@/src/data/topics'
import { Feather, Ionicons } from '@expo/vector-icons'

interface SourceCardProps {
  fonte: {
    tipo: string
    titulo: string
    autor_canal: string
    dificuldade: string
    link: string
    por_que_estudar: string
    id_externo?: string
  }
  isFavourite?: boolean
  onToggleFavourite?: () => void
}

function TipoIcon({ tipo, size, color }: { tipo: string; size: number; color: string }) {
  switch (tipo) {
    case 'livro':   return <Feather name="book-open" size={size} color={color} />
    case 'video':   return <Feather name="video" size={size} color={color} />
    case 'podcast': return <Feather name="mic" size={size} color={color} />
    case 'curso':   return <Ionicons name="school-outline" size={size} color={color} />
    default:        return <Feather name="file-text" size={size} color={color} />
  }
}

export default function SourceCard({ fonte, isFavourite, onToggleFavourite }: SourceCardProps) {
  const tipo       = fonte.tipo?.toLowerCase() ?? 'artigo'
  const tipoColor  = tipoColors[tipo]        ?? tipoColors.artigo
  const difColor   = dificuldadeColors[fonte.dificuldade] ?? dificuldadeColors['Iniciante']

  const handleLink = async () => {
    if (!fonte.link) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Linking.openURL(fonte.link)
  }

  const handleFavourite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onToggleFavourite?.()
  }

  return (
    <View style={styles.card}>
      {/* Type + Difficulty row */}
      <View style={styles.tagsRow}>
        <View style={[styles.badge, styles.badgeInner, { backgroundColor: tipoColor.bg }]}>
          <TipoIcon tipo={tipo} size={10} color={tipoColor.text} />
          <Text style={[styles.badgeText, { color: tipoColor.text }]}>{tipo}</Text>
        </View>
        {fonte.dificuldade ? (
          <View style={[styles.badge, { backgroundColor: difColor.bg }]}>
            <Text style={[styles.badgeText, { color: difColor.text }]}>
              {fonte.dificuldade}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{fonte.titulo}</Text>
      <Text style={styles.author} numberOfLines={1}>{fonte.autor_canal}</Text>

      {/* Why study */}
      {fonte.por_que_estudar ? (
        <Text style={styles.why} numberOfLines={3}>{fonte.por_que_estudar}</Text>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {onToggleFavourite ? (
          <TouchableOpacity
            style={[styles.iconBtn, isFavourite && styles.iconBtnActive]}
            onPress={handleFavourite}
            activeOpacity={0.7}
          >
            <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={16} color={isFavourite ? '#fb7185' : '#4B6070'} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={handleLink}
          activeOpacity={0.8}
        >
          <Text style={styles.linkBtnText}>Acessar conteúdo</Text>
        </TouchableOpacity>

        {tipo === 'livro' && (
          <TouchableOpacity
            style={styles.amazonBtn}
            onPress={() => Linking.openURL(`https://www.amazon.com.br/s?k=${encodeURIComponent(fonte.titulo)}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.amazonBtnText}>Amazon</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    color: '#F0EEE6',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    lineHeight: 20,
  },
  author: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  why: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  linkBtn: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  amazonBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  amazonBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
})
