import { useLocalSearchParams } from 'expo-router'
import BookDetailScreen from '@/src/screens/library/BookDetailScreen'

export default function BookDetailRoute() {
  const { id, matchedBy } = useLocalSearchParams<{ id: string; matchedBy?: string }>()
  return <BookDetailScreen id={id} matchedBy={matchedBy} />
}
