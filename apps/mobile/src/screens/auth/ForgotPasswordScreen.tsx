import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/src/lib/supabase'
import { colors } from '@/src/constants/colors'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [status,  setStatus]  = useState<State>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  const emailTrimmed = email.trim()
  const emailValid   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)

  async function handleSend() {
    if (!emailValid) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setStatus('loading')
    setErrMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
      redirectTo: 'leia-app://reset-password',
    })

    if (error) {
      setErrMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
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
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.muted} />
          <Text style={styles.backText}>Voltar ao login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={32} color={colors.accent} />
          </View>
          <Text style={styles.title}>Esqueci a senha</Text>
          <Text style={styles.sub}>
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {status === 'sent' ? (
            <View style={styles.successWrap}>
              <Ionicons name="checkmark-circle" size={52} color={colors.success} />
              <Text style={styles.successTitle}>E-mail enviado!</Text>
              <Text style={styles.successSub}>
                Verifique sua caixa de entrada (e spam) para o link de redefinição.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { marginTop: 24 }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>
                <View style={[styles.inputRow, status === 'error' && styles.inputRowError]}>
                  <Ionicons name="mail-outline" size={18} color={colors.dimmed} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="seu@email.com"
                    placeholderTextColor={colors.dimmed}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setStatus('idle'); setErrMsg('') }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    editable={status !== 'loading'}
                  />
                </View>
                {status === 'error' && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
                    <Text style={styles.errorText}>{errMsg || 'Não foi possível enviar o e-mail.'}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.btn, (!emailValid || status === 'loading') && styles.btnDisabled]}
                onPress={handleSend}
                disabled={!emailValid || status === 'loading'}
                activeOpacity={0.85}
              >
                {status === 'loading'
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Enviar link de recuperação</Text>
                }
              </TouchableOpacity>
            </>
          )}
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  backText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(14,165,233,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldGroup: {
    marginBottom: 20,
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
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 2,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  successSub: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
