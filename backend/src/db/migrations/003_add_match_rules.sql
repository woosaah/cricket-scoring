-- Migration: Add Match Rules Configuration
-- This adds support for custom match rules including overs, batsmen limits, and junior cricket mode

-- Create match_rules table
CREATE TABLE IF NOT EXISTS match_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Overs configuration
  overs_per_innings INTEGER NOT NULL DEFAULT 20,

  -- Batsmen configuration
  max_batsmen_per_innings INTEGER, -- NULL = unlimited (all players can bat)

  -- Junior cricket mode
  is_junior_mode BOOLEAN DEFAULT FALSE,
  balls_per_batter INTEGER, -- For junior cricket (e.g., 6 balls each)

  -- Powerplay configuration
  has_powerplay BOOLEAN DEFAULT FALSE,
  powerplay_overs INTEGER DEFAULT 6,

  -- Other rules
  allow_super_over BOOLEAN DEFAULT FALSE,
  follow_on_enabled BOOLEAN DEFAULT FALSE, -- For multi-day matches

  -- No-ball and wide rules
  noball_runs INTEGER DEFAULT 1,
  wide_runs INTEGER DEFAULT 1,

  -- Fielding restrictions
  max_fielders_outside_circle INTEGER DEFAULT 5,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add match_rules_id to matches table
ALTER TABLE matches
ADD COLUMN match_rules_id INTEGER REFERENCES match_rules(id) ON DELETE SET NULL;

-- Add match_rules_id to tournaments table (default rules for all matches)
ALTER TABLE tournaments
ADD COLUMN default_match_rules_id INTEGER REFERENCES match_rules(id) ON DELETE SET NULL;

-- Create some default match rules presets
INSERT INTO match_rules (name, description, overs_per_innings, has_powerplay, powerplay_overs) VALUES
('T20', 'Standard Twenty20 format', 20, TRUE, 6),
('T40', 'Forty over format', 40, TRUE, 10),
('T50', 'Fifty over format (ODI)', 50, TRUE, 10),
('T10', 'Ten over format', 10, TRUE, 3),
('Junior T20', 'Junior cricket - 6 balls per batter', 20, FALSE, 0);

-- Update the junior cricket rule with specific settings
UPDATE match_rules
SET is_junior_mode = TRUE, balls_per_batter = 6
WHERE name = 'Junior T20';

-- Add index for faster lookups
CREATE INDEX idx_matches_rules ON matches(match_rules_id);
CREATE INDEX idx_tournaments_rules ON tournaments(default_match_rules_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_match_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_rules_updated_at
BEFORE UPDATE ON match_rules
FOR EACH ROW
EXECUTE FUNCTION update_match_rules_updated_at();
