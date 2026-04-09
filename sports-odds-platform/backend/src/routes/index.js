const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { getMatches, getMatchById, getSports } = require('../controllers/matchesController');
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require('../controllers/favoritesController');
const { agentQuery } = require('../controllers/agentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'sports-odds-api', version: '1.0.0' }));

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', authenticate, getProfile);

// Matches routes (public)
router.get('/matches', getMatches);
router.get('/matches/sports', getSports);
router.get('/matches/:id', getMatchById);

// Favorites (protected)
router.get('/favorites', authenticate, getFavorites);
router.post('/favorites/:matchId', authenticate, addFavorite);
router.delete('/favorites/:matchId', authenticate, removeFavorite);
router.get('/favorites/check/:matchId', authenticate, checkFavorite);

// AI Agent (public)
router.post('/agent/query', agentQuery);

module.exports = router;
