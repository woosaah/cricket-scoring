import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

interface WormGraphProps {
  innings1Data?: Array<{ over: number; runs: number; runRate: number }>
  innings2Data?: Array<{ over: number; runs: number; runRate: number; target?: number; requiredRate?: number }>
  team1Name?: string
  team2Name?: string
  team1Color?: string
  team2Color?: string
  targetScore?: number
}

export default function WormGraph({
  innings1Data = [],
  innings2Data = [],
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  team1Color = '#dc2626',
  team2Color = '#3b82f6',
  targetScore,
}: WormGraphProps) {
  // Combine data for display
  const maxOvers = Math.max(
    innings1Data.length > 0 ? Math.max(...innings1Data.map(d => d.over)) : 0,
    innings2Data.length > 0 ? Math.max(...innings2Data.map(d => d.over)) : 0
  )

  const combinedData = []
  for (let i = 0; i <= maxOvers; i++) {
    const over = i
    const team1Point = innings1Data.find(d => d.over === over)
    const team2Point = innings2Data.find(d => d.over === over)

    combinedData.push({
      over,
      [team1Name]: team1Point?.runs || null,
      [team2Name]: team2Point?.runs || null,
      target: targetScore || null,
    })
  }

  if (combinedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No data available for worm graph</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="over"
            stroke="#9ca3af"
            label={{ value: 'Overs', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            label={{ value: 'Runs', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Target line (if 2nd innings) */}
          {targetScore && (
            <ReferenceLine
              y={targetScore}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: 'Target', fill: '#f59e0b', position: 'right' }}
            />
          )}

          {/* Team 1 line */}
          <Line
            type="monotone"
            dataKey={team1Name}
            stroke={team1Color}
            strokeWidth={3}
            dot={{ fill: team1Color, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />

          {/* Team 2 line */}
          {innings2Data.length > 0 && (
            <Line
              type="monotone"
              dataKey={team2Name}
              stroke={team2Color}
              strokeWidth={3}
              dot={{ fill: team2Color, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
