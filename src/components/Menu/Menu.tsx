import { useState, useEffect } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useGamepad } from '../../hooks/useGamepad'
import { usePeerContext } from '../../hooks/usePeerContext'
import { ControllerHint } from '../shared/ControllerButtons'
import { Settings } from '../Settings/Settings'
import { useSettings } from '../../hooks/useSettings'
import { sounds, preloadSounds } from '../../utils/sounds'
import { playMusic } from '../../utils/backgroundMusic'

export function Menu() {
  const { setPhase, startSinglePlayer, setPlayerCount, controllerType, setControllerType } = useGameState()
  const { setEnabled: setPeerEnabled } = usePeerContext()
  const [showSettings, setShowSettings] = useState(false)
  const { soundEnabled } = useSettings()

  useEffect(() => {
    playMusic('menu')
  }, [])

  useGamepad({
    onP1Answer: () => {},
    onP2Answer: () => {},
    enabled: false,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-10 p-8 relative">
      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 pixel-card w-12 h-12 rounded-lg flex items-center justify-center hover:scale-110 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(150,180,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Title */}
      <div className="text-center flex flex-col items-center gap-3">
        <h1 className="font-pixel text-5xl text-white text-glow leading-tight">
          BRAIN<br />GAMES
        </h1>
        <p className="font-pixel text-xs text-cyan-300/60">Math · Science · Reading</p>

        {/* Pixel brain SVG decoration */}
        <svg width="80" height="80" viewBox="0 0 80 80" className="mt-2 opacity-70">
          <g fill="none" stroke="rgba(147,197,253,0.6)" strokeWidth="2" strokeLinejoin="round">
            {/* Left hemisphere */}
            <path d="M20 40 C20 22 32 14 40 14 C40 14 38 20 36 22 C30 24 26 28 24 34 C22 38 22 44 24 50 C26 56 30 60 36 62 C34 64 32 66 32 68 C28 68 22 64 20 58 C16 52 16 46 20 40Z" fill="rgba(99,102,241,0.2)" />
            {/* Right hemisphere */}
            <path d="M60 40 C60 22 48 14 40 14 C40 14 42 20 44 22 C50 24 54 28 56 34 C58 38 58 44 56 50 C54 56 50 60 44 62 C46 64 48 66 48 68 C52 68 58 64 60 58 C64 52 64 46 60 40Z" fill="rgba(99,102,241,0.2)" />
            {/* Center divider */}
            <line x1="40" y1="14" x2="40" y2="68" strokeDasharray="4 3" stroke="rgba(147,197,253,0.4)" />
            {/* Neural bumps left */}
            <path d="M24 34 C22 30 26 26 30 28" />
            <path d="M22 44 C20 40 24 36 28 38" />
            <path d="M26 54 C24 50 28 46 32 48" />
            {/* Neural bumps right */}
            <path d="M56 34 C58 30 54 26 50 28" />
            <path d="M58 44 C60 40 56 36 52 38" />
            <path d="M54 54 C56 50 52 46 48 48" />
          </g>
          {/* Glow dots */}
          <circle cx="28" cy="32" r="2" fill="rgba(147,197,253,0.5)" />
          <circle cx="52" cy="32" r="2" fill="rgba(147,197,253,0.5)" />
          <circle cx="26" cy="48" r="1.5" fill="rgba(250,204,21,0.5)" />
          <circle cx="54" cy="48" r="1.5" fill="rgba(250,204,21,0.5)" />
        </svg>
      </div>

      {/* Player count buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => {
            preloadSounds()
            if (soundEnabled) sounds.select()
            startSinglePlayer()
            setPhase('cpu-select')
          }}
          className="pixel-btn font-pixel w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm rounded-lg transition-colors"
        >
          1 PLAYER
        </button>
        <button
          onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(2); setPhase('avatar-select') }}
          className="pixel-btn font-pixel w-full py-4 bg-green-500 hover:bg-green-400 text-gray-900 text-sm rounded-lg transition-colors"
        >
          2 PLAYERS
        </button>
        <button
          onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(3); setPhase('avatar-select') }}
          className="pixel-btn font-pixel w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 text-sm rounded-lg transition-colors"
        >
          3 PLAYERS
        </button>
        <button
          onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(4); setPhase('avatar-select') }}
          className="pixel-btn font-pixel w-full py-4 bg-orange-500 hover:bg-orange-400 text-gray-900 text-sm rounded-lg transition-colors"
        >
          4 PLAYERS
        </button>
        <button
          onClick={() => {
            preloadSounds()
            if (soundEnabled) sounds.select()
            setPeerEnabled(true)
            setPhase('phone-lobby')
          }}
          className="pixel-btn font-pixel w-full py-4 bg-purple-500 hover:bg-purple-400 text-white text-sm rounded-lg transition-colors mt-1"
        >
          PHONE PLAY
        </button>
        <button
          onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPhase('trophies') }}
          className="pixel-btn font-pixel w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg transition-colors mt-2"
        >
          TROPHIES
        </button>
        <button
          onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPhase('leaderboards') }}
          className="pixel-btn font-pixel w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
        >
          LEADERBOARDS
        </button>
      </div>

      {/* Footer keyboard hints */}
      <div className="flex flex-col items-center gap-2">
        <div className="font-pixel text-[7px] text-white/30 text-center leading-relaxed">
          P1: 1-2-3-4 &nbsp;|&nbsp; P2: NUMPAD &nbsp;|&nbsp; P3: Q-W-E-R &nbsp;|&nbsp; P4: U-I-O-P
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
