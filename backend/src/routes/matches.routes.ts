import express from 'express';
import pool from '../db/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const { tournament_id } = req.query;

    let query = `
      SELECT
        m.*,
        t.name as tournament_name,
        ht.name as home_team_name,
        ht.primary_color as home_team_color,
        at.name as away_team_name,
        at.primary_color as away_team_color,
        mr.winner_id,
        mr.margin,
        mr.margin_type
      FROM matches m
      JOIN tournaments t ON m.tournament_id = t.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN match_results mr ON m.id = mr.match_id
    `;

    const params: any[] = [];

    if (tournament_id) {
      query += ' WHERE m.tournament_id = $1';
      params.push(tournament_id);
    }

    query += ' ORDER BY m.match_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match by ID with full details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get match details
    const matchResult = await pool.query(`
      SELECT
        m.*,
        t.name as tournament_name,
        ht.name as home_team_name,
        ht.primary_color as home_team_primary_color,
        ht.secondary_color as home_team_secondary_color,
        at.name as away_team_name,
        at.primary_color as away_team_primary_color,
        at.secondary_color as away_team_secondary_color,
        mr.winner_id,
        mr.margin,
        mr.margin_type,
        mr.man_of_match_id
      FROM matches m
      JOIN tournaments t ON m.tournament_id = t.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN match_results mr ON m.id = mr.match_id
      WHERE m.id = $1
    `, [id]);

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get innings
    const inningsResult = await pool.query(`
      SELECT
        i.*,
        bt.name as batting_team_name,
        bowl.name as bowling_team_name
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.id
      JOIN teams bowl ON i.bowling_team_id = bowl.id
      WHERE i.match_id = $1
      ORDER BY i.innings_number
    `, [id]);

    res.json({
      ...match,
      innings: inningsResult.rows
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create match
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      tournament_id,
      home_team_id,
      away_team_id,
      match_date,
      format,
      overs_per_innings,
      venue
    } = req.body;

    const result = await pool.query(
      `INSERT INTO matches (tournament_id, home_team_id, away_team_id, match_date, format, overs_per_innings, venue)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tournament_id, home_team_id, away_team_id, match_date, format, overs_per_innings, venue]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Record toss
router.post('/:id/toss', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { toss_winner_id, toss_decision } = req.body;

    const result = await pool.query(
      'UPDATE matches SET toss_winner_id = $1, toss_decision = $2, status = $3 WHERE id = $4 RETURNING *',
      [toss_winner_id, toss_decision, 'in_progress', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error recording toss:', error);
    res.status(500).json({ error: 'Failed to record toss' });
  }
});

// Get live scorecard
router.get('/:id/scorecard', async (req, res) => {
  try {
    const { id } = req.params;

    // Get match details
    const matchResult = await pool.query(`
      SELECT m.*, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get innings with batting and bowling details
    const inningsResult = await pool.query(`
      SELECT
        i.*,
        bt.name as batting_team_name,
        bowl.name as bowling_team_name
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.id
      JOIN teams bowl ON i.bowling_team_id = bowl.id
      WHERE i.match_id = $1
      ORDER BY i.innings_number
    `, [id]);

    const innings = [];

    for (const inning of inningsResult.rows) {
      // Get batting scorecard
      const battingResult = await pool.query(`
        SELECT
          p.id,
          p.name,
          COUNT(b.id) as balls_faced,
          SUM(b.runs) as runs_scored,
          SUM(CASE WHEN b.runs = 4 THEN 1 ELSE 0 END) as fours,
          SUM(CASE WHEN b.runs = 6 THEN 1 ELSE 0 END) as sixes,
          CASE WHEN SUM(b.runs) > 0 THEN ROUND((SUM(b.runs) * 100.0 / NULLIF(COUNT(b.id), 0))::numeric, 2) ELSE 0 END as strike_rate,
          d.dismissal_type,
          bowler.name as bowler_name,
          fielder.name as fielder_name
        FROM players p
        LEFT JOIN balls b ON p.id = b.batter_id AND b.over_id IN (
          SELECT id FROM overs WHERE innings_id = $1
        )
        LEFT JOIN dismissals d ON p.id = d.player_id AND d.ball_id IN (
          SELECT id FROM balls WHERE over_id IN (SELECT id FROM overs WHERE innings_id = $1)
        )
        LEFT JOIN players bowler ON d.bowler_id = bowler.id
        LEFT JOIN players fielder ON d.fielder_id = fielder.id
        WHERE b.id IS NOT NULL
        GROUP BY p.id, p.name, d.dismissal_type, bowler.name, fielder.name
        ORDER BY runs_scored DESC
      `, [inning.id]);

      // Get bowling scorecard
      const bowlingResult = await pool.query(`
        SELECT
          p.id,
          p.name,
          COUNT(DISTINCT o.id) as overs_bowled,
          SUM(o.runs_conceded) as runs_conceded,
          SUM(o.wickets_taken) as wickets,
          ROUND((SUM(o.runs_conceded) * 1.0 / NULLIF(COUNT(DISTINCT o.id), 0))::numeric, 2) as economy,
          SUM(CASE WHEN o.is_maiden THEN 1 ELSE 0 END) as maidens,
          SUM(o.wides) as wides,
          SUM(o.noballs) as noballs
        FROM players p
        JOIN overs o ON p.id = o.bowler_id
        WHERE o.innings_id = $1
        GROUP BY p.id, p.name
        ORDER BY wickets DESC, runs_conceded ASC
      `, [inning.id]);

      innings.push({
        ...inning,
        batting: battingResult.rows,
        bowling: bowlingResult.rows
      });
    }

    res.json({
      match,
      innings
    });
  } catch (error) {
    console.error('Error fetching scorecard:', error);
    res.status(500).json({ error: 'Failed to fetch scorecard' });
  }
});

// Update match
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE matches SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

export default router;
