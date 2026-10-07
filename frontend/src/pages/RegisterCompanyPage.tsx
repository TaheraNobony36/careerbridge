import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage, registerCompany } from '../services/api'
import { getRoleHomePath } from '../utils/auth'

const companySchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number'),
  full_name: z.string().min(2, 'Contact name is required'),
  company_name: z.string().min(2, 'Company name is required'),
})

export function RegisterCompanyPage() {
  const { login, isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
  })

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user!.role)} replace />
  }

  if (loading) {
    return <div className="auth-shell" role="status">Restoring your session...</div>
  }

  const onSubmit = async (values: z.infer<typeof companySchema>) => {
    setFormError('')
    setIsSubmitting(true)

    try {
      const response = await registerCompany(values)
      login(response.data)
      navigate(getRoleHomePath(response.data.user.role), { replace: true })
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error, 'Unable to register company right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Company</span>
          <h1>Register your organization</h1>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <label className="field">
            <span>Company name</span>
            <input type="text" placeholder="Your company name" {...register('company_name')} />
            {errors.company_name && <small className="error-text">{errors.company_name.message}</small>}
          </label>

          <label className="field">
            <span>Contact name</span>
            <input type="text" placeholder="Hiring manager name" {...register('full_name')} />
            {errors.full_name && <small className="error-text">{errors.full_name.message}</small>}
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="company@email.com" {...register('email')} />
            {errors.email && <small className="error-text">{errors.email.message}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="Create a secure password" {...register('password')} />
            {errors.password && <small className="error-text">{errors.password.message}</small>}
          </label>

          {formError && <div className="status-banner error">{formError}</div>}

          <button className="primary-btn full-width" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating company account...' : 'Create company account'}
          </button>
        </form>

        <div className="auth-links">
          <span>Already registered?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}
