const { query } = require('../config/db');
const { generateOddsForMatch } = require('../services/oddsService');

const getFavorites = async (req, res) => {
  try {
    const result = await query(
      `SELECT m.id, m.sport, m.league, m.team_a, m.team_b,
              m.team_a_rating, m.team_b_rating,
              m.team_a_wins, m.team_b_wins,
              m.team_a_losses, m.team_b_losses,
              m.start_time, m.status, m.venue,
              f.created_at as favorited_at
       FROM favorites f
       JOIN matches m ON m.id = f.match_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    const matches = result.rows;

    // Generate odds for each favorited match
    const matchesWithOdds = await Promise.all(
      matches.map(async (m) => {
        try {
          const oddsData = await generateOddsForMatch(m);
          return {
            match_id: m.id,
            sport: m.sport,
            league: m.league,
            teams: `${m.team_a} vs ${m.team_b}`,
            teamA: m.team_a,
            teamB: m.team_b,
            start_time: m.start_time,
            status: m.status,
            venue: m.venue,
            favorited_at: m.favorited_at,
            stats: {
              teamA: { rating: parseFloat(m.team_a_rating), wins: m.team_a_wins, losses: m.team_a_losses },
              teamB: { rating: parseFloat(m.team_b_rating), wins: m.team_b_wins, losses: m.team_b_losses },
            },
            odds: oddsData.odds,
            probabilities: oddsData.probabilities,
            confidence_score: oddsData.confidence_score,
            favorite: oddsData.favorite,
          };
        } catch {
          return { match_id: m.id, teams: `${m.team_a} vs ${m.team_b}`, error: 'Odds unavailable' };
        }
      })
    );

    res.json({ favorites: matchesWithOdds, count: matchesWithOdds.length });
  } catch (err) {
    console.error('[Favorites] getFavorites error:', err.message);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Check match exists
    const matchExists = await query('SELECT id FROM matches WHERE id = $1', [matchId]);
    if (!matchExists.rows.length) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await query(
      'INSERT INTO favorites (user_id, match_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, matchId]
    );

    res.json({ message: 'Match added to favorites', match_id: matchId });
  } catch (err) {
    console.error('[Favorites] addFavorite error:', err.message);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { matchId } = req.params;
    await query(
      'DELETE FROM favorites WHERE user_id = $1 AND match_id = $2',
      [req.user.id, matchId]
    );
    res.json({ message: 'Match removed from favorites', match_id: matchId });
  } catch (err) {
    console.error('[Favorites] removeFavorite error:', err.message);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { matchId } = req.params;
    const result = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND match_id = $2',
      [req.user.id, matchId]
    );
    res.json({ isFavorite: result.rows.length > 0, match_id: matchId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check favorite' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
