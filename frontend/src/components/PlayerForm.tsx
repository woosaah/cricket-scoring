import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BattingForm {
  match_date: string
  match_id: number
  home_team: string
  away_team: string
  runs: number
  balls: number
  strike_rate: string
}

interface BowlingForm {
  match_date: string
  match_id: number
  home_team: string
  away_team: string
  overs: number
  runs: number
  wickets: number
  economy: string
}

interface PlayerFormProps {
  battingForm: BattingForm[]
  bowlingForm: BowlingForm[]
  playerName: string
}

export default function PlayerForm({ battingForm, bowlingForm, playerName }: PlayerFormProps) {
  const hasBattingData = battingForm && battingForm.length > 0
  const hasBowlingData = bowlingForm && bowlingForm.length > 0

  if (!hasBattingData && !hasBowlingData) {
    return (
      <div className="text-center text-gray-400 py-8">
        No form data available for {playerName}
      </div>
    )
  }

  // Prepare batting chart data (reverse for chronological order)
  const battingChartData = hasBattingData
    ? [...battingForm].reverse().map((match) => ({
        match: `${match.home_team.substring(0, 3)} v ${match.away_team.substring(0, 3)}`,
        runs: match.runs,
        strikeRate: parseFloat(match.strike_rate),
        date: new Date(match.match_date).toLocaleDateString(),
      }))
    : []

  // Prepare bowling chart data
  const bowlingChartData = hasBowlingData
    ? [...bowlingForm].reverse().map((match) => ({
        match: `${match.home_team.substring(0, 3)} v ${match.away_team.substring(0, 3)}`,
        wickets: match.wickets,
        economy: parseFloat(match.economy),
        date: new Date(match.match_date).toLocaleDateString(),
      }))
    : []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
          <p className="font-semibold text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Batting Form */}
      {hasBattingData && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Batting Form (Last 10 Innings)</h3>

          {/* Batting Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={battingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="match" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="runs"
                stroke="#dc2626"
                strokeWidth={2}
                name="Runs"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="strikeRate"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Strike Rate"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Batting Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Match</th>
                  <th className="pb-2 text-center">Runs</th>
                  <th className="pb-2 text-center">Balls</th>
                  <th className="pb-2 text-center">SR</th>
                </tr>
              </thead>
              <tbody>
                {battingForm.map((match, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-2 text-gray-400">
                      {new Date(match.match_date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{match.home_team} v {match.away_team}</td>
                    <td className="py-2 text-center font-bold text-primary">{match.runs}</td>
                    <td className="py-2 text-center">{match.balls}</td>
                    <td className="py-2 text-center">{match.strike_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Batting Stats Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Total Runs</div>
              <div className="text-xl font-bold text-primary">
                {battingForm.reduce((sum, m) => sum + m.runs, 0)}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Average</div>
              <div className="text-xl font-bold">
                {(battingForm.reduce((sum, m) => sum + m.runs, 0) / battingForm.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Avg SR</div>
              <div className="text-xl font-bold">
                {(battingForm.reduce((sum, m) => sum + parseFloat(m.strike_rate), 0) / battingForm.length).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bowling Form */}
      {hasBowlingData && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Bowling Form (Last 10 Innings)</h3>

          {/* Bowling Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={bowlingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="match" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="wickets"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Wickets"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="economy"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Economy"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Bowling Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Match</th>
                  <th className="pb-2 text-center">Overs</th>
                  <th className="pb-2 text-center">Runs</th>
                  <th className="pb-2 text-center">Wickets</th>
                  <th className="pb-2 text-center">Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlingForm.map((match, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-2 text-gray-400">
                      {new Date(match.match_date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{match.home_team} v {match.away_team}</td>
                    <td className="py-2 text-center">{match.overs}</td>
                    <td className="py-2 text-center">{match.runs}</td>
                    <td className="py-2 text-center font-bold text-amber-500">{match.wickets}</td>
                    <td className="py-2 text-center">{match.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bowling Stats Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Total Wickets</div>
              <div className="text-xl font-bold text-amber-500">
                {bowlingForm.reduce((sum, m) => sum + m.wickets, 0)}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Avg Wickets</div>
              <div className="text-xl font-bold">
                {(bowlingForm.reduce((sum, m) => sum + m.wickets, 0) / bowlingForm.length).toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded">
              <div className="text-xs text-gray-400">Avg Economy</div>
              <div className="text-xl font-bold">
                {(bowlingForm.reduce((sum, m) => sum + parseFloat(m.economy), 0) / bowlingForm.length).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
