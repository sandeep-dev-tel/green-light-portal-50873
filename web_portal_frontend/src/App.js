import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * App implements a simple state-based authentication with a light green theme.
 * Users log in using static credentials ('admin' / 'secret@111').
 * Upon success, a dashboard with three top menus is displayed.
 */

// Simple in-memory auth constants
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'secret@111';

// PUBLIC_INTERFACE
export default function App() {
  /** Root app state for auth and UI theme */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');
  const [activeMenu, setActiveMenu] = useState('MENU 1');

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
    setActiveMenu('MENU 1');
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
        <DashboardLayout
          user={user}
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          onLogout={handleLogout}
        >
          <DashboardContent activeMenu={activeMenu} user={user} />
        </DashboardLayout>
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
      <div className="brand-badge">Green Light Portal</div>
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
 * DashboardLayout renders top navigation and a content area with a greeting.
 */
function DashboardLayout({ user, activeMenu, onSelectMenu, onLogout, children }) {
  const menus = ['MENU 1', 'MENU 2', 'MENU 3'];

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand">Green Light Portal</div>
        <nav className="menu">
          {menus.map((m) => (
            <button
              key={m}
              className={`menu-item ${activeMenu === m ? 'active' : ''}`}
              onClick={() => onSelectMenu(m)}
            >
              {m}
            </button>
          ))}
        </nav>
        <div className="user-area">
          <span className="greeting">Hello, {user} 👋</span>
          <button className="btn btn-ghost small" onClick={onLogout} aria-label="Logout">
            Logout
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * DashboardContent shows a friendly message based on the active menu.
 */
function DashboardContent({ activeMenu, user }) {
  /** This is a public function component.
   * Props: { activeMenu: string, user: string }
   */
  return (
    <section className="panel">
      <h2 className="panel-title">{activeMenu}</h2>
      <p className="panel-text">
        Welcome, {user}! You are viewing <strong>{activeMenu}</strong>. This is a placeholder
        content area for your dashboard. Use the top menus to navigate between sections.
      </p>
      <div className="cards">
        <div className="mini-card">
          <div className="mini-card-title">Quick Tip</div>
          <div className="mini-card-text">
            Light green theme keeps things fresh and easy on the eyes.
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Status</div>
          <div className="mini-card-text">
            You are logged in with a demo account. No backend required.
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-card-title">Next Steps</div>
          <div className="mini-card-text">
            Replace this demo with real content and integrate APIs when ready.
          </div>
        </div>
      </div>
    </section>
  );
}
