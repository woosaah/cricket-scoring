-- Migration to add retire batsman functionality

-- Add can_return field to dismissals table for retired hurt batsmen
ALTER TABLE dismissals ADD COLUMN IF NOT EXISTS can_return BOOLEAN DEFAULT false;

-- Update dismissal type check to include retired_out
ALTER TABLE dismissals DROP CONSTRAINT IF EXISTS dismissals_dismissal_type_check;
ALTER TABLE dismissals ADD CONSTRAINT dismissals_dismissal_type_check
  CHECK (dismissal_type IN ('bowled', 'caught', 'lbw', 'stumped', 'run_out', 'hit_wicket', 'retired_hurt', 'retired_out', 'timed_out'));

COMMENT ON COLUMN dismissals.can_return IS 'For retired hurt, allows batter to return later';
