import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MatchCard from '../components/MatchCard';
import SkeletonCard from '../components/SkeletonCard';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.favorites || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFavorites(); }, []);

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>FAVORITES</h1>
          <p style={styles.subtitle}>
            {loading ? 'Loading...' : `${favorites.length} saved match${favorites.length !== 1 ? 'es' : ''} with live odds`}
          </p>
        </div>
        <button onClick={fetchFavorites} style={styles.refreshBtn} disabled={loading}>
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && favorites.length === 0 && (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>☆</span>
          <p style={styles.emptyTitle}>No favorites yet</p>
          <p style={styles.emptyText}>Star matches from the Matches page to track them here with live odds.</p>
          <button
            onClick={() => navigate('/matches')}
            style={styles.browsBtn}
          >
            Browse Matches →
          </button>
        </div>
      )}

      <div style={styles.grid}>
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : favorites.map((fav) => (
            <MatchCard
              key={fav.match_id}
              match={fav}
              isFavorited={true}
              onFavoriteChange={fetchFavorites}
            />
          ))
        }
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    letterSpacing: '0.06em',
    color: 'var(--accent-gold)',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '0.3rem',
    fontFamily: 'var(--font-mono)',
  },
  refreshBtn: {
    padding: '0.5rem 1.1rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  errorBox: {
    background: 'rgba(255,95,64,0.08)',
    border: '1px solid rgba(255,95,64,0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.2rem',
    color: 'var(--accent-secondary)',
    marginBottom: '1rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '5rem 2rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '4rem',
    color: 'var(--accent-gold)',
    opacity: 0.4,
    lineHeight: 1,
  },
  emptyTitle: { fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' },
  emptyText: { fontSize: '0.85rem', maxWidth: '320px', lineHeight: 1.6 },
  browsBtn: {
    marginTop: '0.5rem',
    padding: '0.6rem 1.4rem',
    background: 'var(--accent-primary)',
    color: '#080b0f',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all var(--transition)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1rem',
  },
};
