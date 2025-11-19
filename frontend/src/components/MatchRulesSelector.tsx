import { useState, useEffect } from 'react'
import { matchRules } from '../lib/api'
import { Settings, Plus, Check } from 'lucide-react'

interface MatchRule {
  id: number
  name: string
  description: string
  overs_per_innings: number
  max_batsmen_per_innings: number | null
  is_junior_mode: boolean
  balls_per_batter: number | null
  has_powerplay: boolean
  powerplay_overs: number
  allow_super_over: boolean
  noball_runs: number
  wide_runs: number
}

interface MatchRulesSelectorProps {
  selectedRuleId?: number | null
  onSelect: (ruleId: number | null) => void
  showCustom?: boolean
}

export default function MatchRulesSelector({
  selectedRuleId,
  onSelect,
  showCustom = false,
}: MatchRulesSelectorProps) {
  const [rules, setRules] = useState<MatchRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [customRule, setCustomRule] = useState({
    name: '',
    description: '',
    overs_per_innings: 20,
    max_batsmen_per_innings: null as number | null,
    is_junior_mode: false,
    balls_per_batter: null as number | null,
    has_powerplay: false,
    powerplay_overs: 6,
    allow_super_over: false,
    noball_runs: 1,
    wide_runs: 1,
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const response = await matchRules.getAll()
      setRules(response.data)
    } catch (error) {
      console.error('Error loading match rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await matchRules.create(customRule)
      setRules([...rules, response.data])
      onSelect(response.data.id)
      setShowCreateForm(false)
      // Reset form
      setCustomRule({
        name: '',
        description: '',
        overs_per_innings: 20,
        max_batsmen_per_innings: null,
        is_junior_mode: false,
        balls_per_batter: null,
        has_powerplay: false,
        powerplay_overs: 6,
        allow_super_over: false,
        noball_runs: 1,
        wide_runs: 1,
      })
    } catch (error) {
      console.error('Error creating match rule:', error)
      alert('Failed to create match rule')
    }
  }

  if (loading) {
    return <div className="text-gray-400">Loading match rules...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">Match Format & Rules</label>
        {showCustom && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="text-sm text-primary hover:underline flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>Create Custom</span>
          </button>
        )}
      </div>

      {!showCreateForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rules.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() => onSelect(rule.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedRuleId === rule.id
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Settings size={16} className="text-primary" />
                  <span className="font-semibold">{rule.name}</span>
                </div>
                {selectedRuleId === rule.id && <Check size={16} className="text-primary" />}
              </div>

              {rule.description && (
                <p className="text-xs text-gray-400 mb-3">{rule.description}</p>
              )}

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Overs:</span>
                  <span className="font-medium">{rule.overs_per_innings}</span>
                </div>

                {rule.has_powerplay && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Powerplay:</span>
                    <span className="font-medium">{rule.powerplay_overs} overs</span>
                  </div>
                )}

                {rule.is_junior_mode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Junior Mode:</span>
                    <span className="font-medium">{rule.balls_per_batter} balls/batter</span>
                  </div>
                )}

                {rule.max_batsmen_per_innings && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Batsmen:</span>
                    <span className="font-medium">{rule.max_batsmen_per_innings}</span>
                  </div>
                )}

                {rule.allow_super_over && (
                  <div className="text-primary text-xs mt-2">✓ Super Over Enabled</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateRule} className="card space-y-4">
          <h3 className="font-semibold text-lg">Create Custom Match Rule</h3>

          <div>
            <label className="block text-sm font-medium mb-1">Rule Name*</label>
            <input
              type="text"
              value={customRule.name}
              onChange={(e) => setCustomRule({ ...customRule, name: e.target.value })}
              className="input w-full"
              placeholder="e.g., Custom T30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={customRule.description}
              onChange={(e) => setCustomRule({ ...customRule, description: e.target.value })}
              className="input w-full"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Overs Per Innings*</label>
              <input
                type="number"
                value={customRule.overs_per_innings}
                onChange={(e) =>
                  setCustomRule({ ...customRule, overs_per_innings: parseInt(e.target.value) })
                }
                className="input w-full"
                min="1"
                max="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Batsmen (Optional)</label>
              <input
                type="number"
                value={customRule.max_batsmen_per_innings || ''}
                onChange={(e) =>
                  setCustomRule({
                    ...customRule,
                    max_batsmen_per_innings: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="input w-full"
                min="1"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="has_powerplay"
              checked={customRule.has_powerplay}
              onChange={(e) =>
                setCustomRule({ ...customRule, has_powerplay: e.target.checked })
              }
              className="rounded"
            />
            <label htmlFor="has_powerplay" className="text-sm">Enable Powerplay</label>
          </div>

          {customRule.has_powerplay && (
            <div>
              <label className="block text-sm font-medium mb-1">Powerplay Overs</label>
              <input
                type="number"
                value={customRule.powerplay_overs}
                onChange={(e) =>
                  setCustomRule({ ...customRule, powerplay_overs: parseInt(e.target.value) })
                }
                className="input w-full"
                min="1"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_junior_mode"
              checked={customRule.is_junior_mode}
              onChange={(e) =>
                setCustomRule({ ...customRule, is_junior_mode: e.target.checked })
              }
              className="rounded"
            />
            <label htmlFor="is_junior_mode" className="text-sm">Junior Cricket Mode</label>
          </div>

          {customRule.is_junior_mode && (
            <div>
              <label className="block text-sm font-medium mb-1">Balls Per Batter</label>
              <input
                type="number"
                value={customRule.balls_per_batter || ''}
                onChange={(e) =>
                  setCustomRule({
                    ...customRule,
                    balls_per_batter: parseInt(e.target.value),
                  })
                }
                className="input w-full"
                min="1"
                placeholder="e.g., 6"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allow_super_over"
              checked={customRule.allow_super_over}
              onChange={(e) =>
                setCustomRule({ ...customRule, allow_super_over: e.target.checked })
              }
              className="rounded"
            />
            <label htmlFor="allow_super_over" className="text-sm">Allow Super Over (for ties)</label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Rule
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
