import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import SuppliersPage from './SuppliersPage';

/**
 * App implements a simple state-based authentication with a light green theme.
 * Users log in using static credentials ('admin' / 'secret@111').
 * Upon success, a dashboard reflecting SustainHub features is displayed.
 */

// Simple in-memory auth constants
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'secret@111';

// PUBLIC_INTERFACE
export default function App() {
  /** Root app state for auth and UI theme */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');
  // Role and language are for dashboard only (placeholders)
  const [role, setRole] = useState('Supplier'); // 'Supplier' | 'Admin'
  const [lang, setLang] = useState('EN'); // EN/DE/ES

  // Active section in dashboard (left sidebar)
  const [section, setSection] = useState('Dashboard');

  // Persist auth across reloads (optional and safe for demo only)
  useEffect(() => {
    const stored = sessionStorage.getItem('glp_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.isAuthenticated && parsed?.user) {
          setIsAuthenticated(true);
          setUser(parsed.user);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('glp_auth', JSON.stringify({ isAuthenticated, user }));
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser('');
    setRole('Supplier');
    setLang('EN');
    setSection('Dashboard');
    sessionStorage.removeItem('glp_auth');
  };

  return (
    <div className="glp-app">
      {!isAuthenticated ? (
        <AuthLayout>
          <LoginCard
            onSuccess={(username) => {
              setIsAuthenticated(true);
              setUser(username);
            }}
          />
        </AuthLayout>
      ) : (
        <SustainHubLayout
          user={user}
          role={role}
          lang={lang}
          section={section}
          onChangeRole={setRole}
          onChangeLang={setLang}
          onSelectSection={setSection}
          onLogout={handleLogout}
        >
          <SectionContent section={section} role={role} user={user} />
        </SustainHubLayout>
      )}
    </div>
  );
}

/**
 * Layout shown during authentication (centers the card).
 */
function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="brand-badge">SustainX Portal</div>
      {children}
      <footer className="footer-note">Demo login: admin / secret@111</footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * LoginCard renders a username/password form and validates static credentials.
 */
function LoginCard({ onSuccess }) {
  /** This is a public function component.
   * onSuccess(username: string) => void
   */
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const isDisabled = useMemo(
    () => form.username.trim().length === 0 || form.password.length === 0,
    [form]
  );

  const handleChange = (e) => {
    setError('');
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.username === VALID_USERNAME && form.password === VALID_PASSWORD) {
      onSuccess(form.username);
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="card login-card" role="region" aria-label="Login form">
      <h1 className="title">Welcome</h1>
      <p className="subtitle">Please sign in to continue</p>

      <form onSubmit={handleSubmit} className="form">
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          className="input"
          type="text"
          value={form.username}
          onChange={handleChange}
          placeholder="Enter username"
          autoComplete="username"
          required
        />

        <label className="label" htmlFor="password">Password</label>
        <div className="password-row">
          <input
            id="password"
            name="password"
            className="input"
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="btn btn-primary btn-full" type="submit" disabled={isDisabled}>
          Sign In
        </button>
      </form>
    </div>
  );
}

/**
 * SustainHubLayout: Global shell after login
 * - Header with logo, portal name, role dropdown, language selector, user info
 * - Left sidebar with sections (Admin Settings visible only for Admin)
 * - Main content area for selected section
 */
function SustainHubLayout({
  user,
  role,
  lang,
  section,
  onChangeRole,
  onChangeLang,
  onSelectSection,
  onLogout,
  children,
}) {
  const sectionsBase = [
    { key: 'Dashboard', label: 'Dashboard' },
    { key: 'My Profile', label: 'My Profile' },
    { key: 'Data Submission', label: 'Data Submission' },
    { key: 'Compliance Scores', label: 'Compliance Scores' },
    { key: 'Knowledge Hub', label: 'Knowledge Hub' },
    { key: 'Reports & Downloads', label: 'Reports & Downloads' },
  ];
  const sections = role === 'Admin'
    ? [
        ...sectionsBase,
        { key: 'Suppliers', label: 'Suppliers' },
        { key: 'Admin Settings', label: 'Admin Settings' }
      ]
    : sectionsBase;

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">Elxsi SustainHub</div>
        <div
          /* Reduce font sizing for topbar controls by 20% (login page unaffected) */
          style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8em' }}
        >
          <select
            aria-label="Role"
            className="input"
            value={role}
            onChange={(e) => onChangeRole(e.target.value)}
            style={{ width: 140, padding: '8px 10px' }}
          >
            <option>Supplier</option>
            <option>Admin</option>
          </select>
          <select
            aria-label="Language"
            className="input"
            value={lang}
            onChange={(e) => onChangeLang(e.target.value)}
            style={{ width: 90, padding: '8px 10px' }}
          >
            <option>EN</option>
            <option>DE</option>
            <option>ES</option>
          </select>
        </div>
        <div className="user-area">
          <span className="greeting">Hello, {user} ({role}) 👋</span>
          <button className="btn btn-ghost small" onClick={onLogout} aria-label="Logout">
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 0 }}>
        <aside style={{ padding: 16 }}>
          <nav className="panel" aria-label="Sidebar Navigation">
            <div className="mini-card-title" style={{ marginBottom: 8 }}>Navigation</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6, fontSize: '0.8em' }}>
              {sections.map((s) => (
                <li key={s.key}>
                  <button
                    className={`menu-item ${section === s.key ? 'active' : ''}`}
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => onSelectSection(s.key)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="panel" style={{ marginTop: 12, fontSize: '0.8em' }}>
            <div className="mini-card-title">Quick Actions</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => onSelectSection('Data Submission')}>
                Upload Data
              </button>
              <button className="btn btn-ghost" onClick={() => onSelectSection('Compliance Scores')}>
                View My Scorecard
              </button>
              <button className="btn btn-ghost" onClick={() => onSelectSection('Reports & Downloads')}>
                Download Template
              </button>
            </div>
          </div>
        </aside>

        <main className="content">{children}</main>
      </div>

      <footer className="footer-note" style={{ position: 'static', padding: 16, fontSize: '0.8em' }}>
        Help &amp; Support | Privacy Policy | Tata Elxsi
      </footer>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * SectionContent renders content per selected section with placeholder data.
 */
function SectionContent({ section, role, user }) {
  /** This is a public function component.
   * Props: { section: string, role: 'Supplier'|'Admin', user: string }
   */
  if (section === 'Dashboard') {
    return <DashboardHome role={role} user={user} />;
  }
  if (section === 'My Profile') {
    return <MyProfile user={user} />;
  }
  if (section === 'Data Submission') {
    return <DataSubmission />;
  }
  if (section === 'Compliance Scores') {
    return <ComplianceScores />;
  }
  if (section === 'Knowledge Hub') {
    return <KnowledgeHub />;
  }
  if (section === 'Reports & Downloads') {
    return <ReportsDownloads />;
  }
  if (section === 'Suppliers') {
    return <SuppliersPage />;
  }
  if (section === 'Admin Settings') {
    return <AdminSettings />;
  }
  return null;
}

function StatTile({ label, value, accent = 'var(--primary)' }) {
  return (
    <div className="mini-card" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="mini-card-title">{label}</div>
      <div
        /* Reduced by 20% to align with global scaling on authenticated pages */
        style={{ fontSize: '17.6px', fontWeight: 800 }}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({ grade }) {
  const color = grade === 'A' ? '#388E3C' : grade === 'B' ? '#F9A825' : grade === 'C' ? '#FB8C00' : '#D32F2F';
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: 10,
      fontWeight: 800,
      color: '#fff',
      background: color,
      minWidth: 28,
      textAlign: 'center',
      /* Reduce badge text by ~20% on non-login pages */
      fontSize: '0.8em'
    }}>{grade}</span>
  );
}

function DashboardHome({ role, user }) {
  const supplierView = (
    <section className="panel">
      <h2 className="panel-title">Welcome, {user}</h2>
      <p className="panel-text">This is your SustainHub home. Use quick actions to get started.</p>
      <div className="cards" style={{ fontSize: '0.8em' }}>
        <StatTile label="% Data Complete" value="72%" accent="#3BB273" />
        <StatTile label="Last Updated" value="2024-12-18" accent="#83dba0" />
        <StatTile label="My Grade" value={<Badge grade="B" />} accent="#F9A825" />
      </div>
    </section>
  );

  const adminView = (
    <section className="panel">
      <h2 className="panel-title">Enterprise Dashboard</h2>
      <p className="panel-text">Overview of supplier compliance and sustainability performance.</p>
      <div className="cards">
        <StatTile label="% Suppliers Compliant" value="64%" accent="#3BB273" />
        <StatTile label="Avg Carbon Intensity" value="0.42 tCO₂e/$k" accent="#83dba0" />
        <StatTile label="SBTi Commitments" value="38%" accent="#3fbf6a" />
      </div>

      <div className="cards" style={{ marginTop: 14 }}>
        <div className="mini-card" style={{ fontSize: '0.8em' }}>
          <div className="mini-card-title">Compliance Distribution (A/B/C/D)</div>
          <div className="mini-card-text">Donut: A 24% | B 40% | C 22% | D 14%</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {['#388E3C', '#F9A825', '#FB8C00', '#D32F2F'].map((c, i) => (
              <div key={c} style={{ width: 40, height: 10, background: c, borderRadius: 4 }} title={['A','B','C','D'][i]} />
            ))}
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Emissions by Geography</div>
          <div className="mini-card-text">Bar: NA 35 | EU 28 | APAC 22 | LATAM 15</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 70, marginTop: 8 }}>
            {[35,28,22,15].map((v, idx) => (
              <div key={idx} style={{ width: 24, height: v, background: '#83dba0', borderRadius: 4 }} />
            ))}
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Renewable Adoption Trend</div>
          <div className="mini-card-text">Line: 18% → 26% → 33% → 41%</div>
          <div style={{ height: 70, background: 'linear-gradient(180deg, rgba(63,191,106,0.25), transparent)', borderRadius: 8, marginTop: 8 }} />
        </div>
      </div>
    </section>
  );

  return role === 'Admin' ? adminView : supplierView;
}

