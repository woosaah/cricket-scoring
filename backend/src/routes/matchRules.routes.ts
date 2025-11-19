import express from 'express';
import pool from '../db/database';

const router = express.Router();

// Get all match rules (presets)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM match_rules
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching match rules:', error);
    res.status(500).json({ error: 'Failed to fetch match rules' });
  }
});

// Get a specific match rule by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM match_rules WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match rule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching match rule:', error);
    res.status(500).json({ error: 'Failed to fetch match rule' });
  }
});

// Create a new match rule
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      overs_per_innings = 20,
      max_batsmen_per_innings,
      is_junior_mode = false,
      balls_per_batter,
      has_powerplay = false,
      powerplay_overs = 6,
      allow_super_over = false,
      follow_on_enabled = false,
      noball_runs = 1,
      wide_runs = 1,
      max_fielders_outside_circle = 5,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO match_rules (
        name, description, overs_per_innings, max_batsmen_per_innings,
        is_junior_mode, balls_per_batter, has_powerplay, powerplay_overs,
        allow_super_over, follow_on_enabled, noball_runs, wide_runs,
        max_fielders_outside_circle
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        description,
        overs_per_innings,
        max_batsmen_per_innings,
        is_junior_mode,
        balls_per_batter,
        has_powerplay,
        powerplay_overs,
        allow_super_over,
        follow_on_enabled,
        noball_runs,
        wide_runs,
        max_fielders_outside_circle,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating match rule:', error);
    res.status(500).json({ error: 'Failed to create match rule' });
  }
});

// Update a match rule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      overs_per_innings,
      max_batsmen_per_innings,
      is_junior_mode,
      balls_per_batter,
      has_powerplay,
      powerplay_overs,
      allow_super_over,
      follow_on_enabled,
      noball_runs,
      wide_runs,
      max_fielders_outside_circle,
    } = req.body;

    const result = await pool.query(
      `UPDATE match_rules SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        overs_per_innings = COALESCE($3, overs_per_innings),
        max_batsmen_per_innings = COALESCE($4, max_batsmen_per_innings),
        is_junior_mode = COALESCE($5, is_junior_mode),
        balls_per_batter = COALESCE($6, balls_per_batter),
        has_powerplay = COALESCE($7, has_powerplay),
        powerplay_overs = COALESCE($8, powerplay_overs),
        allow_super_over = COALESCE($9, allow_super_over),
        follow_on_enabled = COALESCE($10, follow_on_enabled),
        noball_runs = COALESCE($11, noball_runs),
        wide_runs = COALESCE($12, wide_runs),
        max_fielders_outside_circle = COALESCE($13, max_fielders_outside_circle)
      WHERE id = $14
      RETURNING *`,
      [
        name,
        description,
        overs_per_innings,
        max_batsmen_per_innings,
        is_junior_mode,
        balls_per_batter,
        has_powerplay,
        powerplay_overs,
        allow_super_over,
        follow_on_enabled,
        noball_runs,
        wide_runs,
        max_fielders_outside_circle,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match rule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating match rule:', error);
    res.status(500).json({ error: 'Failed to update match rule' });
  }
});

// Delete a match rule
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rule is being used by any matches or tournaments
    const usageCheck = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM matches WHERE match_rules_id = $1) as match_count,
        (SELECT COUNT(*) FROM tournaments WHERE default_match_rules_id = $1) as tournament_count
      `,
      [id]
    );

    const { match_count, tournament_count } = usageCheck.rows[0];

    if (match_count > 0 || tournament_count > 0) {
      return res.status(400).json({
        error: 'Cannot delete match rule that is in use',
        details: {
          matches: match_count,
          tournaments: tournament_count,
        },
      });
    }

    const result = await pool.query('DELETE FROM match_rules WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match rule not found' });
    }

    res.json({ message: 'Match rule deleted successfully', rule: result.rows[0] });
  } catch (error) {
    console.error('Error deleting match rule:', error);
    res.status(500).json({ error: 'Failed to delete match rule' });
  }
});

// Apply match rule to a match
router.post('/apply/:ruleId/match/:matchId', async (req, res) => {
  try {
    const { ruleId, matchId } = req.params;

    // Verify rule exists
    const ruleCheck = await pool.query('SELECT id FROM match_rules WHERE id = $1', [ruleId]);
    if (ruleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Match rule not found' });
    }

    // Update match with rule
    const result = await pool.query(
      'UPDATE matches SET match_rules_id = $1 WHERE id = $2 RETURNING *',
      [ruleId, matchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({ message: 'Match rule applied successfully', match: result.rows[0] });
  } catch (error) {
    console.error('Error applying match rule:', error);
    res.status(500).json({ error: 'Failed to apply match rule' });
  }
});

// Get match rules for a specific match (including inherited tournament rules)
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const result = await pool.query(
      `SELECT
        m.id as match_id,
        COALESCE(mr.*, tmr.*) as rules
      FROM matches m
      LEFT JOIN match_rules mr ON m.match_rules_id = mr.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN match_rules tmr ON t.default_match_rules_id = tmr.id
      WHERE m.id = $1
      `,
      [matchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0].rules || null);
  } catch (error) {
    console.error('Error fetching match rules:', error);
    res.status(500).json({ error: 'Failed to fetch match rules' });
  }
});

export default router;
