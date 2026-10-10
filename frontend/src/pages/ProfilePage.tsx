import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage, getStudentProfile, saveStudentProfile } from '../services/api'

interface ProfileFormState {
  full_name: string
  headline: string
  bio: string
  university: string
  degree_program: string
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
  degree_program: '',
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
  const [saving, setSaving] = useState(false)
  const [profileFound, setProfileFound] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') {
      return
    }

    const loadProfile = async () => {
      try {
        const { data } = await getStudentProfile()
        setForm({
          full_name: data.full_name ?? '',
          headline: data.headline ?? '',
          bio: data.bio ?? '',
          university: data.university ?? '',
          degree_program: data.degree_program ?? '',
          graduation_year: data.graduation_year ? String(data.graduation_year) : '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          location: data.location ?? '',
          portfolio_url: data.portfolio_url ?? '',
          linkedin_url: data.linkedin_url ?? '',
          github_url: data.github_url ?? '',
        })
        setProfileFound(true)
      } catch (err) {
        if ((err as { response?: { status?: number } }).response?.status === 404) {
          setProfileFound(false)
        } else {
          setError(getApiErrorMessage(err, 'Unable to load your profile right now.'))
        }
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [isAuthenticated, user?.role])

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'student') {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const payload = {
        full_name: form.full_name.trim() || null,
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        university: form.university.trim() || null,
        degree_program: form.degree_program.trim() || null,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        location: form.location.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        github_url: form.github_url.trim() || null,
      }

      const { data } = await saveStudentProfile(payload)
      setForm({
        full_name: data.full_name ?? '',
        headline: data.headline ?? '',
        bio: data.bio ?? '',
        university: data.university ?? '',
        degree_program: data.degree_program ?? '',
        graduation_year: data.graduation_year ? String(data.graduation_year) : '',
        skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
        location: data.location ?? '',
        portfolio_url: data.portfolio_url ?? '',
        linkedin_url: data.linkedin_url ?? '',
        github_url: data.github_url ?? '',
      })
      setProfileFound(true)
      setSuccess('Profile saved successfully.')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save your profile. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const completionFields = [
    form.full_name,
    form.headline,
    form.bio,
    form.university,
    form.degree_program,
    form.graduation_year,
    form.skills,
    form.location,
    form.portfolio_url,
    form.linkedin_url,
    form.github_url,
  ]
  const completion = Math.round(
    (completionFields.filter((value) => value.trim()).length / completionFields.length) * 100,
  )

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
            {profileFound === false && (
              <div className="profile-empty-state" role="status">
                <strong>Your profile is ready to be started.</strong>
                <span>Add a few details below, then save to create your student profile.</span>
              </div>
            )}
            <section className="profile-completion" aria-label="Profile completion">
              <div className="profile-completion-label">
                <span>Profile completeness</span>
                <strong>{completion}%</strong>
              </div>
              <div
                className="profile-completion-track"
                role="progressbar"
                aria-label="Profile completeness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <span style={{ width: `${completion}%` }} />
              </div>
            </section>
            {error && <div className="status-banner error" role="alert">{error}</div>}
            {success && <div className="status-banner success" role="status">{success}</div>}

            <div className="profile-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  value={form.full_name}
                  maxLength={150}
                  onChange={(event) => handleChange('full_name', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Headline</span>
                <input
                  value={form.headline}
                  maxLength={160}
                  onChange={(event) => handleChange('headline', event.target.value)}
                />
              </label>

              <label className="field">
                <span>University</span>
                <input
                  value={form.university}
                  maxLength={255}
                  onChange={(event) => handleChange('university', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Degree or program</span>
                <input
                  value={form.degree_program}
                  maxLength={255}
                  onChange={(event) => handleChange('degree_program', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Graduation year</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.graduation_year}
                  onChange={(event) => handleChange('graduation_year', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Location</span>
                <input
                  value={form.location}
                  maxLength={150}
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
                  maxLength={2000}
                  value={form.bio}
                  onChange={(event) => handleChange('bio', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Portfolio URL</span>
                <input
                  type="url"
                  maxLength={255}
                  value={form.portfolio_url}
                  onChange={(event) => handleChange('portfolio_url', event.target.value)}
                />
              </label>

              <label className="field">
                <span>LinkedIn</span>
                <input
                  type="url"
                  maxLength={255}
                  value={form.linkedin_url}
                  onChange={(event) => handleChange('linkedin_url', event.target.value)}
                />
              </label>

              <label className="field">
                <span>GitHub</span>
                <input
                  type="url"
                  maxLength={255}
                  value={form.github_url}
                  onChange={(event) => handleChange('github_url', event.target.value)}
                />
              </label>
            </div>

            <button className="primary-btn full-width" type="submit" disabled={saving}>
              {saving ? 'Saving profile...' : 'Save profile'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
