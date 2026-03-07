import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { PLAYER_COLORS } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'

export function AvatarSelect() {
  const { players, setPlayerName, setPlayerColor, setPhase } = useGameState()
  const [names, setNames] = useState([players[0].name, players[1].name])

  const humanPlayers = players.filter(p => p.type === 'human')

  const handleContinue = () => {
    humanPlayers.forEach((p) => {
      setPlayerName(p.id, names[p.id - 1] || `Player ${p.id}`)
    })
    setPhase('event-select')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-500 to-blue-700 flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-5xl font-black text-white tracking-tight">CHOOSE YOUR LOOK</h2>

      <div className="flex gap-12">
        {humanPlayers.map((player) => (
          <div key={player.id} className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-8 border-2 border-white/20">
            <PlayerAvatar name={names[player.id - 1] || `P${player.id}`} color={player.color} size={80} />

            <input
              type="text"
              value={names[player.id - 1]}
              onChange={(e) => {
                const n = [...names]
                n[player.id - 1] = e.target.value
                setNames(n)
              }}
              placeholder={`Player ${player.id} name`}
              maxLength={10}
              className="text-center text-2xl font-bold bg-white/20 text-white placeholder-white/40 border-2 border-white/30 rounded-xl px-4 py-3 w-48 focus:outline-none focus:border-white/60"
            />

            <div className="flex gap-2">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setPlayerColor(player.id, color)}
                  className={`w-10 h-10 rounded-full border-3 transition-all ${player.color === color ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleContinue}
        className="py-5 px-16 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg mt-4"
      >
        NEXT
      </button>
    </div>
  )
}
