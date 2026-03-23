import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'

type Mode = 'login' | 'register'

export default function LoginScreen() {
  const { login, register, loginWithOAuth } = useAuth()
  const router = useRouter()

  const [mode,        setMode]        = useState<Mode>('login')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try {
      await loginWithOAuth(provider)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (!msg.includes('cancelled') && !msg.includes('dismissed')) {
        Alert.alert('Erro', `Não foi possível entrar com ${provider === 'google' ? 'Google' : 'Apple'}.`)
      }
    } finally {
      setOauthLoading(null)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setName('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.')
      return
    }
    if (mode === 'register' && !name.trim()) {
      Alert.alert('Atenção', 'Informe seu nome.')
      return
    }

    setIsLoading(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register(name.trim(), email.trim(), password)
        Alert.alert(
          'Conta criada!',
          'Verifique seu e-mail para confirmar o cadastro, depois faça login.',
          [{ text: 'OK', onPress: () => switchMode('login') }]
        )
        return
      }
      router.replace('/(app)')
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
          <Text style={styles.logoIcon}>🎓</Text>
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
              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#4B6070"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#4B6070"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#4B6070"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
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
            onPress={() => handleOAuth('google')}
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
            onPress={() => handleOAuth('apple')}
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
    backgroundColor: '#131f24',
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
  logoIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F0EEE6',
    letterSpacing: 2,
  },
  logoSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#1B2C33',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#131f24',
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
    backgroundColor: '#0EA5E9',
  },
  tabText: {
    color: '#94A3B8',
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#131f24',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F0EEE6',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#4B6070',
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
    color: '#4B6070',
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
