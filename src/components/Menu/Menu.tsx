import { useGameState } from '../../hooks/useGameState'
import { useGamepad } from '../../hooks/useGamepad'
import { ControllerHint } from '../shared/ControllerButtons'

export function Menu() {
  const { setPhase, startSinglePlayer, controllerType, setControllerType } = useGameState()

  // Listen for controller connections on menu
  useGamepad({
    onP1Answer: () => {},
    onP2Answer: () => {},
    enabled: false,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-800 flex flex-col items-center justify-center gap-12 p-8">
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
          onClick={() => setPhase('avatar-select')}
          className="w-full py-6 bg-green-400 hover:bg-green-300 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          2 PLAYERS
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-white/40 text-sm">
          P1: Keys 1-2-3-4 &nbsp;&nbsp; P2: Keys 7-8-9-0
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>
    </div>
  )
}
