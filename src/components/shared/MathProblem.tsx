import type { GameQuestion } from '../../types'
import type { ControllerType } from '../../hooks/useGamepad'
import { ControllerButton } from './ControllerButtons'

interface Props {
  problem: GameQuestion
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

const SUBJECT_LABELS: Record<string, string> = {
  math: 'SOLVE!',
  science: 'SCIENCE!',
  reading: 'READING!',
  spelling: 'SPELL IT!',
  images: 'WHAT IS IT?',
}

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-cyan-500',
  science: 'bg-green-500',
  reading: 'bg-purple-500',
  spelling: 'bg-yellow-500',
  images: 'bg-orange-500',
}

export function MathProblem({ problem, onAnswer, lockedP1, lockedP2, p1Keys, p2Keys, controllerType }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Question card */}
      <div className="pixel-card rounded-lg px-8 py-5 text-center relative">
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${SUBJECT_COLORS[problem.subject]} px-3 py-0.5 rounded font-pixel-body text-sm font-bold text-white`}>
          {problem.category === 'counting' ? 'COUNT!' : problem.category === 'pattern' ? 'PATTERN!' : SUBJECT_LABELS[problem.subject]}
        </div>
        {problem.patternSequence ? (
          <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap max-w-lg mx-auto">
            {problem.patternSequence.map((item, i) => (
              item === '?' ? (
                <div key={i} className="w-10 h-10 rounded-lg border-2 border-dashed border-yellow-400/60 flex items-center justify-center bg-yellow-400/10">
                  <span className="font-pixel text-yellow-300 text-lg">?</span>
                </div>
              ) : (
                <img
                  key={i}
                  src={item}
                  alt=""
                  style={{ width: 40, height: 40, imageRendering: 'pixelated' as const, objectFit: 'contain' as const }}
                />
              )
            ))}
          </div>
        ) : problem.imageUrl && problem.imageCount ? (
          <div className="flex flex-wrap justify-center gap-1 mb-3 max-w-md mx-auto">
            {Array.from({ length: problem.imageCount }).map((_, i) => (
              <img
                key={i}
                src={problem.imageUrl}
                alt=""
                style={{
                  width: problem.imageCount! <= 6 ? 48 : problem.imageCount! <= 12 ? 36 : 28,
                  height: problem.imageCount! <= 6 ? 48 : problem.imageCount! <= 12 ? 36 : 28,
                  imageRendering: 'pixelated' as const,
                  objectFit: 'contain' as const,
                }}
              />
            ))}
          </div>
        ) : problem.imageUrl ? (
          <img
            src={problem.imageUrl}
            alt="Question image"
            className="mx-auto mb-3"
            style={{ width: 96, height: 96, imageRendering: 'pixelated', objectFit: 'contain' }}
          />
        ) : null}
        <div className={`font-pixel text-white text-glow tracking-wider ${
          problem.question.length > 40 ? 'text-sm' : problem.question.length > 25 ? 'text-lg' : 'text-3xl'
        }`}>
          {problem.subject === 'math'
            ? <>{problem.question} = <span className="text-yellow-300">?</span></>
            : problem.question
          }
        </div>
      </div>

      {/* Answer grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {problem.choices.map((choice, i) => {
          const colors = CARD_COLORS[i]
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center bg-gradient-to-b ${colors.bg} rounded-lg border-2 ${colors.border} py-6 px-3 select-none cursor-pointer
                transition-all duration-150 hover:scale-[1.03] hover:brightness-110 active:scale-95`}
              style={{ boxShadow: `0 4px 12px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
              onClick={() => onAnswer(i)}
            >
              {problem.category === 'pattern' && choice.startsWith('/') ? (
                <img
                  src={choice}
                  alt="choice"
                  style={{ width: 48, height: 48, imageRendering: 'pixelated' as const, objectFit: 'contain' as const }}
                />
              ) : (
                <span className={`font-pixel-body font-bold text-white drop-shadow-md text-center ${
                  choice.length > 15 ? 'text-base' : choice.length > 8 ? 'text-xl' : 'text-3xl'
                }`}>
                  {choice}
                </span>
              )}
              <div className="absolute bottom-1.5 left-2 flex gap-2 items-center">
                <span className={`font-pixel-body text-xs ${lockedP1 ? 'text-white/20 line-through' : 'text-white/40'}`}>
                  [{p1Keys[i]}]
                </span>
                <span className={`font-pixel-body text-xs ${lockedP2 ? 'text-white/20 line-through' : 'text-white/40'}`}>
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
