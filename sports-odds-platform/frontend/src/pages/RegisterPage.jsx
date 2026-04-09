import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.username || !form.email || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(form.username, form.email, form.password);
      navigate('/matches');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoText}>ODDS</span>
          <span style={styles.logoAccent}>IQ</span>
          <span style={styles.logoBadge}>AI</span>
        </div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join the AI-powered sports intelligence platform</p>

        {error && <div style={styles.errorBox}>⚠ {error}</div>}

        <div style={styles.form}>
          {[
            { key: 'username', label: 'Username', type: 'text', placeholder: 'johndoe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
            { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={styles.input}
                placeholder={placeholder}
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.switchLink}>Sign in →</Link>
        </p>
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
  logoRow: { display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '0.5rem' },
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
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    letterSpacing: '0.04em',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  subtitle: { fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.4rem' },
  errorBox: {
    background: 'rgba(255,95,64,0.08)',
    border: '1px solid rgba(255,95,64,0.3)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    color: 'var(--accent-secondary)',
    fontSize: '0.85rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
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
    transition: 'all var(--transition)',
  },
  switchText: { fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' },
  switchLink: { color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 },
};
