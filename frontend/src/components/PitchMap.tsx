import { useState } from 'react'

interface PitchMapProps {
  onSelect?: (data: { x: number; y: number; line: string; length: string }) => void
  deliveries?: Array<{ x: number; y: number; runs: number; isWicket: boolean }>
  interactive?: boolean
  width?: number
  height?: number
}

export default function PitchMap({
  onSelect,
  deliveries = [],
  interactive = false,
  width = 200,
  height = 400,
}: PitchMapProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null)

  // Pitch dimensions (with padding)
  const padding = 20
  const pitchWidth = width - padding * 2
  const pitchHeight = height - padding * 2

  // Define zones
  const lengthZones = [
    { name: 'yorker', yStart: 85, yEnd: 100, label: 'Yorker' },
    { name: 'full', yStart: 70, yEnd: 85, label: 'Full' },
    { name: 'good', yStart: 50, yEnd: 70, label: 'Good' },
    { name: 'short', yStart: 30, yEnd: 50, label: 'Short' },
    { name: 'bouncer', yStart: 0, yEnd: 30, label: 'Bouncer' },
  ]

  const lineZones = [
    { name: 'wide_leg', xStart: 0, xEnd: 20, label: 'Wide Leg' },
    { name: 'leg', xStart: 20, xEnd: 40, label: 'Leg' },
    { name: 'middle', xStart: 40, xEnd: 60, label: 'Middle' },
    { name: 'off', xStart: 60, xEnd: 80, label: 'Off' },
    { name: 'wide_off', xStart: 80, xEnd: 100, label: 'Wide Off' },
  ]

  const getZone = (x: number, y: number) => {
    const lengthZone = lengthZones.find((z) => y >= z.yStart && y < z.yEnd)
    const lineZone = lineZones.find((z) => x >= z.xStart && x < z.xEnd)
    return {
      line: lineZone?.name || 'middle',
      length: lengthZone?.name || 'good',
    }
  }

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onSelect) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const clickX = e.clientX - rect.left - padding
    const clickY = e.clientY - rect.top - padding

    // Ensure click is within pitch bounds
    if (clickX < 0 || clickX > pitchWidth || clickY < 0 || clickY > pitchHeight) return

    // Normalize to 0-100 scale
    const normalizedX = Math.round((clickX / pitchWidth) * 100)
    const normalizedY = Math.round(((pitchHeight - clickY) / pitchHeight) * 100) // Invert Y

    const zones = getZone(normalizedX, normalizedY)

    setSelectedPoint({ x: clickX + padding, y: clickY + padding })
    onSelect({ x: normalizedX, y: normalizedY, ...zones })

    // Clear selection after a short delay
    setTimeout(() => setSelectedPoint(null), 500)
  }

  const getColorForDelivery = (delivery: { runs: number; isWicket: boolean }): string => {
    if (delivery.isWicket) return '#dc2626' // Red for wicket
    if (delivery.runs === 6) return '#8b5cf6' // Purple for six
    if (delivery.runs === 4) return '#f59e0b' // Amber for four
    if (delivery.runs === 0) return '#22c55e' // Green for dot
    return '#3b82f6' // Blue for runs
  }

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className={`${interactive ? 'cursor-crosshair' : ''} bg-amber-950/30 rounded`}
        onClick={handleClick}
      >
        {/* Pitch background */}
        <rect
          x={padding}
          y={padding}
          width={pitchWidth}
          height={pitchHeight}
          fill="#1c1917"
          stroke="#78716c"
          strokeWidth="2"
        />

        {/* Length zones (horizontal lines) */}
        {lengthZones.map((zone, index) => {
          if (index === lengthZones.length - 1) return null // Skip last line
          const y = padding + pitchHeight - (zone.yStart / 100) * pitchHeight
          return (
            <line
              key={zone.name}
              x1={padding}
              y1={y}
              x2={padding + pitchWidth}
              y2={y}
              stroke="#78716c"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.3"
            />
          )
        })}

        {/* Line zones (vertical lines) */}
        {lineZones.map((zone, index) => {
          if (index === lineZones.length - 1) return null // Skip last line
          const x = padding + (zone.xEnd / 100) * pitchWidth
          return (
            <line
              key={zone.name}
              x1={x}
              y1={padding}
              x2={x}
              y2={padding + pitchHeight}
              stroke="#78716c"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.3"
            />
          )
        })}

        {/* Stumps at batter's end */}
        <rect
          x={padding + pitchWidth / 2 - 10}
          y={padding + pitchHeight - 5}
          width="20"
          height="4"
          fill="#f59e0b"
        />

        {/* Stumps at bowler's end */}
        <rect
          x={padding + pitchWidth / 2 - 10}
          y={padding + 1}
          width="20"
          height="4"
          fill="#f59e0b"
        />

        {/* Crease lines */}
        <line
          x1={padding}
          y1={padding + pitchHeight - 10}
          x2={padding + pitchWidth}
          y2={padding + pitchHeight - 10}
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding + 10}
          x2={padding + pitchWidth}
          y2={padding + 10}
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Plot deliveries */}
        {deliveries.map((delivery, index) => {
          // Convert normalized coordinates to SVG coordinates
          const x = padding + (delivery.x / 100) * pitchWidth
          const y = padding + pitchHeight - (delivery.y / 100) * pitchHeight

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={delivery.isWicket ? 6 : 4}
              fill={getColorForDelivery(delivery)}
              stroke="white"
              strokeWidth="1"
              opacity="0.8"
            />
          )
        })}

        {/* Selected point indicator */}
        {selectedPoint && (
          <circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r="10"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            className="animate-ping"
          />
        )}
      </svg>

      {/* Labels */}
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>Leg Side</span>
        <span>Off Side</span>
      </div>

      {interactive && (
        <div className="mt-2 text-center text-xs text-gray-400">
          Click to mark line and length
        </div>
      )}

      {!interactive && deliveries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No deliveries recorded</p>
        </div>
      )}

      {/* Legend */}
      {!interactive && deliveries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-gray-400">Wicket</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span className="text-gray-400">Six</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-amber-600"></div>
            <span className="text-gray-400">Four</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-gray-400">Dot</span>
          </div>
        </div>
      )}
    </div>
  )
}
