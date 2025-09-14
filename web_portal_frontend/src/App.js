import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import SuppliersPage from './SuppliersPage';
// Recharts for pie charts on the dashboard
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { gradeDistribution, complianceSplit, carbonByCategory, auditProgressSplit } from './supplierMetrics';

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
  // Default to 'Admin' to ensure Admin menu (including 'Suppliers') is visible by default after login.
  const [role, setRole] = useState('Admin'); // 'Supplier' | 'Admin'
  const [lang, setLang] = useState('EN'); // EN/DE/ES

  // Active section in dashboard (left sidebar)
  const [section, setSection] = useState('Dashboard');

  // Persist auth and UI preferences across reloads (demo-safe)
  useEffect(() => {
    const stored = sessionStorage.getItem('glp_auth');
    const storedPrefs = sessionStorage.getItem('glp_prefs');
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
    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        if (prefs?.role) setRole(prefs.role);
        if (prefs?.lang) setLang(prefs.lang);
        if (prefs?.section) setSection(prefs.section);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('glp_auth', JSON.stringify({ isAuthenticated, user }));
  }, [isAuthenticated, user]);

  // Persist role/lang/section so the selected role survives reloads within the session
  useEffect(() => {
    sessionStorage.setItem('glp_prefs', JSON.stringify({ role, lang, section }));
  }, [role, lang, section]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser('');
    // Reset to Admin so that upon next login, default context is Admin again
    setRole('Admin');
    setLang('EN');
    setSection('Dashboard');
    sessionStorage.removeItem('glp_auth');
    sessionStorage.removeItem('glp_prefs');
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
    { key: 'Reports & Downloads', label: 'Reports & Downloads' },
  ];

  // For Admin role, construct sections and enforce "My Profile" as last item.
  const rawSections = role === 'Admin'
    ? [
        { key: 'Dashboard', label: 'Dashboard' },
        { key: 'Suppliers', label: 'Suppliers' }, // ensure Suppliers is prominent
        { key: 'My Profile', label: 'My Profile' },
        { key: 'Data Submission', label: 'Data Submission' },
        { key: 'Compliance Scores', label: 'Compliance Scores' },
        { key: 'Reports & Downloads', label: 'Reports & Downloads' },
        { key: 'Knowledge Hub', label: 'Knowledge Hub' },
        { key: 'Admin Settings', label: 'Admin Settings' }
      ]
    : [
        ...sectionsBase,
        { key: 'Knowledge Hub', label: 'Knowledge Hub' }
      ];

  // Ensure "My Profile" (by key) is always appended as the last item after every render.
  // This is resilient to any array order changes or persisted state after reloads.
  const sections = React.useMemo(() => {
    const PROFILE_KEYS = new Set(['My Profile']); // if renamed, ensure the key stays consistent
    const withoutProfile = rawSections.filter(s => !PROFILE_KEYS.has(s.key));
    const profileItems = rawSections.filter(s => PROFILE_KEYS.has(s.key));
    return [...withoutProfile, ...profileItems];
  }, [rawSections]);

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
  // Local re-usable pie chart card
  const PieCard = ({ title, data, colors, innerRadius = 40, outerRadius = 70, subtitle }) => {
    return (
      <div className="mini-card pie-card">
        <div className="mini-card-title">{title}</div>
        {subtitle && <div className="mini-card-text">{subtitle}</div>}
        <div className="pie-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
              >
                {data.map((entry, idx) => (
                  <Cell key={`slice-${title}-${idx}`} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Build the same supplier dataset used by SuppliersPage to keep one source of truth
  const suppliersData = React.useMemo(() => {
    // Inline replica of SuppliersPage's deterministic generator for shared read-only use on dashboard.
    const countries = ['USA', 'Germany', 'India', 'Brazil', 'Netherlands', 'Japan', 'China', 'France', 'UK', 'Canada', 'Spain', 'Italy', 'Mexico', 'Sweden', 'Norway'];
    const industries = ['AgriTech', 'Battery', 'Renewables', 'Automotive', 'Packaging', 'Healthcare', 'Robotics', 'Electronics', 'Pharma'];
    const sbtiStates = ['None', 'Committed', 'Approved'];
    const grades = ['A', 'B', 'C', 'D'];
    const baseNames = ['Agrisoft', 'BareTech', 'BrightSolar', 'EcoFusion', 'PackRight', 'MediCore', 'RoboAxis', 'EcoPrint', 'GreenCore', 'SunVolt', 'AquaFlux', 'TerraPack', 'VoltEdge', 'NeuroBot', 'BioHealth'];

    const explicitD = [
      { supplier: 'DeltaPack 0001D', country: 'USA', industry: 'Packaging', renewables: 9, sbti: 'None', products: 2, grade: 'D', lastUpdated: '2023-06-12' },
      { supplier: 'LowCarbon Inc 0002D', country: 'India', industry: 'Automotive', renewables: 12, sbti: 'None', products: 1, grade: 'D', lastUpdated: '2024-01-24' },
      { supplier: 'OldData Co 0003D', country: 'Germany', industry: 'Electronics', renewables: 7, sbti: 'Committed', products: 3, grade: 'D', lastUpdated: '2023-03-05' },
      { supplier: 'NonReporting LLC 0004D', country: 'Brazil', industry: 'AgriTech', renewables: 6, sbti: 'None', products: 1, grade: 'D', lastUpdated: '2023-02-14' },
    ];

    const TOTAL = 1000;
    const list = [];
    for (let i = 1; i <= TOTAL; i++) {
      const name = `${baseNames[i % baseNames.length]} ${i.toString().padStart(4, '0')}`;
      const country = countries[i % countries.length];
      const industry = industries[i % industries.length];
      const renewables = 5 + ((i * 11) % 92); // 5..96
      const sbti = sbtiStates[i % sbtiStates.length];
      const products = 1 + (i % 12);
      const grade = grades[i % grades.length];
      const month = String((i % 12) + 1).padStart(2, '0');
      const day = String(((i * 3) % 28) + 1).padStart(2, '0');
      const year = 2023 + ((i % 20) > 10 ? 1 : 0);
      const lastUpdated = `${year}-${month}-${day}`;
      list.push({ supplier: name, country, industry, renewables, sbti, products, grade, lastUpdated });
    }

    const seed = [
      { supplier: 'Agrisoft', country: 'Brazil', industry: 'AgriTech', renewables: 45, sbti: 'None', products: 3, grade: 'B', lastUpdated: '2023-09-02' },
      { supplier: 'BareTech', country: 'India', industry: 'Battery', renewables: 52, sbti: 'Committed', products: 5, grade: 'A', lastUpdated: '2024-01-12' },
      { supplier: 'BrightSolar', country: 'USA', industry: 'Renewables', renewables: 70, sbti: 'Approved', products: 2, grade: 'A', lastUpdated: '2024-05-19' },
      { supplier: 'EcoFusion', country: 'Germany', industry: 'Automotive', renewables: 30, sbti: 'Committed', products: 1, grade: 'B', lastUpdated: '2023-11-30' },
      { supplier: 'PackRight', country: 'Netherlands', industry: 'Packaging', renewables: 67, sbti: 'Approved', products: 4, grade: 'A', lastUpdated: '2024-02-18' },
      { supplier: 'MediCore', country: 'Japan', industry: 'Healthcare', renewables: 15, sbti: 'None', products: 3, grade: 'C', lastUpdated: '2023-08-09' },
      { supplier: 'RoboAxis', country: 'China', industry: 'Robotics', renewables: 10, sbti: 'None', products: 6, grade: 'C', lastUpdated: '2023-07-21' },
      { supplier: 'EcoPrint', country: 'France', industry: 'Packaging', renewables: 30, sbti: 'Committed', products: 2, grade: 'B', lastUpdated: '2023-12-05' },
    ];

    return [...seed, ...explicitD, ...list];
  }, []);

  // For a simple filter parity with Suppliers page, add optional local filter states (could be extended later)
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliersData.filter((r) => {
      const hay = `${r.supplier} ${r.country} ${r.industry}`.toLowerCase();
      const matchesText = q.length === 0 || hay.includes(q);
      const matchesGrade = gradeFilter === 'All grades' ? true : r.grade === gradeFilter.replace('Grade ', '');
      return matchesText && matchesGrade;
    });
  }, [suppliersData, query, gradeFilter]);

  // Compute dashboard metrics from the current dataset (filtered to mirror Suppliers behavior)
  const dist = useMemo(() => gradeDistribution(filtered), [filtered]);
  const compliance = useMemo(() => complianceSplit(filtered), [filtered]);
  const carbon = useMemo(() => carbonByCategory(filtered), [filtered]);
  const audit = useMemo(() => auditProgressSplit(filtered), [filtered]);

  // Green-tinted palette aligned with theme
  const pal = {
    grades: ['#2f9954', '#83dba0', '#a8e6bc', '#c7efd3'],
    status: ['#3fbf6a', '#e57373'],
    strong: ['#2f9954', '#83dba0', '#a8e6bc', '#c7efd3', '#e3f7e9'],
    audit: ['#c7efd3', '#a8e6bc', '#3fbf6a', '#ffd1d1'],
  };

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

      {/* Quick filter (mirrors Suppliers filters lightly so dashboard can reflect subset) */}
      <div className="mini-card" style={{ marginBottom: 12, padding: 12, display: 'grid', gap: 8, fontSize: '0.8em' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 8 }}>
          <input
            className="input"
            placeholder="Search suppliers, country, industry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search suppliers on dashboard"
            style={{ padding: '8px 10px' }}
          />
          <select
            className="input"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            aria-label="Filter by grade on dashboard"
            style={{ padding: '8px 10px' }}
          >
            <option>All grades</option>
            <option>Grade A</option>
            <option>Grade B</option>
            <option>Grade C</option>
            <option>Grade D</option>
          </select>
        </div>
      </div>

      <div className="cards">
        <StatTile label="% Suppliers Compliant" value={`${compliance.compliantPct}%`} accent="#3BB273" />
        <StatTile label="Suppliers Count" value={filtered.length} accent="#83dba0" />
        <StatTile label="Grade A Suppliers" value={dist.A} accent="#3fbf6a" />
      </div>

      {/* Pie charts row */}
      <div className="charts-grid">
        <PieCard
          title="Supplier Grade Distribution"
          subtitle={`${dist.A} A | ${dist.B} B | ${dist.C} C | ${dist.D} D`}
          data={[
            { name: 'Grade A', value: dist.A },
            { name: 'Grade B', value: dist.B },
            { name: 'Grade C', value: dist.C },
            { name: 'Grade D', value: dist.D },
          ]}
          colors={pal.grades}
          innerRadius={45}
          outerRadius={75}
        />
        <PieCard
          title="Compliance %"
          subtitle={`${compliance.compliant} compliant / ${compliance.nonCompliant} non-compliant`}
          data={[
            { name: 'Compliant', value: compliance.compliant },
            { name: 'Non-compliant', value: compliance.nonCompliant },
          ]}
          colors={pal.status}
          innerRadius={45}
          outerRadius={75}
        />
        <PieCard
          title="Carbon Emission of Items"
          data={carbon}
          colors={pal.strong}
          innerRadius={45}
          outerRadius={75}
        />
        <PieCard
          title="Supplier Audit Progress"
          data={audit}
          colors={pal.audit}
          innerRadius={45}
          outerRadius={75}
        />
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
