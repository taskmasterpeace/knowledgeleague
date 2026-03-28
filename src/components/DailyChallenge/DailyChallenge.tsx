import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useQuestionEngine } from '../../hooks/useQuestionEngine'
import { useKeyboardInput } from '../../hooks/useKeyboardInput'
import { MathProblem } from '../shared/MathProblem'
import { Timer } from '../shared/Timer'
import { ScreenShake, FlashOverlay, ParticleBurst } from '../shared/Effects'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { playMusic, stopMusic } from '../../utils/backgroundMusic'
import type { GameQuestion } from '../../types'

const TOTAL_QUESTIONS = 10
const DEFAULT_TIME_LIMIT = 15_000

interface LeaderboardEntry {
  name: string
  score: number
  avgTime: number
  bestStreak: number
  timestamp: number
}

interface QuestionResult {
  question: GameQuestion
  correct: boolean
  responseTime: number
}

function getTodayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getStorageKey(): string {
  return `knowledgeLeagueKids:dailyChallenge:${getTodayKey()}`
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey())
    if (raw) return JSON.parse(raw) as LeaderboardEntry[]
  } catch { /* ignored */ }
  return []
}

function saveToLeaderboard(entry: LeaderboardEntry): LeaderboardEntry[] {
  const board = loadLeaderboard()
  board.push(entry)
  board.sort((a, b) => b.score - a.score || a.avgTime - b.avgTime)
  const top10 = board.slice(0, 10)
  localStorage.setItem(getStorageKey(), JSON.stringify(top10))
  return top10
}

