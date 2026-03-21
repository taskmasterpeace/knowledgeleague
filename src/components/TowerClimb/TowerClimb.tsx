import { useCallback, useState, useRef, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { useGamepad } from '../../hooks/useGamepad'
import { useCPU } from '../../hooks/useCPU'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ScreenShake, FlashOverlay } from '../shared/Effects'
import { useSettings } from '../../hooks/useSettings'
import { sounds, towerSounds } from '../../utils/sounds'
import { usePeerContext } from '../../hooks/usePeerContext'
import { useAnnouncer } from '../../hooks/useAnnouncer'
import { TowerScene } from './TowerScene'
import { createPlayerAnalytics, recordAnalyticsAnswer } from '../../utils/playerAnalytics'
import { gradeToStartingTier } from '../../utils/adaptiveDifficulty'
import { storeGameAnalytics } from '../../utils/gameAnalyticsStore'
import type { PlayerId, PlayerAnalytics } from '../../types'

const WIN_HEIGHT = 10

type RoundAnswer = { choiceIndex: number; correct: boolean; timestamp: number } | null

export function TowerClimb() {
  const {
    players, incrementStreak, resetStreak,
    incrementScore, setWinner, cpuCharacter,
    controllerType, setControllerType,
  } = useGameState()
  const { timePerQuestion, difficulty, soundEnabled, gradeLevel } = useSettings()
  const { currentProblem, nextProblem, problemCount } = useQuestionEngine(
    difficulty === 'adaptive' ? undefined : difficulty
  )
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)

  const [towerBlocks, setTowerBlocks] = useState<Map<PlayerId, number>>(new Map())
  const analyticsRef = useRef<Map<PlayerId, PlayerAnalytics>>(new Map())
  const [missiles, setMissiles] = useState<{ id: string; fromIndex: number; toIndex: number }[]>([])

  const { announceCorrect, announceWrong } = useAnnouncer()
  const { broadcastProblem, broadcastResult } = usePeerContext()

  const answersRef = useRef<Map<PlayerId, RoundAnswer>>(new Map())
  const roundResolvedRef = useRef(false)
  const timerStartRef = useRef(Date.now())

  // Initialize tower blocks and analytics for each player
  useEffect(() => {
    const blocks = new Map<PlayerId, number>()
    const tier = gradeToStartingTier(gradeLevel)
    for (const player of players) {
      blocks.set(player.id as PlayerId, 0)
      if (!analyticsRef.current.has(player.id as PlayerId)) {
        analyticsRef.current.set(player.id as PlayerId, createPlayerAnalytics(tier))
      }
    }
    setTowerBlocks(blocks)
  }, [players, gradeLevel])

  // Broadcast current problem to phone controllers
  useEffect(() => {
    broadcastProblem(currentProblem.question, currentProblem.choices, currentProblem.subject)
  }, [currentProblem, broadcastProblem])

  function getWobbleIntensity(pid: PlayerId): number {
    const a = analyticsRef.current.get(pid)
    if (!a) return 0
    const wrongCount = a.wrongWindowRecent5.filter(Boolean).length
    if (wrongCount >= 3) return 2
    if (wrongCount >= 2) return 1
    return 0
  }

  const handleMissileImpact = useCallback((missileId: string, targetId: number) => {
    setMissiles(prev => prev.filter(m => m.id !== missileId))
    const currentBlocks = towerBlocks.get(targetId as PlayerId) ?? 0
    if (currentBlocks > 0) {
      setTowerBlocks(prev => {
        const next = new Map(prev)
        next.set(targetId as PlayerId, currentBlocks - 1)
        return next
      })
      // Update analytics for the target
      const targetAnalytics = analyticsRef.current.get(targetId as PlayerId)
      if (targetAnalytics) {
        analyticsRef.current.set(targetId as PlayerId, {
          ...targetAnalytics,
          missilesTaken: targetAnalytics.missilesTaken + 1,
          blocksLost: targetAnalytics.blocksLost + 1,
        })
      }
      if (soundEnabled) towerSounds.missileHit()
    }
  }, [towerBlocks, soundEnabled])

  const fireMissile = useCallback((fromPid: PlayerId) => {
    const otherPlayers = players.filter(p => (p.id as PlayerId) !== fromPid)
    if (otherPlayers.length === 0) return

    const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
    const fromIndex = players.findIndex(p => (p.id as PlayerId) === fromPid)
    const toIndex = players.findIndex(p => p.id === target.id)

    // Update analytics for the launcher
    const launcherAnalytics = analyticsRef.current.get(fromPid)
    if (launcherAnalytics) {
      analyticsRef.current.set(fromPid, {
        ...launcherAnalytics,
        missilesLaunched: launcherAnalytics.missilesLaunched + 1,
      })
    }

    if (soundEnabled) towerSounds.missileLaunch()

    setMissiles(prev => [...prev, {
      id: `missile-${Date.now()}-${fromPid}`,
      fromIndex,
      toIndex,
    }])
  }, [players, soundEnabled])

  const resolveRound = useCallback(() => {
    if (roundResolvedRef.current) return
    roundResolvedRef.current = true

    const answers = answersRef.current
    let winnerId: PlayerId | null = null

    // Process answers sequentially by timestamp for correct answers
    const orderedAnswers: { pid: PlayerId; answer: NonNullable<RoundAnswer> }[] = []
    for (const player of players) {
      const pid = player.id as PlayerId
      const answer = answers.get(pid) ?? null
      if (answer) {
        orderedAnswers.push({ pid, answer })
      }
    }
    orderedAnswers.sort((a, b) => a.answer.timestamp - b.answer.timestamp)

    // Track which players answered correctly for effects
    let anyHumanCorrect = false

    for (const player of players) {
      const pid = player.id as PlayerId
      const answer = answers.get(pid) ?? null
      const responseTime = answer ? answer.timestamp - timerStartRef.current : timePerQuestion * 1000

      // Record analytics
      const currentAnalytics = analyticsRef.current.get(pid)
      if (currentAnalytics) {
        const updated = recordAnalyticsAnswer(
          currentAnalytics,
          answer?.choiceIndex ?? -1,
          answer?.correct ?? false,
          responseTime,
          currentProblem.category,
        )

        if (answer?.correct) {
          // Add a block
          const currentHeight = towerBlocks.get(pid) ?? 0
          const newHeight = currentHeight + 1
          updated.blocksPlaced = (updated.blocksPlaced ?? 0) + 1
          updated.positionHistory = [...updated.positionHistory, newHeight]

          setTowerBlocks(prev => {
            const next = new Map(prev)
            next.set(pid, newHeight)
            return next
          })

          if (soundEnabled) towerSounds.blockPlace()
          incrementStreak(pid)
          incrementScore(pid)

          if (player.type === 'human') anyHumanCorrect = true

          // Check win condition
          if (newHeight >= WIN_HEIGHT && !winnerId) {
            winnerId = pid
          }

          // Check streak for missile (streak is pre-increment, so +1)
          const newStreak = player.streak + 1
          if (newStreak >= 3 && newStreak % 3 === 0) {
            fireMissile(pid)
            // Streak continues but missile fires every 3
          }
        } else {
          // Wrong answer or no answer
          resetStreak(pid)
          updated.positionHistory = [...updated.positionHistory, towerBlocks.get(pid) ?? 0]

          // Check wobble mechanic
          const wrongCount = updated.wrongWindowRecent5.filter(Boolean).length
          if (wrongCount >= 3) {
            // Tower loses a block
            const currentHeight = towerBlocks.get(pid) ?? 0
            if (currentHeight > 0) {
              updated.blocksLost = (updated.blocksLost ?? 0) + 1
              setTowerBlocks(prev => {
                const next = new Map(prev)
                next.set(pid, currentHeight - 1)
                return next
              })
              if (soundEnabled) towerSounds.blockCrumble()
            }
            // Clear the wrong window after collapse
            updated.wrongWindowRecent5 = []
          } else if (wrongCount >= 2) {
            // Tower creaks/wobbles
            if (soundEnabled) towerSounds.towerCreak()
          }
        }

        analyticsRef.current.set(pid, updated)
      }
    }

    // Effects
    if (anyHumanCorrect) {
      if (soundEnabled) sounds.correct()
      setFlashType('correct')
      setTimeout(() => setFlashType(null), 150)
    } else {
      if (soundEnabled) sounds.wrong()
      setFlashType('wrong')
      setShaking(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShaking(false), 250)
    }

    // Announcer
    if (anyHumanCorrect) {
      for (const player of players) {
        const pid = player.id as PlayerId
        const answer = answers.get(pid)
        if (answer?.correct && player.type === 'human') {
          announceCorrect(player.name, player.streak + 1)
          break
        }
      }
    } else {
      const firstHuman = players.find(p => p.type === 'human')
      if (firstHuman) announceWrong(firstHuman.name, firstHuman.streak > 0)
    }

    // Check for winner
    if (winnerId) {
      // Store analytics before ending
      const names = new Map<PlayerId, string>()
      for (const p of players) names.set(p.id as PlayerId, p.name)
      storeGameAnalytics(analyticsRef.current, names)
      setWinner(winnerId)
      if (soundEnabled) towerSounds.towerComplete()
      return
    }

    // Broadcast correct answer to phone controllers
    broadcastResult(currentProblem.correctIndex)

    setShowingResult(true)

    setTimeout(() => {
      setShowingResult(false)
      answersRef.current = new Map()
      roundResolvedRef.current = false
      nextProblem()
      timerStartRef.current = Date.now()
      setTimerKey(k => k + 1)
    }, 2000)
  }, [
    players, currentProblem, timePerQuestion, towerBlocks, soundEnabled,
    incrementStreak, resetStreak, incrementScore, setWinner,
    nextProblem, broadcastResult, fireMissile, announceCorrect, announceWrong,
  ])

  const handleAnswer = useCallback((playerId: PlayerId, choiceIndex: number) => {
    if (showingResult) return
    if (answersRef.current.has(playerId)) return

    const isCorrect = choiceIndex === currentProblem.correctIndex
    answersRef.current.set(playerId, { choiceIndex, correct: isCorrect, timestamp: Date.now() })

    // If all players have answered, resolve immediately
    if (answersRef.current.size >= players.length) {
      resolveRound()
    }
  }, [currentProblem, showingResult, resolveRound, players.length])

  // Register handler for phone controller answers via PeerJS
  useEffect(() => {
    (window as any).__remoteAnswerHandler = (playerId: number, choiceIndex: number) => {
      handleAnswer(playerId as PlayerId, choiceIndex)
    }
    return () => { delete (window as any).__remoteAnswerHandler }
  }, [handleAnswer])

  const humanCount = players.filter(p => p.type === 'human').length

  useKeyboardInput({
    onAnswer: (playerId, choiceIndex) => {
      const player = players.find(p => p.id === playerId)
      if (player?.type === 'human') handleAnswer(playerId, choiceIndex)
    },
    enabled: !showingResult,
    playerCount: humanCount,
  })

  useGamepad({
    onP1Answer: (i) => handleAnswer(1, i),
    onP2Answer: (i) => {
      if (players[1]?.type === 'human') handleAnswer(2, i)
    },
    enabled: !showingResult,
    onControllerChange: setControllerType,
  })

  // CPU player
  const cpuPlayer = players.find(p => p.type === 'cpu')
  useCPU({
    character: cpuCharacter,
    currentProblem,
    enabled: !!cpuPlayer && !showingResult,
    onAnswer: (i) => { if (cpuPlayer) handleAnswer(cpuPlayer.id as PlayerId, i) },
    streak: cpuPlayer?.streak ?? 0,
  })

  const handleTimeUp = useCallback(() => {
    resolveRound()
  }, [resolveRound])

  return (
    <ScreenShake trigger={shaking}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 flex flex-col">
        <FlashOverlay type={flashType} />

        {/* 3D Tower Scene */}
        <div className="flex-1 relative" style={{ minHeight: '50vh' }}>
          <TowerScene
            players={players.map(p => ({
              id: p.id,
              name: p.name,
              color: p.color,
              blockCount: towerBlocks.get(p.id as PlayerId) ?? 0,
              wobbleIntensity: getWobbleIntensity(p.id as PlayerId),
              type: p.type,
            }))}
            missiles={missiles}
            onMissileImpact={handleMissileImpact}
          />

          {/* HUD overlay on top of 3D scene */}
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
            {players.map(p => (
              <div key={p.id} className="pixel-card rounded-lg px-3 py-2 bg-black/60">
                <div className="font-pixel text-[9px] text-white">{p.name}</div>
                <div className="font-pixel text-xs" style={{ color: p.color }}>
                  {towerBlocks.get(p.id as PlayerId) ?? 0}/{WIN_HEIGHT} blocks
                </div>
                {p.streak >= 2 && (
                  <div className="font-pixel text-[8px] text-orange-400">
                    {p.streak >= 3 ? 'MISSILE READY!' : `${p.streak} streak`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question area at bottom */}
        <div className="p-4 space-y-3">
          {!showingResult && (
            <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={timePerQuestion} />
          )}

          {showingResult ? (
            <div className="pixel-card rounded-lg p-4 text-center screen-enter">
              <span className="font-pixel text-lg text-white">{currentProblem.question} = </span>
              <span className="font-pixel text-lg text-green-400 text-glow">
                {currentProblem.choices[currentProblem.correctIndex]}
              </span>
            </div>
          ) : (
            <MathProblem
              problem={currentProblem}
              onAnswer={() => {}}
              lockedP1={answersRef.current.has(1)}
              lockedP2={answersRef.current.has(2)}
              p1Keys={['1', '2', '3', '4']}
              p2Keys={['1', '2', '3', '4']}
              controllerType={controllerType}
            />
          )}

          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="font-pixel text-[8px] text-white/30">PROBLEM #{problemCount}</div>
            <div className="font-pixel text-[8px] text-white/30">TOWER CLIMB</div>
          </div>
        </div>
      </div>
    </ScreenShake>
  )
}
