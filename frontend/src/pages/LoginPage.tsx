import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage, loginUser } from '../services/api'
import { getRoleHomePath } from '../utils/auth'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function LoginPage() {
  const { login, isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user!.role)} replace />
  }

  if (loading) {
    return <div className="auth-shell" role="status">Restoring your session...</div>
  }

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setFormError('')
    setIsSubmitting(true)

    try {
      const response = await loginUser(values)
      login(response.data)
      navigate(getRoleHomePath(response.data.user.role), { replace: true })
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Unable to sign in right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to CareerBridge</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="name@email.com" {...register('email')} />
            {errors.email && <small className="error-text">{errors.email.message}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="Enter your password" {...register('password')} />
            {errors.password && <small className="error-text">{errors.password.message}</small>}
          </label>

          {formError && <div className="status-banner error">{formError}</div>}

          <button className="primary-btn full-width" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <div className="auth-links">
          <span>New here?</span>
          <Link to="/register/student">Create student account</Link>
        </div>

        <div className="auth-links secondary-links">
          <Link to="/register/company">Register as company</Link>
          <Link to="/">Back home</Link>
        </div>
      </div>
    </div>
  )
}
