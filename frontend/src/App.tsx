import './App.css'

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

function App() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">CB</div>
          <span>CareerBridge</span>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#">Home</a>
          <a href="#">Jobs</a>
          <a href="#">Internships</a>
          <a href="#">Companies</a>
          <a href="#">Career Assistant</a>
        </nav>

        <div className="nav-actions">
          <button className="secondary-btn" type="button">Log in</button>
          <button className="primary-btn" type="button">Create account</button>
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
              <button className="primary-btn" type="button">Search Jobs</button>
              <button className="secondary-btn" type="button">Search Internships</button>
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

export default App
