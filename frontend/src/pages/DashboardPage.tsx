import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    setLogoutError('')
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setLogoutError('Unable to end your session. Check your connection and try again.')
      setIsLoggingOut(false)
    }
  }

  const roleCards = {
    student: [
      'Profile completion',
      'Recommended roles',
      'Saved jobs',
      'Application tracking',
    ],
    company: [
      'Active job posts',
      'New applicants',
      'Shortlisted candidates',
      'Interviews',
    ],
    admin: [
      'User overview',
      'Company verification',
      'Job approvals',
      'Platform analytics',
    ],
    super_admin: [
      'Platform overview',
      'Administrative access',
      'System configuration',
      'Security oversight',
    ],
  } as const

  return (
    <div className="page-shell dashboard-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">CareerBridge</p>
          <h1>Dashboard</h1>
        </div>
        <div className="dashboard-actions">
          <span className="role-pill">{user.role}</span>
          {user.role === 'student' && (
            <Link className="secondary-btn" to="/profile">
              Edit profile
            </Link>
          )}
          <button className="secondary-btn" type="button" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {logoutError && <div className="status-banner error wide-card">{logoutError}</div>}
        <section className="info-card wide-card">
          <h2>Welcome back, {user.email}</h2>
          <p>
            Your account is ready for the next stage of the CareerBridge experience.
          </p>
        </section>

        {roleCards[user.role].map((item) => (
          <div key={item} className="stat-card">
            <strong>{item}</strong>
            <span>{user.role.toUpperCase()} overview</span>
          </div>
        ))}
      </main>
    </div>
  )
}
