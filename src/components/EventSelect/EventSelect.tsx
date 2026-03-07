import { useGameState } from '../../hooks/useGameState'

export function EventSelect() {
  const { setEvent, setPhase } = useGameState()

  const selectEvent = (event: 'marathon' | 'tug-of-war') => {
    setEvent(event)
    setPhase('playing')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-emerald-800 flex flex-col items-center justify-center gap-12 p-8">
      <h2 className="text-5xl font-black text-white tracking-tight">PICK YOUR EVENT</h2>

      <div className="flex gap-8">
        <button
          onClick={() => selectEvent('marathon')}
          className="flex flex-col items-center gap-4 p-10 bg-white/15 backdrop-blur rounded-2xl border-2 border-white/20 hover:bg-white/25 hover:scale-105 transition-all active:scale-95 w-72"
        >
          <svg width="100" height="100" viewBox="0 0 100 100">
            <ellipse cx="50" cy="60" rx="45" ry="25" fill="none" stroke="white" strokeWidth="3" strokeDasharray="8 4" />
            <circle cx="25" cy="52" r="8" fill="#3b82f6" />
            <circle cx="60" cy="42" r="8" fill="#ef4444" />
          </svg>
          <span className="text-white text-3xl font-bold">MATH MARATHON</span>
          <span className="text-white/60 text-lg">Race to the finish!</span>
        </button>

        <button
          onClick={() => selectEvent('tug-of-war')}
          className="flex flex-col items-center gap-4 p-10 bg-white/15 backdrop-blur rounded-2xl border-2 border-white/20 hover:bg-white/25 hover:scale-105 transition-all active:scale-95 w-72"
        >
          <svg width="100" height="100" viewBox="0 0 100 100">
            <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="4" />
            <polygon points="50,35 55,50 45,50" fill="#f59e0b" />
            <circle cx="20" cy="50" r="8" fill="#3b82f6" />
            <circle cx="80" cy="50" r="8" fill="#ef4444" />
          </svg>
          <span className="text-white text-3xl font-bold">TUG OF WAR</span>
          <span className="text-white/60 text-lg">Pull them to your side!</span>
        </button>
      </div>
    </div>
  )
}
