import express from 'express';
import pool from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Start innings
router.post('/innings', authMiddleware, async (req, res) => {
  try {
    const { match_id, innings_number, batting_team_id, bowling_team_id } = req.body;

    const result = await pool.query(
      `INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id, status)
       VALUES ($1, $2, $3, $4, 'in_progress') RETURNING *`,
      [match_id, innings_number, batting_team_id, bowling_team_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error starting innings:', error);
    res.status(500).json({ error: 'Failed to start innings' });
  }
});

// Start over
router.post('/overs', authMiddleware, async (req, res) => {
  try {
    const { innings_id, over_number, bowler_id } = req.body;

    const result = await pool.query(
      'INSERT INTO overs (innings_id, over_number, bowler_id) VALUES ($1, $2, $3) RETURNING *',
      [innings_id, over_number, bowler_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error starting over:', error);
    res.status(500).json({ error: 'Failed to start over' });
  }
});

// Record ball
router.post('/balls', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      over_id,
      ball_number,
      batter_id,
      non_striker_id,
      bowler_id,
      runs,
      is_extra,
      extra_type,
      extra_runs,
      is_wicket,
      dismissal
    } = req.body;

    // Insert ball
    const ballResult = await client.query(
      `INSERT INTO balls (over_id, ball_number, batter_id, non_striker_id, bowler_id, runs, is_extra, extra_type, extra_runs, is_wicket)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [over_id, ball_number, batter_id, non_striker_id, bowler_id, runs, is_extra, extra_type, extra_runs, is_wicket]
    );

    const ball = ballResult.rows[0];

    // If wicket, record dismissal
    if (is_wicket && dismissal) {
      await client.query(
        `INSERT INTO dismissals (ball_id, player_id, dismissal_type, fielder_id, bowler_id, runs_scored, balls_faced)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          ball.id,
          dismissal.player_id,
          dismissal.dismissal_type,
          dismissal.fielder_id || null,
          dismissal.bowler_id || null,
          dismissal.runs_scored || 0,
          dismissal.balls_faced || 0
        ]
      );
    }

    // Update over stats
    const totalRuns = runs + (extra_runs || 0);
    await client.query(
      `UPDATE overs SET
        runs_conceded = runs_conceded + $1,
        wickets_taken = wickets_taken + $2,
        wides = wides + CASE WHEN $3 = 'wide' THEN 1 ELSE 0 END,
        noballs = noballs + CASE WHEN $3 = 'noball' THEN 1 ELSE 0 END
       WHERE id = $4`,
      [totalRuns, is_wicket ? 1 : 0, extra_type, over_id]
    );

    // Get innings_id from over
    const overResult = await client.query('SELECT innings_id FROM overs WHERE id = $1', [over_id]);
    const innings_id = overResult.rows[0].innings_id;

    // Update innings stats
    await client.query(
      `UPDATE innings SET
        total_runs = total_runs + $1,
        wickets_lost = wickets_lost + $2,
        extras_total = extras_total + $3,
        extras_wides = extras_wides + CASE WHEN $4 = 'wide' THEN $3 ELSE 0 END,
        extras_noballs = extras_noballs + CASE WHEN $4 = 'noball' THEN $3 ELSE 0 END,
        extras_byes = extras_byes + CASE WHEN $4 = 'bye' THEN $3 ELSE 0 END,
        extras_legbyes = extras_legbyes + CASE WHEN $4 = 'legbye' THEN $3 ELSE 0 END
       WHERE id = $5`,
      [totalRuns, is_wicket ? 1 : 0, extra_runs || 0, extra_type, innings_id]
    );

    // Update overs_bowled (only if not a wide or no-ball)
    if (!is_extra || (extra_type !== 'wide' && extra_type !== 'noball')) {
      await client.query(
        `UPDATE innings SET
          overs_bowled = FLOOR(overs_bowled) + ($1 / 6.0)
         WHERE id = $2`,
        [ball_number, innings_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ ball, message: 'Ball recorded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording ball:', error);
    res.status(500).json({ error: 'Failed to record ball' });
  } finally {
    client.release();
  }
});

// Get current innings state
router.get('/innings/:id/state', async (req, res) => {
  try {
    const { id } = req.params;

    // Get innings details
    const inningsResult = await pool.query('SELECT * FROM innings WHERE id = $1', [id]);

    if (inningsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Innings not found' });
    }

    const innings = inningsResult.rows[0];

    // Get current over
    const currentOverResult = await pool.query(`
      SELECT o.*, p.name as bowler_name
      FROM overs o
      JOIN players p ON o.bowler_id = p.id
      WHERE o.innings_id = $1
      ORDER BY o.over_number DESC
      LIMIT 1
    `, [id]);

    const currentOver = currentOverResult.rows[0] || null;

    // Get balls in current over
    let ballsInOver = [];
    if (currentOver) {
      const ballsResult = await pool.query(`
        SELECT b.*, p.name as batter_name
        FROM balls b
        JOIN players p ON b.batter_id = p.id
        WHERE b.over_id = $1
        ORDER BY b.ball_number
      `, [currentOver.id]);

      ballsInOver = ballsResult.rows;
    }

    // Get current partnerships
    const partnershipsResult = await pool.query(`
      SELECT
        p.*,
        b1.name as batter1_name,
        b2.name as batter2_name
      FROM partnerships p
      JOIN players b1 ON p.batter1_id = b1.id
      JOIN players b2 ON p.batter2_id = b2.id
      WHERE p.innings_id = $1 AND p.is_active = true
    `, [id]);

    res.json({
      innings,
      current_over: currentOver,
      balls_in_over: ballsInOver,
      current_partnership: partnershipsResult.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching innings state:', error);
    res.status(500).json({ error: 'Failed to fetch innings state' });
  }
});

// Undo last ball
router.delete('/balls/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get ball details
    const ballResult = await client.query('SELECT * FROM balls WHERE id = $1', [id]);

    if (ballResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ball not found' });
    }

    const ball = ballResult.rows[0];

    // Delete dismissal if exists
    await client.query('DELETE FROM dismissals WHERE ball_id = $1', [id]);

    // Get innings_id from over
    const overResult = await client.query('SELECT innings_id FROM overs WHERE id = $1', [ball.over_id]);
    const innings_id = overResult.rows[0].innings_id;

    // Revert innings stats
    const totalRuns = ball.runs + (ball.extra_runs || 0);
    await client.query(
      `UPDATE innings SET
        total_runs = total_runs - $1,
        wickets_lost = wickets_lost - $2,
        extras_total = extras_total - $3
       WHERE id = $4`,
      [totalRuns, ball.is_wicket ? 1 : 0, ball.extra_runs || 0, innings_id]
    );

    // Revert over stats
    await client.query(
      `UPDATE overs SET
        runs_conceded = runs_conceded - $1,
        wickets_taken = wickets_taken - $2
       WHERE id = $3`,
      [totalRuns, ball.is_wicket ? 1 : 0, ball.over_id]
    );

    // Delete ball
    await client.query('DELETE FROM balls WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Ball undone successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error undoing ball:', error);
    res.status(500).json({ error: 'Failed to undo ball' });
  } finally {
    client.release();
  }
});

// End innings
router.put('/innings/:id/end', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE innings SET status = $1 WHERE id = $2 RETURNING *',
      ['completed', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Innings not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error ending innings:', error);
    res.status(500).json({ error: 'Failed to end innings' });
  }
});

export default router;
