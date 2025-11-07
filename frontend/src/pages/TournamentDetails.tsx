import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tournaments, teams as teamsApi, matches as matchesApi } from '../lib/api'
import { Plus, Trophy, TrendingUp } from 'lucide-react'

export default function TournamentDetails() {
  const { id } = useParams()
  const [tournament, setTournament] = useState<any>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [leaderboards, setLeaderboards] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)

  const [matchFormData, setMatchFormData] = useState({
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    venue: '',
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [tournamentRes, teamsRes, leaderboardsRes] = await Promise.all([
        tournaments.getById(parseInt(id!)),
        teamsApi.getAll(),
        tournaments.getLeaderboards(parseInt(id!)),
      ])
      setTournament(tournamentRes.data)
      setAllTeams(teamsRes.data)
      setLeaderboards(leaderboardsRes.data)
    } catch (error) {
      console.error('Error loading tournament details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeam = async (teamId: number) => {
    try {
      await tournaments.addTeam(parseInt(id!), teamId)
      loadData()
    } catch (error) {
      console.error('Error adding team:', error)
    }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await matchesApi.create({
        tournament_id: parseInt(id!),
        ...matchFormData,
        format: tournament.format,
        overs_per_innings: tournament.overs_per_innings,
        home_team_id: parseInt(matchFormData.home_team_id),
        away_team_id: parseInt(matchFormData.away_team_id),
      })
      setShowMatchModal(false)
      setMatchFormData({
        home_team_id: '',
        away_team_id: '',
        match_date: '',
        venue: '',
      })
      loadData()
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!tournament) {
    return <div className="text-center text-gray-400">Tournament not found</div>
  }

  const tournamentTeams = tournament.standings || []
  const availableTeams = allTeams.filter(
    (team) => !tournamentTeams.some((t: any) => t.team_id === team.id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-4 rounded-full">
              <Trophy className="text-primary" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{tournament.name}</h1>
              <p className="text-gray-400">{tournament.format} • {tournament.tournament_type}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTeamModal(true)}
              className="btn-secondary"
            >
              Add Team
            </button>
            <button
              onClick={() => setShowMatchModal(true)}
              className="btn-primary"
            >
              Create Match
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{tournamentTeams.length}</div>
            <div className="text-sm text-gray-400">Teams</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{tournament.matches?.length || 0}</div>
            <div className="text-sm text-gray-400">Matches</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{tournament.overs_per_innings}</div>
            <div className="text-sm text-gray-400">Overs</div>
          </div>
        </div>
      </div>

      {/* Standings */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Standings</h2>
        {tournamentTeams.length === 0 ? (
          <p className="text-center text-gray-400">No teams added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Pos</th>
                  <th className="pb-2">Team</th>
                  <th className="pb-2 text-center">Played</th>
                  <th className="pb-2 text-center">Won</th>
                  <th className="pb-2 text-center">Lost</th>
                  <th className="pb-2 text-center">Points</th>
                  <th className="pb-2 text-center">NRR</th>
                </tr>
              </thead>
              <tbody>
                {tournamentTeams.map((team: any, index: number) => (
                  <tr key={team.id} className="border-b border-gray-800">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3 font-semibold">{team.team_name}</td>
                    <td className="py-3 text-center">{team.wins + team.losses + team.ties}</td>
                    <td className="py-3 text-center">{team.wins}</td>
                    <td className="py-3 text-center">{team.losses}</td>
                    <td className="py-3 text-center font-bold text-primary">{team.points}</td>
                    <td className="py-3 text-center">{team.nrr?.toFixed(3) || '0.000'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboards */}
      {leaderboards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <TrendingUp className="text-primary" size={20} />
              <span>Most Runs</span>
            </h3>
            {leaderboards.most_runs.length === 0 ? (
              <p className="text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboards.most_runs.map((player: any, index: number) => (
                  <div key={player.id} className="flex items-center justify-between bg-dark-100 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-primary">{index + 1}</div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.innings} innings</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{player.total_runs}</div>
                      <div className="text-sm text-gray-400">Avg: {player.average?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <TrendingUp className="text-primary" size={20} />
              <span>Most Wickets</span>
            </h3>
            {leaderboards.most_wickets.length === 0 ? (
              <p className="text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboards.most_wickets.map((player: any, index: number) => (
                  <div key={player.id} className="flex items-center justify-between bg-dark-100 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-primary">{index + 1}</div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-400">{player.overs_bowled} overs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{player.total_wickets}</div>
                      <div className="text-sm text-gray-400">Eco: {player.economy?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Matches */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Matches</h2>
        {tournament.matches?.length === 0 ? (
          <p className="text-center text-gray-400">No matches scheduled yet</p>
        ) : (
          <div className="space-y-3">
            {tournament.matches.map((match: any) => (
              <div key={match.id} className="flex items-center justify-between bg-dark-100 p-4 rounded">
                <div>
                  <div className="font-semibold">
                    {match.home_team_name} vs {match.away_team_name}
                  </div>
                  <div className="text-sm text-gray-400">{match.venue || 'Venue TBD'}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.status === 'in_progress' ? 'bg-green-900/50 text-green-200' :
                    match.status === 'completed' ? 'bg-blue-900/50 text-blue-200' :
                    'bg-yellow-900/50 text-yellow-200'
                  }`}>
                    {match.status}
                  </span>
                  {match.status === 'scheduled' && (
                    <Link to={`/matches/${match.id}/scoring`} className="btn-primary text-sm py-1 px-3">
                      Start
                    </Link>
                  )}
                  {match.status === 'in_progress' && (
                    <Link to={`/matches/${match.id}/scoring`} className="btn-primary text-sm py-1 px-3">
                      Score
                    </Link>
                  )}
                  {match.status === 'completed' && (
                    <Link to={`/matches/${match.id}/live`} className="btn-secondary text-sm py-1 px-3">
                      View
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Team to Tournament</h2>
            {availableTeams.length === 0 ? (
              <p className="text-gray-400">All teams have been added</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between bg-dark-100 p-3 rounded cursor-pointer hover:bg-dark-50"
                    onClick={() => {
                      handleAddTeam(team.id)
                      setShowTeamModal(false)
                    }}
                  >
                    <div>
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-gray-400">{team.player_count} players</div>
                    </div>
                    <Plus className="text-primary" size={20} />
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowTeamModal(false)}
              className="btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Match</h2>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div>
                <label className="label">Home Team</label>
                <select
                  value={matchFormData.home_team_id}
                  onChange={(e) => setMatchFormData({ ...matchFormData, home_team_id: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select team...</option>
                  {tournamentTeams.map((team: any) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Away Team</label>
                <select
                  value={matchFormData.away_team_id}
                  onChange={(e) => setMatchFormData({ ...matchFormData, away_team_id: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Select team...</option>
                  {tournamentTeams.filter((team: any) => team.team_id !== parseInt(matchFormData.home_team_id)).map((team: any) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Match Date</label>
                <input
                  type="datetime-local"
                  value={matchFormData.match_date}
                  onChange={(e) => setMatchFormData({ ...matchFormData, match_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Venue</label>
                <input
                  type="text"
                  value={matchFormData.venue}
                  onChange={(e) => setMatchFormData({ ...matchFormData, venue: e.target.value })}
                  className="input w-full"
                  placeholder="Stadium or ground name"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create Match
                </button>
                <button
                  type="button"
                  onClick={() => setShowMatchModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
