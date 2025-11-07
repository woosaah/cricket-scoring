import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tournaments } from '../lib/api'
import { Plus, Trophy } from 'lucide-react'

export default function Tournaments() {
  const [tournamentsList, setTournamentsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    format: 'T20',
    overs_per_innings: 20,
    start_date: '',
    end_date: '',
    tournament_type: 'round-robin',
    points_win: 2,
    points_loss: 0,
    points_tie: 1,
  })

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      const response = await tournaments.getAll()
      setTournamentsList(response.data)
    } catch (error) {
      console.error('Error loading tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await tournaments.create(formData)
      setShowModal(false)
      setFormData({
        name: '',
        format: 'T20',
        overs_per_innings: 20,
        start_date: '',
        end_date: '',
        tournament_type: 'round-robin',
        points_win: 2,
        points_loss: 0,
        points_tie: 1,
      })
      loadTournaments()
    } catch (error) {
      console.error('Error creating tournament:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tournaments</h1>
          <p className="text-gray-400">Manage and track your cricket tournaments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Create Tournament</span>
        </button>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournamentsList.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tournaments/${tournament.id}`}
            className="card hover:border-primary transition cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Trophy className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{tournament.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">{tournament.tournament_type}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                tournament.status === 'upcoming' ? 'bg-yellow-900/50 text-yellow-200' :
                tournament.status === 'ongoing' ? 'bg-green-900/50 text-green-200' :
                'bg-blue-900/50 text-blue-200'
              }`}>
                {tournament.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span>{tournament.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Teams:</span>
                <span>{tournament.team_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Matches:</span>
                <span>{tournament.match_count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {tournamentsList.length === 0 && (
        <div className="card text-center text-gray-400">
          <p>No tournaments yet. Create your first tournament!</p>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-md w-full my-8">
            <h2 className="text-2xl font-bold mb-4">Create Tournament</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Tournament Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => {
                      const overs = e.target.value === 'T20' ? 20 : e.target.value === 'T40' ? 40 : 50
                      setFormData({ ...formData, format: e.target.value, overs_per_innings: overs })
                    }}
                    className="input w-full"
                  >
                    <option value="T20">T20</option>
                    <option value="T40">T40</option>
                    <option value="T50">T50</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="label">Overs per Innings</label>
                  <input
                    type="number"
                    value={formData.overs_per_innings}
                    onChange={(e) => setFormData({ ...formData, overs_per_innings: parseInt(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Tournament Type</label>
                <select
                  value={formData.tournament_type}
                  onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                  className="input w-full"
                >
                  <option value="round-robin">Round Robin</option>
                  <option value="knockout">Knockout</option>
                  <option value="group-stage">Group Stage</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Win Points</label>
                  <input
                    type="number"
                    value={formData.points_win}
                    onChange={(e) => setFormData({ ...formData, points_win: parseInt(e.target.value) })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Loss Points</label>
                  <input
                    type="number"
                    value={formData.points_loss}
                    onChange={(e) => setFormData({ ...formData, points_loss: parseInt(e.target.value) })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="label">Tie Points</label>
                  <input
                    type="number"
                    value={formData.points_tie}
                    onChange={(e) => setFormData({ ...formData, points_tie: parseInt(e.target.value) })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
