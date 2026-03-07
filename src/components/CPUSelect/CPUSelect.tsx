import { useGameState } from '../../hooks/useGameState'
import { CPU_CHARACTERS } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'

export function CPUSelect() {
  const { setCPUCharacter, setPhase } = useGameState()

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-700 flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-5xl font-black text-white tracking-tight">PICK YOUR OPPONENT</h2>

      <div className="grid grid-cols-2 gap-6 max-w-2xl w-full">
        {CPU_CHARACTERS.map((cpu) => (
          <button
            key={cpu.name}
            onClick={() => {
              setCPUCharacter(cpu)
              setPhase('avatar-select')
            }}
            className="flex flex-col items-center gap-3 p-6 bg-white/15 backdrop-blur rounded-2xl border-2 border-white/20 hover:bg-white/25 hover:scale-105 transition-all active:scale-95"
          >
            <PlayerAvatar name={cpu.name} color={cpu.color} size={60} />
            <span className="text-white/80 text-lg font-medium">{cpu.tagline}</span>
            <div className="flex gap-4 text-sm text-white/50">
              <span>Speed: {cpu.speedRange[0]}-{cpu.speedRange[1]}s</span>
              <span>Accuracy: {Math.round(cpu.accuracy * 100)}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