function MyProfile({ user }) {
  return (
    <section className="panel">
      <h2 className="panel-title">My Profile</h2>
      <p className="panel-text">Supplier profile details used for reporting and compliance.</p>
      <div className="cards">
        <div className="mini-card">
          <div className="mini-card-title">Company</div>
          <div className="mini-card-text">{user} Inc.</div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Industry</div>
          <div className="mini-card-text">Telecom Equipment</div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Geography</div>
          <div className="mini-card-text">North America</div>
        </div>
      </div>
    </section>
  );
}

function DataSubmission() {
  return (
    <section className="panel">
      <h2 className="panel-title">Data Submission</h2>
      <p className="panel-text">Submit emissions and compliance data via guided form or CSV upload.</p>

      <div className="mini-card" style={{ marginBottom: 12, fontSize: '0.8em' }}>
        <div className="mini-card-title">Option 1: Guided Form</div>
        <div className="mini-card-text">Scope 1, 2, 3, Renewables %, Certifications</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input className="input" placeholder="Scope 1 (tCO₂e)" />
          <input className="input" placeholder="Scope 2 (tCO₂e)" />
          <input className="input" placeholder="Scope 3 (tCO₂e)" />
          <input className="input" placeholder="Renewable Energy % (0-100)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label className="label"><input type="checkbox" /> SBTi Committed</label>
            <label className="label"><input type="checkbox" /> ISO 14001 Certified</label>
            <label className="label"><input type="checkbox" /> RoHS Compliant</label>
            <label className="label"><input type="checkbox" /> REACH Compliant</label>
          </div>
          <button className="btn btn-primary" type="button">Validate & Save</button>
        </div>
      </div>

      <div className="mini-card">
        <div className="mini-card-title">Option 2: CSV Upload</div>
        <div className="mini-card-text">Upload your template CSV. Validation errors will be shown.</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" type="button">Choose File</button>
          <button className="btn btn-primary" type="button">Upload</button>
        </div>
        <div className="error" style={{ marginTop: 10 }}>
          Example validation: Missing Scope 3 value in row 12.
        </div>
        <div className="mini-card-text" style={{ marginTop: 8 }}>
          Progress: 70% complete
          <div style={{ background: '#e3f7e9', height: 8, borderRadius: 6, marginTop: 6 }}>
            <div style={{ width: '70%', height: '100%', background: 'var(--primary)', borderRadius: 6 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplianceScores() {
  return (
    <section className="panel">
      <h2 className="panel-title">Compliance Scores</h2>
      <p className="panel-text">Automated grading and gap analysis.</p>

      <div className="mini-card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="mini-card-title">Your Grade</div>
        <Badge grade="B" />
      </div>

      <div className="cards" style={{ marginTop: 12, fontSize: '0.8em' }}>
        <div className="mini-card">
          <div className="mini-card-title">Gaps Highlight</div>
          <ul className="mini-card-text">
            <li>Scope 3 not fully reported</li>
            <li>Renewable energy below 30%</li>
            <li>Data older than 12 months</li>
          </ul>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">3 Steps to Improve</div>
          <ol className="mini-card-text">
            <li>Increase renewables by 20% within 12 months</li>
            <li>Adopt ISO 14001 processes</li>
            <li>Engage value chain for Scope 3 data</li>
          </ol>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Download Scorecard</div>
          <button className="btn btn-ghost" type="button">Download PDF</button>
        </div>
      </div>
    </section>
  );
}

function KnowledgeHub() {
  const tiles = [
    { title: 'SBTi Guidance', desc: 'Science Based Targets initiative starter kit' },
    { title: 'ISO 14001 Playbook', desc: 'Practical steps to certification' },
    { title: 'Renewable Procurement Toolkit', desc: 'PPAs, RECs, on-site solar' },
  ];
  return (
    <section className="panel">
      <h2 className="panel-title">Knowledge Hub</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: '0.8em' }}>
        <input className="input" placeholder="Search resources..." />
        <button className="btn btn-ghost">Filter</button>
      </div>
      <div className="cards">
        {tiles.map((t) => (
          <div key={t.title} className="mini-card">
            <div className="mini-card-title">{t.title}</div>
            <div className="mini-card-text">{t.desc}</div>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-primary">Open</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportsDownloads() {
  return (
    <section className="panel">
      <h2 className="panel-title">Reports & Downloads</h2>
      <p className="panel-text">Export and drill down with filters.</p>
      <div className="mini-card" style={{ marginBottom: 12 }}>
        <div className="mini-card-title">Filters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
          <input className="input" placeholder="Supplier" />
          <input className="input" placeholder="Geography" />
          <input className="input" placeholder="Industry" />
          <input className="input" placeholder="Year" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: '0.8em' }}>
        <button className="btn btn-primary">Export CSV</button>
        <button className="btn btn-ghost">Export PDF</button>
      </div>
    </section>
  );
}

function AdminSettings() {
  return (
    <section className="panel">
      <h2 className="panel-title">Admin Settings</h2>
      <p className="panel-text">Configure thresholds and manage content (placeholder).</p>

      <div className="cards">
        <div className="mini-card">
          <div className="mini-card-title">Grading Thresholds</div>
          <div className="mini-card-text">Renewables target: 40%</div>
          <div className="mini-card-text">Data recency: 12 months</div>
          <button className="btn btn-ghost" type="button">Edit</button>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Supplier Accounts</div>
          <div className="mini-card-text">Pending invites: 5</div>
          <button className="btn btn-ghost" type="button">Manage</button>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Knowledge Hub Content</div>
          <div className="mini-card-text">Last updated: 2025-01-05</div>
          <button className="btn btn-ghost" type="button">Upload</button>
        </div>
      </div>
    </section>
  );
}
