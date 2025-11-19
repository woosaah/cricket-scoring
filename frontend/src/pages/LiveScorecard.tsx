import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { matches, scoring } from '../lib/api'
import { RefreshCw } from 'lucide-react'
import WagonWheel from '../components/WagonWheel'
import PitchMap from '../components/PitchMap'

export default function LiveScorecard() {
  const { id } = useParams()
  const [scorecard, setScorecard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [inningsData, setInningsData] = useState<any[]>([])
  const [showWagonWheel, setShowWagonWheel] = useState<number | null>(null)
  const [showPitchMap, setShowPitchMap] = useState<number | null>(null)

  useEffect(() => {
    loadScorecard()

    const interval = autoRefresh
      ? setInterval(() => {
          loadScorecard()
        }, 2000)
      : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [id, autoRefresh])

  const loadScorecard = async () => {
    try {
      const response = await matches.getScorecard(parseInt(id!))
      setScorecard(response.data)

      // Load innings data with balls for visualizations
      if (response.data.innings) {
        const inningsWithBalls = await Promise.all(
          response.data.innings.map(async (inning: any) => {
            try {
              const stateRes = await scoring.getInningsState(inning.id)
              return { ...inning, balls: stateRes.data?.balls || [] }
            } catch {
              return { ...inning, balls: [] }
            }
          })
        )
        setInningsData(inningsWithBalls)
      }
    } catch (error) {
      console.error('Error loading scorecard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading scorecard...</div>
  }

  if (!scorecard) {
    return <div className="text-center text-gray-400">Scorecard not available</div>
  }

  const { match, innings } = scorecard

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {match.home_team} vs {match.away_team}
            </h1>
            <p className="text-gray-400">{match.venue || 'Venue TBD'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`btn-secondary flex items-center space-x-2 ${
                autoRefresh ? 'bg-green-900/50' : ''
              }`}
            >
              <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
              <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
            <button onClick={loadScorecard} className="btn-secondary">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <div className={`inline-block px-3 py-1 rounded text-sm ${
          match.status === 'in_progress'
            ? 'bg-green-900/50 text-green-200'
            : match.status === 'completed'
            ? 'bg-blue-900/50 text-blue-200'
            : 'bg-yellow-900/50 text-yellow-200'
        }`}>
          {match.status.replace('_', ' ')}
        </div>
      </div>

      {/* Innings Scorecards */}
      {innings.map((inning: any, index: number) => (
        <div key={inning.id} className="space-y-4">
          {/* Innings Header */}
          <div className="card">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{inning.batting_team_name}</h2>
                <p className="text-sm text-gray-400">Innings {inning.innings_number}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {inning.total_runs}/{inning.wickets_lost}
                </div>
                <div className="text-sm text-gray-400">
                  {Math.floor(inning.overs_bowled)}.{Math.round((inning.overs_bowled % 1) * 6)} Overs
                </div>
              </div>
            </div>
            {inning.extras_total > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                Extras: {inning.extras_total} (wd {inning.extras_wides}, nb {inning.extras_noballs}, b {inning.extras_byes}, lb {inning.extras_legbyes})
              </div>
            )}
          </div>

          {/* Batting Scorecard */}
          <div className="card">
            <h3 className="font-semibold mb-3">Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2">Batter</th>
                    <th className="pb-2 text-center">R</th>
                    <th className="pb-2 text-center">B</th>
                    <th className="pb-2 text-center">4s</th>
                    <th className="pb-2 text-center">6s</th>
                    <th className="pb-2 text-center">SR</th>
                    <th className="pb-2">How Out</th>
                  </tr>
                </thead>
                <tbody>
                  {inning.batting.map((batter: any) => (
                    <tr key={batter.id} className="border-b border-gray-800">
                      <td className="py-2 font-medium">{batter.name}</td>
                      <td className="py-2 text-center">{batter.runs_scored || 0}</td>
                      <td className="py-2 text-center">{batter.balls_faced || 0}</td>
                      <td className="py-2 text-center">{batter.fours || 0}</td>
                      <td className="py-2 text-center">{batter.sixes || 0}</td>
                      <td className="py-2 text-center">{batter.strike_rate || '0.00'}</td>
                      <td className="py-2 text-sm text-gray-400">
                        {batter.dismissal_type ? (
                          <>
                            {batter.dismissal_type === 'caught' && `c ${batter.fielder_name || 'fielder'}`}
                            {batter.dismissal_type === 'bowled' && 'b'}
                            {batter.dismissal_type === 'lbw' && 'lbw'}
                            {batter.dismissal_type === 'stumped' && `st ${batter.fielder_name || 'wk'}`}
                            {batter.dismissal_type === 'run_out' && 'run out'}
                            {batter.bowler_name && ` ${batter.bowler_name}`}
                          </>
                        ) : (
                          'not out'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bowling Scorecard */}
          <div className="card">
            <h3 className="font-semibold mb-3">Bowling</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2">Bowler</th>
                    <th className="pb-2 text-center">O</th>
                    <th className="pb-2 text-center">M</th>
                    <th className="pb-2 text-center">R</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-center">Eco</th>
                    <th className="pb-2 text-center">Wd</th>
                    <th className="pb-2 text-center">Nb</th>
                  </tr>
                </thead>
                <tbody>
                  {inning.bowling.map((bowler: any) => (
                    <tr key={bowler.id} className="border-b border-gray-800">
                      <td className="py-2 font-medium">{bowler.name}</td>
                      <td className="py-2 text-center">{bowler.overs_bowled || 0}</td>
                      <td className="py-2 text-center">{bowler.maidens || 0}</td>
                      <td className="py-2 text-center">{bowler.runs_conceded || 0}</td>
                      <td className="py-2 text-center font-bold text-primary">
                        {bowler.wickets || 0}
                      </td>
                      <td className="py-2 text-center">{bowler.economy || '0.00'}</td>
                      <td className="py-2 text-center text-gray-400">{bowler.wides || 0}</td>
                      <td className="py-2 text-center text-gray-400">{bowler.noballs || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualizations */}
          {inningsData[index] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wagon Wheel */}
              <div className="card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Wagon Wheel</h3>
                  <button
                    onClick={() =>
                      setShowWagonWheel(showWagonWheel === index ? null : index)
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    {showWagonWheel === index ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showWagonWheel === index && (
                  <div className="flex justify-center">
                    <WagonWheel
                      shots={
                        inningsData[index].balls
                          ?.filter(
                            (b: any) =>
                              b.wagon_wheel_x !== null && b.wagon_wheel_y !== null
                          )
                          .map((b: any) => ({
                            x: b.wagon_wheel_x,
                            y: b.wagon_wheel_y,
                            runs: b.runs,
                          })) || []
                      }
                      size={300}
                    />
                  </div>
                )}
              </div>

              {/* Pitch Map */}
              <div className="card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Pitch Map</h3>
                  <button
                    onClick={() =>
                      setShowPitchMap(showPitchMap === index ? null : index)
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    {showPitchMap === index ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showPitchMap === index && (
                  <div className="flex justify-center">
                    <PitchMap
                      deliveries={
                        inningsData[index].balls
                          ?.filter(
                            (b: any) => b.pitch_x !== null && b.pitch_y !== null
                          )
                          .map((b: any) => ({
                            x: b.pitch_x,
                            y: b.pitch_y,
                            runs: b.runs,
                            isWicket: b.is_wicket,
                          })) || []
                      }
                      width={250}
                      height={350}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {innings.length === 0 && (
        <div className="card text-center text-gray-400">
          <p>Match has not started yet</p>
        </div>
      )}
    </div>
  )
}
