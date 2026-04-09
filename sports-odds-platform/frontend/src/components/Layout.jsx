import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV_LINKS = [
  { to: '/matches', label: 'Matches', icon: '⚡' },
  { to: '/favorites', label: 'Favorites', icon: '★' },
  { to: '/agent', label: 'AI Agent', icon: '◈' },
];

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top ticker */}
      <div style={styles.ticker}>
        <div style={styles.tickerInner}>
          {Array(3).fill([
            'MAN CITY vs ARSENAL • 2H',
            'REAL MADRID vs BARCELONA • 3H',
            'CELTICS vs HEAT • 5H',
            'DJOKOVIC vs ALCARAZ • 3H',
            'LAKERS vs NUGGETS • 7H',
            'BAYERN vs PSG • 48H',
          ]).flat().map((item, i) => (
            <span key={i} style={styles.tickerItem}>
              <span style={styles.tickerDot}>●</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          {/* Logo */}
          <NavLink to="/matches" style={styles.logo}>
            <span style={styles.logoText}>ODDS</span>
            <span style={styles.logoAccent}>IQ</span>
            <span style={styles.logoBadge}>AI</span>
          </NavLink>

          {/* Desktop nav links */}
          <div style={styles.navLinks}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <span style={{ fontSize: '0.8rem' }}>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth section */}
          <div style={styles.authSection}>
            {isAuthenticated ? (
              <div style={styles.userMenu}>
                <span style={styles.userName}>
                  <span style={styles.userDot}></span>
                  {user?.username}
                </span>
                <button onClick={handleLogout} style={styles.btnLogout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={styles.authButtons}>
                <button onClick={() => navigate('/login')} style={styles.btnGhost}>
                  Sign In
                </button>
                <button onClick={() => navigate('/register')} style={styles.btnPrimary}>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.1em' }}>
            ODDS<span style={{ color: 'var(--accent-primary)' }}>IQ</span>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            AI-powered odds engine • For entertainment only
          </span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  ticker: {
    background: 'var(--accent-primary)',
    overflow: 'hidden',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
  },
  tickerInner: {
    display: 'flex',
    gap: '2.5rem',
    animation: 'ticker 40s linear infinite',
    whiteSpace: 'nowrap',
    width: 'max-content',
  },
  tickerItem: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#080b0f',
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  tickerDot: { color: 'rgba(0,0,0,0.4)', fontSize: '0.5rem' },
  nav: {
    background: 'rgba(8,11,15,0.95)',
    borderBottom: '1px solid var(--border-subtle)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    textDecoration: 'none',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    letterSpacing: '0.08em',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  logoAccent: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
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
    marginBottom: '10px',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.05em',
  },
  navLinks: {
    display: 'flex',
    gap: '0.25rem',
    flex: 1,
    marginLeft: '1rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all var(--transition)',
    letterSpacing: '0.02em',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: 'var(--accent-primary)',
    background: 'var(--accent-dim)',
  },
  authSection: { marginLeft: 'auto' },
  userMenu: { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  userName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
  },
  userDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    display: 'inline-block',
    animation: 'pulse-glow 2s infinite',
  },
  authButtons: { display: 'flex', gap: '0.6rem' },
  btnGhost: {
    padding: '0.4rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-subtle)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  btnPrimary: {
    padding: '0.4rem 1rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#080b0f',
    background: 'var(--accent-primary)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  btnLogout: {
    padding: '0.35rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    border: '1px solid var(--border-subtle)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  main: {
    flex: 1,
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  footer: {
    borderTop: '1px solid var(--border-subtle)',
    padding: '1.2rem 1.5rem',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};
