import { useState, useEffect, useRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useGamepad } from '../../hooks/useGamepad'
import { usePeerContext } from '../../hooks/usePeerContext'
import { ControllerHint } from '../shared/ControllerButtons'
import { Settings } from '../Settings/Settings'
import { useSettings } from '../../hooks/useSettings'
import { sounds, preloadSounds } from '../../utils/sounds'
import { playMusic } from '../../utils/backgroundMusic'
import { speak } from '../../utils/announcer'
import { MenuScene } from './MenuScene'

const WELCOME_LINES = [
  'Welcome to Knowledge League Kids! Are you ready to play?',
  'Knowledge League Kids! Let\'s get those brains fired up!',
  'Welcome back to Knowledge League Kids! Who\'s ready to learn?',
]

const DID_YOU_KNOW_FACTS = [
  'Did you know? A group of flamingos is called a flamboyance!',
  'Did you know? Honey never spoils. Archaeologists found 3,000 year old honey in Egyptian tombs and it was still good!',
  'Did you know? Octopuses have three hearts and blue blood!',
  'Did you know? The shortest war in history lasted only 38 minutes!',
  'Did you know? A bolt of lightning is five times hotter than the surface of the sun!',
  'Did you know? Bananas are technically berries, but strawberries are not!',
  'Did you know? The human nose can detect over one trillion different scents!',
  'Did you know? There are more stars in the universe than grains of sand on Earth!',
  'Did you know? Sharks have been around longer than trees!',
  'Did you know? An astronaut\'s footprint on the moon can last for millions of years!',
]

export function Menu() {
  const { setPhase, startSinglePlayer, setPlayerCount, controllerType, setControllerType } = useGameState()
  const { setEnabled: setPeerEnabled } = usePeerContext()
  const [showSettings, setShowSettings] = useState(false)
  const { soundEnabled, announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const [currentFact, setCurrentFact] = useState<string | null>(null)
  const [factVisible, setFactVisible] = useState(false)
  const usedFactsRef = useRef(new Set<number>())
  const welcomePlayedRef = useRef(false)

  const announcerConfig = { enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency }

  useEffect(() => {
    playMusic('menu')
  }, [])

  // Welcome announcement on first load
  useEffect(() => {
    if (welcomePlayedRef.current) return
    welcomePlayedRef.current = true

    const timer = setTimeout(() => {
      const line = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)]
      speak({ text: line, priority: 'high' }, announcerConfig, true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Rotating "Did You Know?" facts every 30 seconds, randomly skip some cycles
  useEffect(() => {
    const showFact = () => {
      // ~30% chance to skip this cycle (so it's not every single time)
      if (Math.random() < 0.3) return

      // Pick an unused fact
      const available = DID_YOU_KNOW_FACTS
        .map((f, i) => ({ fact: f, index: i }))
        .filter(({ index }) => !usedFactsRef.current.has(index))

      // Reset if all used
      if (available.length === 0) {
        usedFactsRef.current.clear()
        return
      }

      const pick = available[Math.floor(Math.random() * available.length)]
      usedFactsRef.current.add(pick.index)

      // Show on screen
      setCurrentFact(pick.fact)
      setFactVisible(true)

      // Announce it
      speak({ text: pick.fact, priority: 'normal' }, announcerConfig, true)

      // Fade out after 8 seconds
      setTimeout(() => setFactVisible(false), 8000)
      setTimeout(() => setCurrentFact(null), 9000)
    }

    const interval = setInterval(showFact, 30000)
    return () => clearInterval(interval)
  }, [announcerConfig.enabled, announcerConfig.voice])

  useGamepad({
    onP1Answer: () => {},
    onP2Answer: () => {},
    enabled: false,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-10 p-8 relative">
      <MenuScene />
      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
        className="absolute top-6 right-6 pixel-card w-12 h-12 rounded-lg flex items-center justify-center hover:scale-110 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(150,180,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {/* Logo + Title */}
      <div className="text-center flex flex-col items-center gap-2">
        <img
          src="/logo.png"
          alt="Knowledge League Kids"
          className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]"
        />
        <p className="font-pixel text-xs text-cyan-300/60">Math · Science · Reading</p>
      </div>

      {/* "Did You Know?" fact — inline text, no card/popup */}
      <div className="h-8 flex items-center justify-center max-w-lg w-[90%]">
        {currentFact && (
          <p
            className={`font-pixel text-[8px] text-yellow-300/80 text-center leading-relaxed transition-opacity duration-700 ${
              factVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentFact}
          </p>
        )}
      </div>

      {/* Play buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {/* Local play grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              preloadSounds()
              if (soundEnabled) sounds.select()
              startSinglePlayer()
              setPhase('cpu-select')
            }}
            className="pixel-btn font-pixel py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm rounded-lg transition-colors"
          >
            1 PLAYER
          </button>
          <button
            onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(2); setPhase('avatar-select') }}
            className="pixel-btn font-pixel py-4 bg-green-500 hover:bg-green-400 text-gray-900 text-sm rounded-lg transition-colors"
          >
            2 PLAYERS
          </button>
          <button
            onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(3); setPhase('avatar-select') }}
            className="pixel-btn font-pixel py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 text-sm rounded-lg transition-colors"
          >
            3 PLAYERS
          </button>
          <button
            onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPlayerCount(4); setPhase('avatar-select') }}
            className="pixel-btn font-pixel py-4 bg-orange-500 hover:bg-orange-400 text-gray-900 text-sm rounded-lg transition-colors"
          >
            4 PLAYERS
          </button>
        </div>

        {/* Phone play — full width accent */}
        <button
          onClick={() => {
            preloadSounds()
            if (soundEnabled) sounds.select()
            setPeerEnabled(true)
            setPhase('phone-lobby')
          }}
          className="pixel-btn font-pixel w-full py-4 bg-purple-500 hover:bg-purple-400 text-white text-sm rounded-lg transition-colors"
        >
          PHONE PLAY
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPhase('trophies') }}
            className="pixel-btn font-pixel py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg transition-colors"
          >
            TROPHIES
          </button>
          <button
            onClick={() => { preloadSounds(); if (soundEnabled) sounds.select(); setPhase('leaderboards') }}
            className="pixel-btn font-pixel py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors"
          >
            LEADERBOARDS
          </button>
        </div>
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
