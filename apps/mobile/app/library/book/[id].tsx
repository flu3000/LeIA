import { useLocalSearchParams } from 'expo-router'
import BookDetailScreen from '@/src/screens/library/BookDetailScreen'

export default function BookDetailRoute() {
  console.log('Renderizando BookDetailRoute')
  const { id } = useLocalSearchParams<{ id: string }>()
  console.log('ID do livro:', id)
  return <BookDetailScreen id={id} />
}
