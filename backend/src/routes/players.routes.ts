import express from 'express';
import pool from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all players
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(json_agg(
          json_build_object('id', t.id, 'name', t.name)
        ) FILTER (WHERE t.id IS NOT NULL), '[]') as teams
      FROM players p
      LEFT JOIN team_players tp ON p.id = tp.player_id AND tp.is_active = true
      LEFT JOIN teams t ON tp.team_id = t.id
      GROUP BY p.id
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get player by ID with stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get player details
    const playerResult = await pool.query('SELECT * FROM players WHERE id = $1', [id]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = playerResult.rows[0];

    // Get teams
    const teamsResult = await pool.query(`
      SELECT t.* FROM teams t
      JOIN team_players tp ON t.id = tp.team_id
      WHERE tp.player_id = $1 AND tp.is_active = true
    `, [id]);

    // Get batting stats
    const battingStats = await pool.query(`
      SELECT
        COUNT(DISTINCT b.id) as innings,
        SUM(b.runs) as total_runs,
        COUNT(DISTINCT CASE WHEN b.runs >= 50 AND b.runs < 100 THEN b.over_id END) as fifties,
        COUNT(DISTINCT CASE WHEN b.runs >= 100 THEN b.over_id END) as hundreds,
        AVG(b.runs) as average,
        SUM(CASE WHEN b.runs = 4 THEN 1 ELSE 0 END) as fours,
        SUM(CASE WHEN b.runs = 6 THEN 1 ELSE 0 END) as sixes
      FROM balls b
      WHERE b.batter_id = $1
    `, [id]);

    // Get bowling stats
    const bowlingStats = await pool.query(`
      SELECT
        COUNT(DISTINCT o.id) as overs_bowled,
        SUM(o.runs_conceded) as runs_conceded,
        SUM(o.wickets_taken) as wickets,
        AVG(o.runs_conceded * 1.0 / NULLIF(o.over_number, 0)) as economy,
        SUM(CASE WHEN o.is_maiden THEN 1 ELSE 0 END) as maidens
      FROM overs o
      WHERE o.bowler_id = $1
    `, [id]);

    res.json({
      ...player,
      teams: teamsResult.rows,
      batting: battingStats.rows[0] || {},
      bowling: bowlingStats.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Create player
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, jersey_number, role, bio } = req.body;

    const result = await pool.query(
      'INSERT INTO players (name, jersey_number, role, bio) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, jersey_number, role, bio]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Update player
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, jersey_number, role, bio } = req.body;

    const result = await pool.query(
      'UPDATE players SET name = $1, jersey_number = $2, role = $3, bio = $4 WHERE id = $5 RETURNING *',
      [name, jersey_number, role, bio, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Delete player
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;
