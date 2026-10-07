import './App.css'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { JobsPage } from './pages/JobsPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterCompanyPage } from './pages/RegisterCompanyPage'
import { RegisterStudentPage } from './pages/RegisterStudentPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

const popularSkills = [
  'Python',
  'JavaScript',
  'React',
  'Node.js',
  'SQL',
  'UI/UX',
  'Data Analysis',
  'Machine Learning',
]

const categories = ['Software Engineering', 'Data', 'Design', 'Marketing', 'Finance']

const stats = [
  { label: 'Jobs posted', value: '2.4K+' },
  { label: 'Students matched', value: '18K+' },
  { label: 'Companies hiring', value: '480+' },
]

function LandingPage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">CB</div>
          <span>CareerBridge</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/jobs">Internships</Link>
          <Link to="/dashboard">Companies</Link>
          <Link to="/dashboard">Career Assistant</Link>
        </nav>

        <div className="nav-actions">
          {isAuthenticated && user ? (
            <>
              <Link className="secondary-btn" to="/dashboard">
                Dashboard
              </Link>
              <Link className="primary-btn" to="/dashboard">
                {user.role}
              </Link>
            </>
          ) : (
            <>
              <Link className="secondary-btn" to="/login">
                Log in
              </Link>
              <Link className="primary-btn" to="/register/student">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Find your next opportunity</span>
            <h1>Launch your career with better matches and smarter hiring.</h1>
            <p>
              Search internships and jobs built around your skills, unlock AI-powered CV help,
              and connect with employers that align with your goals.
            </p>

            <div className="search-cta-row">
              <Link className="primary-btn" to="/register/student">
                Search Jobs
              </Link>
              <Link className="secondary-btn" to="/register/company">
                Search Internships
              </Link>
            </div>

            <div className="stats-grid" aria-label="Platform stats">
              {stats.map((item) => (
                <div key={item.label} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel" aria-label="Opportunity overview card">
            <div className="panel-card">
              <div className="mini-header">
                <span className="dot green" />
                <span>Live hiring</span>
              </div>
              <h2>Recommended for you</h2>

              <ul className="job-list">
                <li>
                  <div>
                    <strong>Frontend Developer Intern</strong>
                    <small>Northstar Labs</small>
                  </div>
                  <span className="tag">84% match</span>
                </li>
                <li>
                  <div>
                    <strong>Data Analyst</strong>
                    <small>BrightPath Ltd.</small>
                  </div>
                  <span className="tag">92% match</span>
                </li>
                <li>
                  <div>
                    <strong>Product Design Intern</strong>
                    <small>Pixel Harbor</small>
                  </div>
                  <span className="tag">77% match</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <span className="eyebrow">Popular skills</span>
            <h2>Explore high-demand skills</h2>
          </div>
          <div className="chip-grid">
            {popularSkills.map((skill) => (
              <span key={skill} className="skill-chip">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="content-section split-section">
          <div>
            <div className="section-heading left">
              <span className="eyebrow">Popular categories</span>
              <h2>Browse by role and field</h2>
            </div>
            <div className="category-grid">
              {categories.map((category) => (
                <div key={category} className="category-card">
                  {category}
                </div>
              ))}
            </div>
          </div>

          <div className="info-card">
            <span className="eyebrow">What students get</span>
            <h3>Personalized growth, from discovery to onboarding.</h3>
            <ul>
              <li>Skill-based job matching with transparency</li>
              <li>AI career guidance and CV improvement</li>
              <li>Application tracking and recruiter notifications</li>
            </ul>
          </div>
        </section>

        <section className="content-section">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2>Built for a smoother hiring journey</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <span>01</span>
              <h3>For students</h3>
              <p>Create a profile, add skills, upload or generate a CV, and discover aligned roles.</p>
            </div>
            <div className="step-card">
              <span>02</span>
              <h3>For companies</h3>
              <p>Post roles, manage applicants, shortlist talent, and streamline interviews.</p>
            </div>
            <div className="step-card">
              <span>03</span>
              <h3>For admins</h3>
              <p>Approve companies, monitor compliance, and review platform activity and payments.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function RegisterPage() {
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">CareerBridge</span>
          <h1>Create an account</h1>
        </div>
        <div className="auth-links">
          <Link to="/register/student">Student account</Link>
          <Link to="/register/company">Company account</Link>
        </div>
      </section>
    </div>
  )
}

function CompaniesPage() {
  return (
    <main className="page-shell">
      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow">CareerBridge</span>
          <h1>Companies</h1>
          <p>Company listings are not available yet.</p>
          <Link className="primary-btn" to="/">Return home</Link>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/internships" element={<JobsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/student" element={<RegisterStudentPage />} />
          <Route path="/register/company" element={<RegisterCompanyPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/student" element={<DashboardPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['company']} />}>
              <Route path="/company" element={<DashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
