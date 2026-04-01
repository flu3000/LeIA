import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, Alert, Image
} from 'react-native'
import { useState } from 'react'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'
import { colors } from '@/src/constants/colors'

export default function LoginScreen() {
  const { signInWithEmail } = useAuth()

  const [email,     setEmail]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent,      setSent]      = useState(false)

  const canSubmit = email.trim().length > 0 && email.includes('@')

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return
    setIsLoading(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      await signInWithEmail(email.trim().toLowerCase())
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      Alert.alert('Erro', msg)
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
          <Image 
            source={require('../../assets/logo_login.png')} // Ajuste o caminho até a pasta da imagem
            style={styles.logoImage} 
            resizeMode="contain"
          />
          <Text style={styles.logoText}>LeIA</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {sent ? (
            /* ── Confirmation state ── */
            <View style={styles.sentWrap}>
              <Ionicons name="mail-open-outline" size={48} color={colors.accent} style={{ marginBottom: 16 }} />
              <Text style={styles.sentTitle}>Link enviado!</Text>
              <Text style={styles.sentBody}>
                Enviamos um link de acesso para{'\n'}
                <Text style={styles.sentEmail}>{email.trim().toLowerCase()}</Text>
              </Text>
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={() => setSent(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Usar outro e-mail</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Email input state ── */
            <>
              <Text style={styles.cardTitle}>Entrar</Text>
              <View style={styles.fieldGroup}>
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
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (!canSubmit || isLoading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="send-outline" size={18} color="#EAE0C8" style={{ marginRight: 8 }} />
                      <Text style={styles.submitBtnText}>Receber Link de Acesso</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

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
  logoImage: {
    width: 109,  // Ajuste conforme necessário
    height: 129, // Ajuste conforme necessário
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
    fontFamily: 'ClashDisplay-Bold',
  },
  logoSub: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 6,
  },
  card: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'ClashDisplay-Semibold',
  },
  cardSub: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 24,
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
  inputIcon: {
    marginLeft: 14,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: 'ClashDisplay-Medium',
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#EAE0C8',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'ClashDisplay-Semibold',
  },
  /* Sent state */
  sentWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    fontFamily: 'ClashDisplay-Semibold',
  },
  sentBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'ClashDisplay-Medium',
  },
  sentEmail: {
    color: colors.text,
    fontWeight: '600',
  },
  sentHint: {
    fontSize: 13,
    color: colors.dimmed,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    fontFamily: 'ClashDisplay-Medium',
  },
  resendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resendText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'ClashDisplay-Semibold',
  },
  footer: {
    color: colors.dimmed,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
    fontFamily: 'ClashDisplay-Medium',
  },
})
