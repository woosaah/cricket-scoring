import express from 'express';
import pool from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT tt.team_id) as team_count,
        COUNT(DISTINCT m.id) as match_count
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
      LEFT JOIN matches m ON t.id = m.tournament_id
      GROUP BY t.id
      ORDER BY t.start_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Get tournament by ID with standings
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get tournament details
    const tournamentResult = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    // Get standings
    const standingsResult = await pool.query(`
      SELECT
        tt.*,
        t.name as team_name,
        t.primary_color,
        t.secondary_color
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      WHERE tt.tournament_id = $1
      ORDER BY tt.points DESC, tt.nrr DESC
    `, [id]);

    // Get matches
    const matchesResult = await pool.query(`
      SELECT
        m.*,
        ht.name as home_team_name,
        at.name as away_team_name,
        mr.winner_id,
        mr.margin,
        mr.margin_type
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN match_results mr ON m.id = mr.match_id
      WHERE m.tournament_id = $1
      ORDER BY m.match_date DESC
    `, [id]);

    res.json({
      ...tournament,
      standings: standingsResult.rows,
      matches: matchesResult.rows
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Create tournament
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      format,
      overs_per_innings,
      start_date,
      end_date,
      tournament_type,
      points_win,
      points_loss,
      points_tie
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tournaments (name, format, overs_per_innings, start_date, end_date, tournament_type, points_win, points_loss, points_tie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, format, overs_per_innings, start_date, end_date, tournament_type, points_win || 2, points_loss || 0, points_tie || 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Add team to tournament
router.post('/:id/teams', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id } = req.body;

    const result = await pool.query(
      'INSERT INTO tournament_teams (tournament_id, team_id) VALUES ($1, $2) RETURNING *',
      [id, team_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding team to tournament:', error);
    res.status(500).json({ error: 'Failed to add team to tournament' });
  }
});

// Get tournament leaderboards
router.get('/:id/leaderboards', async (req, res) => {
  try {
    const { id } = req.params;

    // Most runs
    const mostRuns = await pool.query(`
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT i.id) as innings,
        SUM(b.runs) as total_runs,
        AVG(b.runs) as average,
        MAX(b.runs) as highest_score
      FROM players p
      JOIN balls b ON p.id = b.batter_id
      JOIN overs o ON b.over_id = o.id
      JOIN innings i ON o.innings_id = i.id
      JOIN matches m ON i.match_id = m.id
      WHERE m.tournament_id = $1
      GROUP BY p.id, p.name
      ORDER BY total_runs DESC
      LIMIT 10
    `, [id]);

    // Most wickets
    const mostWickets = await pool.query(`
      SELECT
        p.id,
        p.name,
        COUNT(DISTINCT o.id) as overs_bowled,
        SUM(o.wickets_taken) as total_wickets,
        SUM(o.runs_conceded) as runs_conceded,
        AVG(o.runs_conceded * 1.0 / NULLIF(o.over_number, 0)) as economy
      FROM players p
      JOIN overs o ON p.id = o.bowler_id
      JOIN innings i ON o.innings_id = i.id
      JOIN matches m ON i.match_id = m.id
      WHERE m.tournament_id = $1
      GROUP BY p.id, p.name
      ORDER BY total_wickets DESC
      LIMIT 10
    `, [id]);

    res.json({
      most_runs: mostRuns.rows,
      most_wickets: mostWickets.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboards' });
  }
});

// Update tournament
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      format,
      overs_per_innings,
      start_date,
      end_date,
      tournament_type,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE tournaments
       SET name = $1, format = $2, overs_per_innings = $3, start_date = $4, end_date = $5, tournament_type = $6, status = $7
       WHERE id = $8 RETURNING *`,
      [name, format, overs_per_innings, start_date, end_date, tournament_type, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// Delete tournament
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tournaments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

export default router;
