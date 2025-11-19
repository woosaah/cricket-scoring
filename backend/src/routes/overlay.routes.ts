import express from 'express';
import pool from '../db/database';

const router = express.Router();

// Get live score data for OBS overlay (lightweight, fast)
router.get('/match/:id/live', async (req, res) => {
  try {
    const { id } = req.params;

    // Get match details with current innings
    const matchResult = await pool.query(`
      SELECT
        m.id,
        m.format,
        ht.name as home_team,
        ht.primary_color as home_color,
        at.name as away_team,
        at.primary_color as away_color,
        m.status,
        m.venue
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Get current/latest innings
    const inningsResult = await pool.query(`
      SELECT
        i.*,
        bt.name as batting_team,
        bt.primary_color as batting_color
      FROM innings i
      JOIN teams bt ON i.batting_team_id = bt.id
      WHERE i.match_id = $1
      ORDER BY i.innings_number DESC
      LIMIT 1
    `, [id]);

    const innings = inningsResult.rows[0] || null;

    // Get current batsmen (if innings exists)
    let batsmen = [];
    if (innings) {
      const batsmenResult = await pool.query(`
        SELECT DISTINCT ON (p.id)
          p.id,
          p.name,
          COUNT(b.id) as balls_faced,
          SUM(b.runs) as runs_scored,
          SUM(CASE WHEN b.runs = 4 THEN 1 ELSE 0 END) as fours,
          SUM(CASE WHEN b.runs = 6 THEN 1 ELSE 0 END) as sixes,
          CASE
            WHEN COUNT(b.id) > 0 THEN ROUND((SUM(b.runs) * 100.0 / COUNT(b.id))::numeric, 2)
            ELSE 0
          END as strike_rate
        FROM players p
        JOIN balls b ON p.id = b.batter_id
        JOIN overs o ON b.over_id = o.id
        WHERE o.innings_id = $1
        GROUP BY p.id, p.name
        ORDER BY p.id, MAX(b.created_at) DESC
        LIMIT 2
      `, [innings.id]);

      batsmen = batsmenResult.rows;
    }

    // Get current bowler
    let currentBowler = null;
    if (innings) {
      const bowlerResult = await pool.query(`
        SELECT
          p.id,
          p.name,
          COUNT(DISTINCT o.id) as overs_bowled,
          SUM(o.runs_conceded) as runs_conceded,
          SUM(o.wickets_taken) as wickets,
          ROUND((SUM(o.runs_conceded) * 1.0 / NULLIF(COUNT(DISTINCT o.id), 0))::numeric, 2) as economy
        FROM players p
        JOIN overs o ON p.id = o.bowler_id
        WHERE o.innings_id = $1
        GROUP BY p.id, p.name
        ORDER BY MAX(o.created_at) DESC
        LIMIT 1
      `, [innings.id]);

      currentBowler = bowlerResult.rows[0] || null;
    }

    // Get recent balls (last 6)
    let recentBalls = [];
    if (innings) {
      const ballsResult = await pool.query(`
        SELECT
          b.runs,
          b.is_extra,
          b.extra_type,
          b.is_wicket,
          b.created_at
        FROM balls b
        JOIN overs o ON b.over_id = o.id
        WHERE o.innings_id = $1
        ORDER BY b.created_at DESC
        LIMIT 6
      `, [innings.id]);

      recentBalls = ballsResult.rows.reverse();
    }

    // Calculate required run rate (if 2nd innings)
    let requiredRunRate = null;
    if (innings && innings.innings_number === 2) {
      // Get target from 1st innings
      const targetResult = await pool.query(`
        SELECT total_runs + 1 as target
        FROM innings
        WHERE match_id = $1 AND innings_number = 1
      `, [id]);

      if (targetResult.rows.length > 0) {
        const target = targetResult.rows[0].target;
        const runsNeeded = target - innings.total_runs;
        const oversRemaining = match.overs_per_innings - innings.overs_bowled;
        requiredRunRate = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : 0;
      }
    }

    // Calculate current run rate
    const currentRunRate = innings && innings.overs_bowled > 0
      ? (innings.total_runs / innings.overs_bowled).toFixed(2)
      : '0.00';

    // Build response
    const response = {
      match: {
        id: match.id,
        home_team: match.home_team,
        home_color: match.home_color,
        away_team: match.away_team,
        away_color: match.away_color,
        format: match.format,
        status: match.status,
        venue: match.venue,
      },
      innings: innings ? {
        number: innings.innings_number,
        batting_team: innings.batting_team,
        batting_color: innings.batting_color,
        runs: innings.total_runs,
        wickets: innings.wickets_lost,
        overs: innings.overs_bowled,
        extras: innings.extras_total,
        current_run_rate: currentRunRate,
        required_run_rate: requiredRunRate,
      } : null,
      batsmen,
      current_bowler: currentBowler,
      recent_balls: recentBalls,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching overlay data:', error);
    res.status(500).json({ error: 'Failed to fetch overlay data' });
  }
});

export default router;
