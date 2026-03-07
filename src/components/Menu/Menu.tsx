import { useState } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useGamepad } from '../../hooks/useGamepad'
import { ControllerHint } from '../shared/ControllerButtons'
import { Settings } from '../Settings/Settings'

export function Menu() {
  const { setPhase, startSinglePlayer, setPlayerCount, controllerType, setControllerType } = useGameState()
  const [showSettings, setShowSettings] = useState(false)

  useGamepad({
    onP1Answer: () => {},
    onP2Answer: () => {},
    enabled: false,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-800 flex flex-col items-center justify-center gap-12 p-8 relative">
      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      <div className="text-center">
        <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-lg">
          MATH MUSCLE
        </h1>
        <p className="text-2xl text-white/70 mt-4 font-medium">Kids Edition</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <button
          onClick={() => {
            startSinglePlayer()
            setPhase('cpu-select')
          }}
          className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          1 PLAYER
        </button>
        <button
          onClick={() => { setPlayerCount(2); setPhase('avatar-select') }}
          className="w-full py-6 bg-green-400 hover:bg-green-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          2 PLAYERS
        </button>
        <button
          onClick={() => { setPlayerCount(3); setPhase('avatar-select') }}
          className="w-full py-6 bg-cyan-400 hover:bg-cyan-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          3 PLAYERS
        </button>
        <button
          onClick={() => { setPlayerCount(4); setPhase('avatar-select') }}
          className="w-full py-6 bg-orange-400 hover:bg-orange-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          4 PLAYERS
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-white/40 text-sm">
          P1: 1-2-3-4 &nbsp; P2: Numpad &nbsp; P3: Q-W-E-R &nbsp; P4: U-I-O-P
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
