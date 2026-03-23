import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Ionicons name={name as never} size={size} color={color} />
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   '#0EA5E9',
        tabBarInactiveTintColor: '#4B6070',
        tabBarStyle: {
          backgroundColor: '#1B2C33',
          borderTopColor:  'rgba(255,255,255,0.06)',
          borderTopWidth:  1,
          paddingTop:      6,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 10,
          height:          Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: '600',
          marginTop:  2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync()
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <TabIcon name="chatbubbles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: 'Temas',
          tabBarIcon: ({ color, size }) => <TabIcon name="library" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Salvos',
          tabBarIcon: ({ color, size }) => <TabIcon name="bookmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: 'Foco',
          tabBarIcon: ({ color, size }) => <TabIcon name="timer" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <TabIcon name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
