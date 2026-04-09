import { useLocalSearchParams } from 'expo-router'
import BookDetailScreen from '@/src/screens/library/BookDetailScreen'

export default function BookDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <BookDetailScreen id={id} />
}
