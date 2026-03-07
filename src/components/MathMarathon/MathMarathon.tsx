import { useCallback, useState, useRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useMathEngine } from '../../hooks/useMathEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ScoreBar } from '../shared/ScoreBar'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { ControllerHint } from '../shared/ControllerButtons'
import {
  MARATHON_TRACK_LENGTH, MARATHON_FIRST_CORRECT,
  MARATHON_SECOND_CORRECT, MARATHON_WRONG_ANSWER,
  MARATHON_NO_ANSWER,
} from '../../utils/constants'

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

interface RoundResult {
  p1: RoundAnswer
  p2: RoundAnswer
  p1Spaces: number
  p2Spaces: number
  correctAnswer: number
  question: string
}

export function MathMarathon() {
  const {
    players, updatePosition, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { currentProblem, nextProblem, problemCount } = useMathEngine()
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)

  const answersRef = useRef<{ p1: RoundAnswer; p2: RoundAnswer }>({ p1: null, p2: null })
  const roundResolvedRef = useRef(false)

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const { p1, p2 } = answersRef.current

    let p1Spaces = MARATHON_NO_ANSWER
    let p2Spaces = MARATHON_NO_ANSWER

    const p1Correct = p1?.correct ?? false
    const p2Correct = p2?.correct ?? false

    if (p1Correct && p2Correct) {
      if ((p1!.timestamp) <= (p2!.timestamp)) {
        p1Spaces = MARATHON_FIRST_CORRECT
        p2Spaces = MARATHON_SECOND_CORRECT
      } else {
        p1Spaces = MARATHON_SECOND_CORRECT
        p2Spaces = MARATHON_FIRST_CORRECT
      }
    } else if (p1Correct) {
      p1Spaces = MARATHON_FIRST_CORRECT
      p2Spaces = p2 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    } else if (p2Correct) {
      p2Spaces = MARATHON_FIRST_CORRECT
      p1Spaces = p1 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    } else {
      p1Spaces = p1 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
      p2Spaces = p2 ? MARATHON_WRONG_ANSWER : MARATHON_NO_ANSWER
    }

    if (p1Spaces > 0) updatePosition(1, p1Spaces)
    if (p2Spaces > 0) updatePosition(2, p2Spaces)

    if (p1Correct) { incrementStreak(1); incrementScore(1) } else { resetStreak(1) }
    if (p2Correct) { incrementStreak(2); incrementScore(2) } else { resetStreak(2) }

    const p1NewPos = players[0].position + p1Spaces
    const p2NewPos = players[1].position + p2Spaces
    if (p1NewPos >= MARATHON_TRACK_LENGTH || p2NewPos >= MARATHON_TRACK_LENGTH) {
      if (p1NewPos >= MARATHON_TRACK_LENGTH && p2NewPos >= MARATHON_TRACK_LENGTH) {
        setWinner(p1NewPos >= p2NewPos ? 1 : 2)
      } else {
        setWinner(p1NewPos >= MARATHON_TRACK_LENGTH ? 1 : 2)
      }
      return
    }

    setRoundResult({
      p1, p2, p1Spaces, p2Spaces,
      correctAnswer: currentProblem.correctAnswer,
      question: currentProblem.question,
    })
    setShowingResult(true)

    setTimeout(() => {
      setShowingResult(false)
      setRoundResult(null)
      answersRef.current = { p1: null, p2: null }
      roundResolvedRef.current = false
      nextProblem()
      setTimerKey(k => k + 1)
    }, 2000)
  }, [players, currentProblem, updatePosition, incrementStreak, resetStreak, incrementScore, setWinner, nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    if (showingResult) return
    const key = playerId === 1 ? 'p1' : 'p2'
    if (answersRef.current[key] !== null) return

    const isCorrect = currentProblem.choices[choiceIndex] === currentProblem.correctAnswer

    answersRef.current[key] = { choiceIndex, correct: isCorrect, timestamp: Date.now() }

    if (answersRef.current.p1 !== null && answersRef.current.p2 !== null) {
      resolveRound()
    }
  }, [currentProblem, showingResult, resolveRound])

  const handleP1Answer = useCallback((i: number) => handleAnswer(1, i), [handleAnswer])
  const handleP2Answer = useCallback((i: number) => handleAnswer(2, i), [handleAnswer])

  useKeyboardInput({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: !showingResult,
  })

  useGamepad({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1].type === 'cpu' ? () => {} : handleP2Answer,
    enabled: !showingResult,
    onControllerChange: setControllerType,
  })

  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: players[1].type === 'cpu' && !showingResult,
    onAnswer: handleP2Answer,
    streak: players[1].streak,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col p-6 gap-6">
      {/* Progress bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar position={players[0].position} trackLength={MARATHON_TRACK_LENGTH} color={players[0].color} label={players[0].name} />
        <ScoreBar position={players[1].position} trackLength={MARATHON_TRACK_LENGTH} color={players[1].color} label={players[1].name} />
      </div>

      {/* Track visualization */}
      <div className="relative h-32 bg-white/10 rounded-2xl border-2 border-white/20 overflow-hidden">
        <div className="absolute top-0 bottom-0 right-4 w-1 bg-yellow-400/50" />
        {players.map((player, i) => (
          <div
            key={player.id}
            className="absolute transition-all duration-300"
            style={{
              left: `${Math.min(95, (player.position / MARATHON_TRACK_LENGTH) * 100)}%`,
              top: i === 0 ? '10%' : '50%',
            }}
          >
            <PlayerAvatar
              name={player.name}
              color={player.color}
              size={40}
              avatarUrl={player.avatarUrl}
            />
          </div>
        ))}
      </div>

      {/* Timer */}
      {!showingResult && <Timer onTimeUp={handleTimeUp} resetKey={timerKey} />}

      {/* Problem or Results */}
      <div className="flex-1 flex items-center justify-center">
        {showingResult && roundResult ? (
          <div className="flex flex-col items-center gap-6 bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20 w-full max-w-2xl">
            <div className="text-3xl font-bold text-white">
              {roundResult.question} = <span className="text-green-300">{roundResult.correctAnswer}</span>
            </div>
            <div className="flex gap-12">
              {[
                { player: players[0], answer: roundResult.p1, spaces: roundResult.p1Spaces },
                { player: players[1], answer: roundResult.p2, spaces: roundResult.p2Spaces },
              ].map(({ player, answer, spaces }) => (
                <div key={player.id} className="flex flex-col items-center gap-2">
                  <PlayerAvatar name={player.name} color={player.color} size={50} avatarUrl={player.avatarUrl} />
                  <div className={`text-2xl font-bold ${answer?.correct ? 'text-green-300' : answer ? 'text-red-300' : 'text-white/40'}`}>
                    {answer?.correct ? 'Correct!' : answer ? 'Wrong' : 'No answer'}
                  </div>
                  <div className="text-yellow-300 text-xl font-bold">+{spaces} spaces</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <MathProblem
            problem={currentProblem}
            onAnswer={() => {}}
            lockedP1={answersRef.current.p1 !== null}
            lockedP2={answersRef.current.p2 !== null}
            p1Keys={['1', '2', '3', '4']}
            p2Keys={['1', '2', '3', '4']}
            controllerType={controllerType}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="text-white/40 text-sm">Problem #{problemCount}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
  )
}
