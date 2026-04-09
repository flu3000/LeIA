import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';

export default function LibraryLayout() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Stack screenOptions={{
        // Define a cor de fundo de TODA a área de transição
        contentStyle: { backgroundColor: theme.background },
        headerTitle: '',
        headerShadowVisible: false, // Remove uma linha fina que às vezes "pisca"
        headerTintColor: theme.text, // Esconde o título do header
        headerStyle: { backgroundColor: theme.background }
    }}>
        {/* index é o seu antigo library.tsx */}
        <Stack.Screen name="index" options={{
            contentStyle: { backgroundColor: theme.background },
            headerShown: false
        }}/>
      
        {/* As sub-páginas herdarão o header acima */}
        <Stack.Screen name="book/[id]" options={{ title: '' }} />
        <Stack.Screen name="pillar/[id]" options={{ title: '' }} />
        <Stack.Screen name="category/[id]" options={{ title: '' }} />
    </Stack>
  );
}