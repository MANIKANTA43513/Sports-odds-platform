import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatOdds = (v) => (v != null ? Number(v).toFixed(2) : '—');
const formatPct = (v) => (v != null ? `${(v * 100).toFixed(1)}%` : '—');

function ProbBar({ label, value, color, oddsVal }) {
  const pct = (value ?? 0) * 100;
  return (
    <div style={barStyles.row}>
      <div style={barStyles.labelRow}>
        <span style={barStyles.label}>{label}</span>
        <div style={barStyles.rightInfo}>
          <span style={{ ...barStyles.pct, color }}>
            {formatPct(value)}
          </span>
          <span style={barStyles.odds}>{formatOdds(oddsVal)}</span>
        </div>
      </div>
      <div style={barStyles.track}>
        <div style={{
          ...barStyles.fill,
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 12px ${color}66`,
        }} />
      </div>
    </div>
  );
}

const barStyles = {
  row: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' },
  rightInfo: { display: 'flex', gap: '1rem', alignItems: 'center' },
  pct: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' },
  odds: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    minWidth: '50px',
    textAlign: 'right',
  },
  track: {
    height: '10px',
    background: 'var(--bg-elevated)',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export default function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/matches/${id}`);
        setMatch(res.data);
        if (isAuthenticated) {
          const favRes = await api.get(`/favorites/check/${id}`);
          setFavorited(favRes.data.isFavorite);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Match not found');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      if (favorited) {
        await api.delete(`/favorites/${id}`);
        setFavorited(false);
      } else {
        await api.post(`/favorites/${id}`);
        setFavorited(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.spinner} />
      <p style={styles.loadingText}>Generating odds...</p>
    </div>
  );
  if (error) return (
    <div style={styles.errorWrap}>
      <p style={{ color: 'var(--accent-secondary)' }}>⚠ {error}</p>
      <button onClick={() => navigate('/matches')} style={styles.backBtn}>← Back to Matches</button>
    </div>
  );
  if (!match) return null;

  const { probabilities: probs = {}, odds = {}, stats = {} } = match;

  return (
    <div style={styles.page}>
      {/* Back nav */}
      <button onClick={() => navigate('/matches')} style={styles.backBtn}>
        ← All Matches
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.leagueBadge}>
          <span>{match.sport}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span>{match.league}</span>
        </div>

        <div style={styles.matchupTitle}>
          <span style={styles.teamTitle}>{match.teamA}</span>
          <span style={styles.vsGlyph}>⚡</span>
          <span style={styles.teamTitle}>{match.teamB}</span>
        </div>

        <div style={styles.metaRow}>
          {match.venue && <span>📍 {match.venue}</span>}
          <span>🕐 {new Date(match.start_time).toLocaleString()}</span>
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            style={{
              ...styles.favBtn,
              color: favorited ? 'var(--accent-gold)' : 'var(--text-muted)',
            }}
          >
            {favorited ? '★ Saved' : '☆ Save Match'}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Probability breakdown */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>WIN PROBABILITY</h3>
          <div style={styles.probSection}>
            <ProbBar
              label={match.teamA}
              value={probs.teamA}
              color="var(--accent-primary)"
              oddsVal={odds.teamA}
            />
            {probs.draw > 0.01 && (
              <ProbBar
                label="Draw"
                value={probs.draw}
                color="var(--accent-gold)"
                oddsVal={odds.draw}
              />
            )}
            <ProbBar
              label={match.teamB}
              value={probs.teamB}
              color="var(--accent-secondary)"
              oddsVal={odds.teamB}
            />
          </div>

          {match.favorite && (
            <div style={styles.favoriteCallout}>
              <span style={styles.calloutIcon}>🎯</span>
              <div>
                <div style={styles.calloutTitle}>PREDICTED WINNER</div>
                <div style={styles.calloutValue}>{match.favorite}</div>
              </div>
              {match.confidence_score != null && (
                <div style={styles.confidenceRing}>
                  <span style={styles.confNum}>{match.confidence_score.toFixed(0)}</span>
                  <span style={styles.confLabel}>% conf.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Odds table */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>MARKET ODDS</h3>
          <div style={styles.oddsTable}>
            <OddsRow outcome={match.teamA} oddsVal={odds.teamA} prob={probs.teamA} highlight />
            {probs.draw > 0.01 && (
              <OddsRow outcome="Draw" oddsVal={odds.draw} prob={probs.draw} gold />
            )}
            <OddsRow outcome={match.teamB} oddsVal={odds.teamB} prob={probs.teamB} />
          </div>
          <p style={styles.modelBadge}>
            Model: <span style={{ color: 'var(--accent-primary)' }}>{match.odds_model || 'rating-logistic-v1'}</span>
            {match.odds_cached && ' · ⚡ cached'}
          </p>
        </div>

        {/* Team stats */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>TEAM STATISTICS</h3>
          <div style={styles.statsGrid}>
            <TeamStatBlock team={match.teamA} stats={stats.teamA} color="var(--accent-primary)" />
            <TeamStatBlock team={match.teamB} stats={stats.teamB} color="var(--accent-secondary)" />
          </div>
        </div>

        {/* Model inputs */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>AI MODEL INPUTS</h3>
          <div style={styles.inputsList}>
            <ModelInput label="Team A Rating" value={stats.teamA?.rating?.toFixed(1) ?? '—'} />
            <ModelInput label="Team B Rating" value={stats.teamB?.rating?.toFixed(1) ?? '—'} />
            <ModelInput label="Team A Win Rate" value={
              stats.teamA ? `${((stats.teamA.wins / (stats.teamA.wins + stats.teamA.losses || 1)) * 100).toFixed(0)}%` : '—'
            } />
            <ModelInput label="Team B Win Rate" value={
              stats.teamB ? `${((stats.teamB.wins / (stats.teamB.wins + stats.teamB.losses || 1)) * 100).toFixed(0)}%` : '—'
            } />
            <ModelInput label="Sport" value={match.sport} />
            <ModelInput label="League" value={match.league} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OddsRow({ outcome, oddsVal, prob, highlight, gold }) {
  return (
    <div style={{
      ...oddsRowStyles.row,
      background: highlight ? 'rgba(0,229,160,0.05)'
                : gold ? 'rgba(245,200,66,0.05)' : 'transparent',
      borderColor: highlight ? 'rgba(0,229,160,0.15)'
                 : gold ? 'rgba(245,200,66,0.15)' : 'var(--border-subtle)',
    }}>
      <span style={oddsRowStyles.outcome}>{outcome}</span>
      <span style={oddsRowStyles.prob}>{formatPct(prob)}</span>
      <span style={{
        ...oddsRowStyles.odds,
        color: highlight ? 'var(--accent-primary)'
              : gold ? 'var(--accent-gold)' : 'var(--text-primary)',
      }}>
        {formatOdds(oddsVal)}
      </span>
    </div>
  );
}

const oddsRowStyles = {
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '1rem',
    alignItems: 'center',
    padding: '0.7rem 0.9rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
    marginBottom: '0.5rem',
  },
  outcome: { fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' },
  prob: { fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  odds: { fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)' },
};

function TeamStatBlock({ team, stats, color }) {
  if (!stats) return null;
  const winRate = ((stats.wins / (stats.wins + stats.losses || 1)) * 100).toFixed(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {team}
      </div>
      <StatLine label="Rating" value={`${Number(stats.rating).toFixed(1)} / 100`} />
      <StatLine label="Wins" value={stats.wins} />
      <StatLine label="Losses" value={stats.losses} />
      <StatLine label="Win Rate" value={`${winRate}%`} />
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ModelInput({ label, value }) {
  return (
    <div style={modelInputStyles.row}>
      <span style={modelInputStyles.label}>{label}</span>
      <span style={modelInputStyles.value}>{value}</span>
    </div>
  );
}
const modelInputStyles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-subtle)',
  },
  label: { fontSize: '0.82rem', color: 'var(--text-secondary)' },
  value: { fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 500 },
};

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  loadingWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '1rem', padding: '5rem', color: 'var(--text-muted)',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid var(--bg-elevated)',
    borderTop: '3px solid var(--accent-primary)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontFamily: 'var(--font-mono)', fontSize: '0.85rem' },
  errorWrap: { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '3rem', alignItems: 'center' },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0.4rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    alignSelf: 'flex-start',
    transition: 'color var(--transition)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.5rem',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
  },
  leagueBadge: {
    display: 'flex',
    gap: '0.5rem',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  matchupTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  teamTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.8rem, 4vw, 3rem)',
    letterSpacing: '0.04em',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  vsGlyph: {
    fontSize: '1.5rem',
    color: 'var(--accent-primary)',
    animation: 'pulse-glow 2s infinite',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    flexWrap: 'wrap',
  },
  favBtn: {
    background: 'none',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
    fontSize: '0.82rem',
    transition: 'all var(--transition)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  cardTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  probSection: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  favoriteCallout: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'rgba(0,229,160,0.06)',
    border: '1px solid rgba(0,229,160,0.2)',
    borderRadius: 'var(--radius-md)',
    padding: '0.85rem 1rem',
    marginTop: '0.5rem',
  },
  calloutIcon: { fontSize: '1.4rem' },
  calloutTitle: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  calloutValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    marginTop: '1px',
  },
  confidenceRing: {
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(0,229,160,0.1)',
    borderRadius: '50%',
    width: '54px',
    height: '54px',
    justifyContent: 'center',
  },
  confNum: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: 'var(--accent-primary)',
    lineHeight: 1,
  },
  confLabel: { fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  oddsTable: { display: 'flex', flexDirection: 'column' },
  modelBadge: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    marginTop: 'auto',
    paddingTop: '0.5rem',
    borderTop: '1px solid var(--border-subtle)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  inputsList: { display: 'flex', flexDirection: 'column' },
};
