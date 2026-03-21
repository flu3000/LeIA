import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Lock, Mail, Trash2, Loader2, CheckCircle, X, Eye, EyeOff, ShieldCheck, BadgeCheck, AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{children}</p>
    </div>
  )
}

const inputClass = 'w-full bg-brand-secondary border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent transition-colors'
const saveButtonClass = 'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function SettingsPage() {
  const { user, updateProfile, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [state, setState] = useState(user?.state ?? '')
  const [profileSaving, setProfileSaving] = useState(false)

  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatarUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [passSaving, setPassSaving] = useState(false)

  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  if (!user) return null

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { showToast('Selecione uma imagem válida.', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('Imagem deve ter no máximo 5MB.', 'error'); return }

    setAvatarLoading(true)
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) {
      console.error('Erro detalhado no upload do avatar:', uploadError)
      showToast('Erro ao enviar imagem.', 'error')
      setAvatarPreview(user.avatarUrl)
      setAvatarLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    // Append cache-buster so CDN serves the new file even if the path is the same
    const avatarUrl = `${publicUrl}?t=${Date.now()}`
    console.log('[SettingsPage] Avatar avatarUrl gerada:', avatarUrl)

    // Upsert to user_settings — creates row if it doesn't exist yet (source of truth)
    const { error: saveError } = await supabase
      .from('user_settings')
      .upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' })

    console.log('[SettingsPage] upsert avatar_url resultado:', saveError ?? 'OK')

    if (saveError) {
      console.error('Erro ao salvar avatar_url em user_settings:', saveError)
      showToast('Erro ao salvar foto.', 'error')
      setAvatarPreview(user.avatarUrl)
      setAvatarLoading(false)
      return
    }

    await refreshUser()
    showToast('Foto de perfil atualizada!')
    setAvatarLoading(false)
  }

  const handleProfileSave = async () => {
    if (!user) return
    if (!name.trim()) { showToast('Nome não pode ser vazio.', 'error'); return }
    const uname = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    setProfileSaving(true)
    try {
      await updateProfile({ name: name.trim(), username: uname, bio: bio.trim(), city: city.trim(), state: state.trim() })
      showToast('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro detalhado ao salvar perfil:', error)
      const isUsernameTaken = (error as { code?: string }).code === 'USERNAME_TAKEN'
      showToast(
        isUsernameTaken
          ? 'Este nome de usuário já está sendo usado por outro leitor. Escolha outro!'
          : 'Erro ao salvar perfil.',
        'error'
      )
    }
    setProfileSaving(false)
  }

  const handlePasswordSave = async () => {
    if (newPass.length < 6) { showToast('Nova senha deve ter pelo menos 6 caracteres.', 'error'); return }
    if (newPass !== confirmPass) { showToast('As senhas não coincidem.', 'error'); return }
    setPassSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) { showToast('Erro ao alterar senha.', 'error') }
    else { showToast('Senha alterada com sucesso!'); setNewPass(''); setConfirmPass('') }
    setPassSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    await supabase.rpc('delete_user_account').catch(() => null)
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  const initials = user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-brand-primary border-pomodoro-break/40 text-pomodoro-break'
            : 'bg-brand-primary border-pomodoro-focus/40 text-pomodoro-focus'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <X className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-100">Configurações da conta</h1>
      </div>

      {/* Foto de Perfil */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <SectionTitle>Foto de Perfil</SectionTitle>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="relative w-24 h-24 rounded-full group focus:outline-none"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-brand-accent/40" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-accent/20 border-2 border-brand-accent/40 flex items-center justify-center text-2xl font-bold text-brand-accent">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarLoading
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarLoading}
            className="text-xs text-brand-accent hover:text-sky-300 transition-colors disabled:opacity-50"
          >
            Alterar foto
          </button>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <SectionTitle>Informações Pessoais</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Nome</label>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none">@</span>
              <input
                type="text"
                placeholder="seu_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${inputClass} pl-7`}
              />
            </div>
            <p className="text-xs text-slate-500">Apenas letras minúsculas, números e sublinhado (_).</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Bio</label>
            <textarea
              placeholder="Conte um pouco sobre você…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-slate-500 text-right">{bio.length}/160</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-text">Cidade</label>
              <input
                type="text"
                placeholder="Ex: São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-text">Estado</label>
              <input
                type="text"
                placeholder="Ex: SP"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={2}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={profileSaving}
              className={saveButtonClass}
            >
              {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {profileSaving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <SectionTitle icon={ShieldCheck}>Segurança</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Nova Senha</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                autoComplete="new-password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowNewPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-text transition-colors"
                aria-label={showNewPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-text">Confirmar Nova Senha</label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                autoComplete="new-password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-text transition-colors"
                aria-label={showConfirmPass ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasswordSave}
              disabled={passSaving}
              className={saveButtonClass}
            >
              {passSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {passSaving ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </div>
      </div>

      {/* Conta */}
      <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6">
        <SectionTitle>Conta</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-brand-text">E-mail</p>
                <p className="text-sm text-slate-200 truncate">{user.email}</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs text-pomodoro-break bg-pomodoro-break/10 border border-pomodoro-break/20 rounded-full px-2 py-0.5 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5" />
              Verificado
            </span>
          </div>

          <div className="h-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <p className="text-xs text-slate-500 flex-1">Para alterar seu e-mail, entre em contato com o suporte.</p>
          </div>

          <div className="h-px bg-slate-700" />

          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-pomodoro-focus/40 text-pomodoro-focus text-sm hover:bg-pomodoro-focus/10 transition-colors w-fit"
          >
            <Trash2 className="w-4 h-4" />
            Excluir conta
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-primary border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-pomodoro-focus shrink-0" />
              <h2 className="font-semibold text-slate-100">Excluir conta</h2>
            </div>
            <p className="text-sm text-brand-text mb-1">Esta ação é irreversível. Todos os seus dados serão deletados permanentemente.</p>
            <p className="text-sm text-brand-text mb-4">
              Digite <strong className="text-slate-200">excluir</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="excluir"
              className={inputClass}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteInput('') }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteInput !== 'excluir' || deleting}
                onClick={handleDeleteAccount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pomodoro-focus text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
