const axios = require('axios');
const { cacheGet, cacheSet } = require('../config/redis');
const { query } = require('../config/db');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5001';
const CACHE_TTL = parseInt(process.env.ODDS_CACHE_TTL) || 600;

/**
 * Generate odds for a single match via Python service.
 * Uses Redis cache first, then DB cache, then Python service.
 */
const generateOddsForMatch = async (match) => {
  const cacheKey = `odds:${match.id}`;

  // 1. Try Redis cache
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return { ...cached, cached: true, cache_source: 'redis' };
  }

  // 2. Try DB cache (not expired)
  try {
    const dbCached = await query(
      `SELECT * FROM cached_odds WHERE match_id = $1 AND expires_at > NOW()`,
      [match.id]
    );
    if (dbCached.rows.length > 0) {
      const row = dbCached.rows[0];
      const oddsData = formatDbCachedOdds(row, match);
      await cacheSet(cacheKey, oddsData, 300); // warm Redis with 5min TTL
      return { ...oddsData, cached: true, cache_source: 'db' };
    }
  } catch (err) {
    console.warn('[OddsService] DB cache lookup failed:', err.message);
  }

  // 3. Call Python service
  const oddsData = await callPythonService(match);

  // 4. Store in DB cache
  await storeOddsInDb(match.id, oddsData);

  // 5. Store in Redis
  await cacheSet(cacheKey, oddsData, CACHE_TTL);

  return { ...oddsData, cached: false };
};

/**
 * Batch generate odds for multiple matches (bonus: batch API call).
 */
const generateOddsBatch = async (matches) => {
  if (!matches || matches.length === 0) return [];

  // Check which matches have cached odds
  const uncachedMatches = [];
  const results = new Map();

  for (const match of matches) {
    const cacheKey = `odds:${match.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      results.set(match.id, { ...cached, cached: true, cache_source: 'redis' });
    } else {
      uncachedMatches.push(match);
    }
  }

  // Batch call Python for uncached matches
  if (uncachedMatches.length > 0) {
    try {
      const payload = {
        matches: uncachedMatches.map((m) => ({
          match_id: m.id,
          teamA: m.team_a,
          teamB: m.team_b,
          teamA_rating: parseFloat(m.team_a_rating) || 70,
          teamB_rating: parseFloat(m.team_b_rating) || 70,
          teamA_wins: parseInt(m.team_a_wins) || 10,
          teamB_wins: parseInt(m.team_b_wins) || 10,
          teamA_losses: parseInt(m.team_a_losses) || 5,
          teamB_losses: parseInt(m.team_b_losses) || 5,
          sport: m.sport,
          league: m.league,
        })),
      };

      const response = await axios.post(`${PYTHON_URL}/generate-odds-batch`, payload, {
        timeout: 10000,
      });

      const batchResults = response.data.results || [];

      for (const oddsResult of batchResults) {
        if (oddsResult.error) continue;
        const matchId = oddsResult.match_id;
        const match = uncachedMatches.find((m) => m.id === matchId);
        if (!match) continue;

        const formatted = formatPythonOdds(oddsResult, match);
        results.set(matchId, { ...formatted, cached: false });

        // Cache individually
        await cacheSet(`odds:${matchId}`, formatted, CACHE_TTL);
        await storeOddsInDb(matchId, formatted).catch(() => {});
      }
    } catch (err) {
      console.error('[OddsService] Batch Python call failed:', err.message);
      // Fallback: generate individually
      for (const match of uncachedMatches) {
        try {
          const oddsData = await callPythonService(match);
          results.set(match.id, { ...oddsData, cached: false });
          await cacheSet(`odds:${match.id}`, oddsData, CACHE_TTL);
          await storeOddsInDb(match.id, oddsData).catch(() => {});
        } catch {
          results.set(match.id, null);
        }
      }
    }
  }

  // Return in original order
  return matches.map((m) => ({
    ...m,
    oddsData: results.get(m.id) || null,
  }));
};

/**
 * Call Python service for a single match.
 */
const callPythonService = async (match) => {
  const payload = {
    teamA: match.teama,
    teamB: match.teamb,
    teamA_rating: parseFloat(match.team_a_rating) || 70,
    teamB_rating: parseFloat(match.team_b_rating) || 70,
    teamA_wins: parseInt(match.team_a_wins) || 10,
    teamB_wins: parseInt(match.team_b_wins) || 10,
    teamA_losses: parseInt(match.team_a_losses) || 5,
    teamB_losses: parseInt(match.team_b_losses) || 5,
    sport: match.sport,
    league: match.league,
  };

  const response = await axios.post(`${PYTHON_URL}/generate-odds`, payload, {
    timeout: 8000,
  });

  return formatPythonOdds(response.data, match);
};

const formatPythonOdds = (data, match) => ({
  teamA: match.teama,
  teamB: match.teamb,
  probabilities: {
    teamA: data.teamA_win_prob,
    teamB: data.teamB_win_prob,
    draw: data.draw_prob,
  },
  odds: {
    teamA: data.odds?.teamA,
    teamB: data.odds?.teamB,
    draw: data.odds?.draw,
  },
  confidence_score: data.confidence_score,
  favorite: data.favorite === "teamA" ? match.teama : match.teamb,
  model: data.model || 'rating-logistic-v1',
  generated_at: new Date().toISOString(),
});

const formatDbCachedOdds = (row, match) => ({
  teamA: match.team_a,
  teamB: match.team_b,
  probabilities: {
    teamA: parseFloat(row.team_a_win_prob),
    teamB: parseFloat(row.team_b_win_prob),
    draw: parseFloat(row.draw_prob),
  },
  odds: {
    teamA: parseFloat(row.odds_team_a),
    teamB: parseFloat(row.odds_team_b),
    draw: parseFloat(row.odds_draw),
  },
  confidence_score: parseFloat(row.confidence_score),
  favorite: row.favorite,
  model: row.model_version,
  generated_at: row.generated_at,
});

const storeOddsInDb = async (matchId, oddsData) => {
  try {
    await query(
      `INSERT INTO cached_odds 
        (match_id, team_a_win_prob, team_b_win_prob, draw_prob,
         odds_team_a, odds_team_b, odds_draw, confidence_score, favorite, model_version, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '10 minutes')
       ON CONFLICT (match_id) DO UPDATE SET
         team_a_win_prob = EXCLUDED.team_a_win_prob,
         team_b_win_prob = EXCLUDED.team_b_win_prob,
         draw_prob = EXCLUDED.draw_prob,
         odds_team_a = EXCLUDED.odds_team_a,
         odds_team_b = EXCLUDED.odds_team_b,
         odds_draw = EXCLUDED.odds_draw,
         confidence_score = EXCLUDED.confidence_score,
         favorite = EXCLUDED.favorite,
         generated_at = NOW(),
         expires_at = NOW() + INTERVAL '10 minutes'`,
      [
        matchId,
        oddsData.probabilities.teamA,
        oddsData.probabilities.teamB,
        oddsData.probabilities.draw,
        oddsData.odds.teamA,
        oddsData.odds.teamB,
        oddsData.odds.draw,
        oddsData.confidence_score,
        oddsData.favorite,
        oddsData.model,
      ]
    );
  } catch (err) {
    console.warn('[OddsService] Failed to store odds in DB:', err.message);
  }
};

module.exports = { generateOddsForMatch, generateOddsBatch };
