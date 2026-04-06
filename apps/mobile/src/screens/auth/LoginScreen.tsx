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
  const [isFocused, setIsFocused] = useState(false)
  const color = colors()
  const style = styles(color)


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
      style={style.flex}
    >
      <ScrollView
        contentContainerStyle={style.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={style.logoArea}>
          <Image 
            source={require('../../assets/logo_definitiva_core.png')} // Ajuste o caminho até a pasta da imagem
            style={style.logoImage} 
            resizeMode="contain"
          />
          <Text style={style.logoText}>LeIA</Text>
        </View>

        {/* Card */}
        <View style={style.card}>
          {sent ? (
            /* ── Confirmation state ── */
            <View style={style.sentWrap}>
              <Ionicons name="mail-open-outline" size={48} color={color.accent} style={{ marginBottom: 16 }} />
              <Text style={style.sentTitle}>Link enviado!</Text>
              <Text style={style.sentBody}>
                Enviamos um link de acesso para{'\n'}
                <Text style={style.sentEmail}>{email.trim().toLowerCase()}</Text>
              </Text>
              <TouchableOpacity
                style={style.resendBtn}
                onPress={() => setSent(false)}
                activeOpacity={0.7}
              >
                <Text style={style.resendText}>Usar outro e-mail</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Email input state ── */
            <>
              <View style={style.fieldGroup}>
                <View
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={[style.inputRow, (isFocused) && style.inputRowFocused]}
                >
                  <Ionicons name="mail-outline" size={18} color={color.dimmed} style={style.inputIcon} />
                  <TextInput
                    style={style.inputWithIcon}
                    selectionColor={color.accent}
                    placeholder="seu@email.com"
                    placeholderTextColor={color.dimmed}
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
                style={[style.submitBtn, (!canSubmit || isLoading) && style.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || isLoading}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Ionicons name="send-outline" size={18} color="colors.background" style={{ marginRight: 8 }} />
                      <Text style={style.submitBtnText}>Entrar</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={style.footer}>
          Ao continuar, você concorda com nossos Termos de Uso.
        </Text>
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
    paddingBottom: 80,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 0,
    borderRadius: 16,
    padding: 8,
  },
  logoImage: {
    width: 175,  // Ajuste conforme necessário
    height: 155, // Ajuste conforme necessário
    marginBottom: 32,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: color.accent,
    // color: "#ff4519",
    letterSpacing: 2,
    fontFamily: 'ClashDisplay-Bold',
  },
  logoSub: {
    fontSize: 14,
    color: color.muted,
    marginTop: 6,
  },
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: color.text,
    marginBottom: 8,
    fontFamily: 'ClashDisplay-Semibold',
  },
  cardSub: {
    fontSize: 14,
    color: color.muted,
    lineHeight: 20,
    marginBottom: 24,
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
    borderBottomWidth: 2,
    borderColor: color.border,
  },
  inputRowFocused: {
    borderBottomWidth: 2,
    borderColor: color.accent,
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
    fontFamily: 'ClashDisplay-Medium',
  },
  submitBtn: {
    backgroundColor: color.accent,
    // backgroundColor: "#0094C2",
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
    color: color.background,
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
    color: color.text,
    marginBottom: 12,
    fontFamily: 'ClashDisplay-Semibold',
  },
  sentBody: {
    fontSize: 14,
    color: color.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'ClashDisplay-Medium',
  },
  sentEmail: {
    color: color.text,
    fontWeight: '600',
  },
  sentHint: {
    fontSize: 13,
    color: color.dimmed,
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
    borderColor: color.border,
  },
  resendText: {
    color: color.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'ClashDisplay-Semibold',
  },
  footer: {
    color: color.dimmed,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
    fontFamily: 'ClashDisplay-Medium',
  },
})
