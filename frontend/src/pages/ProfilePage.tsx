import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getStudentProfile, saveStudentProfile } from '../services/api'

interface ProfileFormState {
  full_name: string
  headline: string
  bio: string
  university: string
  graduation_year: string
  skills: string
  location: string
  portfolio_url: string
  linkedin_url: string
  github_url: string
}

const emptyProfile: ProfileFormState = {
  full_name: '',
  headline: '',
  bio: '',
  university: '',
  graduation_year: '',
  skills: '',
  location: '',
  portfolio_url: '',
  linkedin_url: '',
  github_url: '',
}

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProfileFormState>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'student') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await getStudentProfile()
        setForm({
          full_name: data.full_name ?? '',
          headline: data.headline ?? '',
          bio: data.bio ?? '',
          university: data.university ?? '',
          graduation_year: data.graduation_year ? String(data.graduation_year) : '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          location: data.location ?? '',
          portfolio_url: data.portfolio_url ?? '',
          linkedin_url: data.linkedin_url ?? '',
          github_url: data.github_url ?? '',
        })
      } catch (err) {
        if ((err as { response?: { status?: number } }).response?.status !== 404) {
          setError('Unable to load your profile right now. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        full_name: form.full_name.trim() || undefined,
        headline: form.headline.trim() || undefined,
        bio: form.bio.trim() || undefined,
        university: form.university.trim() || undefined,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : undefined,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        location: form.location.trim() || undefined,
        portfolio_url: form.portfolio_url.trim() || undefined,
        linkedin_url: form.linkedin_url.trim() || undefined,
        github_url: form.github_url.trim() || undefined,
      }

      const { data } = await saveStudentProfile(payload)
      setForm({
        full_name: data.full_name ?? '',
        headline: data.headline ?? '',
        bio: data.bio ?? '',
        university: data.university ?? '',
        graduation_year: data.graduation_year ? String(data.graduation_year) : '',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
        location: data.location ?? '',
        portfolio_url: data.portfolio_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        github_url: data.github_url ?? '',
      })
      setSuccess('Profile saved successfully.')
    } catch (err) {
      setError('Something went wrong while saving your profile. Please try again.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page-shell profile-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">CareerBridge</p>
          <h1>Student profile</h1>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-btn" to="/dashboard">
            Back to dashboard
          </Link>
          <button className="secondary-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="profile-card">
        <div className="profile-header">
          <div>
            <p className="eyebrow">Profile setup</p>
            <h2>{user.email}</h2>
          </div>
        </div>

        {loading ? (
          <p className="status-banner">Loading profile...</p>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            {error && <div className="status-banner error">{error}</div>}
            {success && <div className="status-banner success">{success}</div>}

            <div className="profile-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  value={form.full_name}
                  onChange={(event) => handleChange('full_name', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Headline</span>
                <input
                  value={form.headline}
                  onChange={(event) => handleChange('headline', event.target.value)}
                />
              </label>

              <label className="field">
                <span>University</span>
                <input
                  value={form.university}
                  onChange={(event) => handleChange('university', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Graduation year</span>
                <input
                  type="number"
                  value={form.graduation_year}
                  onChange={(event) => handleChange('graduation_year', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Location</span>
                <input
                  value={form.location}
                  onChange={(event) => handleChange('location', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Skills</span>
                <input
                  value={form.skills}
                  onChange={(event) => handleChange('skills', event.target.value)}
                  placeholder="Python, SQL, UI/UX"
                />
              </label>

              <label className="field full-width">
                <span>Bio</span>
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(event) => handleChange('bio', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Portfolio URL</span>
                <input
                  type="url"
                  value={form.portfolio_url}
                  onChange={(event) => handleChange('portfolio_url', event.target.value)}
                />
              </label>

              <label className="field">
                <span>LinkedIn</span>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(event) => handleChange('linkedin_url', event.target.value)}
                />
              </label>

              <label className="field">
                <span>GitHub</span>
                <input
                  type="url"
                  value={form.github_url}
                  onChange={(event) => handleChange('github_url', event.target.value)}
                />
              </label>
            </div>

            <button className="primary-btn full-width" type="submit">
              Save profile
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
