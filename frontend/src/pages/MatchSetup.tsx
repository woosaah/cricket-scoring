import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { tournaments, teams, matches } from '../lib/api'
import MatchRulesSelector from '../components/MatchRulesSelector'

export default function MatchSetup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const matchId = searchParams.get('matchId')

  const [tournamentsList, setTournamentsList] = useState<any[]>([])
  const [teamsList, setTeamsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'create' | 'toss'>('create')
  const [createdMatchId, setCreatedMatchId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    tournament_id: '',
    home_team_id: '',
    away_team_id: '',
    match_date: new Date().toISOString().slice(0, 16),
    match_rules_id: null as number | null,
    venue: '',
  })

  const [tossData, setTossData] = useState({
    toss_winner_id: '',
    toss_decision: 'bat',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tournamentsRes, teamsRes] = await Promise.all([
        tournaments.getAll(),
        teams.getAll(),
      ])
      setTournamentsList(tournamentsRes.data)
      setTeamsList(teamsRes.data)

      if (matchId) {
        const matchRes = await matches.getById(parseInt(matchId))
        const match = matchRes.data
        setFormData({
          tournament_id: match.tournament_id.toString(),
          home_team_id: match.home_team_id.toString(),
          away_team_id: match.away_team_id.toString(),
          match_date: match.match_date || new Date().toISOString().slice(0, 16),
          match_rules_id: match.match_rules_id || null,
          venue: match.venue || '',
        })
        setCreatedMatchId(match.id)
        setStep('toss')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await matches.create({
        ...formData,
        tournament_id: parseInt(formData.tournament_id),
        home_team_id: parseInt(formData.home_team_id),
        away_team_id: parseInt(formData.away_team_id),
      })
      setCreatedMatchId(response.data.id)
      setStep('toss')
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Failed to create match')
    }
  }

  const handleRecordToss = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await matches.recordToss(createdMatchId!, {
        toss_winner_id: parseInt(tossData.toss_winner_id),
        toss_decision: tossData.toss_decision,
      })
      navigate(`/matches/${createdMatchId}/scoring`)
    } catch (error) {
      console.error('Error recording toss:', error)
      alert('Failed to record toss')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Match Setup</h1>
        <p className="text-gray-400">
          {step === 'create' ? 'Create a new match' : 'Record the toss'}
        </p>
      </div>

      {step === 'create' ? (
        <form onSubmit={handleCreateMatch} className="card space-y-4">
          <h2 className="text-xl font-semibold">Match Details</h2>

          <div>
            <label className="label">Tournament</label>
            <select
              value={formData.tournament_id}
              onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select tournament...</option>
              {tournamentsList.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Home Team</label>
              <select
                value={formData.home_team_id}
                onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select team...</option>
                {teamsList.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Away Team</label>
              <select
                value={formData.away_team_id}
                onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select team...</option>
                {teamsList
                  .filter((team) => team.id !== parseInt(formData.home_team_id))
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <MatchRulesSelector
            selectedRuleId={formData.match_rules_id}
            onSelect={(ruleId) => setFormData({ ...formData, match_rules_id: ruleId })}
            showCustom={true}
          />

          <div>
            <label className="label">Match Date & Time</label>
            <input
              type="datetime-local"
              value={formData.match_date}
              onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="label">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="input w-full"
              placeholder="Stadium or ground name"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Continue to Toss
          </button>
        </form>
      ) : (
        <form onSubmit={handleRecordToss} className="card space-y-4">
          <h2 className="text-xl font-semibold">Toss Details</h2>

          <div>
            <label className="label">Toss Winner</label>
            <select
              value={tossData.toss_winner_id}
              onChange={(e) => setTossData({ ...tossData, toss_winner_id: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select team...</option>
              <option value={formData.home_team_id}>
                {teamsList.find((t) => t.id === parseInt(formData.home_team_id))?.name}
              </option>
              <option value={formData.away_team_id}>
                {teamsList.find((t) => t.id === parseInt(formData.away_team_id))?.name}
              </option>
            </select>
          </div>

          <div>
            <label className="label">Toss Decision</label>
            <select
              value={tossData.toss_decision}
              onChange={(e) => setTossData({ ...tossData, toss_decision: e.target.value })}
              className="input w-full"
            >
              <option value="bat">Chose to Bat</option>
              <option value="bowl">Chose to Bowl</option>
            </select>
          </div>

          <div className="bg-dark-100 p-4 rounded">
            <p className="text-sm text-gray-400">
              {teamsList.find((t) => t.id === parseInt(tossData.toss_winner_id))?.name || 'Team'}{' '}
              won the toss and chose to{' '}
              <span className="font-semibold text-primary">{tossData.toss_decision}</span>
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setStep('create')}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button type="submit" className="btn-primary flex-1">
              Start Match
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
