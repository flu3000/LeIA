import { useLocalSearchParams } from 'expo-router'
import PillarDetailScreen from '@/src/screens/library/PillarDetailScreen'

export default function PillarDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PillarDetailScreen pillarId={id} />
}
