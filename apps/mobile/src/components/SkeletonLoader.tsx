import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, ViewStyle } from 'react-native'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: '#243640', opacity: anim },
        style,
      ]}
    />
  )
}

export function MessageSkeleton() {
  return (
    <View style={styles.messageSkeletonContainer}>
      {/* Assistant bubble skeleton */}
      <View style={styles.assistantRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={styles.bubbleBlock}>
          <Skeleton height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="80%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={14} />
        </View>
      </View>
      {/* User bubble skeleton */}
      <View style={styles.userRow}>
        <Skeleton width="70%" height={40} borderRadius={16} />
      </View>
      {/* Assistant bubble skeleton 2 */}
      <View style={styles.assistantRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={styles.bubbleBlock}>
          <Skeleton height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  messageSkeletonContainer: {
    padding: 16,
    gap: 16,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  bubbleBlock: {
    flex: 1,
  },
})
