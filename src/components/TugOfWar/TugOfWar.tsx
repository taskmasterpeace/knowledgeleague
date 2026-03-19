import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { ControllerHint } from '../shared/ControllerButtons'
import { ScreenShake, FlashOverlay, StreakFlame, ParticleBurst } from '../shared/Effects'
import {
  TUG_CORRECT_PULL, TUG_SUPER_PULL, TUG_WRONG_PULL,
  TUG_STREAK_THRESHOLD, TUG_WIN_THRESHOLD,
} from '../../utils/constants'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { getOrCreateProfile, recordAnswer } from '../../utils/playerProfile'
import type { Badge } from '../../types'
import { BadgeToast } from '../shared/BadgeToast'
import { useAnnouncer } from '../../hooks/useAnnouncer'

export function TugOfWar() {
  const {
    players, setPosition, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { timePerQuestion, difficulty, soundEnabled } = useSettings()
  const { currentProblem, nextProblem, problemCount } = useQuestionEngine(
    difficulty === 'adaptive' ? undefined : difficulty
  )
  const [timerKey, setTimerKey] = useState(0)
  const [feedback, setFeedback] = useState<Record<number, 'correct' | 'wrong' | null>>({ 1: null, 2: null })
  const [usedShot, setUsedShot] = useState<Record<number, boolean>>({ 1: false, 2: false })
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null)
  const { announceCorrect, announceWrong } = useAnnouncer()

  const profilesRef = useRef<Map<number, string>>(new Map()) // playerId -> profileId
  const timerStartRef = useRef(Date.now())

  useEffect(() => {
    for (const player of players) {
      if (player.type === 'human' && !profilesRef.current.has(player.id)) {
        const profile = getOrCreateProfile(player.name)
        profilesRef.current.set(player.id, profile.id)
      }
    }
  }, [players])

  const ropePos = players[0].position

  const advanceProblem = useCallback(() => {
    nextProblem()
    timerStartRef.current = Date.now()
    setTimerKey(k => k + 1)
    setFeedback({ 1: null, 2: null })
    setUsedShot({ 1: false, 2: false })
    setEarnedBadge(null)
  }, [nextProblem])

  const handleAnswer = useCallback((playerId: 1 | 2, choiceIndex: number) => {
    if (usedShot[playerId]) return

    const isCorrect = choiceIndex === currentProblem.correctIndex
    const direction = playerId === 1 ? -1 : 1

    setUsedShot(prev => ({ ...prev, [playerId]: true }))

    const profileId = profilesRef.current.get(playerId)
    if (profileId && players[playerId - 1].type === 'human') {
      const responseTime = Date.now() - timerStartRef.current
      const badge = recordAnswer(profileId, currentProblem.category, isCorrect, responseTime)
      if (badge) {
        setEarnedBadge(badge)
        if (soundEnabled) sounds.badge()
      }
    }

    if (isCorrect) {
      if (soundEnabled) sounds.correct()
      if (players[playerId - 1].type === 'human') announceCorrect(players[playerId - 1].name, players[playerId - 1].streak + 1)
      const streak = players[playerId - 1].streak + 1
      const pull = streak >= TUG_STREAK_THRESHOLD ? TUG_SUPER_PULL : TUG_CORRECT_PULL

      const newPos = ropePos + direction * pull
      setPosition(1, newPos)
      incrementStreak(playerId)
      incrementScore(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'correct' }))
      setFlashType('correct')
      setShowBurst(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShowBurst(false), 600)

      if (Math.abs(newPos) >= TUG_WIN_THRESHOLD) {
        setWinner(newPos < 0 ? 1 : 2)
        return
      }
      setTimeout(advanceProblem, 600)
    } else {
      if (soundEnabled) sounds.wrong()
      if (players[playerId - 1].type === 'human') announceWrong(players[playerId - 1].name, players[playerId - 1].streak > 0)
      const opponentDirection = playerId === 1 ? 1 : -1
      const newPos = ropePos + opponentDirection * TUG_WRONG_PULL
      setPosition(1, newPos)
      resetStreak(playerId)
      setFeedback(f => ({ ...f, [playerId]: 'wrong' }))
      setFlashType('wrong')
      setShaking(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShaking(false), 250)

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
    onAnswer: (playerId, choiceIndex) => {
      if (playerId === 1) handleP1Answer(choiceIndex)
      else if (playerId === 2 && players[1]?.type === 'human') handleP2Answer(choiceIndex)
    },
    enabled: true,
    playerCount: 2,
  })

  useGamepad({
    onP1Answer: handleP1Answer,
    onP2Answer: players[1]?.type === 'cpu' ? () => {} : handleP2Answer,
    enabled: true,
    onControllerChange: setControllerType,
  })

  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: players[1]?.type === 'cpu' && !usedShot[2],
    onAnswer: handleP2Answer,
    streak: players[1]?.streak ?? 0,
  })

  const handleTimeUp = useCallback(() => {
    advanceProblem()
  }, [advanceProblem])

  const flagPct = 50 + (ropePos / 2)

  return (
    <ScreenShake trigger={shaking}>
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col p-4 gap-4">
      <BadgeToast badge={earnedBadge} />
      <FlashOverlay type={flashType} />

      {/* Player info panels */}
      <div className="flex justify-between items-start gap-3">
        {/* Player 1 */}
        <div className="pixel-card rounded-lg p-3 flex flex-col items-center gap-1 min-w-[120px]">
          <PlayerAvatar
            name={players[0].name}
            color={players[0].color}
            size={52}
            isWinning={ropePos < -20}
            isLosing={ropePos > 20}
            isLocked={usedShot[1]}
            avatarUrl={players[0].avatarUrl}
          />
          <div className="font-pixel text-[8px] text-white/80 mt-1 text-center leading-tight">{players[0].name}</div>
          <div className="flex items-center gap-1">
            <StreakFlame streak={players[0].streak} />
            <span className="font-pixel text-[7px] text-yellow-300">
              {players[0].streak >= TUG_STREAK_THRESHOLD ? 'SUPER!' : `×${players[0].streak}`}
            </span>
          </div>
          {usedShot[1] && !feedback[1] && (
            <div className="font-pixel text-[6px] text-white/40">WAITING...</div>
          )}
        </div>

        {/* VS */}
        <div className="font-pixel text-sm text-white/60 self-center text-glow">VS</div>

        {/* Player 2 */}
        <div className="pixel-card rounded-lg p-3 flex flex-col items-center gap-1 min-w-[120px]">
          <PlayerAvatar
            name={players[1].name}
            color={players[1].color}
            size={52}
            isWinning={ropePos > 20}
            isLosing={ropePos < -20}
            isLocked={usedShot[2]}
            avatarUrl={players[1].avatarUrl}
          />
          <div className="font-pixel text-[8px] text-white/80 mt-1 text-center leading-tight">{players[1].name}</div>
          <div className="flex items-center gap-1">
            <StreakFlame streak={players[1].streak} />
            <span className="font-pixel text-[7px] text-yellow-300">
              {players[1].streak >= TUG_STREAK_THRESHOLD ? 'SUPER!' : `×${players[1].streak}`}
            </span>
          </div>
          {usedShot[2] && !feedback[2] && (
            <div className="font-pixel text-[6px] text-white/40">WAITING...</div>
          )}
        </div>
      </div>

      {/* Rope / Tug area */}
      <div className="pixel-card rounded-lg overflow-hidden relative h-20">
        {/* Grass top strip */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-green-700 to-green-800" />
        {/* Dirt bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-900 to-amber-800" />

        {/* Win zone overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-blue-500/25 border-r-2 border-blue-400/50 flex items-center justify-center">
          <span className="font-pixel text-[6px] text-blue-300/80">WIN</span>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[12%] bg-red-500/25 border-l-2 border-red-400/50 flex items-center justify-center">
          <span className="font-pixel text-[6px] text-red-300/80">WIN</span>
        </div>

        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 -translate-x-1/2" />

        {/* Rope */}
        <div className="absolute top-4 bottom-4 left-[12%] right-[12%] flex items-center">
          <div className="w-full h-3 rounded-full"
            style={{
              background: 'repeating-linear-gradient(90deg, #92400e 0px, #b45309 6px, #78350f 12px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          />
        </div>

        {/* Flag on rope */}
        <div
          className="absolute top-2 transition-all duration-300 z-10"
          style={{ left: `${flagPct}%`, transform: 'translateX(-50%)' }}
        >
          {/* Flag pole */}
          <div className="w-0.5 h-14 bg-white/90 mx-auto" />
          {/* Flag triangle */}
          <div
            className="absolute top-1 left-0.5"
            style={{
              width: 0, height: 0,
              borderTop: '7px solid #facc15',
              borderBottom: '7px solid transparent',
              borderRight: '12px solid transparent',
            }}
          />
        </div>
      </div>

      {/* Timer */}
      <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />

      {/* Problem */}
      <div className="flex-1 flex items-center justify-center relative">
        <ParticleBurst active={showBurst} color="#4ade80" />
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

      {/* Feedback badges */}
      {feedback[1] === 'correct' && (
        <div className="fixed top-4 left-4 pixel-card rounded-lg px-3 py-1.5 animate-bounce border-green-500/50">
          <span className="font-pixel text-[9px] text-green-400">CORRECT!</span>
        </div>
      )}
      {feedback[1] === 'wrong' && (
        <div className="fixed top-4 left-4 pixel-card rounded-lg px-3 py-1.5 animate-pulse border-red-500/50">
          <span className="font-pixel text-[9px] text-red-400">WRONG!</span>
        </div>
      )}
      {feedback[2] === 'correct' && (
        <div className="fixed top-4 right-4 pixel-card rounded-lg px-3 py-1.5 animate-bounce border-green-500/50">
          <span className="font-pixel text-[9px] text-green-400">CORRECT!</span>
        </div>
      )}
      {feedback[2] === 'wrong' && (
        <div className="fixed top-4 right-4 pixel-card rounded-lg px-3 py-1.5 animate-pulse border-red-500/50">
          <span className="font-pixel text-[9px] text-red-400">WRONG!</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="font-pixel text-[8px] text-white/30">PROBLEM #{problemCount}</div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
    </ScreenShake>
  )
}
