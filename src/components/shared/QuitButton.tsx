import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { stopMusic } from '../../utils/backgroundMusic'

export function QuitButton() {
  const { resetGame } = useGameState()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 pixel-card rounded-lg px-4 py-3">
        <span className="font-pixel-body font-semibold text-sm text-white/80">Quit game?</span>
        <button
          onClick={() => { stopMusic(); resetGame() }}
          className="font-pixel-body font-bold text-sm bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded transition-colors"
        >
          YES
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="font-pixel-body font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
        >
          NO
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="fixed top-4 left-4 z-50 pixel-card rounded-lg px-3 py-2 font-pixel-body font-bold text-sm text-white/50 hover:text-white/90 transition-colors"
      title="Quit to menu"
    >
      QUIT
    </button>
  )
}
