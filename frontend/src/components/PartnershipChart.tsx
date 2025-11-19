import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Partnership {
  id: number
  runs: number
  balls: number
  wicket_number: number | null
  batter1_name: string
  batter2_name: string
  is_active: boolean
}

interface PartnershipChartProps {
  partnerships: Partnership[]
  teamColor?: string
}

export default function PartnershipChart({ partnerships, teamColor = '#dc2626' }: PartnershipChartProps) {
  if (!partnerships || partnerships.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No partnership data available
      </div>
    )
  }

  // Transform data for chart
  const chartData = partnerships.map((p, index) => ({
    name: p.wicket_number ? `${p.wicket_number}th wkt` : 'Current',
    runs: p.runs,
    balls: p.balls,
    partnership: `${p.batter1_name} & ${p.batter2_name}`,
    runRate: p.balls > 0 ? ((p.runs / p.balls) * 6).toFixed(2) : '0.00',
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
          <p className="font-semibold text-white mb-1">{data.partnership}</p>
          <p className="text-sm text-gray-300">Runs: {data.runs} ({data.balls} balls)</p>
          <p className="text-sm text-gray-300">Run Rate: {data.runRate}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" label={{ value: 'Runs', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="runs" fill={teamColor} name="Partnership Runs" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Partnership Details Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-2">Wicket</th>
              <th className="pb-2">Partnership</th>
              <th className="pb-2 text-center">Runs</th>
              <th className="pb-2 text-center">Balls</th>
              <th className="pb-2 text-center">Run Rate</th>
              <th className="pb-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {partnerships.map((p) => {
              const runRate = p.balls > 0 ? ((p.runs / p.balls) * 6).toFixed(2) : '0.00'
              return (
                <tr key={p.id} className="border-b border-gray-800">
                  <td className="py-2">{p.wicket_number ? `${p.wicket_number}th` : '-'}</td>
                  <td className="py-2 font-medium">
                    {p.batter1_name} & {p.batter2_name}
                  </td>
                  <td className="py-2 text-center font-bold text-primary">{p.runs}</td>
                  <td className="py-2 text-center">{p.balls}</td>
                  <td className="py-2 text-center">{runRate}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      p.is_active
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {p.is_active ? 'Active' : 'Ended'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
