import { useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { usePeerContext } from '../../hooks/usePeerContext'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { Fireworks } from '../shared/Effects'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { playMusic, stopMusic } from '../../utils/backgroundMusic'

export function Victory() {
  const { players, winner, resetGame, rematch, setPhase } = useGameState()
  const { broadcastGameOver } = usePeerContext()
  const { soundEnabled } = useSettings()

  // Rank all players by position (descending), then by score
  const ranked = [...players].sort((a, b) => b.position - a.position || b.score - a.score)

  useEffect(() => {
    playMusic('victory')
    return () => stopMusic()
  }, [])

  useEffect(() => {
    if (soundEnabled) sounds.victory()
    // Broadcast game over to phone controllers
    if (winner) {
      const winnerPlayer = players.find(p => p.id === winner)
      broadcastGameOver(
        winnerPlayer?.name ?? 'Unknown',
        ranked.map(p => ({ name: p.name, score: p.score, position: p.position }))
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-advance to stats after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPhase('stats'), 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!winner) return null
  const winnerPlayer = players.find(p => p.id === winner)!

  // Podium heights: 1st tallest, 2nd/3rd shorter
  const podiumHeights = ['h-20', 'h-12', 'h-8', 'h-6']
  const podiumColors = [
    'bg-yellow-500/30 border-yellow-400/50',
    'bg-gray-400/20 border-gray-300/40',
    'bg-amber-700/20 border-amber-600/40',
    'bg-gray-600/20 border-gray-500/40',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-8 p-8 overflow-hidden">
      <Fireworks active={true} />

      {/* Confetti */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="fixed w-2 h-2 rounded-sm pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            backgroundColor: ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899'][i % 6],
            animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* Trophy SVG */}
      <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
        {/* Cup body */}
        <path d="M22 10 h36 v28 C58 52 50 58 40 60 C30 58 22 52 22 38 Z"
          fill="rgba(251,191,36,0.9)" stroke="#d97706" strokeWidth="2" />
        {/* Cup handles */}
        <path d="M22 18 C10 18 10 34 22 34" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        <path d="M58 18 C70 18 70 34 58 34" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        {/* Base stem */}
        <rect x="34" y="60" width="12" height="6" fill="#d97706" rx="1" />
        {/* Base platform */}
        <rect x="26" y="66" width="28" height="5" fill="#b45309" rx="2" />
        {/* Star on cup */}
        <polygon points="40,20 42,26 48,26 43,30 45,36 40,32 35,36 37,30 32,26 38,26"
          fill="rgba(255,255,255,0.9)" />
        {/* Shine */}
        <ellipse cx="30" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(-20 30 22)" />
      </svg>

      {/* Winner announcement */}
      <div className="text-center">
        <h2 className="font-pixel text-3xl text-yellow-300 text-glow-gold animate-bounce leading-relaxed">
          {winnerPlayer.name.toUpperCase()}
        </h2>
        <p className="font-pixel text-sm text-yellow-400/80 mt-1">WINS!</p>
      </div>

      {/* Podium */}
      <div className="flex gap-4 items-end flex-wrap justify-center">
        {ranked.map((player, i) => {
          const isWinner = player.id === winner
          return (
            <div key={player.id} className="flex flex-col items-center gap-2">
              {/* Place badge */}
              {i === 0 && (
                <div className="pixel-card rounded-lg px-2 py-0.5 border-yellow-400/50 pulse-glow">
                  <span className="font-pixel text-[8px] text-yellow-300">1ST</span>
                </div>
              )}
              {i === 1 && (
                <div className="pixel-card rounded-lg px-2 py-0.5">
                  <span className="font-pixel text-[8px] text-gray-300">2ND</span>
                </div>
              )}
              {i === 2 && (
                <div className="pixel-card rounded-lg px-2 py-0.5">
                  <span className="font-pixel text-[8px] text-amber-600">3RD</span>
                </div>
              )}
              {i >= 3 && (
                <div className="pixel-card rounded-lg px-2 py-0.5">
                  <span className="font-pixel text-[8px] text-white/40">{i + 1}TH</span>
                </div>
              )}

              {/* Player card */}
              <div className={`pixel-card rounded-lg p-4 flex flex-col items-center gap-2 ${isWinner ? 'pulse-glow border-yellow-400/60' : 'opacity-70'}`}>
                <PlayerAvatar
                  name={player.name}
                  color={player.color}
                  size={isWinner ? 80 : 56}
                  isWinning={isWinner}
                  isLosing={!isWinner}
                  avatarUrl={player.avatarUrl}
                />
                <span className="font-pixel text-[8px] text-white text-center">{player.name}</span>
                <span className="font-pixel text-[7px] text-yellow-300">SCORE: {player.score}</span>
              </div>

              {/* Podium block */}
              <div className={`w-full border-2 rounded-t-sm ${podiumHeights[i] ?? 'h-4'} ${podiumColors[i] ?? 'bg-gray-600/20'} min-w-[80px]`} />
            </div>
          )
        })}
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={rematch}
          className="pixel-btn font-pixel py-4 px-8 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-lg transition-colors"
        >
          REMATCH
        </button>
        <button
          onClick={() => setPhase('stats')}
          className="pixel-btn font-pixel py-4 px-8 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors"
        >
          SKIP
        </button>
        <button
          onClick={resetGame}
          className="pixel-btn font-pixel py-4 px-8 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg transition-colors"
        >
          MENU
        </button>
      </div>
    </div>
  )
}
