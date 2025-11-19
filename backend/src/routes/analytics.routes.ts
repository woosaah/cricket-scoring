import express from 'express';
import pool from '../db/database';

const router = express.Router();

// Get worm graph data for a match
router.get('/match/:id/worm-graph', async (req, res) => {
  try {
    const { id } = req.params;

    // Get all innings for the match
    const inningsResult = await pool.query(`
      SELECT id, innings_number, batting_team_id, total_runs
      FROM innings
      WHERE match_id = $1
      ORDER BY innings_number
    `, [id]);

    const response = [];

    for (const innings of inningsResult.rows) {
      // Get cumulative runs per over
      const oversData = await pool.query(`
        SELECT
          o.over_number as over,
          SUM(o.runs_conceded) OVER (ORDER BY o.over_number) as runs,
          ROUND((SUM(o.runs_conceded) OVER (ORDER BY o.over_number)::numeric / o.over_number), 2) as run_rate
        FROM overs o
        WHERE o.innings_id = $1
        ORDER BY o.over_number
      `, [innings.id]);

      response.push({
        innings_number: innings.innings_number,
        batting_team_id: innings.batting_team_id,
        data: oversData.rows,
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching worm graph data:', error);
    res.status(500).json({ error: 'Failed to fetch worm graph data' });
  }
});

// Get Manhattan chart data for an innings
router.get('/innings/:id/manhattan', async (req, res) => {
  try {
    const { id } = req.params;

    const oversData = await pool.query(`
      SELECT
        over_number as over,
        runs_conceded as runs,
        wickets_taken as wickets
      FROM overs
      WHERE innings_id = $1
      ORDER BY over_number
    `, [id]);

    res.json(oversData.rows);
  } catch (error) {
    console.error('Error fetching Manhattan data:', error);
    res.status(500).json({ error: 'Failed to fetch Manhattan data' });
  }
});

// Get partnership data for an innings
router.get('/innings/:id/partnerships', async (req, res) => {
  try {
    const { id } = req.params;

    const partnershipsData = await pool.query(`
      SELECT
        p.id,
        p.runs,
        p.balls,
        p.wicket_number,
        b1.name as batter1_name,
        b2.name as batter2_name,
        p.is_active
      FROM partnerships p
      JOIN players b1 ON p.batter1_id = b1.id
      JOIN players b2 ON p.batter2_id = b2.id
      WHERE p.innings_id = $1
      ORDER BY p.wicket_number NULLS LAST, p.created_at
    `, [id]);

    res.json(partnershipsData.rows);
  } catch (error) {
    console.error('Error fetching partnerships:', error);
    res.status(500).json({ error: 'Failed to fetch partnerships' });
  }
});

// Get player form data (last 10 innings)
router.get('/player/:id/form', async (req, res) => {
  try {
    const { id } = req.params;

    // Batting form
    const battingForm = await pool.query(`
      SELECT
        m.match_date,
        m.id as match_id,
        ht.name as home_team,
        at.name as away_team,
        SUM(b.runs) as runs,
        COUNT(b.id) as balls,
        ROUND((SUM(b.runs) * 100.0 / NULLIF(COUNT(b.id), 0))::numeric, 2) as strike_rate
      FROM balls b
      JOIN overs o ON b.over_id = o.id
      JOIN innings i ON o.innings_id = i.id
      JOIN matches m ON i.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE b.batter_id = $1
      GROUP BY m.id, m.match_date, ht.name, at.name
      ORDER BY m.match_date DESC
      LIMIT 10
    `, [id]);

    // Bowling form
    const bowlingForm = await pool.query(`
      SELECT
        m.match_date,
        m.id as match_id,
        ht.name as home_team,
        at.name as away_team,
        COUNT(DISTINCT o.id) as overs,
        SUM(o.runs_conceded) as runs,
        SUM(o.wickets_taken) as wickets,
        ROUND((SUM(o.runs_conceded) / NULLIF(COUNT(DISTINCT o.id), 0))::numeric, 2) as economy
      FROM overs o
      JOIN innings i ON o.innings_id = i.id
      JOIN matches m ON i.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE o.bowler_id = $1
      GROUP BY m.id, m.match_date, ht.name, at.name
      ORDER BY m.match_date DESC
      LIMIT 10
    `, [id]);

    res.json({
      batting: battingForm.rows,
      bowling: bowlingForm.rows,
    });
  } catch (error) {
    console.error('Error fetching player form:', error);
    res.status(500).json({ error: 'Failed to fetch player form' });
  }
});

export default router;
