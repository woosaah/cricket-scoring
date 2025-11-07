import { useEffect, useState } from 'react'
import { players } from '../lib/api'
import { Plus, Edit, Trash2, User } from 'lucide-react'

export default function Players() {
  const [playersList, setPlayersList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '',
    role: 'batter',
    bio: '',
  })

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const response = await players.getAll()
      setPlayersList(response.data)
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingPlayer) {
        await players.update(editingPlayer.id, formData)
      } else {
        await players.create(formData)
      }
      setShowModal(false)
      setEditingPlayer(null)
      setFormData({ name: '', jersey_number: '', role: 'batter', bio: '' })
      loadPlayers()
    } catch (error) {
      console.error('Error saving player:', error)
    }
  }

  const handleEdit = (player: any) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      jersey_number: player.jersey_number || '',
      role: player.role,
      bio: player.bio || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await players.delete(id)
        loadPlayers()
      } catch (error) {
        console.error('Error deleting player:', error)
      }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-gray-400">Manage your player roster</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Player</span>
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playersList.map((player) => (
          <div key={player.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/20 p-3 rounded-full">
                  <User className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{player.name}</h3>
                  <p className="text-sm text-gray-400">#{player.jersey_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(player)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(player.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Role:</span>
                <span className="capitalize">{player.role}</span>
              </div>
              {player.teams && player.teams.length > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">Teams: </span>
                  <span>{player.teams.map((t: any) => t.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {playersList.length === 0 && (
        <div className="card text-center text-gray-400">
          <p>No players yet. Create your first player!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label">Jersey Number</label>
                <input
                  type="number"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="batter">Batter</option>
                  <option value="bowler">Bowler</option>
                  <option value="all-rounder">All-Rounder</option>
                  <option value="wicket-keeper">Wicket Keeper</option>
                </select>
              </div>
              <div>
                <label className="label">Bio (optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn-primary flex-1">
                  {editingPlayer ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPlayer(null)
                    setFormData({ name: '', jersey_number: '', role: 'batter', bio: '' })
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
    </div>
  )
}
