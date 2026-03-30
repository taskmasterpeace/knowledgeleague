import { useCallback } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { sounds } from '../../utils/sounds'
import { useSettings } from '../../hooks/useSettings'
import { useGamepadNav } from '../../hooks/useGamepadNav'

const EVENTS = ['marathon', 'tug-of-war', 'hurdle-dash', 'long-jump', 'spelling-bee'] as const
// Total selectable items: 5 events + 1 stories (disabled) + 1 party mode = 7 (party is index 6)
const TOTAL_ITEMS = 7

export function EventSelect() {
  const { setEvent, setPhase, playerCount } = useGameState()
  const { soundEnabled } = useSettings()

  const selectEvent = useCallback((event: typeof EVENTS[number]) => {
    if (soundEnabled) sounds.select()
    setEvent(event)
    setPhase('playing')
  }, [soundEnabled, setEvent, setPhase])

  const handlePartyMode = useCallback(() => {
    if (soundEnabled) sounds.select()
    setPhase('party-setup')
  }, [soundEnabled, setPhase])

  const handleBack = useCallback(() => {
    if (soundEnabled) sounds.navigate()
    setPhase('avatar-select')
  }, [soundEnabled, setPhase])

  const handleSelect = useCallback((i: number) => {
    if (i < EVENTS.length) selectEvent(EVENTS[i])
    else if (i === 6) handlePartyMode()
  }, [selectEvent, handlePartyMode])

  const { focusIndex } = useGamepadNav({
    itemCount: TOTAL_ITEMS,
    columns: 3,
    onSelect: handleSelect,
    onBack: handleBack,
    enabled: true,
  })

  return (
    <div className="min-h-screen screen-enter flex flex-col items-center justify-center gap-10 p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0520] via-[#121040] to-[#0a0520]" />

      {/* Slow-scrolling star field layer 1 (far) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(1px 1px at 10% 20%, white 50%, transparent 100%), radial-gradient(1px 1px at 30% 60%, white 50%, transparent 100%), radial-gradient(1.5px 1.5px at 50% 10%, white 50%, transparent 100%), radial-gradient(1px 1px at 70% 40%, white 50%, transparent 100%), radial-gradient(1px 1px at 90% 70%, white 50%, transparent 100%), radial-gradient(1.5px 1.5px at 15% 80%, white 50%, transparent 100%), radial-gradient(1px 1px at 55% 45%, white 50%, transparent 100%), radial-gradient(1px 1px at 85% 15%, white 50%, transparent 100%)',
          backgroundSize: '200px 200px',
          animation: 'starDrift 60s linear infinite',
        }}
      />

      {/* Star field layer 2 (near, brighter, faster) */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(2px 2px at 20% 30%, #facc15 50%, transparent 100%), radial-gradient(2px 2px at 60% 70%, #67e8f9 50%, transparent 100%), radial-gradient(2px 2px at 80% 20%, #facc15 50%, transparent 100%), radial-gradient(1.5px 1.5px at 40% 90%, #c084fc 50%, transparent 100%), radial-gradient(2px 2px at 10% 50%, #67e8f9 50%, transparent 100%)',
          backgroundSize: '300px 300px',
          animation: 'starDrift 35s linear infinite reverse',
        }}
      />

      {/* Floating sparkle particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            left: `${8 + (i * 7.5) % 90}%`,
            top: `${5 + (i * 13) % 85}%`,
            background: i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#67e8f9' : '#c084fc',
            animation: `sparkleFloat ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite alternate`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Subtle radial glow behind cards */}
      <div
        className="absolute"
        style={{
          width: '80%',
          height: '60%',
          left: '10%',
          top: '25%',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 pixel-card px-4 py-2 rounded-lg font-pixel text-[8px] text-white/70 hover:text-white hover:scale-105 transition-all z-10"
      >
        BACK
      </button>

      <div className="text-center relative z-10">
        <h2 className="font-pixel text-3xl text-white text-glow leading-relaxed">PICK YOUR</h2>
        <h2 className="font-pixel text-3xl text-cyan-300 text-glow leading-relaxed">EVENT</h2>
      </div>

      <div className="flex gap-6 flex-wrap justify-center relative z-10 max-w-6xl">
        {/* Math Marathon card */}
        <button
          onClick={() => selectEvent('marathon')}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(250,204,21,0.3)] ${focusIndex === 0 ? 'gamepad-focus' : ''}`}
        >
          <img
            src="/pixelart/events/marathon.png"
            alt="Math Marathon"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Race to the finish!</span>
        </button>

        {/* Tug of War card */}
        <button
          onClick={() => selectEvent('tug-of-war')}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(250,204,21,0.3)] ${focusIndex === 1 ? 'gamepad-focus' : ''}`}
        >
          <img
            src="/pixelart/events/tug-of-war.png"
            alt="Tug of War"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Pull them to your side!</span>
          {playerCount > 2 && (
            <span className="font-pixel-body font-semibold text-xs text-yellow-300/70 text-center mt-1">Teams mode!</span>
          )}
        </button>

        {/* Hurdle Dash card */}
        <button
          onClick={() => selectEvent('hurdle-dash')}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(250,204,21,0.3)] ${focusIndex === 2 ? 'gamepad-focus' : ''}`}
        >
          <img
            src="/pixelart/events/hurdle-dash.png"
            alt="Hurdle Dash"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Clear hurdles with knowledge!</span>
        </button>

        {/* Long Jump card */}
        <button
          onClick={() => selectEvent('long-jump')}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(250,204,21,0.3)] ${focusIndex === 3 ? 'gamepad-focus' : ''}`}
        >
          <img
            src="/pixelart/events/long-jump.png"
            alt="Long Jump"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Build momentum & leap!</span>
        </button>

        {/* Spelling Bee card */}
        <button
          onClick={() => selectEvent('spelling-bee')}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(250,204,21,0.3)] ${focusIndex === 4 ? 'gamepad-focus' : ''}`}
        >
          <img
            src="/pixelart/events/spelling-bee.png"
            alt="Spelling Bee"
            className="w-full rounded-lg"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Last speller standing!</span>
        </button>

        {/* Stories card — Coming Soon */}
        <div
          className="pixel-card rounded-lg flex flex-col items-center gap-3 p-4 w-56 relative cursor-not-allowed"
          style={{ opacity: 0.7 }}
        >
          <div className="relative w-full">
            <img
              src="/pixelart/events/stories.png"
              alt="Stories"
              className="w-full rounded-lg grayscale-[30%]"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Coming Soon overlay */}
            <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-black/40">
              <span
                className="font-pixel text-xs text-yellow-300 tracking-wider"
                style={{
                  textShadow: '0 0 12px rgba(250,204,21,0.6), 2px 2px 0 #000',
                  transform: 'rotate(-6deg)',
                }}
              >
                COMING SOON
              </span>
            </div>
          </div>
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Adventure awaits!</span>
        </div>

        {/* Party Mode card */}
        <button
          onClick={handlePartyMode}
          className={`pixel-card rounded-lg flex flex-col items-center gap-3 p-4 hover:scale-105 transition-all active:scale-95 w-56 group hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] border-2 border-purple-400/40 ${focusIndex === 6 ? 'gamepad-focus' : ''}`}
          style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.15) 100%)' }}
        >
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(251,191,36,0.3) 100%)' }}
          >
            <span className="text-5xl" style={{ filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.6))' }}>🎉</span>
          </div>
          <span className="font-pixel text-sm text-purple-300 group-hover:text-purple-200 transition-colors" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
            PARTY MODE
          </span>
          <span className="font-pixel-body font-semibold text-xs text-white/50 text-center">Play 3-5 events!</span>
        </button>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes starDrift {
          from { background-position: 0 0; }
          to { background-position: 200px 200px; }
        }
        @keyframes sparkleFloat {
          from { transform: translateY(0) scale(1); opacity: 0.4; }
          to { transform: translateY(-12px) scale(1.3); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
