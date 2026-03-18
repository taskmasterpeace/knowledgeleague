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

const CARD_COLORS = [
  { bg: 'from-blue-600 to-blue-800', border: 'border-blue-400/50', glow: 'rgba(59,130,246,0.3)' },
  { bg: 'from-rose-600 to-rose-800', border: 'border-rose-400/50', glow: 'rgba(244,63,94,0.3)' },
  { bg: 'from-emerald-600 to-emerald-800', border: 'border-emerald-400/50', glow: 'rgba(16,185,129,0.3)' },
  { bg: 'from-violet-600 to-violet-800', border: 'border-violet-400/50', glow: 'rgba(139,92,246,0.3)' },
]

export function MathProblem({ problem, lockedP1, lockedP2, p1Keys, p2Keys, controllerType }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Question card */}
      <div className="pixel-card rounded-lg px-8 py-5 text-center relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 px-3 py-0.5 rounded font-pixel text-[8px] text-white">
          SOLVE!
        </div>
        <div className="font-pixel text-3xl text-white text-glow tracking-wider">
          {problem.question} = <span className="text-yellow-300">?</span>
        </div>
      </div>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {problem.choices.map((choice, i) => {
          const colors = CARD_COLORS[i]
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center bg-gradient-to-b ${colors.bg} rounded-lg border-2 ${colors.border} py-6 select-none cursor-pointer
                transition-all duration-150 hover:scale-[1.03] hover:brightness-110 active:scale-95`}
              style={{ boxShadow: `0 4px 12px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
            >
              <span className="font-pixel text-2xl text-white drop-shadow-md">{choice}</span>
              <div className="absolute bottom-1.5 left-2 flex gap-2 items-center">
                <span className={`font-pixel text-[7px] ${lockedP1 ? 'text-white/20 line-through' : 'text-white/40'}`}>
                  [{p1Keys[i]}]
                </span>
                <span className={`font-pixel text-[7px] ${lockedP2 ? 'text-white/20 line-through' : 'text-white/40'}`}>
                  [{p2Keys[i]}]
                </span>
                {controllerType && (
                  <ControllerButton controllerType={controllerType} choiceIndex={i} locked={lockedP1} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
