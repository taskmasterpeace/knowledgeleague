import type { ControllerType } from '../../hooks/useGamepad'
import { BUTTON_LABELS } from '../../hooks/useGamepad'

interface Props {
  controllerType: ControllerType
  choiceIndex: number
  locked?: boolean
}

export function ControllerButton({ controllerType, choiceIndex, locked }: Props) {
  if (!controllerType) return null

  const config = BUTTON_LABELS[controllerType]
  const label = config.labels[choiceIndex]
  const color = config.colors[choiceIndex]

  if (controllerType === 'playstation') {
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 ${locked ? 'opacity-30' : ''}`}
        style={{ borderColor: color, color }}
      >
        {label}
      </span>
    )
  }

  // Xbox style — filled colored buttons
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${locked ? 'opacity-30' : ''}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  )
}

interface ControllerHintProps {
  controllerType: ControllerType
}

export function ControllerHint({ controllerType }: ControllerHintProps) {
  if (!controllerType) return null

  const label = controllerType === 'playstation' ? 'PlayStation' : controllerType === 'xbox' ? 'Xbox' : 'Gamepad'

  return (
    <div className="flex items-center gap-2 text-white/50 text-sm">
      <span>{label} connected</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <ControllerButton key={i} controllerType={controllerType} choiceIndex={i} />
        ))}
      </div>
    </div>
  )
}
