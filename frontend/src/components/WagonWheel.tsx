import { useState } from 'react'

interface WagonWheelProps {
  onSelect?: (data: { x: number; y: number; zone: string }) => void
  shots?: Array<{ x: number; y: number; runs: number }>
  interactive?: boolean
  size?: number
}

export default function WagonWheel({
  onSelect,
  shots = [],
  interactive = false,
  size = 300
}: WagonWheelProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null)
  const center = size / 2
  const radius = (size / 2) - 20

  // Define field zones
  const zones = [
    { name: 'straight', angle: 0, label: 'Straight' },
    { name: 'long_on', angle: 30, label: 'Long On' },
    { name: 'midwicket', angle: 60, label: 'Midwicket' },
    { name: 'square_leg', angle: 90, label: 'Square Leg' },
    { name: 'fine_leg', angle: 120, label: 'Fine Leg' },
    { name: 'third_man', angle: 240, label: 'Third Man' },
    { name: 'point', angle: 270, label: 'Point' },
    { name: 'cover', angle: 300, label: 'Cover' },
    { name: 'long_off', angle: 330, label: 'Long Off' },
  ]

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onSelect) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to coordinates relative to center
    const relX = x - center
    const relY = center - y // Invert Y so up is positive

    // Calculate distance from center
    const distance = Math.sqrt(relX * relX + relY * relY)

    // Only allow clicks within the field circle
    if (distance > radius) return

    // Calculate angle (0° = straight/north)
    let angle = Math.atan2(relX, relY) * (180 / Math.PI)
    if (angle < 0) angle += 360

    // Find closest zone
    const zone = zones.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.angle - angle)
      const currDiff = Math.abs(curr.angle - angle)
      return currDiff < prevDiff ? curr : prev
    })

    // Normalize coordinates to -100 to 100 for X, 0 to 100 for Y
    const normalizedX = Math.round((relX / radius) * 100)
    const normalizedY = Math.round((distance / radius) * 100)

    setSelectedPoint({ x, y })
    onSelect({ x: normalizedX, y: normalizedY, zone: zone.name })

    // Clear selection after a short delay
    setTimeout(() => setSelectedPoint(null), 500)
  }

  const getColorForRuns = (runs: number): string => {
    if (runs === 6) return '#dc2626' // Red for six
    if (runs === 4) return '#f59e0b' // Amber for four
    if (runs >= 2) return '#3b82f6' // Blue for 2-3
    return '#6b7280' // Gray for 0-1
  }

  const getSizeForRuns = (runs: number): number => {
    if (runs === 6) return 8
    if (runs === 4) return 6
    return 4
  }

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        className={`${interactive ? 'cursor-crosshair' : ''} bg-green-950/30 rounded-full`}
        onClick={handleClick}
      >
        {/* Outer circle (boundary) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Inner circle (30-yard circle) */}
        <circle
          cx={center}
          cy={center}
          r={radius * 0.6}
          fill="none"
          stroke="#374151"
          strokeWidth="1"
          strokeDasharray="5,5"
        />

        {/* Center point (pitch) */}
        <circle cx={center} cy={center} r="3" fill="#94a3b8" />

        {/* Gridlines for zones */}
        {zones.map((zone) => {
          const angleRad = (zone.angle - 90) * (Math.PI / 180)
          const x2 = center + radius * Math.cos(angleRad)
          const y2 = center + radius * Math.sin(angleRad)
          return (
            <line
              key={zone.name}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#374151"
              strokeWidth="0.5"
              opacity="0.3"
            />
          )
        })}

        {/* Zone labels */}
        {zones.map((zone) => {
          const angleRad = (zone.angle - 90) * (Math.PI / 180)
          const labelRadius = radius + 15
          const x = center + labelRadius * Math.cos(angleRad)
          const y = center + labelRadius * Math.sin(angleRad)
          return (
            <text
              key={`label-${zone.name}`}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-xs fill-gray-400 select-none"
              style={{ fontSize: '10px' }}
            >
              {zone.label.split(' ').map((word, i) => (
                <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>
                  {word}
                </tspan>
              ))}
            </text>
          )
        })}

        {/* Plot shots */}
        {shots.map((shot, index) => {
          // Convert normalized coordinates back to SVG coordinates
          const x = center + (shot.x / 100) * radius
          const y = center - (shot.y / 100) * radius

          return (
            <g key={index}>
              {/* Line from center to shot */}
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={getColorForRuns(shot.runs)}
                strokeWidth="1.5"
                opacity="0.6"
              />
              {/* Shot marker */}
              <circle
                cx={x}
                cy={y}
                r={getSizeForRuns(shot.runs)}
                fill={getColorForRuns(shot.runs)}
                stroke="white"
                strokeWidth="1"
              />
            </g>
          )
        })}

        {/* Selected point indicator */}
        {selectedPoint && (
          <circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r="8"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            className="animate-ping"
          />
        )}
      </svg>

      {interactive && (
        <div className="mt-2 text-center text-xs text-gray-400">
          Click on the field to mark where the ball was hit
        </div>
      )}

      {!interactive && shots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No shots recorded</p>
        </div>
      )}
    </div>
  )
}
