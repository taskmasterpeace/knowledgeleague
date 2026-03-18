import { useGameState } from '../../hooks/useGameState'

export function EventSelect() {
  const { setEvent, setPhase } = useGameState()

  const selectEvent = (event: 'marathon' | 'tug-of-war') => {
    setEvent(event)
    setPhase('playing')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h2 className="font-pixel text-3xl text-white text-glow leading-relaxed">PICK YOUR</h2>
        <h2 className="font-pixel text-3xl text-cyan-300 text-glow leading-relaxed">EVENT</h2>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {/* Math Marathon card */}
        <button
          onClick={() => selectEvent('marathon')}
          className="pixel-card rounded-lg flex flex-col items-center gap-4 p-8 hover:scale-105 transition-all active:scale-95 w-64 group"
        >
          {/* Marathon SVG: running figure on track with checkered flag */}
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Track oval */}
            <ellipse cx="50" cy="72" rx="40" ry="14" fill="none" stroke="rgba(100,200,100,0.5)" strokeWidth="3" strokeDasharray="8 4" />
            {/* Track surface */}
            <ellipse cx="50" cy="72" rx="38" ry="12" fill="rgba(180,120,60,0.15)" />

            {/* Runner figure (blue) */}
            <circle cx="28" cy="45" r="7" fill="#3b82f6" />
            {/* Body */}
            <line x1="28" y1="52" x2="28" y2="68" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
            {/* Arms pumping */}
            <line x1="28" y1="56" x2="20" y2="60" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="56" x2="36" y2="53" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            {/* Legs running */}
            <line x1="28" y1="68" x2="22" y2="78" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="68" x2="34" y2="75" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

            {/* Runner figure (red) */}
            <circle cx="55" cy="42" r="7" fill="#ef4444" />
            {/* Body */}
            <line x1="55" y1="49" x2="55" y2="65" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            {/* Arms */}
            <line x1="55" y1="53" x2="47" y2="50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="53" x2="63" y2="57" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            {/* Legs */}
            <line x1="55" y1="65" x2="49" y2="75" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="65" x2="61" y2="72" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* Checkered flag */}
            <line x1="82" y1="20" x2="82" y2="55" stroke="white" strokeWidth="2" />
            <rect x="82" y="20" width="8" height="5" fill="white" />
            <rect x="86" y="20" width="4" height="5" fill="#222" />
            <rect x="82" y="25" width="4" height="5" fill="#222" />
            <rect x="86" y="25" width="4" height="5" fill="white" />
          </svg>

          <span className="font-pixel text-xs text-white group-hover:text-cyan-300 transition-colors text-center leading-relaxed">
            MATH<br />MARATHON
          </span>
          <span className="font-pixel text-[7px] text-white/50 text-center">Race to the finish!</span>
        </button>

        {/* Tug of War card */}
        <button
          onClick={() => selectEvent('tug-of-war')}
          className="pixel-card rounded-lg flex flex-col items-center gap-4 p-8 hover:scale-105 transition-all active:scale-95 w-64 group"
        >
          {/* Tug of War SVG: two figures pulling a rope */}
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Rope */}
            <line x1="18" y1="50" x2="82" y2="50" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
            {/* Rope texture */}
            <line x1="18" y1="50" x2="82" y2="50" stroke="#f59e0b" strokeWidth="2"
              strokeDasharray="6 6" strokeLinecap="round" />

            {/* Flag on rope */}
            <line x1="50" y1="36" x2="50" y2="56" stroke="white" strokeWidth="2" />
            <polygon points="50,36 62,42 50,48" fill="#facc15" />

            {/* Left figure (blue) - leaning back */}
            <circle cx="14" cy="30" r="7" fill="#3b82f6" />
            <line x1="14" y1="37" x2="12" y2="55" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="43" x2="20" y2="48" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="55" x2="6" y2="65" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="55" x2="18" y2="63" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

            {/* Right figure (red) - leaning back other direction */}
            <circle cx="86" cy="30" r="7" fill="#ef4444" />
            <line x1="86" y1="37" x2="88" y2="55" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <line x1="88" y1="43" x2="80" y2="48" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="88" y1="55" x2="94" y2="65" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <line x1="88" y1="55" x2="82" y2="63" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

            {/* Tension arrows */}
            <polygon points="32,47 26,50 32,53" fill="rgba(59,130,246,0.7)" />
            <polygon points="68,47 74,50 68,53" fill="rgba(239,68,68,0.7)" />
          </svg>

          <span className="font-pixel text-xs text-white group-hover:text-cyan-300 transition-colors text-center leading-relaxed">
            TUG OF<br />WAR
          </span>
          <span className="font-pixel text-[7px] text-white/50 text-center">Pull them to your side!</span>
        </button>
      </div>
    </div>
  )
}
