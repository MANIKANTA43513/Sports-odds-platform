import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate('/matches');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <span style={styles.logoText}>ODDS</span>
          <span style={styles.logoAccent}>IQ</span>
          <span style={styles.logoBadge}>AI</span>
        </div>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>Access your personalized odds dashboard</p>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={styles.input}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.switchLink}>Register free →</Link>
        </p>

        <div style={styles.divider} />
        <Link to="/matches" style={styles.guestLink}>
          Continue as guest (view-only) →
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,229,160,0.07) 0%, transparent 70%)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    animation: 'fadeUp 0.4s ease both',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    marginBottom: '0.5rem',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  logoAccent: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.08em',
    color: 'var(--accent-primary)',
    lineHeight: 1,
  },
  logoBadge: {
    background: 'var(--accent-primary)',
    color: '#080b0f',
    fontSize: '0.55rem',
    fontWeight: 700,
    padding: '2px 5px',
    borderRadius: '4px',
    marginLeft: '4px',
    marginBottom: '12px',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.05em',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.04em',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '-0.4rem',
  },
  errorBox: {
    background: 'rgba(255,95,64,0.08)',
    border: '1px solid rgba(255,95,64,0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    color: 'var(--accent-secondary)',
    fontSize: '0.85rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' },
  input: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.7rem 0.85rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color var(--transition)',
  },
  submitBtn: {
    padding: '0.8rem',
    background: 'var(--accent-primary)',
    color: '#080b0f',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.25rem',
    letterSpacing: '0.03em',
    transition: 'all var(--transition)',
  },
  switchText: { fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' },
  switchLink: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 },
  divider: { height: '1px', background: 'var(--border-subtle)' },
  guestLink: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    textDecoration: 'none',
    transition: 'color var(--transition)',
  },
};
