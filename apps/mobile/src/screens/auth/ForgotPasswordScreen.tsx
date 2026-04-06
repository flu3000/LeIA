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
  const color = colors()
  const style = styles(color)

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
      style={style.flex}
    >
      <ScrollView
        contentContainerStyle={style.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={style.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={color.muted} />
          <Text style={style.backText}>Voltar ao login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={style.header}>
          <View style={style.iconWrap}>
            <Ionicons name="lock-open-outline" size={32} color={color.accent} />
          </View>
          <Text style={style.title}>Esqueci a senha</Text>
          <Text style={style.sub}>
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </Text>
        </View>

        {/* Card */}
        <View style={style.card}>
          {status === 'sent' ? (
            <View style={style.successWrap}>
              <Ionicons name="checkmark-circle" size={52} color={color.success} />
              <Text style={style.successTitle}>E-mail enviado!</Text>
              <Text style={style.successSub}>
                Verifique sua caixa de entrada (e spam) para o link de redefinição.
              </Text>
              <TouchableOpacity
                style={[style.btn, { marginTop: 24 }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Text style={style.btnText}>Voltar ao login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={style.fieldGroup}>
                <Text style={style.label}>E-mail</Text>
                <View style={[style.inputRow, status === 'error' && style.inputRowError]}>
                  <Ionicons name="mail-outline" size={18} color={color.dimmed} style={style.inputIcon} />
                  <TextInput
                    style={style.inputWithIcon}
                    placeholder="seu@email.com"
                    placeholderTextColor={color.dimmed}
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
                  <View style={style.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color={color.danger} />
                    <Text style={style.errorText}>{errMsg || 'Não foi possível enviar o e-mail.'}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[style.btn, (!emailValid || status === 'loading') && style.btnDisabled]}
                onPress={handleSend}
                disabled={!emailValid || status === 'loading'}
                activeOpacity={0.85}
              >
                {status === 'loading'
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={style.btnText}>Enviar link de recuperação</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = (color: any) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: color.background,
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
    color: color.muted,
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
    color: color.text,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 14,
    color: color.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: color.border,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: color.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
  },
  inputRowError: {
    borderColor: color.danger,
  },
  inputIcon: {
    marginLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: color.text,
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
    color: color.danger,
    fontSize: 12,
  },
  btn: {
    backgroundColor: color.accent,
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
    color: color.text,
    marginTop: 8,
  },
  successSub: {
    fontSize: 14,
    color: color.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
})
