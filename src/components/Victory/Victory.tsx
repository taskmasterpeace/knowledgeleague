import { useGameState } from '../../hooks/useGameState'
import { PlayerAvatar } from '../shared/PlayerAvatar'

export function Victory() {
  const { players, winner, resetGame, setPhase } = useGameState()

  if (!winner) return null
  const winnerPlayer = players[winner - 1]
  const loserPlayer = players[winner === 1 ? 1 : 0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-600 flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-6xl font-black text-white tracking-tight animate-bounce">
        {winnerPlayer.name.toUpperCase()} WINS!
      </h2>

      <div className="flex gap-12 items-end">
        <div className="flex flex-col items-center opacity-50">
          <PlayerAvatar name={loserPlayer.name} color={loserPlayer.color} size={80} isLosing />
          <span className="text-white text-xl mt-2">Score: {loserPlayer.score}</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-8xl mb-4">🏆</div>
          <PlayerAvatar name={winnerPlayer.name} color={winnerPlayer.color} size={100} isWinning />
          <span className="text-white text-2xl font-bold mt-2">Score: {winnerPlayer.score}</span>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => {
            resetGame()
            setPhase('event-select')
          }}
          className="py-5 px-12 bg-white/20 hover:bg-white/30 text-white text-2xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 border-white/30"
        >
          REMATCH
        </button>
        <button
          onClick={resetGame}
          className="py-5 px-12 bg-white/20 hover:bg-white/30 text-white text-2xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 border-white/30"
        >
          MENU
        </button>
      </div>
    </div>
  )
}
