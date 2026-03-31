import {
  View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Dimensions, TextInput,
} from 'react-native'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { Feather, Ionicons } from '@expo/vector-icons'

import { usePomodoro, type PomodoroMode } from '@/src/hooks/usePomodoro'
import { usePomodoroSettings } from '@/src/hooks/usePomodoroSettings'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const RING_SIZE   = Math.min(SCREEN_WIDTH * 0.65, 240)
const RADIUS      = (RING_SIZE / 2) - 10
const STROKE      = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function DurationStepper({
  label,
  icon,
  value,
  onChange,
  min = 1,
  max = 90,
  unit = 'min',
}: {
  label: string
  icon: React.ReactNode
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  unit?: string
}) {
  const [raw, setRaw] = useState(String(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setRaw(String(value))
  }, [value, editing])

  const commit = () => {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed)
    } else {
      setRaw(String(value))
    }
    setEditing(false)
  }

  return (
    <View style={styles.stepper}>
      <View style={styles.stepperLabelWrap}>
        {icon}
        <Text style={styles.stepperLabel}>{label}</Text>
      </View>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
          onPress={() => { if (value > min) onChange(value - 1) }}
          activeOpacity={0.7}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.stepperInputWrap}>
          <TextInput
            style={styles.stepperInput}
            value={raw}
            onChangeText={setRaw}
            onFocus={() => setEditing(true)}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="number-pad"
            maxLength={3}
            selectTextOnFocus
          />
          {unit ? <Text style={styles.stepperUnit}>{unit}</Text> : null}
        </View>
        <TouchableOpacity
          style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
          onPress={() => { if (value < max) onChange(value + 1) }}
          activeOpacity={0.7}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function PomodoroScreen() {
  const { stats, saveStatus, saveDurations, saveDailyGoal, completeSession, isLoadingSettings } = usePomodoroSettings()

  const handleFocusComplete = useCallback(async (data: { durationMinutes: number; maintainedFocus: boolean }) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await completeSession(data)
    setShowCompleteModal(true)
  }, [completeSession])

  const {
    mode, durations, minutes, seconds, isRunning, sessions, progress,
    focusInterrupted,
    start, pause, reset, switchMode, setDuration, loadDurations, dismissInterrupted,
  } = usePomodoro(handleFocusComplete)

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [switcherWidth, setSwitcherWidth] = useState(0)
  const indicatorX = useSharedValue(0)

  const tabWidth = switcherWidth > 0 ? (switcherWidth - 8) / 2 : 0
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  const isFocus      = mode === 'focus'
  const accentColor  = isFocus ? '#E11D48' : '#10B981'
  const pad          = (n: number) => String(n).padStart(2, '0')

  const handleToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (isRunning) pause()
    else start()
  }

  const handleReset = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    reset()
  }

  const handleSwitch = async (m: PomodoroMode) => {
    if (m === mode) return
    await Haptics.selectionAsync()
    indicatorX.value = withTiming(m === 'focus' ? 0 : tabWidth, { duration: 200, easing: Easing.out(Easing.quad) })
    switchMode(m)
  }

  const handleDurationChange = (m: PomodoroMode, v: number) => {
    setDuration(m, v)
    saveDurations({ ...durations, [m]: v })
  }

  // Goal celebration toast
  const goalJustReached = stats.goalJustReached

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Mode switcher */}
        <View
          style={styles.modeSwitcher}
          onLayout={(e) => setSwitcherWidth(e.nativeEvent.layout.width)}
        >
          {switcherWidth > 0 && (
            <Reanimated.View
              style={[styles.modeIndicator, indicatorStyle, { width: tabWidth, backgroundColor: accentColor }]}
            />
          )}
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => handleSwitch('focus')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeTabText, isFocus && styles.modeTabTextActive]}>
              Foco
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modeTab}
            onPress={() => handleSwitch('break')}
            activeOpacity={0.7}
          >
            <Text style={[styles.modeTabText, !isFocus && styles.modeTabTextActive]}>
              Pausa
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.header}>
          {stats.streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame-outline" size={14} color="#fbbf24" />
              <Text style={styles.streakText}> {stats.streak}</Text>
            </View>
          )}
        </View>

        {/* SVG Ring */}
        <View style={styles.ringContainer}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          >
            {/* Background track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="#1B2C33"
              strokeWidth={STROKE}
              fill="none"
            />
            {/* Progress arc */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={accentColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>

          {/* Timer inside ring */}
          <View style={[styles.timerOverlay, { width: RING_SIZE, height: RING_SIZE }]}>
            <Text style={[styles.timerText, { color: accentColor }]}>
              {pad(minutes)}:{pad(seconds)}
            </Text>
            <View style={styles.timerModeRow}>
              {isFocus ? <Feather name="target" size={14} color="#94A3B8" /> : <Feather name="coffee" size={14} color="#94A3B8" />}
              <Text style={styles.timerMode}>{isFocus ? ' Foco' : ' Pausa'}</Text>
            </View>
            {sessions > 0 && (
              <Text style={styles.sessionsText}>{sessions} sessões hoje</Text>
            )}
          </View>
        </View>

        {/* Interrupted warning */}
        {focusInterrupted && (
          <TouchableOpacity style={styles.warningBanner} onPress={dismissInterrupted}>
            <View style={styles.warningRow}>
              <Feather name="alert-triangle" size={14} color="#fbbf24" />
              <Text style={styles.warningText}> Foco interrompido — o app foi para segundo plano</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accentColor }]}
            onPress={handleToggle}
            activeOpacity={0.85}
          >
            {isRunning ? <Feather name="pause" size={28} color="#fff" /> : <Feather name="play" size={28} color="#fff" />}
          </TouchableOpacity>

          <View style={styles.resetBtn} />
        </View>

        {/* Session progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Sessões hoje: {stats.sessionsToday} / {stats.dailyGoal}
            </Text>
            {saveStatus === 'saving' && <Text style={styles.saveStatus}>Salvando...</Text>}
            {saveStatus === 'saved'  && (
              <View style={styles.saveStatusRow}>
                <Feather name="check" size={12} color="#10B981" />
                <Text style={[styles.saveStatus, { color: '#10B981' }]}> Salvo</Text>
              </View>
            )}
          </View>
          <View style={styles.progressBar}>
            {Array.from({ length: stats.dailyGoal }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  { backgroundColor: i < stats.sessionsToday ? accentColor : '#243640' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Duration settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Durações</Text>
          <DurationStepper
            label="Foco"
            icon={<Ionicons name="timer-outline" size={14} color="#94A3B8" />}
            value={durations.focus}
            onChange={(v) => handleDurationChange('focus', v)}
            min={5}
          />
          <DurationStepper
            label="Pausa"
            icon={<Feather name="coffee" size={14} color="#94A3B8" />}
            value={durations.break}
            onChange={(v) => handleDurationChange('break', v)}
          />
          <DurationStepper
            label="Meta diária"
            icon={<Feather name="target" size={14} color="#94A3B8" />}
            value={stats.dailyGoal}
            onChange={saveDailyGoal}
            max={20}
            unit=""
          />
        </View>
      </ScrollView>

      {/* Session complete modal */}
      <Modal transparent animationType="fade" visible={showCompleteModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="sparkles-outline" size={48} color="#0EA5E9" style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Sessão completa!</Text>
            <Text style={styles.modalBody}>
              Ótimo trabalho! Você completou {stats.sessionsToday} de {stats.dailyGoal} sessões hoje.
            </Text>
            {stats.streak > 1 && (
              <View style={styles.modalStreakRow}>
                <Ionicons name="flame-outline" size={16} color="#fbbf24" />
                <Text style={styles.modalStreakText}> Sequência de {stats.streak} dias!</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowCompleteModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal reached toast */}
      {goalJustReached && (
        <View style={styles.goalToast}>
          <View style={styles.goalToastRow}>
            <Ionicons name="trophy-outline" size={16} color="#fbbf24" />
            <Text style={styles.goalToastText}> Meta diária atingida! {stats.dailyGoal} sessões completadas!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131f24',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: '#F0EEE6',
    fontSize: 24,
    fontWeight: '800',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  streakText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1B2C33',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  modeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 9,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
    zIndex: 1,
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#fff',
  },
  ringContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  timerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timerMode: {
    color: '#94A3B8',
    fontSize: 14,
  },
  sessionsText: {
    color: '#4B6070',
    fontSize: 12,
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  resetBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B2C33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  saveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  saveStatus: {
    color: '#94A3B8',
    fontSize: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  settingsSection: {
    backgroundColor: '#1B2C33',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  settingsTitle: {
    color: '#F0EEE6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  stepperLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#243640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepBtnText: {
    color: '#F0EEE6',
    fontSize: 18,
    fontWeight: '700',
  },
  stepperInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 52,
    justifyContent: 'center',
  },
  stepperInput: {
    color: '#F0EEE6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 28,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  stepperUnit: {
    color: '#64748B',
    fontSize: 13,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1B2C33',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: '#F0EEE6',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalBody: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalStreakText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Goal toast
  goalToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1B2C33',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  goalToastRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalToastText: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
})
