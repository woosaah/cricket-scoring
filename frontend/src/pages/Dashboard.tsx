import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { matches, tournaments } from '../lib/api'
import { Trophy, Play, Clock, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [activeTournaments, setActiveTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [matchesRes, tournamentsRes] = await Promise.all([
        matches.getAll(),
        tournaments.getAll(),
      ])
      setRecentMatches(matchesRes.data.slice(0, 5))
      setActiveTournaments(
        tournamentsRes.data.filter((t: any) => t.status !== 'completed')
      )
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Play className="text-green-500" size={20} />
      case 'completed':
        return <CheckCircle className="text-blue-500" size={20} />
      default:
        return <Clock className="text-yellow-500" size={20} />
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to your cricket scoring hub</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/matches/setup" className="card hover:border-primary transition cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Play className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Start Match</h3>
              <p className="text-sm text-gray-400">Create & score a match</p>
            </div>
          </div>
        </Link>

        <Link to="/tournaments" className="card hover:border-primary transition cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Trophy className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Tournaments</h3>
              <p className="text-sm text-gray-400">Manage tournaments</p>
            </div>
          </div>
        </Link>

        <Link to="/teams" className="card hover:border-primary transition cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <Trophy className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="font-semibold">Teams</h3>
              <p className="text-sm text-gray-400">Manage teams & players</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Active Tournaments */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Tournaments</h2>
        {activeTournaments.length === 0 ? (
          <div className="card text-center text-gray-400">
            <p>No active tournaments</p>
            <Link to="/tournaments" className="text-primary hover:underline mt-2 inline-block">
              Create one now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/tournaments/${tournament.id}`}
                className="card hover:border-primary transition cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{tournament.name}</h3>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                    {tournament.format}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {tournament.team_count} teams • {tournament.match_count} matches
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Matches */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
        {recentMatches.length === 0 ? (
          <div className="card text-center text-gray-400">
            <p>No matches yet</p>
            <Link to="/matches/setup" className="text-primary hover:underline mt-2 inline-block">
              Start your first match
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMatches.map((match) => (
              <div key={match.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(match.status)}
                    <div>
                      <div className="font-semibold">
                        {match.home_team_name} vs {match.away_team_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {match.tournament_name} • {match.format}
                      </div>
                    </div>
                  </div>
                  {match.status === 'in_progress' && (
                    <Link
                      to={`/matches/${match.id}/scoring`}
                      className="btn-primary"
                    >
                      Score
                    </Link>
                  )}
                  {match.status === 'completed' && match.winner_id && (
                    <div className="text-right">
                      <div className="text-sm text-green-500">
                        Winner: {match.winner_id === match.home_team_id ? match.home_team_name : match.away_team_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        by {match.margin} {match.margin_type}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
