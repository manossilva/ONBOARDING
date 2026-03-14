import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import ReCAPTCHA from 'react-google-recaptcha'
import { CheckSquare, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

interface LoginForm {
  email: string
  password: string
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [captchaDone, setCaptchaDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    if (!captchaDone) {
      setAuthError('Por favor, confirme que você não é um robô.')
      return
    }
    setLoading(true)
    setAuthError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError('Email ou senha incorretos. Tente novamente.')
      recaptchaRef.current?.reset()
      setCaptchaDone(false)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-600/30">
            <CheckSquare size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão Interna</h1>
          <p className="text-zinc-500 text-sm mt-1">Sistema de gestão empresarial</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
              })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-300">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full bg-zinc-800 border ${errors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-3 py-2 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm`}
                  {...register('password', { required: 'Senha é obrigatória' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {RECAPTCHA_SITE_KEY && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaDone(!!token)}
                  onExpired={() => setCaptchaDone(false)}
                  theme="dark"
                />
              </div>
            )}

            {authError && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              disabled={!!RECAPTCHA_SITE_KEY && !captchaDone}
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Acesso restrito a usuários autorizados
        </p>
      </div>
    </div>
  )
}
