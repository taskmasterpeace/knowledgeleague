import { useCallback } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { CPU_CHARACTERS } from '../../utils/constants'
import { sounds } from '../../utils/sounds'
import { useSettings } from '../../hooks/useSettings'
import { playMusic } from '../../utils/backgroundMusic'
import { useGamepadNav } from '../../hooks/useGamepadNav'

// Difficulty indicator dots
function DifficultyDots({ accuracy }: { accuracy: number }) {
  // accuracy >= 0.85 = hard (3 red), >= 0.70 = medium (2 yellow), else easy (1 green)
  const level = accuracy >= 0.85 ? 3 : accuracy >= 0.70 ? 2 : 1
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor:
              i <= level
                ? level === 1 ? '#22c55e' : level === 2 ? '#eab308' : '#ef4444'
                : 'rgba(255,255,255,0.15)',
            boxShadow: i <= level ? `0 0 4px ${level === 1 ? '#22c55e' : level === 2 ? '#eab308' : '#ef4444'}` : 'none',
          }}
        />
      ))}
      <span className="font-pixel-body font-bold text-xs ml-1" style={{
        color: level === 1 ? '#22c55e' : level === 2 ? '#eab308' : '#ef4444'
      }}>
        {level === 1 ? 'EASY' : level === 2 ? 'MED' : 'HARD'}
      </span>
    </div>
  )
}

export function CPUSelect() {
  const { setCPUCharacter, setPhase } = useGameState()
  const { soundEnabled } = useSettings()

  // Start lobby music — persists through Avatar Select and Event Select
  playMusic('lobby')

  const handleSelect = useCallback((cpu: typeof CPU_CHARACTERS[0]) => {
    if (soundEnabled) sounds.select()
    setCPUCharacter(cpu)
    setPhase('avatar-select')
  }, [soundEnabled, setCPUCharacter, setPhase])

  const handleBack = useCallback(() => {
    if (soundEnabled) sounds.navigate()
    setPhase('menu')
  }, [soundEnabled, setPhase])

  const { focusIndex } = useGamepadNav({
    itemCount: CPU_CHARACTERS.length,
    columns: Math.min(CPU_CHARACTERS.length, 3),
    onSelect: (i) => handleSelect(CPU_CHARACTERS[i]),
    onBack: handleBack,
    enabled: true,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-8 p-8 relative">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 pixel-card px-4 py-2 rounded-lg font-pixel text-[8px] text-white/70 hover:text-white hover:scale-105 transition-all"
      >
        BACK
      </button>

      <div className="text-center">
        <h2 className="font-pixel text-2xl text-white text-glow leading-relaxed">PICK YOUR</h2>
        <h2 className="font-pixel text-2xl text-cyan-300 text-glow leading-relaxed">OPPONENT</h2>
      </div>

      <div className="flex flex-wrap gap-4 justify-center max-w-3xl w-full">
        {CPU_CHARACTERS.map((cpu, i) => (
          <button
            key={cpu.name}
            onClick={() => handleSelect(cpu)}
            className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-5 hover:scale-105 transition-all active:scale-95 group w-56 ${focusIndex === i ? 'gamepad-focus' : ''}`}
          >
            <img
              src={cpu.avatarUrl}
              alt={cpu.name}
              className="w-20 h-20 rounded-lg border-2 group-hover:scale-110 transition-transform"
              style={{ imageRendering: 'pixelated', borderColor: cpu.color }}
            />
            <span className="font-pixel text-[10px] text-white group-hover:text-cyan-300 transition-colors">
              {cpu.name}
            </span>
            <span className="font-pixel-body font-semibold text-xs text-white/60 text-center leading-relaxed">
              {cpu.tagline}
            </span>

            {/* Stats row */}
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="pixel-card rounded px-2 py-1" style={{ border: '1px solid rgba(100,100,180,0.3)' }}>
                <span className="font-pixel-body font-semibold text-xs text-white/50">SPD: </span>
                <span className="font-pixel-body font-semibold text-xs text-cyan-300">
                  {cpu.speedRange[0]}-{cpu.speedRange[1]}s
                </span>
              </div>
              <div className="pixel-card rounded px-2 py-1" style={{ border: '1px solid rgba(100,100,180,0.3)' }}>
                <span className="font-pixel-body font-semibold text-xs text-white/50">ACC: </span>
                <span className="font-pixel-body font-semibold text-xs text-yellow-300">
                  {Math.round(cpu.accuracy * 100)}%
                </span>
              </div>
            </div>

            <DifficultyDots accuracy={cpu.accuracy} />
          </button>
        ))}
      </div>
    </div>
  )
}
