-- Cricket Scoring Application Database Schema

-- Drop tables if they exist (for clean migrations)
DROP TABLE IF EXISTS partnerships CASCADE;
DROP TABLE IF EXISTS dismissals CASCADE;
DROP TABLE IF EXISTS balls CASCADE;
DROP TABLE IF EXISTS overs CASCADE;
DROP TABLE IF EXISTS innings CASCADE;
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS tournament_teams CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TABLE IF EXISTS team_players CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (for authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  primary_color VARCHAR(7) DEFAULT '#dc2626',
  secondary_color VARCHAR(7) DEFAULT '#000000',
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  jersey_number INTEGER,
  role VARCHAR(20) CHECK (role IN ('batter', 'bowler', 'all-rounder', 'wicket-keeper')),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Players junction table (many-to-many)
CREATE TABLE team_players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(team_id, player_id)
);

-- Tournaments table
CREATE TABLE tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  format VARCHAR(20) CHECK (format IN ('T20', 'T40', 'T50', '2-day', 'custom')),
  overs_per_innings INTEGER,
  start_date DATE,
  end_date DATE,
  tournament_type VARCHAR(20) CHECK (tournament_type IN ('round-robin', 'knockout', 'group-stage')),
  points_win INTEGER DEFAULT 2,
  points_loss INTEGER DEFAULT 0,
  points_tie INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament Teams junction table
CREATE TABLE tournament_teams (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  nrr DECIMAL(5,3) DEFAULT 0,
  UNIQUE(tournament_id, team_id)
);

-- Matches table
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  match_date TIMESTAMP,
  format VARCHAR(20) CHECK (format IN ('T20', 'T40', 'T50', '2-day', 'custom')),
  overs_per_innings INTEGER,
  toss_winner_id INTEGER REFERENCES teams(id),
  toss_decision VARCHAR(10) CHECK (toss_decision IN ('bat', 'bowl')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'abandoned')),
  venue VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Innings table
CREATE TABLE innings (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  innings_number INTEGER CHECK (innings_number IN (1, 2, 3)),
  batting_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  bowling_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  total_runs INTEGER DEFAULT 0,
  wickets_lost INTEGER DEFAULT 0,
  overs_bowled DECIMAL(4,1) DEFAULT 0,
  extras_total INTEGER DEFAULT 0,
  extras_wides INTEGER DEFAULT 0,
  extras_noballs INTEGER DEFAULT 0,
  extras_byes INTEGER DEFAULT 0,
  extras_legbyes INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Overs table
CREATE TABLE overs (
  id SERIAL PRIMARY KEY,
  innings_id INTEGER REFERENCES innings(id) ON DELETE CASCADE,
  over_number INTEGER NOT NULL,
  bowler_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  runs_conceded INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  is_maiden BOOLEAN DEFAULT false,
  wides INTEGER DEFAULT 0,
  noballs INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Balls table (most granular level)
CREATE TABLE balls (
  id SERIAL PRIMARY KEY,
  over_id INTEGER REFERENCES overs(id) ON DELETE CASCADE,
  ball_number INTEGER CHECK (ball_number BETWEEN 1 AND 6),
  batter_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  non_striker_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  bowler_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  runs INTEGER DEFAULT 0,
  is_extra BOOLEAN DEFAULT false,
  extra_type VARCHAR(10) CHECK (extra_type IN ('wide', 'bye', 'legbye', 'noball')),
  extra_runs INTEGER DEFAULT 0,
  is_wicket BOOLEAN DEFAULT false,
  -- Wagon Wheel data (shot location - optional)
  wagon_wheel_x INTEGER,  -- X coordinate (-100 to 100, 0 = straight)
  wagon_wheel_y INTEGER,  -- Y coordinate (0 to 100, distance from batter)
  wagon_wheel_zone VARCHAR(20),  -- Zone name (e.g., 'cover', 'midwicket', 'fine_leg')
  -- Pitch Map data (bowling line & length - optional)
  pitch_line VARCHAR(20),  -- Line (e.g., 'off', 'middle', 'leg', 'wide_off', 'wide_leg')
  pitch_length VARCHAR(20),  -- Length (e.g., 'yorker', 'full', 'good', 'short', 'bouncer')
  pitch_x INTEGER,  -- X coordinate (0-100, 0=leg side, 50=middle, 100=off side)
  pitch_y INTEGER,  -- Y coordinate (0-100, 0=bowler's end, 100=batter's end)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dismissals table
CREATE TABLE dismissals (
  id SERIAL PRIMARY KEY,
  ball_id INTEGER REFERENCES balls(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  dismissal_type VARCHAR(20) CHECK (dismissal_type IN ('bowled', 'caught', 'lbw', 'stumped', 'run_out', 'hit_wicket', 'retired_hurt', 'retired_out', 'timed_out')),
  fielder_id INTEGER REFERENCES players(id),
  bowler_id INTEGER REFERENCES players(id),
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  can_return BOOLEAN DEFAULT false,  -- For retired hurt, allows batter to return
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partnerships table
CREATE TABLE partnerships (
  id SERIAL PRIMARY KEY,
  innings_id INTEGER REFERENCES innings(id) ON DELETE CASCADE,
  batter1_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  batter2_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  runs INTEGER DEFAULT 0,
  balls INTEGER DEFAULT 0,
  wicket_number INTEGER,
  start_ball_id INTEGER REFERENCES balls(id),
  end_ball_id INTEGER REFERENCES balls(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match Results table
CREATE TABLE match_results (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  winner_id INTEGER REFERENCES teams(id),
  margin INTEGER,
  margin_type VARCHAR(10) CHECK (margin_type IN ('runs', 'wickets', 'tied', 'DL')),
  result_type VARCHAR(20) DEFAULT 'normal' CHECK (result_type IN ('normal', 'super_over', 'DL', 'tied', 'abandoned')),
  man_of_match_id INTEGER REFERENCES players(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_team_players_team ON team_players(team_id);
CREATE INDEX idx_team_players_player ON team_players(player_id);
CREATE INDEX idx_tournament_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX idx_tournament_teams_team ON tournament_teams(team_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_innings_match ON innings(match_id);
CREATE INDEX idx_overs_innings ON overs(innings_id);
CREATE INDEX idx_balls_over ON balls(over_id);
CREATE INDEX idx_dismissals_ball ON dismissals(ball_id);
CREATE INDEX idx_partnerships_innings ON partnerships(innings_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@cricket.local', '$2a$10$rOzJkKkYvpYhWjGvXGKkJO6YqYGQvYvJ3hXvPqGqvYvJ3hXvPqGqv', 'admin');
