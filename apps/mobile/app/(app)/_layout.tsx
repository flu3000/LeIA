import { Tabs } from 'expo-router'
import { Platform, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors } from '@/src/constants/colors'

// ── Paleta dopaminérgica ──────────────────────────────────────────────────────

const C = {
  chat:    '#00D1FF',  // Ciano Elétrico
  library: '#00DB80',  // Verde Esmeralda
  social:  '#E7FF21',  // Amarelo Lima/Neon
  focus:   '#FF9F1C',  // Laranja Vibrante
  profile: '#FF00FF',  // Magenta
} as const

// ── Ícone da aba ──────────────────────────────────────────────────────────────

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name']
  color: string
  size: number
  focused: boolean
}) {
  return (
    <View style={[
      styles.iconWrap,
      focused && { backgroundColor: color + '1A', borderColor: color + '55', borderWidth: 1 },
    ]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AppLayout() {
  const color = colors()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: color.background,
          borderTopColor:  'rgba(255,255,255,0.06)',
          borderTopWidth:  1,
          paddingTop:      6,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 10,
          height:          Platform.OS === 'ios' ? 84 : 64,
        },
      }}
      screenListeners={{
        // tabPress: () => Haptics.selectionAsync(),
        tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarActiveTintColor:   C.chat,
          tabBarInactiveTintColor: C.chat,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon name="chatbubbles" color={C.chat} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="topics"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarActiveTintColor:   C.library,
          tabBarInactiveTintColor: C.library,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon name="library" color={C.library} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarActiveTintColor:   C.social,
          tabBarInactiveTintColor: C.social,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon name="people" color={C.social} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'Foco',
          tabBarActiveTintColor:   C.focus,
          tabBarInactiveTintColor: C.focus,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon name="timer" color={C.focus} size={size} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarActiveTintColor:   C.profile,
          tabBarInactiveTintColor: C.profile,
          tabBarIcon: ({ size, focused }) => (
            <TabIcon name="person" color={C.profile} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
