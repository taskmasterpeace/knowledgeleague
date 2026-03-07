import type { MathProblem as MathProblemType } from '../../types'
import type { ControllerType } from '../../hooks/useGamepad'
import { ControllerButton } from './ControllerButtons'

interface Props {
  problem: MathProblemType
  onAnswer: (choiceIndex: number) => void
  lockedP1: boolean
  lockedP2: boolean
  p1Keys: string[]
  p2Keys: string[]
  controllerType?: ControllerType
}

export function MathProblem({ problem, lockedP1, lockedP2, p1Keys, p2Keys, controllerType }: Props) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-7xl font-bold text-white drop-shadow-lg tracking-tight">
        {problem.question} = ?
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {problem.choices.map((choice, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center bg-white/20 backdrop-blur rounded-xl border-2 border-white/30 text-white text-4xl font-bold py-8 select-none"
          >
            <span>{choice}</span>
            <div className="absolute bottom-2 left-3 text-sm opacity-60 flex gap-3 items-center">
              <span className={lockedP1 ? 'text-red-300 line-through' : 'text-blue-300'}>
                [{p1Keys[i]}]
              </span>
              <span className={lockedP2 ? 'text-red-300 line-through' : 'text-red-300'}>
                [{p2Keys[i]}]
              </span>
              {controllerType && (
                <ControllerButton controllerType={controllerType} choiceIndex={i} locked={lockedP1} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
