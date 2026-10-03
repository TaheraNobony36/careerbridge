import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import {
  applyToJob,
  createJob,
  getJobRecommendations,
  getJobs,
  getMyJobs,
} from '../services/api'

interface JobRecord {
  id: string
  company_id: string
  company_name: string
  title: string
  description: string
  location?: string
  job_type: string
  salary?: string
  skills: string[]
  is_active: boolean
}

interface RecommendedJobRecord extends JobRecord {
  match_score: number
  matched_skills: string[]
}

const emptyForm = {
  title: '',
  description: '',
  company_name: '',
  location: '',
  job_type: 'internship',
  salary: '',
  skills: '',
}

export function JobsPage() {
  const { isAuthenticated, user } = useAuth()
  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [myJobs, setMyJobs] = useState<JobRecord[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJobRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingApplication, setPendingApplication] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadJobs = async () => {
    try {
      const { data } = await getJobs()
      setJobs(data)

      if (user?.role === 'company') {
        const myResponse = await getMyJobs()
        setMyJobs(myResponse.data)
      }

      if (user?.role === 'student') {
        const recommendations = await getJobRecommendations()
        setRecommendedJobs(recommendations.data)
      } else {
        setRecommendedJobs([])
      }
    } catch {
      setError('Unable to load the latest opportunities right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadJobs()
  }, [user])

  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      await createJob({
        title: form.title,
        description: form.description,
        company_name: form.company_name,
        location: form.location || undefined,
        job_type: form.job_type,
        salary: form.salary || undefined,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      })

      setSuccess('Opportunity posted successfully.')
      setForm(emptyForm)
      await loadJobs()
    } catch {
      setError('Please ensure you are signed in as a company account to post jobs.')
    }
  }

  const handleApply = async (jobId: string) => {
    if (!isAuthenticated || user?.role !== 'student') {
      setError('Please log in as a student to apply to opportunities.')
      return
    }

    setPendingApplication(jobId)
    setError(null)
    setSuccess(null)

    try {
      await applyToJob(jobId, { cover_letter: 'I am interested in this opportunity.' })
      setSuccess('Application submitted successfully.')
    } catch {
      setError('You may already have applied to this role, or the request failed.')
    } finally {
      setPendingApplication(null)
    }
  }

  return (
    <div className="page-shell jobs-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">CareerBridge</p>
          <h1>Discover opportunities</h1>
        </div>
        <div className="dashboard-actions">
          <Link className="secondary-btn" to="/">
            Home
          </Link>
          {isAuthenticated ? (
            <Link className="primary-btn" to="/dashboard">
              Dashboard
            </Link>
          ) : (
            <Link className="primary-btn" to="/login">
              Log in
            </Link>
          )}
        </div>
      </header>

      {user?.role === 'company' && (
        <section className="profile-card company-post-card">
          <div className="profile-header">
            <div>
              <p className="eyebrow">Company posting</p>
              <h2>Post a new internship or role</h2>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            {error && <div className="status-banner error">{error}</div>}
            {success && <div className="status-banner success">{success}</div>}

            <div className="profile-grid">
              <label className="field">
                <span>Company name</span>
                <input
                  value={form.company_name}
                  onChange={(event) => handleChange('company_name', event.target.value)}
                />
              </label>

              <label className="field">
                <span>Job title</span>
                <input
                  value={form.title}
                  onChange={(event) => handleChange('title', event.target.value)}
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
                <span>Job type</span>
                <select
                  value={form.job_type}
                  onChange={(event) => handleChange('job_type', event.target.value)}
                >
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </label>

              <label className="field">
                <span>Salary</span>
                <input
                  value={form.salary}
                  onChange={(event) => handleChange('salary', event.target.value)}
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
                <span>Description</span>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                />
              </label>
            </div>

            <button className="primary-btn full-width" type="submit">
              Publish opportunity
            </button>
          </form>
        </section>
      )}

      {user?.role === 'company' && myJobs.length > 0 && (
        <section className="jobs-section">
          <div className="section-heading">
            <span className="eyebrow">Your posts</span>
            <h2>Published by you</h2>
          </div>
          <div className="jobs-grid">
            {myJobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-header">
                  <span className="tag">{job.job_type}</span>
                  <span className="salary-pill">{job.salary || 'Compensation not listed'}</span>
                </div>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company_name}</p>
                <p className="meta">{job.location || 'Remote'} • {job.company_name}</p>
                <p>{job.description}</p>
                <div className="skills-row">
                  {job.skills.map((skill) => (
                    <span key={`${job.id}-${skill}`} className="skill-chip compact-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {user?.role === 'student' && recommendedJobs.length > 0 && (
        <section className="jobs-section">
          <div className="section-heading">
            <span className="eyebrow">Match score</span>
            <h2>Recommended for you</h2>
          </div>
          <div className="jobs-grid">
            {recommendedJobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-header">
                  <span className="tag">{job.job_type}</span>
                  <span className="salary-pill">{job.match_score}% match</span>
                </div>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company_name}</p>
                <p className="meta">{job.location || 'Remote'} • {job.company_name}</p>
                <p>{job.description}</p>
                <div className="skills-row">
                  {job.matched_skills.map((skill) => (
                    <span key={`${job.id}-matched-${skill}`} className="skill-chip compact-chip">
                      {skill}
                    </span>
                  ))}
                </div>
                <button
                  className="primary-btn full-width apply-btn"
                  type="button"
                  onClick={() => void handleApply(job.id)}
                  disabled={pendingApplication === job.id}
                >
                  {pendingApplication === job.id ? 'Applying...' : 'Apply now'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="jobs-section">
        <div className="section-heading">
          <span className="eyebrow">Open roles</span>
          <h2>Latest opportunities</h2>
        </div>

        {loading ? (
          <p className="status-banner">Loading internships and jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="status-banner">No open opportunities right now. Check back soon.</p>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <article key={job.id} className="job-card">
                <div className="job-header">
                  <span className="tag">{job.job_type}</span>
                  <span className="salary-pill">{job.salary || 'Compensation not listed'}</span>
                </div>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company_name}</p>
                <p className="meta">{job.location || 'Remote'} • {job.company_name}</p>
                <p>{job.description}</p>
                <div className="skills-row">
                  {job.skills.map((skill) => (
                    <span key={`${job.id}-${skill}`} className="skill-chip compact-chip">
                      {skill}
                    </span>
                  ))}
                </div>
                {isAuthenticated && user?.role === 'student' && (
                  <button
                    className="primary-btn full-width apply-btn"
                    type="button"
                    onClick={() => void handleApply(job.id)}
                    disabled={pendingApplication === job.id}
                  >
                    {pendingApplication === job.id ? 'Applying...' : 'Apply now'}
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
