-- Migration to add wagon wheel and pitch map fields to balls table

-- Add wagon wheel columns
ALTER TABLE balls ADD COLUMN IF NOT EXISTS wagon_wheel_x INTEGER;
ALTER TABLE balls ADD COLUMN IF NOT EXISTS wagon_wheel_y INTEGER;
ALTER TABLE balls ADD COLUMN IF NOT EXISTS wagon_wheel_zone VARCHAR(20);

-- Add pitch map columns
ALTER TABLE balls ADD COLUMN IF NOT EXISTS pitch_line VARCHAR(20);
ALTER TABLE balls ADD COLUMN IF NOT EXISTS pitch_length VARCHAR(20);
ALTER TABLE balls ADD COLUMN IF NOT EXISTS pitch_x INTEGER;
ALTER TABLE balls ADD COLUMN IF NOT EXISTS pitch_y INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN balls.wagon_wheel_x IS 'X coordinate for wagon wheel (-100 to 100, 0 = straight)';
COMMENT ON COLUMN balls.wagon_wheel_y IS 'Y coordinate for wagon wheel (0 to 100, distance from batter)';
COMMENT ON COLUMN balls.wagon_wheel_zone IS 'Zone name (e.g., cover, midwicket, fine_leg)';
COMMENT ON COLUMN balls.pitch_line IS 'Bowling line (e.g., off, middle, leg, wide_off, wide_leg)';
COMMENT ON COLUMN balls.pitch_length IS 'Bowling length (e.g., yorker, full, good, short, bouncer)';
COMMENT ON COLUMN balls.pitch_x IS 'Pitch X coordinate (0-100, 0=leg side, 50=middle, 100=off side)';
COMMENT ON COLUMN balls.pitch_y IS 'Pitch Y coordinate (0-100, 0=bowler end, 100=batter end)';
