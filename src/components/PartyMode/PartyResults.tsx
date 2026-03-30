import { useEffect, useMemo } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useSettings } from '../../hooks/useSettings'
import { sounds } from '../../utils/sounds'
import { playMusic, stopMusic } from '../../utils/backgroundMusic'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { Fireworks } from '../shared/Effects'
import { OBJECTS } from '../../utils/pixelArt'

const EVENT_NAMES: Record<string, string> = {
  'marathon': 'Math Marathon',
  'tug-of-war': 'Tug of War',
  'hurdle-dash': 'Hurdle Dash',
  'long-jump': 'Long Jump',
  'spelling-bee': 'Spelling Bee',
}

const PLACE_LABELS = ['1ST', '2ND', '3RD']

export function PartyResults() {
  const {
    partyResults,
    partyTotalScores,
    players,
    endPartyMode,
    resetGame,
    startPartyMode,
    partyEvents,
  } = useGameState()
  const { soundEnabled } = useSettings()

  // Rank players by total medal points descending
  const standings = useMemo(() => {
    return [...players]
      .map(p => ({ ...p, totalPoints: partyTotalScores[p.id] ?? 0 }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, partyTotalScores])

  const champion = standings[0]

  // Play victory music + sound on mount
  useEffect(() => {
    playMusic('victory')
    return () => stopMusic()
  }, [])

  useEffect(() => {
    if (soundEnabled) sounds.victory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePlayAgain = () => {
    startPartyMode(partyEvents.length || 3)
  }

  const handleMenu = () => {
    endPartyMode()
    resetGame()
  }

  if (!champion) return null

  const podiumColors = [
    'from-yellow-500/40 to-yellow-600/20 border-yellow-400/60',
    'from-gray-400/30 to-gray-500/20 border-gray-300/50',
    'from-amber-700/30 to-amber-800/20 border-amber-600/50',
    'from-gray-600/20 to-gray-700/10 border-gray-500/30',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-black stars-bg screen-enter flex flex-col items-center gap-6 p-6 overflow-hidden relative">
      <Fireworks active={true} />

      {/* Confetti — 50 pieces for extra celebration */}
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="fixed pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            width: i % 3 === 0 ? 8 : 6,
            height: i % 3 === 0 ? 8 : 6,
            borderRadius: i % 4 === 0 ? '50%' : '2px',
            backgroundColor: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#facc15', '#14b8a6'][i % 8],
            animation: `confetti-fall ${2 + Math.random() * 4}s linear ${Math.random() * 2}s infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
            zIndex: 9997,
          }}
        />
      ))}

      {/* Golden glow backdrop behind champion */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(250,204,21,0.25) 0%, rgba(250,204,21,0.08) 40%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Trophy */}
      <div className="relative z-10 mt-4">
        {OBJECTS['trophy'] ? (
          <img
            src={OBJECTS['trophy']}
            alt="Trophy"
            className="drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]"
            style={{ width: 96, height: 96, imageRendering: 'pixelated' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <svg width="96" height="96" viewBox="0 0 80 80" className="drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]">
            <path d="M22 10 h36 v28 C58 52 50 58 40 60 C30 58 22 52 22 38 Z"
              fill="rgba(251,191,36,0.9)" stroke="#d97706" strokeWidth="2" />
            <path d="M22 18 C10 18 10 34 22 34" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            <path d="M58 18 C70 18 70 34 58 34" fill="none" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            <rect x="34" y="60" width="12" height="6" fill="#d97706" rx="1" />
            <rect x="26" y="66" width="28" height="5" fill="#b45309" rx="2" />
            <polygon points="40,20 42,26 48,26 43,30 45,36 40,32 35,36 37,30 32,26 38,26"
              fill="rgba(255,255,255,0.9)" />
            <ellipse cx="30" cy="22" rx="5" ry="3" fill="rgba(255,255,255,0.3)" transform="rotate(-20 30 22)" />
          </svg>
        )}
      </div>

      {/* Title */}
      <div className="text-center relative z-10">
        <h1
          className="font-pixel text-3xl md:text-4xl text-yellow-300 animate-bounce leading-relaxed"
          style={{
            textShadow: '0 0 20px rgba(250,204,21,0.8), 0 0 40px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.2)',
          }}
        >
          PARTY CHAMPION!
        </h1>
      </div>

      {/* Champion showcase */}
      <div className="relative z-10 pixel-card rounded-xl p-6 border-2 border-yellow-400/60 pulse-glow flex flex-col items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(245,158,11,0.08))' }}
      >
        <PlayerAvatar
          name={champion.name}
          color={champion.color}
          size={96}
          isWinning={true}
          avatarUrl={champion.avatarUrl}
        />
        <h2
          className="font-pixel text-2xl text-yellow-300 leading-relaxed"
          style={{ textShadow: '0 0 12px rgba(250,204,21,0.6)' }}
        >
          {champion.name.toUpperCase()}
        </h2>
        <div className="font-pixel-body text-lg text-yellow-400 font-bold">
          {champion.totalPoints} MEDAL POINTS
        </div>
      </div>

      {/* Event breakdown table */}
      <div className="relative z-10 w-full max-w-2xl">
        <h3 className="font-pixel text-sm text-purple-300 mb-3 text-center leading-relaxed">EVENT BREAKDOWN</h3>
        <div className="pixel-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="font-pixel-body text-xs text-white/60 text-left py-2 px-3">EVENT</th>
                <th className="font-pixel-body text-xs text-white/60 text-left py-2 px-3">WINNER</th>
                {players.map(p => (
                  <th key={p.id} className="font-pixel-body text-xs text-white/60 text-center py-2 px-2">
                    <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: p.color, verticalAlign: 'middle' }} />
                    {p.name.length > 6 ? p.name.slice(0, 6) : p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partyResults.map((result, idx) => {
                const winnerId = result.rankings[0]?.playerId
                const winnerPlayer = players.find(p => p.id === winnerId)
                return (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="font-pixel-body text-sm text-white/90 py-2 px-3">
                      {EVENT_NAMES[result.event] ?? result.event}
                    </td>
                    <td className="font-pixel-body text-sm py-2 px-3">
                      <span className="text-yellow-300 font-bold">{winnerPlayer?.name ?? '???'}</span>
                    </td>
                    {players.map(p => {
                      const pts = result.medalPoints[p.id] ?? 0
                      return (
                        <td key={p.id} className="font-pixel-body text-sm text-center py-2 px-2">
                          <span className={pts === 3 ? 'text-yellow-300 font-bold' : pts === 2 ? 'text-gray-300' : pts === 1 ? 'text-amber-600' : 'text-white/30'}>
                            {pts > 0 ? `+${pts}` : '-'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final standings podium */}
      <div className="relative z-10 w-full max-w-2xl">
        <h3 className="font-pixel text-sm text-purple-300 mb-3 text-center leading-relaxed">FINAL STANDINGS</h3>
        <div className="flex gap-4 items-end justify-center">
          {standings.map((player, i) => {
            const isChamp = i === 0
            const podiumHeight = i === 0 ? 80 : i === 1 ? 56 : i === 2 ? 40 : 28

            return (
              <div key={player.id} className="flex flex-col items-center gap-2">
                {/* Place badge */}
                <div className={`pixel-card rounded-lg px-2 py-0.5 ${isChamp ? 'border-yellow-400/50 pulse-glow' : ''}`}>
                  <span className={`font-pixel-body font-bold text-xs ${
                    i === 0 ? 'text-yellow-300' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white/40'
                  }`}>
                    {i < 3 ? PLACE_LABELS[i] : `${i + 1}TH`}
                  </span>
                </div>

                {/* Player card */}
                <div className={`pixel-card rounded-lg p-3 flex flex-col items-center gap-2 ${isChamp ? 'pulse-glow border-yellow-400/60' : 'opacity-75'}`}>
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size={isChamp ? 72 : 52}
                    isWinning={isChamp}
                    isLosing={!isChamp}
                    avatarUrl={player.avatarUrl}
                  />
                  <span className="font-pixel-body font-bold text-xs text-white text-center">{player.name}</span>
                  <span className={`font-pixel-body font-semibold text-xs ${isChamp ? 'text-yellow-300' : 'text-yellow-400/70'}`}>
                    {player.totalPoints} PTS
                  </span>
                </div>

                {/* Podium block */}
                <div
                  className={`w-full border-2 rounded-t-sm min-w-[72px] bg-gradient-to-b ${podiumColors[i] ?? podiumColors[3]}`}
                  style={{ height: podiumHeight }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="relative z-10 flex gap-4 mt-4 pb-8">
        <button
          onClick={handlePlayAgain}
          className="pixel-btn font-pixel py-4 px-8 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded-lg transition-colors"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          PLAY AGAIN
        </button>
        <button
          onClick={handleMenu}
          className="pixel-btn font-pixel py-4 px-8 bg-indigo-700 hover:bg-indigo-600 text-white text-xs rounded-lg transition-colors"
        >
          MENU
        </button>
      </div>
    </div>
  )
}
