import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Switch, Alert,
} from 'react-native'
import { useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'
import { colors } from '@/src/constants/colors'

const TOTAL_STEPS = 3

type ThemeOption = 'dark' | 'light' | 'system'

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: string }[] = [
  { value: 'dark',   label: 'Escuro',  icon: 'moon-outline'        },
  { value: 'light',  label: 'Claro',   icon: 'sunny-outline'       },
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
]

export default function OnboardingScreen() {
  const { updateProfile, logout } = useAuth()
  const router = useRouter()

  const [step,      setStep]      = useState(1)
  const [saving,    setSaving]    = useState(false)

  // Step 1 — Identidade
  const [username,  setUsername]  = useState('')
  const [bio,       setBio]       = useState('')

  // Step 2 — Localização & Privacidade
  const [city,      setCity]      = useState('')
  const [state,     setState]     = useState('')
  const [country,   setCountry]   = useState('')
  const [isPublic,  setIsPublic]  = useState(true)

  // Step 3 — Preferências
  const [theme,     setTheme]     = useState<ThemeOption>('dark')

  const usernameInputRef = useRef<TextInput>(null)

  // ─── Validação ────────────────────────────────────────────────────────────
  const usernameClean = username.toLowerCase().replace(/\s/g, '').trim()
  const usernameValid = /^[a-z0-9_.]{3,20}$/.test(usernameClean)

  function canAdvance(): boolean {
    if (step === 1) return usernameValid
    return true
  }

  // ─── Navegação entre steps ────────────────────────────────────────────────
  async function handleNext() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }
    await handleSave()
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  // ─── Salvar perfil ────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        username: usernameClean,
        bio:      bio.trim() || undefined,
        city:     city.trim() || undefined,
        state:    state.trim() || undefined,
        country:  country.trim() || undefined,
        isPublic,
        theme,
      })
      // _layout.tsx vai detectar hasCompletedProfile = true e redirecionar
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg === 'USERNAME_TAKEN') {
        Alert.alert('Nome de usuário indisponível', 'Escolha outro username e tente novamente.')
        setStep(1)
      } else {
        Alert.alert('Erro', msg)
      }
    } finally {
      setSaving(false)
    }
  }

  // ─── Conteúdo por step ───────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1: return (
        <View>
          <Text style={styles.stepTitle}>Sua identidade</Text>
          <Text style={styles.stepSub}>Como a comunidade vai te conhecer?</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputRow}>
              <Ionicons name="at-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
              <TextInput
                ref={usernameInputRef}
                style={styles.inputWithIcon}
                placeholder="seu_username"
                placeholderTextColor={colors.dimmed}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {username.length > 0 && (
                <Ionicons
                  name={usernameValid ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={usernameValid ? colors.success : colors.danger}
                  style={{ marginRight: 14 }}
                />
              )}
            </View>
            <Text style={styles.hint}>3–20 caracteres: letras, números, _ e .</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bio</Text>
            <View style={styles.inputRow}>
              <Ionicons name="pencil-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, styles.bioInput]}
                placeholder="Escreva algo sobre você..."
                placeholderTextColor={colors.dimmed}
                value={bio}
                onChangeText={(t) => { if (t.length <= 160) setBio(t) }}
                multiline
                numberOfLines={3}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.hint}>{bio.length}/160</Text>
          </View>
        </View>
      )

      case 2: return (
        <View>
          <Text style={styles.stepTitle}>Localização</Text>
          <Text style={styles.stepSub}>Opcional — aparece no seu perfil público.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Cidade</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="São Paulo"
                placeholderTextColor={colors.dimmed}
                value={city}
                onChangeText={setCity}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={styles.input}
                placeholder="SP"
                placeholderTextColor={colors.dimmed}
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 2 }]}>
              <Text style={styles.label}>País</Text>
              <TextInput
                style={styles.input}
                placeholder="Brasil"
                placeholderTextColor={colors.dimmed}
                value={country}
                onChangeText={setCountry}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Perfil público</Text>
              <Text style={styles.hint}>Outros usuários podem ver seu progresso</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: colors.dimmed, true: colors.accentDim }}
              thumbColor={isPublic ? colors.accent : colors.muted}
            />
          </View>
        </View>
      )

      case 3: return (
        <View>
          <Text style={styles.stepTitle}>Tema preferido</Text>
          <Text style={styles.stepSub}>Pode ser alterado nas configurações a qualquer momento.</Text>

          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.themeOption, theme === opt.value && styles.themeOptionActive]}
              onPress={() => setTheme(opt.value)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt.icon as any}
                size={22}
                color={theme === opt.value ? colors.accent : colors.muted}
              />
              <Text style={[styles.themeLabel, theme === opt.value && styles.themeLabelActive]}>
                {opt.label}
              </Text>
              {theme === opt.value && (
                <Ionicons name="checkmark" size={18} color={colors.accent} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="school-outline" size={36} color={colors.accent} />
          <Text style={styles.headerTitle}>Configurar perfil</Text>
          <Text style={styles.headerSub}>Passo {step} de {TOTAL_STEPS}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {renderStep()}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="arrow-back" size={18} color={colors.muted} />
              <Text style={styles.backBtnText}>Voltar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backBtn} onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              logout()
            }}>
              <Ionicons name="log-out-outline" size={18} color={colors.dimmed} />
              <Text style={[styles.backBtnText, { color: colors.dimmed }]}>Sair</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, (!canAdvance() || saving) && styles.btnDisabled]}
            onPress={handleNext}
            disabled={!canAdvance() || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.nextBtnText}>
                    {step === TOTAL_STEPS ? 'Concluir' : 'Próximo'}
                  </Text>
                  {step < TOTAL_STEPS && (
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                  )}
                </>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 13,
    color: colors.muted,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 24,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 2,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.dimmed,
    marginTop: 4,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeOptionActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(14,165,233,0.08)',
  },
  themeLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.muted,
  },
  themeLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  backBtnText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
