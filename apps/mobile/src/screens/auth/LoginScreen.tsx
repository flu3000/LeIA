import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert,
} from 'react-native'
import { useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'
import { colors } from '@/src/constants/colors'

// ─── Password Strength ──────────────────────────────────────────────────────

interface PasswordCriteria {
  minLength: boolean
  hasUpper:  boolean
  hasLower:  boolean
  hasNumber: boolean
  hasSpecial: boolean
}

function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength:  password.length >= 8,
    hasUpper:   /[A-Z]/.test(password),
    hasLower:   /[a-z]/.test(password),
    hasNumber:  /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
}

function strengthScore(criteria: PasswordCriteria): number {
  return Object.values(criteria).filter(Boolean).length
}

function strengthColor(score: number): string {
  if (score <= 1) return colors.danger
  if (score <= 2) return '#F97316'   // orange
  if (score <= 3) return colors.warning
  if (score === 4) return '#84CC16'  // lime
  return colors.success
}

function strengthLabel(score: number): string {
  if (score <= 1) return 'Muito fraca'
  if (score <= 2) return 'Fraca'
  if (score <= 3) return 'Razoável'
  if (score === 4) return 'Boa'
  return 'Forte'
}

const CRITERIA_LABELS: { key: keyof PasswordCriteria; label: string }[] = [
  { key: 'minLength',  label: 'Mínimo 8 caracteres'   },
  { key: 'hasUpper',   label: 'Uma letra maiúscula'    },
  { key: 'hasLower',   label: 'Uma letra minúscula'    },
  { key: 'hasNumber',  label: 'Um número'              },
  { key: 'hasSpecial', label: 'Um caractere especial'  },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'login' | 'register'

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login, register, loginWithOAuth, signInWithGoogleNative } = useAuth()
  const router = useRouter()

  const [mode,            setMode]            = useState<Mode>('login')
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading,       setIsLoading]       = useState(false)
  const [oauthLoading,    setOauthLoading]    = useState<'google' | 'apple' | null>(null)
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [showCriteria,    setShowCriteria]    = useState(false)

  // ─── Derived ─────────────────────────────────────────────────────────────
  const criteria   = getPasswordCriteria(password)
  const score      = strengthScore(criteria)
  const isStrong   = score === 5
  const pwMatch    = password === confirmPassword
  const canSubmit  = mode === 'login'
    ? email.trim().length > 0 && password.length > 0
    : name.trim().length > 0 && email.trim().length > 0 && isStrong && pwMatch && confirmPassword.length > 0

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleGoogleNative = async () => {
    setOauthLoading('google')
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await signInWithGoogleNative()
    } catch (err: unknown) {
      // Cancellamento pelo usuário — silencioso
      if (
        err !== null &&
        typeof err === 'object' &&
        'code' in err &&
        (err.code === statusCodes.SIGN_IN_CANCELLED ||
         err.code === statusCodes.IN_PROGRESS)
      ) return

      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      Alert.alert('Erro no login com Google', msg)
    } finally {
      setOauthLoading(null)
    }
  }

  const handleApple = async () => {
    setOauthLoading('apple')
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await loginWithOAuth('apple')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (!msg.includes('cancelled') && !msg.includes('dismissed')) {
        Alert.alert('Erro', 'Não foi possível entrar com Apple.')
      }
    } finally {
      setOauthLoading(null)
    }
  }

  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowCriteria(false)
  }, [])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsLoading(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
        router.replace('/(app)')
      } else {
        await register(name.trim(), email.trim(), password)
        Alert.alert(
          'Conta criada!',
          'Verifique seu e-mail para confirmar o cadastro, depois faça login.',
          [{ text: 'OK', onPress: () => switchMode('login') }]
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      let friendly = msg
      if (msg.includes('Invalid login credentials')) friendly = 'E-mail ou senha incorretos.'
      else if (msg.includes('Email not confirmed'))  friendly = 'Confirme seu e-mail antes de entrar.'
      else if (msg.includes('already registered'))   friendly = 'Este e-mail já está cadastrado.'
      Alert.alert('Erro', friendly)
    } finally {
      setIsLoading(false)
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
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <Ionicons name="school-outline" size={56} color={colors.accent} style={{ marginBottom: 8 }} />
          <Text style={styles.logoText}>LeIA</Text>
          <Text style={styles.logoSub}>Seu Bibliotecário Inteligente</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabs}>
            {(['login', 'register'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => switchMode(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name (register only) */}
          {mode === 'register' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Seu nome completo"
                  placeholderTextColor={colors.dimmed}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="seu@email.com"
                placeholderTextColor={colors.dimmed}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, { paddingRight: 4 }]}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Sua senha'}
                placeholderTextColor={colors.dimmed}
                value={password}
                onChangeText={(t) => { setPassword(t); setShowCriteria(t.length > 0 && mode === 'register') }}
                secureTextEntry={!showPassword}
                returnKeyType={mode === 'login' ? 'done' : 'next'}
                onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.dimmed}
                />
              </TouchableOpacity>
            </View>

            {/* Strength bar + label (register only) */}
            {mode === 'register' && password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  {[1,2,3,4,5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= score ? strengthColor(score) : colors.border },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor(score) }]}>
                  {strengthLabel(score)}
                </Text>
              </View>
            )}

            {/* Criteria checklist (register only) */}
            {mode === 'register' && showCriteria && (
              <View style={styles.criteriaList}>
                {CRITERIA_LABELS.map(({ key, label }) => (
                  <View key={key} style={styles.criteriaRow}>
                    <Ionicons
                      name={criteria[key] ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={criteria[key] ? colors.success : colors.dimmed}
                    />
                    <Text style={[styles.criteriaText, criteria[key] && styles.criteriaTextMet]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={[
                styles.inputRow,
                confirmPassword.length > 0 && (pwMatch ? styles.inputRowOk : styles.inputRowError),
              ]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputWithIcon, { paddingRight: 4 }]}
                  placeholder="Repita a senha"
                  placeholderTextColor={colors.dimmed}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm((v) => !v)}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.dimmed}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && !pwMatch && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={colors.danger} />
                  <Text style={styles.errorText}>As senhas não coincidem.</Text>
                </View>
              )}
            </View>
          )}

          {/* Forgot password link (login only) */}
          {mode === 'login' && (
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || isLoading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Entrar' : 'Criar conta'}
                </Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continue com</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth buttons */}
          <TouchableOpacity
            style={[styles.oauthBtn, styles.oauthGoogle, oauthLoading === 'google' && styles.submitBtnDisabled]}
            onPress={handleGoogleNative}
            disabled={oauthLoading !== null}
            activeOpacity={0.85}
          >
            {oauthLoading === 'google'
              ? <ActivityIndicator color="#131f24" size="small" />
              : <>
                  <Ionicons name="logo-google" size={18} color="#EA4335" style={styles.oauthIcon} />
                  <Text style={styles.oauthGoogleText}>Entrar com Google</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.oauthBtn, styles.oauthApple, oauthLoading === 'apple' && styles.submitBtnDisabled]}
            onPress={handleApple}
            disabled={oauthLoading !== null}
            activeOpacity={0.85}
          >
            {oauthLoading === 'apple'
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="logo-apple" size={20} color="#fff" style={styles.oauthIcon} />
                  <Text style={styles.oauthAppleText}>Entrar com Apple</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Ao continuar, você concorda com nossos Termos de Uso.
        </Text>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 60,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRowOk: {
    borderColor: colors.success,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  inputIcon: {
    marginLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  strengthTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  criteriaList: {
    marginTop: 10,
    gap: 5,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criteriaText: {
    fontSize: 12,
    color: colors.dimmed,
  },
  criteriaTextMet: {
    color: colors.success,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 12,
  },
  forgotText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: colors.dimmed,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: colors.dimmed,
    fontSize: 12,
    fontWeight: '500',
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  oauthIcon: {
    marginRight: 8,
  },
  oauthGoogle: {
    backgroundColor: '#FFFFFF',
  },
  oauthGoogleText: {
    color: '#131f24',
    fontSize: 15,
    fontWeight: '600',
  },
  oauthApple: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  oauthAppleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
})
