import { useCallback, useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useMathEngine } from '../../hooks/useMathEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { ControllerHint } from '../shared/ControllerButtons'
import {
  TUG_CORRECT_PULL, TUG_SUPER_PULL, TUG_WRONG_PULL,
  TUG_STREAK_THRESHOLD, TUG_WIN_THRESHOLD,
} from '../../utils/constants'

export function TugOfWar() {
  const {
    players, setPosition, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { currentProblem, nextProblem, problemCount } = useMathEngine()
  const [timerKey, setTimerKey] = useState(0)
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong' | null>>({ 1: null, 2: null })
  const [usedShot, setUsedShot] = useState<Record<number, boolean>>({ 1: false, 2: false })

  const ropePos = players[0].position

  const advanceProblem = useCallback(() => {
    nextProblem()
    setTimerKey(k => k + 1)
    setFeedback({ 1: null, 2: null })
    setUsedShot({ 1: false, 2: false })
  }, [nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    if (usedShot[playerId]) return

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer
    const direction = playerId === 1 ? -1 : 1

    setUsedShot(prev => ({ ...prev, [playerId]: true }))

    if (isCorrect) {
      const streak = players[playerId - 1].streak + 1
      const pull = streak >= TUG_STREAK_THRESHOLD ? TUG_SUPER_PULL : TUG_CORRECT_PULL

      const newPos = ropePos + direction * pull
      setPosition(1, newPos)
      incrementStreak(playerId)
      incrementScore(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'correct' }))

      if (Math.abs(newPos) >= TUG_WIN_THRESHOLD) {
        setWinner(newPos < 0 ? 1 : 2)
        return
      }
      setTimeout(advanceProblem, 600)
    } else {
      const opponentDirection = playerId === 1 ? 1 : -1
      const newPos = ropePos + opponentDirection * TUG_WRONG_PULL
      setPosition(1, newPos)
      resetStreak(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'wrong' }))

      if (Math.abs(newPos) >= TUG_WIN_THRESHOLD) {
        setWinner(newPos < 0 ? 1 : 2)
        return
      }

      const opponentId = playerId === 1 ? 2 : 1
      if (usedShot[opponentId]) {
        setTimeout(advanceProblem, 800)
      }
    }
  }, [players, currentProblem, ropePos, usedShot, setPosition, incrementStreak, resetStreak, incrementScore, setWinner, advanceProblem])

  const handleP1Answer = useCallback((i: number) => handleAnswer(1, i), [handleAnswer])
  const handleP2Answer = useCallback((i: number) => handleAnswer(2, i), [handleAnswer])

  useKeyboardInput({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: true,
  })

  useGamepad({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: true,
    onControllerChange: setControllerType,
  })

  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: players[1].type === 'cpu' && !usedShot[2],
    onAnswer: handleP2Answer,
    streak: players[1].streak,
  })

  const handleTimeUp = useCallback(() => {
    advanceProblem()
  }, [advanceProblem])

  const flagPct = 50 + (ropePos / 2)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-emerald-800 flex flex-col p-6 gap-6">
      {/* Player info */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-center">
          <PlayerAvatar
            name={players[0].name}
            color={players[0].color}
            size={60}
            isWinning={ropePos < -20}
            isLosing={ropePos > 20}
            isLocked={usedShot[1]}
            avatarUrl={players[0].avatarUrl}
          />
          <div className="text-yellow-300 text-sm font-bold mt-1">
            {players[0].streak >= TUG_STREAK_THRESHOLD ? 'SUPER PULL!' : `Streak: ${players[0].streak}`}
          </div>
          {usedShot[1] && !feedback[1] && <div className="text-white/50 text-xs">Waiting...</div>}
        </div>
        <div className="text-white text-xl font-bold">VS</div>
        <div className="flex flex-col items-center">
          <PlayerAvatar
            name={players[1].name}
            color={players[1].color}
            size={60}
            isWinning={ropePos > 20}
            isLosing={ropePos < -20}
            isLocked={usedShot[2]}
            avatarUrl={players[1].avatarUrl}
          />
          <div className="text-yellow-300 text-sm font-bold mt-1">
            {players[1].streak >= TUG_STREAK_THRESHOLD ? 'SUPER PULL!' : `Streak: ${players[1].streak}`}
          </div>
          {usedShot[2] && !feedback[2] && <div className="text-white/50 text-xs">Waiting...</div>}
        </div>
      </div>

      {/* Rope */}
      <div className="relative h-16 bg-gradient-to-r from-blue-500/30 via-amber-800/40 to-red-500/30 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[10%] bg-blue-500/20 border-r-2 border-blue-400/40" />
        <div className="absolute right-0 top-0 bottom-0 w-[10%] bg-red-500/20 border-l-2 border-red-400/40" />
        <div className="absolute top-1/2 left-[5%] right-[5%] h-2 bg-amber-700 rounded -translate-y-1/2" />
        <div
          className="absolute top-1 transition-all duration-300"
          style={{ left: `${flagPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-1 h-12 bg-white mx-auto" />
          <div className="w-6 h-4 bg-yellow-400 -mt-12 ml-0.5" />
        </div>
      </div>

      {/* Timer */}
      <Timer onTimeUp={handleTimeUp} resetKey={timerKey} />

      {/* Problem */}
      <div className="flex-1 flex items-center justify-center">
        <MathProblem
          problem={currentProblem}
          onAnswer={() => {}}
          lockedP1={usedShot[1]}
          lockedP2={usedShot[2]}
          p1Keys={['1', '2', '3', '4']}
          p2Keys={['1', '2', '3', '4']}
          controllerType={controllerType}
        />
      </div>

      {/* Feedback */}
      {feedback[1] === 'correct' && <div className="fixed top-4 left-4 text-6xl animate-bounce">✓</div>}
      {feedback[1] === 'wrong' && <div className="fixed top-4 left-4 text-6xl text-red-500 animate-pulse">✗</div>}
      {feedback[2] === 'correct' && <div className="fixed top-4 right-4 text-6xl animate-bounce">✓</div>}
      {feedback[2] === 'wrong' && <div className="fixed top-4 right-4 text-6xl text-red-500 animate-pulse">✗</div>}

      <div className="flex justify-between items-center">
        <div className="text-white/40 text-sm">Problem #{problemCount}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
  )
}
