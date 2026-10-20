import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/client.js'
import { setCredentials } from '../store/authSlice.js'
import { Button, Input, Alert } from '../components/ui.jsx'
import { AuthShell, SocialAuth } from './LoginPage.jsx'

export default function RegisterPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(data.email, data.password)
      dispatch(setCredentials(res.data))
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Start load testing in seconds">
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
          placeholder="At least 8 characters"
          register={register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Minimum 8 characters' },
          })}
          error={errors.password?.message}
        />
        <Input
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          register={register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (v) => v === watch('password') || 'Passwords do not match',
          })}
          error={errors.confirmPassword?.message}
        />
        <Alert message={error} />
        <Button type="submit" fullWidth loading={loading} size="lg">
          Create account
        </Button>
      </form>
      
      <SocialAuth />

      <p className="text-center text-sm text-[var(--text-2)] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">Sign in</Link>
      </p>
    </AuthShell>
  )
}
