-- Sports Odds Intelligence Platform - Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table (no hardcoded odds)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport VARCHAR(50) NOT NULL DEFAULT 'Football',
    league VARCHAR(100) NOT NULL,
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    team_a_rating DECIMAL(5,2) DEFAULT 70.0,
    team_b_rating DECIMAL(5,2) DEFAULT 70.0,
    team_a_wins INTEGER DEFAULT 10,
    team_b_wins INTEGER DEFAULT 10,
    team_a_losses INTEGER DEFAULT 5,
    team_b_losses INTEGER DEFAULT 5,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled')),
    venue VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cached odds table (bonus: caching to avoid recalculation)
CREATE TABLE IF NOT EXISTS cached_odds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_a_win_prob DECIMAL(6,4),
    team_b_win_prob DECIMAL(6,4),
    draw_prob DECIMAL(6,4),
    odds_team_a DECIMAL(8,2),
    odds_team_b DECIMAL(8,2),
    odds_draw DECIMAL(8,2),
    confidence_score DECIMAL(5,2),
    favorite VARCHAR(100),
    model_version VARCHAR(50) DEFAULT 'rating-logistic-v1',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    UNIQUE(match_id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_start_time ON matches(start_time);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_cached_odds_match_id ON cached_odds(match_id);
CREATE INDEX IF NOT EXISTS idx_cached_odds_expires ON cached_odds(expires_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- Seed matches (diverse sports and leagues)
INSERT INTO matches (sport, league, team_a, team_b, team_a_rating, team_b_rating, team_a_wins, team_b_wins, team_a_losses, team_b_losses, start_time, venue) VALUES
-- Premier League
('Football', 'Premier League', 'Manchester City', 'Arsenal', 89.5, 85.2, 24, 20, 6, 9, NOW() + INTERVAL '2 hours', 'Etihad Stadium'),
('Football', 'Premier League', 'Liverpool', 'Chelsea', 87.0, 78.5, 22, 16, 7, 12, NOW() + INTERVAL '4 hours', 'Anfield'),
('Football', 'Premier League', 'Tottenham', 'Manchester United', 76.0, 74.5, 15, 14, 14, 15, NOW() + INTERVAL '6 hours', 'Tottenham Hotspur Stadium'),
('Football', 'Premier League', 'Aston Villa', 'Newcastle', 80.0, 79.0, 18, 17, 10, 11, NOW() + INTERVAL '24 hours', 'Villa Park'),

-- La Liga
('Football', 'La Liga', 'Real Madrid', 'Barcelona', 92.0, 91.0, 26, 25, 4, 5, NOW() + INTERVAL '3 hours', 'Santiago Bernabeu'),
('Football', 'La Liga', 'Atletico Madrid', 'Sevilla', 83.0, 74.0, 20, 13, 8, 14, NOW() + INTERVAL '30 hours', 'Wanda Metropolitano'),

-- Champions League
('Football', 'UEFA Champions League', 'Bayern Munich', 'PSG', 90.5, 88.0, 23, 21, 5, 7, NOW() + INTERVAL '48 hours', 'Allianz Arena'),
('Football', 'UEFA Champions League', 'Inter Milan', 'Borussia Dortmund', 82.0, 80.5, 18, 17, 9, 10, NOW() + INTERVAL '52 hours', 'San Siro'),

-- NBA
('Basketball', 'NBA', 'Boston Celtics', 'Miami Heat', 88.0, 79.0, 54, 38, 18, 34, NOW() + INTERVAL '5 hours', 'TD Garden'),
('Basketball', 'NBA', 'LA Lakers', 'Denver Nuggets', 82.5, 86.0, 42, 50, 30, 22, NOW() + INTERVAL '7 hours', 'Crypto.com Arena'),
('Basketball', 'NBA', 'Golden State Warriors', 'Phoenix Suns', 84.0, 83.0, 46, 44, 26, 28, NOW() + INTERVAL '9 hours', 'Chase Center'),

-- NHL
('Hockey', 'NHL', 'Florida Panthers', 'Tampa Bay Lightning', 87.0, 85.5, 47, 44, 20, 23, NOW() + INTERVAL '5 hours', 'Amerant Bank Arena'),
('Hockey', 'NHL', 'Colorado Avalanche', 'Dallas Stars', 83.0, 82.5, 43, 42, 24, 25, NOW() + INTERVAL '8 hours', 'Ball Arena'),

-- Tennis
('Tennis', 'ATP Masters', 'Novak Djokovic', 'Carlos Alcaraz', 96.0, 93.0, 82, 68, 12, 18, NOW() + INTERVAL '3 hours', 'Centre Court'),
('Tennis', 'WTA Tour', 'Iga Swiatek', 'Aryna Sabalenka', 94.0, 91.0, 70, 62, 10, 16, NOW() + INTERVAL '5 hours', 'Court Philippe Chatrier'),

-- Cricket
('Cricket', 'IPL', 'Mumbai Indians', 'Chennai Super Kings', 85.0, 87.0, 9, 11, 5, 3, NOW() + INTERVAL '1 hour', 'Wankhede Stadium'),
('Cricket', 'IPL', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 79.0, 81.0, 7, 8, 7, 6, NOW() + INTERVAL '26 hours', 'M Chinnaswamy Stadium')

ON CONFLICT DO NOTHING;
