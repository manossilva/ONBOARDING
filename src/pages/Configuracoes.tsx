import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, Save, Key, User, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

interface ProfileForm {
  name: string
  company_name: string
}

interface PasswordForm {
  new_password: string
  confirm_password: string
}

export default function Configuracoes() {
  const { profile } = useAuth()
  const { updateProfile, uploadPhoto, uploading, changePassword } = useProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const profileForm = useForm<ProfileForm>({
    values: {
      name: profile?.name || '',
      company_name: profile?.company_name || 'Gestão Interna',
    },
  })

  const passwordForm = useForm<PasswordForm>()

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg('')
    setTimeout(() => setErrorMsg(''), 4000)
  }

  const onSubmitProfile = async (data: ProfileForm) => {
    setProfileSaving(true)
    const { error } = await updateProfile({ name: data.name, company_name: data.company_name })
    if (error) {
      showError('Erro ao salvar perfil.')
    } else {
      // Update company settings table too
      await supabase.from('company_settings').upsert({ id: 1, company_name: data.company_name, updated_at: new Date().toISOString() })
      showSuccess('Perfil atualizado com sucesso!')
    }
    setProfileSaving(false)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const { url, error } = await uploadPhoto(file)
    if (error) {
      showError('Erro ao fazer upload da foto.')
    } else if (url) {
      await updateProfile({ photo_url: url })
      showSuccess('Foto atualizada!')
    }
  }

  const onSubmitPassword = async (data: PasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      showError('As senhas não coincidem.')
      return
    }
    if (data.new_password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setPasswordSaving(true)
    const { error } = await changePassword(data.new_password)
    if (error) {
      showError('Erro ao alterar senha.')
    } else {
      showSuccess('Senha alterada com sucesso!')
      passwordForm.reset()
    }
    setPasswordSaving(false)
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">Gerencie seu perfil e preferências</p>
      </div>

      {/* Success/Error messages */}
      {successMsg && (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-3">
          <p className="text-green-400 text-sm">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User size={18} className="text-purple-400" />
          <h2 className="text-white font-semibold">Perfil</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {profile?.photo_url ? (
              <img
                src={profile.photo_url}
                alt={profile.name || 'Avatar'}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-600/50"
              />
            ) : (
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              {uploading ? (
                <div className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <p className="text-white font-medium">{profile?.name || 'Sem nome'}</p>
            <p className="text-zinc-500 text-sm capitalize">{profile?.role}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-400 hover:text-purple-300 text-xs mt-1 transition-colors"
            >
              Alterar foto
            </button>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Seu nome"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register('name', { required: 'Nome é obrigatório' })}
          />

          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-zinc-400" />
            <span className="text-zinc-300 text-sm font-medium">Empresa</span>
          </div>
          <Input
            label="Nome da Empresa"
            placeholder="Nome da empresa"
            {...profileForm.register('company_name')}
          />

          <div className="pt-2">
            <Button type="submit" loading={profileSaving}>
              <Save size={16} /> Salvar Perfil
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Section */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Key size={18} className="text-amber-400" />
          <h2 className="text-white font-semibold">Alterar Senha</h2>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={passwordForm.formState.errors.new_password?.message}
            {...passwordForm.register('new_password', {
              required: 'Obrigatório',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />
          <Input
            label="Confirmar Nova Senha"
            type="password"
            placeholder="Repita a nova senha"
            error={passwordForm.formState.errors.confirm_password?.message}
            {...passwordForm.register('confirm_password', { required: 'Obrigatório' })}
          />
          <div className="pt-2">
            <Button type="submit" variant="secondary" loading={passwordSaving}>
              <Key size={16} /> Alterar Senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
