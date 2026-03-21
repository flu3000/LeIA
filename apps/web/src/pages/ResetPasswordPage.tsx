import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [canReset, setCanReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true)
      }
      if (event === 'USER_UPDATED') {
        navigate('/login?reset=success', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      setError('Não foi possível redefinir a senha. Tente novamente.')
      setLoading(false)
    }
    // On success, onAuthStateChange fires USER_UPDATED and navigates away
  }

  return (
    <div className="min-h-screen bg-brand-secondary flex flex-col items-center justify-center p-4">
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary border border-slate-700 flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-brand-accent" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Redefinir senha</h1>
          <p className="text-sm text-brand-text mt-1">LeIA — Curadoria de conhecimento</p>
        </div>

        <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
          {!canReset ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
              <p className="text-sm text-brand-text text-center">Verificando link de recuperação…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-brand-text mb-1">Escolha uma nova senha para sua conta.</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-text">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    className="w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-text transition-colors"
                    aria-label={showNew ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-text">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-text transition-colors"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
