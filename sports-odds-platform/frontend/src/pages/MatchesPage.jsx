import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import MatchCard from '../components/MatchCard';
import SkeletonCard from '../components/SkeletonCard';

const SPORTS = ['All', 'Football', 'Basketball', 'Hockey', 'Tennis', 'Cricket'];

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('time');

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { status: 'upcoming', limit: 50 };
      if (selectedSport !== 'All') params.sport = selectedSport;
      const res = await api.get('/matches', { params });
      setMatches(res.data.matches || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const filtered = matches
    .filter(m => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.teamA?.toLowerCase().includes(q) ||
        m.teamB?.toLowerCase().includes(q) ||
        m.league?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'time') return new Date(a.start_time) - new Date(b.start_time);
      if (sortBy === 'confidence') return (b.confidence_score ?? 0) - (a.confidence_score ?? 0);
      if (sortBy === 'odds') return (a.odds?.teamA ?? 0) - (b.odds?.teamA ?? 0);
      return 0;
    });

  return (
    <div>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>LIVE ODDS</h1>
          <p style={styles.pageSubtitle}>
            AI-generated odds • Updated in real-time • {matches.length} matches available
          </p>
        </div>
        <button onClick={fetchMatches} style={styles.refreshBtn} disabled={loading}>
          {loading ? '...' : '↻ Refresh'}
        </button>
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        {/* Sport tabs */}
        <div style={styles.sportTabs}>
          {SPORTS.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              style={{
                ...styles.sportTab,
                ...(selectedSport === sport ? styles.sportTabActive : {}),
              }}
            >
              {sport}
            </button>
          ))}
        </div>

        <div style={styles.filterRight}>
          {/* Search */}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Search teams, leagues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="time">Sort: Time</option>
            <option value="confidence">Sort: Confidence</option>
            <option value="odds">Sort: Odds</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <span style={styles.statVal}>{filtered.length}</span>
            <span style={styles.statLabel}>Matches</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {filtered.filter(m => m.confidence_score > 60).length}
            </span>
            <span style={styles.statLabel}>High Confidence</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statVal}>
              {new Set(filtered.map(m => m.sport)).size}
            </span>
            <span style={styles.statLabel}>Sports</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statVal} style={{ color: 'var(--accent-primary)' }}>LIVE</span>
            <span style={styles.statLabel}>AI Model</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span>⚠ {error}</span>
          <button onClick={fetchMatches} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* Grid */}
      <div style={styles.grid}>
        {loading
          ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
            ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>⚽</span>
                <p style={styles.emptyText}>No matches found</p>
                <p style={styles.emptySubtext}>Try adjusting your filters</p>
              </div>
            )
            : filtered.map((match, i) => (
              <div key={match.match_id} style={{ animationDelay: `${i * 0.05}s` }}>
                <MatchCard match={match} />
              </div>
            ))
        }
      </div>
    </div>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '1.5rem',
  },
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    letterSpacing: '0.06em',
    lineHeight: 1,
    color: 'var(--text-primary)',
  },
  pageSubtitle: {
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
    transition: 'all var(--transition)',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  sportTabs: { display: 'flex', gap: '0.3rem', flexWrap: 'wrap' },
  sportTab: {
    padding: '0.4rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.82rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
  },
  sportTabActive: {
    color: 'var(--accent-primary)',
    background: 'var(--accent-dim)',
    border: '1px solid var(--border-accent)',
  },
  filterRight: { display: 'flex', gap: '0.6rem', alignItems: 'center' },
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.6rem',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    pointerEvents: 'none',
  },
  searchInput: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.8rem 0.4rem 1.8rem',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    outline: 'none',
    width: '200px',
    transition: 'all var(--transition)',
  },
  sortSelect: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.7rem',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
    outline: 'none',
    cursor: 'pointer',
  },
  statsBar: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    padding: '0.8rem 1.2rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
    marginBottom: '1.5rem',
  },
  statItem: { display: 'flex', flexDirection: 'column', gap: '1px' },
  statVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--accent-primary)',
  },
  statLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statDivider: { width: '1px', height: '30px', background: 'var(--border-subtle)' },
  errorBox: {
    background: 'rgba(255,95,64,0.08)',
    border: '1px solid rgba(255,95,64,0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.2rem',
    color: 'var(--accent-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  retryBtn: {
    padding: '0.35rem 0.8rem',
    background: 'rgba(255,95,64,0.15)',
    border: '1px solid rgba(255,95,64,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1rem',
  },
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '4rem',
    color: 'var(--text-muted)',
  },
  emptyIcon: { fontSize: '3rem', marginBottom: '0.5rem' },
  emptyText: { fontSize: '1.1rem', fontWeight: 500 },
  emptySubtext: { fontSize: '0.85rem' },
};
