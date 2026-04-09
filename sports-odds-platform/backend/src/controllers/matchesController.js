const { query } = require('../config/db');
const { generateOddsForMatch, generateOddsBatch } = require('../services/oddsService');

/**
 * GET /matches
 * Returns all matches with AI-generated odds attached.
 */
const getMatches = async (req, res) => {
  try {
    const { sport, league, status = 'upcoming', limit = 20, offset = 0 } = req.query;

    let sql = `SELECT * FROM matches`;
    const params = [];
    
    const result = await query(sql, params);
    const matches = result.rows;

    if (matches.length === 0) {
      return res.json({ matches: [], count: 0 });
    }

    // Batch generate odds (bonus: single batch call)
    const matchesWithOdds = await generateOddsBatch(matches);

    const formattedMatches = matchesWithOdds.map((m) => ({
      match_id: m.id,
      teams: `${m.teama} vs ${m.teamb}`,
      teamA: m.teama,
      teamB: m.teamb,
      start_time: m.start_time,
      status: m.status,
      venue: m.venue,
      stats: {
        teamA: { rating: parseFloat(m.teama_rating), wins: m.teama_wins, losses: m.teama_losses },
        teamB: { rating: parseFloat(m.teamb_rating), wins: m.teamb_wins, losses: m.teamb_losses },
      },
      odds: m.oddsData?.odds || null,
      probabilities: m.oddsData?.probabilities || null,
      confidence_score: m.oddsData?.confidence_score || null,
      favorite: m.oddsData?.favorite || null,
      odds_cached: m.oddsData?.cached || false,
      odds_model: m.oddsData?.model || null,
    }));

    res.json({
      matches: formattedMatches,
      count: formattedMatches.length,
      filters: { sport, league, status },
    });
  } catch (err) {
    console.error('[Matches] getMatches error:', err.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

/**
 * GET /matches/:id
 * Returns a single match with fresh AI-generated odds.
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, league, teama, teamb,
              teama_rating, teamb_rating,
              teama_wins, teamb_wins,
              teama_losses, teamb_losses,
              start_time, status, venue
       FROM matches WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = result.rows[0];
    const oddsData = await generateOddsForMatch(match);

    res.json({
      match_id: match.id,
      league: match.league,
      teams: `${match.teama} vs ${match.teamb}`,
      teamA: match.teama,
      teamB: match.teamb,
      start_time: match.start_time,
      status: match.status,
      venue: match.venue,
      stats: {
        teamA: { rating: parseFloat(match.teama_rating), wins: match.teama_wins, losses: match.teama_losses },
        teamB: { rating: parseFloat(match.teamb_rating), wins: match.teamb_wins, losses: match.teamb_losses },
      },
      odds: oddsData.odds,
      probabilities: oddsData.probabilities,
      confidence_score: oddsData.confidence_score,
      favorite: oddsData.favorite,
      odds_cached: oddsData.cached,
      odds_model: oddsData.model,
    });
  } catch (err) {
    console.error('[Matches] getMatchById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
};

/**
 * GET /matches/sports
 * Returns available sports and leagues.
 */
const getSports = async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT league FROM matches`
    );
    res.json({ sports: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
};

module.exports = { getMatches, getMatchById, getSports };
