const axios = require('axios');
const { query } = require('../config/db');
const { generateOddsBatch } = require('../services/oddsService');

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * POST /agent/query
 * Natural language query about match odds.
 */
const agentQuery = async (req, res) => {
  try {
    const { query: userQuery, matchIds } = req.body;

    if (!userQuery || typeof userQuery !== 'string') {
      return res.status(400).json({ error: 'query field is required and must be a string' });
    }

    // Fetch matches to reason over
    let sqlQuery = `
      SELECT id, sport, league, team_a, team_b,
             team_a_rating, team_b_rating,
             team_a_wins, team_b_wins,
             team_a_losses, team_b_losses,
             start_time, status, venue
      FROM matches WHERE status = 'upcoming'
      ORDER BY start_time ASC LIMIT 20
    `;
    const params = [];

    if (matchIds && Array.isArray(matchIds) && matchIds.length > 0) {
      sqlQuery = `
        SELECT id, sport, league, team_a, team_b,
               team_a_rating, team_b_rating,
               team_a_wins, team_b_wins,
               team_a_losses, team_b_losses,
               start_time, status, venue
        FROM matches WHERE id = ANY($1::uuid[])
      `;
      params.push(matchIds);
    }

    const dbResult = await query(sqlQuery, params);
    const matches = dbResult.rows;

    if (!matches.length) {
      return res.json({
        answer: 'No matches are currently available for analysis.',
        query: userQuery,
        matches_analyzed: 0,
      });
    }

    // Get odds for all matches
    const matchesWithOdds = await generateOddsBatch(matches);

    // Format for Python agent
    const agentMatches = matchesWithOdds
      .filter((m) => m.oddsData)
      .map((m) => ({
        match_id: m.id,
        teamA: m.team_a,
        teamB: m.team_b,
        sport: m.sport,
        league: m.league,
        start_time: m.start_time,
        probabilities: m.oddsData.probabilities,
        odds: m.oddsData.odds,
        confidence_score: m.oddsData.confidence_score,
        favorite: m.oddsData.favorite,
      }));

    // Call Python agent
    const agentResponse = await axios.post(
      `${PYTHON_URL}/agent/analyze`,
      { query: userQuery, matches: agentMatches },
      { timeout: 10000 }
    );

    const agentResult = agentResponse.data;

    res.json({
      answer: agentResult.answer,
      query: userQuery,
      intent_detected: agentResult.intent_detected,
      tools_used: agentResult.tools_used,
      matches_analyzed: agentMatches.length,
      supporting_data: agentResult.match || agentResult.matches || null,
    });
  } catch (err) {
    console.error('[Agent] Query error:', err.message);

    // Graceful fallback if Python service is down
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({
        error: 'AI Agent service temporarily unavailable',
        fallback_answer: 'The AI analysis service is currently starting up. Please try again in a moment.',
      });
    }

    res.status(500).json({ error: 'Agent query failed' });
  }
};

module.exports = { agentQuery };
