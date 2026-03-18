import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { BookMarked, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { useAuth, type OAuthProvider } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.24.73 3.01.75.96-.18 1.88-.87 3.14-.93 1.52-.08 2.94.61 3.77 1.8-3.35 2.06-2.77 6.73.59 8.08-.44 1.12-.94 2.22-1.51 3.18zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { user, login, register, loginWithOAuth } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingOAuth, setLoadingOAuth] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Preencha todos os campos.'); return }
    if (mode === 'register' && !name.trim()) { setError('Informe seu nome.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    try {
      mode === 'login'
        ? await login(email, password)
        : await register(name.trim(), email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Ops! Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: OAuthProvider) => {
    setError('')
    setLoadingOAuth(provider)
    try {
      await loginWithOAuth(provider)
      // Supabase redireciona para o provider — o browser sai da página
      // onAuthStateChange cuida da sessão no retorno
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
      setLoadingOAuth(null)
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setName(''); setEmail(''); setPassword('')
  }

  const anyLoading = loading || !!loadingOAuth

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary border border-slate-700 flex items-center justify-center mb-4">
            <BookMarked className="w-7 h-7 text-brand-accent" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Portal do Conhecimento</h1>
          <p className="text-sm text-brand-text mt-1">Seu guia de curadoria com IA</p>
        </div>

        {/* Card */}
        <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-brand-secondary p-1 rounded-xl mb-5">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-brand-text hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 bg-brand-primary hover:bg-slate-700 text-slate-200 font-medium text-sm py-2.5 px-4 rounded-xl border border-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingOAuth === 'google'
                ? <Loader2 className="w-5 h-5 animate-spin text-brand-text" />
                : <GoogleIcon />}
              Continuar com Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 bg-brand-primary hover:bg-slate-700 text-slate-200 font-medium text-sm py-2.5 px-4 rounded-xl border border-slate-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingOAuth === 'apple'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <AppleIcon />}
              Continuar com Apple
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">ou continue com e-mail</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {mode === 'register' && (
              <Input
                label="Nome completo"
                type="text"
                placeholder="Ex: Maria Souza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
              />
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={mode === 'login' ? 'email' : 'off'}
              autoFocus={mode === 'login'}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-text">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pr-11 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-text transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={anyLoading}
              size="lg"
              className="w-full mt-1 rounded-xl justify-center"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
              {loading
                ? (mode === 'login' ? 'Entrando...' : 'Criando conta...')
                : (mode === 'login' ? 'Entrar' : 'Criar minha conta')}
            </Button>
          </form>
        </div>

        {mode === 'login' && (
          <p className="text-center text-xs text-brand-text mt-5">
            Não tem conta?{' '}
            <button
              onClick={() => switchMode('register')}
              className="text-brand-accent hover:text-sky-300 font-medium transition-colors"
            >
              Criar gratuitamente
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
