import { useLocalSearchParams } from 'expo-router'
import CategoryDetailScreen from '@/src/screens/library/CategoryDetailScreen'

export default function CategoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <CategoryDetailScreen categoryId={id} />
}
