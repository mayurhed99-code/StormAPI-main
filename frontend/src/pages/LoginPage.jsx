import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Zap, CheckCircle } from 'lucide-react'
import { authApi } from '../api/client.js'
import { setCredentials } from '../store/authSlice.js'
import { Button, Input, Alert } from '../components/ui.jsx'

export default function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(data.email, data.password)
      dispatch(setCredentials(res.data))
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Sign In" subtitle="Welcome back">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          register={register('email', { required: 'Email is required' })}
          error={errors.email?.message}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          register={register('password', { required: 'Password is required' })}
          error={errors.password?.message}
        />
        <Alert message={error} />
        <Button type="submit" fullWidth loading={loading} size="lg">
          Continue
        </Button>
      </form>
      
      <SocialAuth />

      <p className="text-center text-sm text-[var(--text-2)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[var(--accent)] hover:underline font-medium">Register</Link>
      </p>
    </AuthShell>
  )
}

export function SocialAuth() {
  return (
    <div className="mt-6">
      <div className="relative flex items-center py-4">
        <div className="flex-grow border-t border-[var(--border-2)]"></div>
        <span className="flex-shrink-0 mx-4 text-[var(--text-3)] text-xs font-semibold uppercase tracking-wider">OR</span>
        <div className="flex-grow border-t border-[var(--border-2)]"></div>
      </div>
      <div className="flex flex-col gap-3">
        <button
          disabled
          title="Coming in the next release"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[var(--border-2)] bg-[var(--bg)] text-[var(--text)] text-sm font-medium opacity-50 cursor-not-allowed transition-colors hover:bg-[var(--surface-2)]"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        <button
          disabled
          title="Coming in the next release"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[var(--border-2)] bg-[var(--bg)] text-[var(--text)] text-sm font-medium opacity-50 cursor-not-allowed transition-colors hover:bg-[var(--surface-2)]"
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}

export function AuthShell({ title, subtitle, children }) {
  const features = [
    'Java Virtual Threads',
    'WebSocket Live Metrics',
    'Redis Streaming',
    'JWT Authentication',
    'Docker Microservices',
    'Nginx Reverse Proxy',
    'MySQL + Flyway'
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Left Branding Panel (Hidden on mobile) */}
      <div className="hidden md:flex w-[45%] flex-col justify-center px-12 lg:px-20 border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={32} className="text-[var(--accent)]" />
          <span className="font-bold text-3xl tracking-tight text-[var(--text)]">
            Storm<span className="text-[var(--accent)]">API</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-[var(--text)]">Concurrent HTTP Load Testing Platform</h1>
        <p className="text-[var(--text-2)] mb-10 leading-relaxed text-base">
          Run high-concurrency HTTP load tests using Java Virtual Threads, Redis streaming, WebSocket metrics and Docker microservices.
        </p>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[var(--text-3)] uppercase tracking-wider mb-3">Live Features</div>
          {features.map(feature => (
            <div key={feature} className="flex items-center gap-3">
              <CheckCircle size={18} className="text-[var(--success)]" />
              <span className="text-[var(--text)] font-medium text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-center gap-2 mb-8 md:hidden">
            <Zap size={28} className="text-[var(--accent)]" />
            <span className="font-bold text-2xl tracking-tight text-[var(--text)]">
              Storm<span className="text-[var(--accent)]">API</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1 text-center text-[var(--text)]">{title}</h1>
          <p className="text-sm text-[var(--text-2)] mb-8 text-center">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
