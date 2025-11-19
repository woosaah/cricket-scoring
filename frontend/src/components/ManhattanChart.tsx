import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface ManhattanChartProps {
  data: Array<{ over: number; runs: number; wickets: number }>
  teamName?: string
  teamColor?: string
}

export default function ManhattanChart({
  data = [],
  teamName = 'Team',
  teamColor = '#dc2626',
}: ManhattanChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No data available for Manhattan chart</p>
      </div>
    )
  }

  // Color coding based on runs
  const getBarColor = (runs: number, hasWicket: boolean) => {
    if (hasWicket) return '#ef4444' // Red for wicket overs
    if (runs === 0) return '#22c55e' // Green for maiden
    if (runs >= 15) return '#dc2626' // Dark red for expensive overs
    if (runs >= 10) return '#f59e0b' // Amber for 10+ runs
    if (runs >= 6) return '#3b82f6' // Blue for 6+ runs
    return '#6b7280' // Gray for low-scoring overs
  }

  const chartData = data.map(item => ({
    ...item,
    overLabel: `${item.over}`,
    color: getBarColor(item.runs, item.wickets > 0),
  }))

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="overLabel"
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
            formatter={(value: number, name: string, props: any) => {
              const wickets = props.payload.wickets
              return [
                `${value} runs${wickets > 0 ? `, ${wickets} wicket${wickets > 1 ? 's' : ''}` : ''}`,
                'Over ' + props.payload.over
              ]
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={() => teamName}
          />
          <Bar dataKey="runs" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-gray-400">Wicket</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
          <span className="text-gray-400">15+ runs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span className="text-gray-400">10-14 runs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <span className="text-gray-400">6-9 runs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
          <span className="text-gray-400">Maiden</span>
        </div>
      </div>
    </div>
  )
}
