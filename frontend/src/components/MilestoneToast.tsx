import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Milestone } from '../utils/milestones'

interface MilestoneToastProps {
  milestone: Milestone
  onClose: () => void
  duration?: number
}

export default function MilestoneToast({ milestone, onClose, duration = 5000 }: MilestoneToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Slide in
    setTimeout(() => setIsVisible(true), 10)

    // Auto close
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for slide out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <div
        className="rounded-lg shadow-2xl p-4 flex items-start space-x-3 border-2 animate-pulse-slow"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderColor: milestone.color,
        }}
      >
        <div className="text-4xl">{milestone.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {milestone.category.replace('_', ' ')}
          </div>
          <div className="font-bold text-white text-lg leading-tight mb-1">
            {milestone.description}
          </div>
          <div className="text-sm text-gray-300">{milestone.player}</div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

// Toast container for managing multiple toasts
interface ToastContainerProps {
  milestones: Milestone[]
  onRemove: (index: number) => void
}

export function MilestoneToastContainer({ milestones, onRemove }: ToastContainerProps) {
  return (
    <>
      {milestones.map((milestone, index) => (
        <MilestoneToast
          key={`${milestone.player}-${milestone.value}-${index}`}
          milestone={milestone}
          onClose={() => onRemove(index)}
        />
      ))}
    </>
  )
}
