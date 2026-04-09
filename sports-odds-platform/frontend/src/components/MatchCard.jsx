import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SPORT_ICONS = {
  Football: '⚽', Basketball: '🏀', Hockey: '🏒',
  Tennis: '🎾', Baseball: '⚾', Cricket: '🏏', Default: '🏆',
};

const formatOdds = (val) => (val != null ? Number(val).toFixed(2) : '—');
const formatPct = (val) => (val != null ? `${(val * 100).toFixed(1)}%` : '—');

export default function MatchCard({ match, showFavoriteBtn = true, isFavorited = false, onFavoriteChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(isFavorited);
  const [favLoading, setFavLoading] = useState(false);

  const icon = SPORT_ICONS[match.sport] || SPORT_ICONS.Default;
  const startDate = new Date(match.start_time);
  const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const probs = match.probabilities || {};
  const odds = match.odds || {};
  const pA = probs.teamA ?? 0;
  const pB = probs.teamB ?? 0;
  const pD = probs.draw ?? 0;
  const isFavoriteTeam = (team) => match.favorite === team;

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      if (favorited) {
        await api.delete(`/favorites/${match.match_id}`);
        setFavorited(false);
      } else {
        await api.post(`/favorites/${match.match_id}`);
        setFavorited(true);
      }
      onFavoriteChange?.();
    } catch (err) {
      console.error('Favorite error:', err);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/matches/${match.match_id}`)}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Card header */}
      <div style={styles.cardHeader}>
        <div style={styles.leagueBadge}>
          <span>{icon}</span>
          <span style={styles.leagueText}>{match.league}</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.timeBadge}>
            <span style={styles.timeDot}></span>
            {timeStr} · {dateStr}
          </div>
          {showFavoriteBtn && (
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              style={{
                ...styles.favBtn,
                color: favorited ? 'var(--accent-gold)' : 'var(--text-muted)',
              }}
              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {favorited ? '★' : '☆'}
            </button>
          )}
        </div>
      </div>

      {/* Teams & odds */}
      <div style={styles.teamsRow}>
        {/* Team A */}
        <div style={{ ...styles.teamBlock, alignItems: 'flex-start' }}>
          <span style={styles.teamName}>{match.teamA}</span>
          {isFavoriteTeam(match.teamA) && <span style={styles.favTag}>FAVORITE</span>}
          <span style={styles.probText}>{formatPct(pA)}</span>
          <span style={styles.oddsChip}>{formatOdds(odds.teamA)}</span>
        </div>

        {/* VS divider */}
        <div style={styles.vsDivider}>
          <span style={styles.vsText}>VS</span>
          {pD > 0.01 && (
            <div style={styles.drawBlock}>
              <span style={styles.drawLabel}>DRAW</span>
              <span style={styles.drawOdds}>{formatOdds(odds.draw)}</span>
              <span style={styles.drawProb}>{formatPct(pD)}</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div style={{ ...styles.teamBlock, alignItems: 'flex-end' }}>
          <span style={styles.teamName}>{match.teamB}</span>
          {isFavoriteTeam(match.teamB) && <span style={styles.favTag}>FAVORITE</span>}
          <span style={styles.probText}>{formatPct(pB)}</span>
          <span style={styles.oddsChip}>{formatOdds(odds.teamB)}</span>
        </div>
      </div>

      {/* Probability bar */}
      <div style={styles.probBarWrap}>
        <div
          style={{ ...styles.probBarA, width: `${pA * 100}%` }}
          title={`${match.teamA}: ${formatPct(pA)}`}
        />
        {pD > 0.01 && (
          <div
            style={{ ...styles.probBarDraw, width: `${pD * 100}%` }}
            title={`Draw: ${formatPct(pD)}`}
          />
        )}
        <div
          style={{ ...styles.probBarB, width: `${pB * 100}%` }}
          title={`${match.teamB}: ${formatPct(pB)}`}
        />
      </div>
      <div style={styles.probBarLabels}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>{match.teamA}</span>
        {pD > 0.01 && <span style={{ color: 'var(--accent-gold)', fontSize: '0.7rem' }}>Draw</span>}
        <span style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem' }}>{match.teamB}</span>
      </div>

      {/* Footer */}
      <div style={styles.cardFooter}>
        {match.venue && <span style={styles.venue}>📍 {match.venue}</span>}
        <div style={styles.footerRight}>
          {match.confidence_score != null && (
            <span style={{
              ...styles.confidenceBadge,
              background: match.confidence_score > 60
                ? 'rgba(0,229,160,0.1)' : 'rgba(255,95,64,0.1)',
              color: match.confidence_score > 60
                ? 'var(--accent-primary)' : 'var(--accent-secondary)',
            }}>
              {match.confidence_score.toFixed(0)}% confidence
            </span>
          )}
          {match.odds_cached && (
            <span style={styles.cachedBadge}>⚡ cached</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    animation: 'fadeUp 0.35s ease both',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: 'var(--bg-elevated)',
    padding: '0.25rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
  },
  leagueText: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  timeDot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--accent-primary)',
    display: 'inline-block',
  },
  favBtn: {
    fontSize: '1.1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    transition: 'all 0.15s',
    lineHeight: 1,
  },
  teamsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '0.75rem',
    alignItems: 'center',
  },
  teamBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  teamName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  favTag: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--accent-gold)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  probText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  oddsChip: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.02em',
  },
  vsDivider: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
  },
  vsText: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.12em',
    fontFamily: 'var(--font-mono)',
  },
  drawBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
    background: 'rgba(245,200,66,0.08)',
    border: '1px solid rgba(245,200,66,0.2)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.2rem 0.5rem',
  },
  drawLabel: {
    fontSize: '0.6rem',
    color: 'var(--accent-gold)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
  },
  drawOdds: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: 'var(--accent-gold)',
    fontFamily: 'var(--font-mono)',
  },
  drawProb: {
    fontSize: '0.65rem',
    color: 'rgba(245,200,66,0.7)',
    fontFamily: 'var(--font-mono)',
  },
  probBarWrap: {
    height: '5px',
    borderRadius: '4px',
    background: 'var(--bg-elevated)',
    display: 'flex',
    overflow: 'hidden',
    gap: '1px',
  },
  probBarA: {
    height: '100%',
    background: 'var(--accent-primary)',
    transition: 'width 0.6s ease',
    borderRadius: '4px 0 0 4px',
  },
  probBarDraw: {
    height: '100%',
    background: 'var(--accent-gold)',
    transition: 'width 0.6s ease',
  },
  probBarB: {
    height: '100%',
    background: 'var(--accent-secondary)',
    transition: 'width 0.6s ease',
    borderRadius: '0 4px 4px 0',
  },
  probBarLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '-0.2rem',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.1rem',
  },
  venue: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '60%',
  },
  footerRight: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  confidenceBadge: {
    fontSize: '0.68rem',
    fontWeight: 600,
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
  },
  cachedBadge: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
};
