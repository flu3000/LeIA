import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '@/src/constants/colors'

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>LeIA</Text>
      <ActivityIndicator
        size="small"
        color={colors.accent}
        style={styles.spinner}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logo: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 4,
  },
  spinner: {
    opacity: 0.6,
  },
})
