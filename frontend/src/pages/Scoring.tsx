import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { matches, teams, scoring } from '../lib/api'
import { Undo } from 'lucide-react'

export default function Scoring() {
  const { id } = useParams()
  const [match, setMatch] = useState<any>(null)
  const [currentInnings, setCurrentInnings] = useState<any>(null)
  const [currentOver, setCurrentOver] = useState<any>(null)
  const [battingTeamPlayers, setBattingTeamPlayers] = useState<any[]>([])
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [batter1, setBatter1] = useState<any>(null)
  const [batter2, setBatter2] = useState<any>(null)
  const [bowler, setBowler] = useState<any>(null)
  const [striker, setStriker] = useState<'batter1' | 'batter2'>('batter1')

  const [ballData, setBallData] = useState({
    runs: 0,
    is_extra: false,
    extra_type: '',
    extra_runs: 0,
    is_wicket: false,
  })

  const [showDismissalModal, setShowDismissalModal] = useState(false)
  const [dismissalData, setDismissalData] = useState({
    dismissal_type: 'bowled',
    fielder_id: null,
  })

  useEffect(() => {
    loadMatch()
  }, [id])

  const loadMatch = async () => {
    try {
      const matchRes = await matches.getById(parseInt(id!))
      const matchData = matchRes.data
      setMatch(matchData)

      // Load teams' players
      const [homeTeamRes, awayTeamRes] = await Promise.all([
        teams.getById(matchData.home_team_id),
        teams.getById(matchData.away_team_id),
      ])

      // Determine batting and bowling teams based on toss
      const battingTeamId =
        matchData.toss_decision === 'bat'
          ? matchData.toss_winner_id
          : matchData.toss_winner_id === matchData.home_team_id
          ? matchData.away_team_id
          : matchData.home_team_id

      const bowlingTeamId =
        battingTeamId === matchData.home_team_id
          ? matchData.away_team_id
          : matchData.home_team_id

      if (battingTeamId === matchData.home_team_id) {
        setBattingTeamPlayers(homeTeamRes.data.players.filter((p: any) => p.is_active))
        setBowlingTeamPlayers(awayTeamRes.data.players.filter((p: any) => p.is_active))
      } else {
        setBattingTeamPlayers(awayTeamRes.data.players.filter((p: any) => p.is_active))
        setBowlingTeamPlayers(homeTeamRes.data.players.filter((p: any) => p.is_active))
      }

      // Check if innings exists
      if (!matchData.innings || matchData.innings.length === 0) {
        // Start first innings
        const inningsRes = await scoring.startInnings({
          match_id: matchData.id,
          innings_number: 1,
          batting_team_id: battingTeamId,
          bowling_team_id: bowlingTeamId,
        })
        setCurrentInnings(inningsRes.data)
      } else {
        setCurrentInnings(matchData.innings[0])
        // Load innings state
        const stateRes = await scoring.getInningsState(matchData.innings[0].id)
        setCurrentOver(stateRes.data.current_over)
      }
    } catch (error) {
      console.error('Error loading match:', error)
    } finally {
      setLoading(false)
    }
  }

  const startNewOver = async () => {
    if (!bowler) {
      alert('Please select a bowler')
      return
    }

    try {
      const overNumber = currentOver ? currentOver.over_number + 1 : 1
      const overRes = await scoring.startOver({
        innings_id: currentInnings.id,
        over_number: overNumber,
        bowler_id: bowler.id,
      })
      setCurrentOver(overRes.data)
    } catch (error) {
      console.error('Error starting over:', error)
    }
  }

  const recordBall = async () => {
    if (!batter1 || !batter2 || !bowler || !currentOver) {
      alert('Please select batters and bowler')
      return
    }

    const currentBatter = striker === 'batter1' ? batter1 : batter2
    const nonStriker = striker === 'batter1' ? batter2 : batter1

    try {
      const ballNumber = (currentOver.runs_conceded || 0) + 1

      await scoring.recordBall({
        over_id: currentOver.id,
        ball_number: ballNumber,
        batter_id: currentBatter.id,
        non_striker_id: nonStriker.id,
        bowler_id: bowler.id,
        ...ballData,
        dismissal: ballData.is_wicket ? {
          player_id: currentBatter.id,
          ...dismissalData,
          bowler_id: dismissalData.dismissal_type !== 'run_out' ? bowler.id : null,
        } : null,
      })

      // Swap striker if odd runs or if it's the end of the over
      if (ballData.runs % 2 === 1 || ballNumber === 6) {
        setStriker(striker === 'batter1' ? 'batter2' : 'batter1')
      }

      // Reset ball data
      setBallData({
        runs: 0,
        is_extra: false,
        extra_type: '',
        extra_runs: 0,
        is_wicket: false,
      })

      // If wicket, reset batter
      if (ballData.is_wicket) {
        if (striker === 'batter1') {
          setBatter1(null)
        } else {
          setBatter2(null)
        }
        setShowDismissalModal(false)
      }

      // Reload match state
      loadMatch()
    } catch (error) {
      console.error('Error recording ball:', error)
      alert('Failed to record ball')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!match) {
    return <div className="text-center text-gray-400">Match not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {match.home_team_name} vs {match.away_team_name}
          </h1>
          <p className="text-gray-400">{match.tournament_name} • {match.format}</p>
        </div>
        {currentInnings && (
          <div className="mt-4 text-center">
            <div className="text-4xl font-bold text-primary">
              {currentInnings.total_runs}/{currentInnings.wickets_lost}
            </div>
            <div className="text-sm text-gray-400">
              {Math.floor(currentInnings.overs_bowled)}.{Math.round((currentInnings.overs_bowled % 1) * 6)} Overs
            </div>
          </div>
        )}
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Striker</h3>
          <select
            value={batter1?.id || ''}
            onChange={(e) => {
              const player = battingTeamPlayers.find((p) => p.id === parseInt(e.target.value))
              setBatter1(player)
              if (striker !== 'batter1') setStriker('batter1')
            }}
            className="input w-full"
          >
            <option value="">Select batter...</option>
            {battingTeamPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <div className="mt-2 text-sm text-gray-400">
            {striker === 'batter1' && '⚡ On Strike'}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Non-Striker</h3>
          <select
            value={batter2?.id || ''}
            onChange={(e) => {
              const player = battingTeamPlayers.find((p) => p.id === parseInt(e.target.value))
              setBatter2(player)
              if (striker !== 'batter2') setStriker('batter2')
            }}
            className="input w-full"
          >
            <option value="">Select batter...</option>
            {battingTeamPlayers.filter((p) => p.id !== batter1?.id).map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <div className="mt-2 text-sm text-gray-400">
            {striker === 'batter2' && '⚡ On Strike'}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Bowler</h3>
          <select
            value={bowler?.id || ''}
            onChange={(e) => {
              const player = bowlingTeamPlayers.find((p) => p.id === parseInt(e.target.value))
              setBowler(player)
            }}
            className="input w-full"
          >
            <option value="">Select bowler...</option>
            {bowlingTeamPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          {!currentOver && (
            <button onClick={startNewOver} className="btn-primary w-full mt-2">
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* Scoring Buttons */}
      <div className="card">
        <h3 className="font-semibold mb-4">Score Ball</h3>

        {/* Runs */}
        <div className="mb-4">
          <label className="label mb-2">Runs</label>
          <div className="grid grid-cols-6 gap-2">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button
                key={run}
                onClick={() => setBallData({ ...ballData, runs: run, is_extra: false })}
                className={`py-3 rounded font-bold transition ${
                  ballData.runs === run && !ballData.is_extra
                    ? 'bg-primary text-white'
                    : 'bg-dark-100 hover:bg-dark-50'
                }`}
              >
                {run}
              </button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="mb-4">
          <label className="label mb-2">Extras</label>
          <div className="grid grid-cols-4 gap-2">
            {['wide', 'noball', 'bye', 'legbye'].map((extra) => (
              <button
                key={extra}
                onClick={() =>
                  setBallData({
                    ...ballData,
                    is_extra: true,
                    extra_type: extra,
                    extra_runs: 1,
                  })
                }
                className={`py-2 rounded capitalize transition ${
                  ballData.extra_type === extra
                    ? 'bg-yellow-600 text-white'
                    : 'bg-dark-100 hover:bg-dark-50'
                }`}
              >
                {extra}
              </button>
            ))}
          </div>
          {ballData.is_extra && (
            <div className="mt-2">
              <label className="label">Extra Runs</label>
              <input
                type="number"
                value={ballData.extra_runs}
                onChange={(e) =>
                  setBallData({ ...ballData, extra_runs: parseInt(e.target.value) || 0 })
                }
                className="input w-full"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Wicket */}
        <div className="mb-4">
          <button
            onClick={() => {
              setBallData({ ...ballData, is_wicket: true })
              setShowDismissalModal(true)
            }}
            className={`w-full py-3 rounded font-bold transition ${
              ballData.is_wicket
                ? 'bg-red-600 text-white'
                : 'bg-dark-100 hover:bg-dark-50'
            }`}
          >
            Wicket
          </button>
        </div>

        {/* Record Ball Button */}
        <div className="flex space-x-3">
          <button onClick={recordBall} className="btn-primary flex-1">
            Record Ball
          </button>
          <button className="btn-secondary">
            <Undo size={18} />
          </button>
        </div>
      </div>

      {/* Current Over */}
      {currentOver && (
        <div className="card">
          <h3 className="font-semibold mb-2">Current Over</h3>
          <div className="flex space-x-2">
            {/* This would show the balls in the current over */}
            <div className="text-sm text-gray-400">
              Over {currentOver.over_number} • {bowler?.name}
            </div>
          </div>
        </div>
      )}

      {/* Dismissal Modal */}
      {showDismissalModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Record Dismissal</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Dismissal Type</label>
                <select
                  value={dismissalData.dismissal_type}
                  onChange={(e) =>
                    setDismissalData({ ...dismissalData, dismissal_type: e.target.value })
                  }
                  className="input w-full"
                >
                  <option value="bowled">Bowled</option>
                  <option value="caught">Caught</option>
                  <option value="lbw">LBW</option>
                  <option value="stumped">Stumped</option>
                  <option value="run_out">Run Out</option>
                  <option value="hit_wicket">Hit Wicket</option>
                  <option value="retired_hurt">Retired Hurt</option>
                </select>
              </div>
              {(dismissalData.dismissal_type === 'caught' ||
                dismissalData.dismissal_type === 'stumped' ||
                dismissalData.dismissal_type === 'run_out') && (
                <div>
                  <label className="label">Fielder</label>
                  <select
                    value={dismissalData.fielder_id || ''}
                    onChange={(e) =>
                      setDismissalData({
                        ...dismissalData,
                        fielder_id: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="input w-full"
                  >
                    <option value="">Select fielder...</option>
                    {bowlingTeamPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDismissalModal(false)
                    setBallData({ ...ballData, is_wicket: false })
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDismissalModal(false)
                    // Keep wicket marked, will be recorded with ball
                  }}
                  className="btn-primary flex-1"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
