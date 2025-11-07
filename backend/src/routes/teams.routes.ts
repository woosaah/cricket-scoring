import express from 'express';
import pool from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT tp.player_id) as player_count
      FROM teams t
      LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.is_active = true
      GROUP BY t.id
      ORDER BY t.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID with players
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get team details
    const teamResult = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamResult.rows[0];

    // Get players
    const playersResult = await pool.query(`
      SELECT p.*, tp.is_active
      FROM players p
      JOIN team_players tp ON p.id = tp.player_id
      WHERE tp.team_id = $1
      ORDER BY p.name
    `, [id]);

    res.json({
      ...team,
      players: playersResult.rows
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Create team
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, city, primary_color, secondary_color, logo_url } = req.body;

    const result = await pool.query(
      'INSERT INTO teams (name, city, primary_color, secondary_color, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, city, primary_color || '#dc2626', secondary_color || '#000000', logo_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update team
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, primary_color, secondary_color, logo_url } = req.body;

    const result = await pool.query(
      'UPDATE teams SET name = $1, city = $2, primary_color = $3, secondary_color = $4, logo_url = $5 WHERE id = $6 RETURNING *',
      [name, city, primary_color, secondary_color, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Add player to team
router.post('/:id/players', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { player_id } = req.body;

    const result = await pool.query(
      'INSERT INTO team_players (team_id, player_id) VALUES ($1, $2) ON CONFLICT (team_id, player_id) DO UPDATE SET is_active = true RETURNING *',
      [id, player_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding player to team:', error);
    res.status(500).json({ error: 'Failed to add player to team' });
  }
});

// Remove player from team
router.delete('/:id/players/:playerId', authMiddleware, async (req, res) => {
  try {
    const { id, playerId } = req.params;

    await pool.query(
      'UPDATE team_players SET is_active = false WHERE team_id = $1 AND player_id = $2',
      [id, playerId]
    );

    res.json({ message: 'Player removed from team' });
  } catch (error) {
    console.error('Error removing player from team:', error);
    res.status(500).json({ error: 'Failed to remove player from team' });
  }
});

// Delete team
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
