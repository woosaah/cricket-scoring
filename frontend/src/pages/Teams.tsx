import { useEffect, useState } from 'react'
import { teams, players as playersApi } from '../lib/api'
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react'

export default function Teams() {
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [playersList, setPlayersList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    primary_color: '#dc2626',
    secondary_color: '#000000',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        teams.getAll(),
        playersApi.getAll(),
      ])
      setTeamsList(teamsRes.data)
      setPlayersList(playersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTeam) {
        await teams.update(editingTeam.id, formData)
      } else {
        await teams.create(formData)
      }
      setShowModal(false)
      setEditingTeam(null)
      setFormData({
        name: '',
        city: '',
        primary_color: '#dc2626',
        secondary_color: '#000000',
      })
      loadData()
    } catch (error) {
      console.error('Error saving team:', error)
    }
  }

  const handleEdit = (team: any) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      city: team.city || '',
      primary_color: team.primary_color,
      secondary_color: team.secondary_color,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await teams.delete(id)
        loadData()
      } catch (error) {
        console.error('Error deleting team:', error)
      }
    }
  }

  const handleManagePlayers = async (team: any) => {
    try {
      const response = await teams.getById(team.id)
      setSelectedTeam(response.data)
      setShowPlayerModal(true)
    } catch (error) {
      console.error('Error loading team details:', error)
    }
  }

  const handleAddPlayer = async (playerId: number) => {
    if (!selectedTeam) return
    try {
      await teams.addPlayer(selectedTeam.id, playerId)
      const response = await teams.getById(selectedTeam.id)
      setSelectedTeam(response.data)
      loadData()
    } catch (error) {
      console.error('Error adding player:', error)
    }
  }

  const handleRemovePlayer = async (playerId: number) => {
    if (!selectedTeam) return
    try {
      await teams.removePlayer(selectedTeam.id, playerId)
      const response = await teams.getById(selectedTeam.id)
      setSelectedTeam(response.data)
      loadData()
    } catch (error) {
      console.error('Error removing player:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-gray-400">Manage your cricket teams</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamsList.map((team) => (
          <div key={team.id} className="card" style={{ borderLeftWidth: '4px', borderLeftColor: team.primary_color }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full" style={{ backgroundColor: `${team.primary_color}20` }}>
                  <Shield style={{ color: team.primary_color }} size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  {team.city && <p className="text-sm text-gray-400">{team.city}</p>}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(team)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {team.player_count} players
              </div>
              <button
                onClick={() => handleManagePlayers(team)}
                className="btn-secondary text-sm py-1 px-3 flex items-center space-x-1"
              >
                <Users size={16} />
                <span>Manage Players</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {teamsList.length === 0 && (
        <div className="card text-center text-gray-400">
          <p>No teams yet. Create your first team!</p>
        </div>
      )}

      {/* Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingTeam ? 'Edit Team' : 'Add Team'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Team Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Primary Color</label>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="input w-full h-10"
                  />
                </div>
                <div>
                  <label className="label">Secondary Color</label>
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="input w-full h-10"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  {editingTeam ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTeam(null)
                    setFormData({
                      name: '',
                      city: '',
                      primary_color: '#dc2626',
                      secondary_color: '#000000',
                    })
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Management Modal */}
      {showPlayerModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card max-w-2xl w-full my-8">
            <h2 className="text-2xl font-bold mb-4">Manage Players - {selectedTeam.name}</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Current Players ({selectedTeam.players?.filter((p: any) => p.is_active).length || 0})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTeam.players?.filter((p: any) => p.is_active).map((player: any) => (
                    <div key={player.id} className="flex items-center justify-between bg-dark-100 p-3 rounded">
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-400 capitalize">{player.role}</div>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(!selectedTeam.players || selectedTeam.players.filter((p: any) => p.is_active).length === 0) && (
                    <p className="text-gray-400 text-center py-4">No players in this team</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Add Players</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {playersList
                    .filter((player) => !selectedTeam.players?.some((p: any) => p.id === player.id && p.is_active))
                    .map((player) => (
                      <div key={player.id} className="flex items-center justify-between bg-dark-100 p-3 rounded">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-400 capitalize">{player.role}</div>
                        </div>
                        <button
                          onClick={() => handleAddPlayer(player.id)}
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPlayerModal(false)
                setSelectedTeam(null)
              }}
              className="btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
