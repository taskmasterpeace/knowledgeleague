import { useGameState } from '../../hooks/useGameState'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { Fireworks } from '../shared/Effects'

export function Victory() {
  const { players, winner, resetGame, rematch } = useGameState()

  if (!winner) return null
  const winnerPlayer = players.find(p => p.id === winner)!

  // Rank all players by position (descending), then by score
  const ranked = [...players].sort((a, b) => b.position - a.position || b.score - a.score)

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-600 flex flex-col items-center justify-center gap-8 p-8">
      <Fireworks active={true} />
      <h2 className="text-6xl font-black text-white tracking-tight animate-bounce">
        {winnerPlayer.name.toUpperCase()} WINS!
      </h2>

      <div className="flex gap-8 items-end flex-wrap justify-center">
        {ranked.map((player, i) => {
          const isWinner = player.id === winner
          return (
            <div key={player.id} className={`flex flex-col items-center ${isWinner ? '' : 'opacity-60'}`}>
              {isWinner && <div className="text-6xl mb-2">🏆</div>}
              {i === 1 && <div className="text-3xl mb-2">🥈</div>}
              {i === 2 && <div className="text-3xl mb-2">🥉</div>}
              {i >= 3 && <div className="h-10" />}
              <PlayerAvatar
                name={player.name}
                color={player.color}
                size={isWinner ? 100 : 70}
                isWinning={isWinner}
                isLosing={!isWinner}
                avatarUrl={player.avatarUrl}
              />
              <span className={`text-white mt-2 font-bold ${isWinner ? 'text-2xl' : 'text-lg'}`}>
                {player.name}
              </span>
              <span className="text-white/80 text-sm">Score: {player.score}</span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={rematch}
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