export function DailyChallenge() {
  const { setPhase, players } = useGameState()
  const { difficulty, soundEnabled } = useSettings()
  const { currentProblem, nextProblem, problemCount, reset: resetEngine } = useQuestionEngine(
    difficulty === 'adaptive' ? undefined : difficulty
  )

  // Game state
  const [questionNum, setQuestionNum] = useState(1)
  const [correctCount, setCorrectCount] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [results, setResults] = useState<QuestionResult[]>([])
  const [finished, setFinished] = useState(false)

  // Round state
  const [timerKey, setTimerKey] = useState(0)
  const [showingResult, setShowingResult] = useState(false)
  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null)
  const [shaking, setShaking] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const answeredRef = useRef(false)
  // eslint-disable-next-line react-hooks/purity
  const questionStartRef = useRef(Date.now())

  // Results screen state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => loadLeaderboard())
  const [playerName, setPlayerName] = useState(() => players[0]?.name || 'Player 1')
  const [saved, setSaved] = useState(false)

  // Start music
  useEffect(() => {
    playMusic('marathon')
    return () => stopMusic()
  }, [])

  const advanceOrFinish = useCallback(() => {
    if (questionNum >= TOTAL_QUESTIONS) {
      setFinished(true)
      return
    }
    setQuestionNum(q => q + 1)
    nextProblem()
    answeredRef.current = false
    questionStartRef.current = Date.now()
    setTimerKey(k => k + 1)
  }, [questionNum, nextProblem])

  const handleAnswer = useCallback((choiceIndex: number) => {
    if (answeredRef.current || showingResult || finished) return
    answeredRef.current = true

    const responseTime = Date.now() - questionStartRef.current
    const isCorrect = choiceIndex === currentProblem.correctIndex

    // Record result
    setResults(prev => [...prev, { question: currentProblem, correct: isCorrect, responseTime }])
    setTotalTime(prev => prev + responseTime)

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setCurrentStreak(s => {
        const next = s + 1
        setBestStreak(best => Math.max(best, next))
        // Play streak sound at milestones
        if ((next === 3 || next === 5) && soundEnabled) sounds.streak()
        return next
      })
      if (soundEnabled) sounds.correct()
      setFlashType('correct')
      setShowBurst(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShowBurst(false), 600)
    } else {
      setCurrentStreak(0)
      if (soundEnabled) sounds.wrong()
      setFlashType('wrong')
      setShaking(true)
      setTimeout(() => setFlashType(null), 150)
      setTimeout(() => setShaking(false), 250)
    }

    setShowingResult(true)
    setTimeout(() => {
      setShowingResult(false)
      advanceOrFinish()
    }, 1500)
  }, [currentProblem, showingResult, finished, soundEnabled, advanceOrFinish])

  const handleTimeUp = useCallback(() => {
    if (answeredRef.current || finished) return
    answeredRef.current = true

    // No answer — treat as wrong
    setResults(prev => [...prev, { question: currentProblem, correct: false, responseTime: DEFAULT_TIME_LIMIT }])
    setTotalTime(prev => prev + DEFAULT_TIME_LIMIT)
    setCurrentStreak(0)

    if (soundEnabled) sounds.wrong()
    setFlashType('wrong')
    setShaking(true)
    setTimeout(() => setFlashType(null), 150)
    setTimeout(() => setShaking(false), 250)

    setShowingResult(true)
    setTimeout(() => {
      setShowingResult(false)
      advanceOrFinish()
    }, 1500)
  }, [currentProblem, finished, soundEnabled, advanceOrFinish])

  useKeyboardInput({
    onAnswer: (_playerId, choiceIndex) => handleAnswer(choiceIndex),
    enabled: !showingResult && !finished,
    playerCount: 1,
  })

  const handleSaveScore = () => {
    if (saved || !playerName.trim()) return
    const avgTime = results.length > 0 ? totalTime / results.length : 0
    const board = saveToLeaderboard({
      name: playerName.trim(),
      score: correctCount,
      avgTime: Math.round(avgTime),
      bestStreak,
      timestamp: Date.now(),
    })
    setLeaderboard(board)
    setSaved(true)
    if (soundEnabled) sounds.badge()
  }

  const handlePlayAgain = () => {
    resetEngine()
    setQuestionNum(1)
    setCorrectCount(0)
    setCurrentStreak(0)
    setBestStreak(0)
    setTotalTime(0)
    setResults([])
    setFinished(false)
    setShowingResult(false)
    answeredRef.current = false
    questionStartRef.current = Date.now()
    setTimerKey(k => k + 1)
    setSaved(false)
    setLeaderboard(loadLeaderboard())
  }

  const avgTime = results.length > 0 ? totalTime / results.length : 0

  // ===== RESULTS SCREEN =====
  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center p-4 gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-pixel text-2xl text-yellow-300 text-glow tracking-wider">DAILY CHALLENGE</h1>
          <p className="font-pixel-body font-semibold text-sm text-cyan-300/60 mt-1">{new Date().toLocaleDateString()}</p>
        </div>

        {/* Score card */}
        <div className="pixel-card rounded-lg p-6 w-full max-w-md screen-enter">
          <div className="text-center mb-4">
            <div className="font-pixel text-6xl text-white text-glow">{correctCount}</div>
            <div className="font-pixel-body font-semibold text-base text-white/60">out of {TOTAL_QUESTIONS}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="font-pixel-body font-bold text-lg text-cyan-300">{(avgTime / 1000).toFixed(1)}s</div>
              <div className="font-pixel-body font-semibold text-xs text-white/40">AVG TIME</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
              <div className="font-pixel-body font-bold text-lg text-orange-300">{bestStreak}</div>
              <div className="font-pixel-body font-semibold text-xs text-white/40">BEST STREAK</div>
            </div>
          </div>

          {/* Question recap */}
          <div className="flex gap-1 justify-center mb-4">
            {results.map((r, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded flex items-center justify-center font-pixel text-[8px] ${
                  r.correct
                    ? 'bg-green-500/30 text-green-400 border border-green-500/30'
                    : 'bg-red-500/30 text-red-400 border border-red-500/30'
                } font-pixel-body font-bold`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Save score */}
          {!saved ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={16}
                placeholder="Your name"
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 font-pixel text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSaveScore}
                className="pixel-btn font-pixel py-2 px-4 bg-green-500 hover:bg-green-400 text-gray-900 text-xs rounded transition-colors"
              >
                SAVE
              </button>
            </div>
          ) : (
            <div className="font-pixel-body font-bold text-sm text-green-400 text-center">SCORE SAVED!</div>
          )}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="pixel-card rounded-lg p-4 w-full max-w-md screen-enter">
            <h2 className="font-pixel text-xs text-yellow-300 mb-3 text-center">TODAY&apos;S LEADERBOARD</h2>
            <div className="space-y-1">
              {leaderboard.map((entry, i) => (
                <div
                  key={`${entry.timestamp}-${i}`}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded text-sm font-pixel-body font-semibold ${
                    i === 0 ? 'bg-yellow-500/10 text-yellow-300' :
                    i === 1 ? 'bg-gray-400/10 text-gray-300' :
                    i === 2 ? 'bg-orange-500/10 text-orange-300' :
                    'text-white/50'
                  }`}
                >
                  <span className="w-5 text-right">{i + 1}.</span>
                  <span className="flex-1 truncate">{entry.name}</span>
                  <span className="text-cyan-300">{entry.score}/{TOTAL_QUESTIONS}</span>
                  <span className="text-white/30">{(entry.avgTime / 1000).toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="pixel-btn font-pixel py-3 px-6 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm rounded-lg transition-colors"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => setPhase('menu')}
            className="pixel-btn font-pixel py-3 px-6 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
          >
            MENU
          </button>
        </div>
      </div>
    )
  }

  // ===== PLAYING SCREEN =====
  return (
    <ScreenShake trigger={shaking}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col p-4 gap-4">
        <FlashOverlay type={flashType} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="font-pixel text-lg text-yellow-300 text-glow tracking-wider">DAILY CHALLENGE</h1>
            <p className="font-pixel-body font-semibold text-sm text-cyan-300/60">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel-body font-semibold text-sm text-white/50">QUESTION {questionNum}/{TOTAL_QUESTIONS}</span>
            <span className="font-pixel-body font-bold text-sm text-green-400">{correctCount} CORRECT</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(questionNum / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        {/* Streak indicator */}
        {currentStreak >= 2 && (
          <div className="text-center">
            <span className="font-pixel-body font-bold text-base text-orange-300 text-glow">
              {currentStreak >= 5 ? 'ON FIRE! ' : ''}{currentStreak} STREAK
            </span>
          </div>
        )}

        {/* Timer */}
        {!showingResult && (
          <Timer onTimeUp={handleTimeUp} resetKey={timerKey} timeLimit={DEFAULT_TIME_LIMIT} />
        )}

        {/* Problem or result feedback */}
        <div className="flex-1 flex items-center justify-center relative">
          <ParticleBurst active={showBurst} color="#4ade80" />
          {showingResult ? (
            <div className="pixel-card rounded-lg p-6 w-full max-w-2xl mx-auto screen-enter text-center">
              <div className="font-pixel text-lg text-white mb-2">
                {currentProblem.question}
                {currentProblem.subject === 'math' ? ' = ' : ''}
              </div>
              <div className={`font-pixel text-2xl ${
                answeredRef.current && results[results.length - 1]?.correct
                  ? 'text-green-400 text-glow'
                  : 'text-red-400'
              }`}>
                {currentProblem.choices[currentProblem.correctIndex]}
              </div>
              <div className="font-pixel-body font-bold text-sm text-white/40 mt-2">
                {results[results.length - 1]?.correct ? 'CORRECT!' : 'WRONG'}
              </div>
            </div>
          ) : (
            <MathProblem
              problem={currentProblem}
              onAnswer={handleAnswer}
              lockedP1={answeredRef.current}
              lockedP2={true}
              p1Keys={['1', '2', '3', '4']}
              p2Keys={['-', '-', '-', '-']}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="font-pixel-body font-semibold text-sm text-white/30">QUESTION #{problemCount}</div>
          <button
            onClick={() => setPhase('menu')}
            className="font-pixel-body font-semibold text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            QUIT
          </button>
        </div>
      </div>
    </ScreenShake>
  )
}
