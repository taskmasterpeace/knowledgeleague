import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { useGamepadNav } from '../../hooks/useGamepadNav'
import { usePeerContext } from '../../hooks/usePeerContext'
import { ControllerHint } from '../shared/ControllerButtons'
import { Settings } from '../Settings/Settings'
import { useSettings } from '../../hooks/useSettings'
import { sounds, preloadSounds } from '../../utils/sounds'
import { playMusic, toggleMute, isMusicMuted } from '../../utils/backgroundMusic'
import { speak } from '../../utils/announcer'
import { getGameContext, getContextualGreeting, getContextualFact } from '../../utils/contextEngine'
import { MenuScene } from './MenuScene'

const WELCOME_FALLBACKS = [
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
  const { setPhase, startSinglePlayer, setPlayerCount, controllerType, setControllerType, siteCode, setSiteCode } = useGameState()
  const { setEnabled: setPeerEnabled } = usePeerContext()
  const [showSettings, setShowSettings] = useState(false)
  const [showSiteCodeInput, setShowSiteCodeInput] = useState(false)
  const [siteCodeDraft, setSiteCodeDraft] = useState('')
  const { soundEnabled, announcerEnabled, announcerVoice, announcerFrequency } = useSettings()
  const [currentFact, setCurrentFact] = useState<string | null>(null)
  const [factVisible, setFactVisible] = useState(false)
  const [musicMuted, setMusicMuted] = useState(isMusicMuted())
  const usedFactsRef = useRef(new Set<number>())
  const welcomePlayedRef = useRef(false)
  const musicStartedRef = useRef(false)

  const announcerConfig = { enabled: announcerEnabled, voice: announcerVoice, frequency: announcerFrequency }

  // Music — try immediately, then retry on any user interaction until it plays
  useEffect(() => {
    const tryPlay = () => {
      if (musicStartedRef.current) return
      playMusic('menu')
      // Check after a tick if it actually started
      setTimeout(() => {
        musicStartedRef.current = true
        // Clean up listeners once started
        document.removeEventListener('click', tryPlay, true)
        document.removeEventListener('touchstart', tryPlay, true)
        document.removeEventListener('keydown', tryPlay, true)
        document.removeEventListener('pointerdown', tryPlay, true)
      }, 100)
    }
    // Try immediately
    tryPlay()
    // Also listen on every interaction type (capture phase for reliability)
    document.addEventListener('click', tryPlay, true)
    document.addEventListener('touchstart', tryPlay, true)
    document.addEventListener('keydown', tryPlay, true)
    document.addEventListener('pointerdown', tryPlay, true)
    return () => {
      document.removeEventListener('click', tryPlay, true)
      document.removeEventListener('touchstart', tryPlay, true)
      document.removeEventListener('keydown', tryPlay, true)
      document.removeEventListener('pointerdown', tryPlay, true)
    }
  }, [])

  // Welcome announcement on first load
  useEffect(() => {
    if (welcomePlayedRef.current) return
    welcomePlayedRef.current = true

    const timer = setTimeout(() => {
      const ctx = getGameContext()
      // Try contextual greeting first (holiday, time of day, etc.)
      const contextLine = getContextualGreeting(ctx)
      const line = contextLine || WELCOME_FALLBACKS[Math.floor(Math.random() * WELCOME_FALLBACKS.length)]
      speak({ text: line, priority: 'high' }, announcerConfig)
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

      // Sometimes swap in a contextual fact (season, performance, etc.)
      const factText = Math.random() < 0.3
        ? getContextualFact(getGameContext())
        : pick.fact

      // Announce it
      speak({ text: factText, priority: 'normal' }, announcerConfig)

      // Fade out after 8 seconds
      setTimeout(() => setFactVisible(false), 8000)
      setTimeout(() => setCurrentFact(null), 9000)
    }

    const interval = setInterval(showFact, 30000)
    return () => clearInterval(interval)
  }, [announcerConfig.enabled, announcerConfig.voice])

  // Menu items: 0=1P, 1=2P, 2=3P, 3=4P, 4=Phone, 5=Daily, 6=Trophies, 7=Leaderboards, 8=Settings
  const menuActions = useCallback((index: number) => {
    preloadSounds()
    if (soundEnabled) sounds.select()
    switch (index) {
      case 0: startSinglePlayer(); setPhase('cpu-select'); break
      case 1: setPlayerCount(2); setPhase('avatar-select'); break
      case 2: setPlayerCount(3); setPhase('avatar-select'); break
      case 3: setPlayerCount(4); setPhase('avatar-select'); break
      case 4: setPeerEnabled(true); setPhase('phone-lobby'); break
      case 5: setPhase('daily-challenge'); break
      case 6: setPhase('trophies'); break
      case 7: setPhase('leaderboards'); break
      case 8: setShowSettings(true); break
    }
  }, [soundEnabled, startSinglePlayer, setPhase, setPlayerCount, setPeerEnabled])

  const { focusIndex } = useGamepadNav({
    itemCount: 9,
    columns: 2,
    onSelect: menuActions,
    enabled: !showSettings,
    onControllerChange: setControllerType,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-10 p-8 relative overflow-hidden">
      <MenuScene />

      {/* Top bar — mute + settings */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {/* Mute / unmute music */}
        <button
          onClick={() => { setMusicMuted(toggleMute()) }}
          aria-label={musicMuted ? 'Unmute music' : 'Mute music'}
          className="pixel-card w-12 h-12 rounded-lg flex items-center justify-center hover:scale-110 transition-all"
        >
          {musicMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(150,180,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
        {/* Settings gear */}
        <button
          onClick={() => menuActions(8)}
          aria-label="Settings"
          className={`pixel-card w-12 h-12 rounded-lg flex items-center justify-center hover:scale-110 transition-all ${focusIndex === 8 ? 'gamepad-focus' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(150,180,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      {/* Logo + Title */}
      <div className="text-center flex flex-col items-center gap-2 relative z-10">
        <img
          src="/logo.png"
          alt="Knowledge League Kids"
          className="w-72 h-72 object-contain drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]"
        />
        <p className="font-pixel-body font-semibold text-sm text-cyan-300/60">Math · Science · Reading · Images</p>
      </div>

      {/* "Did You Know?" fact — inline text, no card/popup */}
      <div className="h-8 flex items-center justify-center max-w-lg w-[90%] relative z-10">
        {currentFact && (
          <p
            className={`font-pixel-body font-semibold text-sm text-yellow-300/80 text-center leading-relaxed transition-opacity duration-700 ${
              factVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {currentFact}
          </p>
        )}
      </div>

      {/* Play buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm relative z-10">
        {/* Local play grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => menuActions(0)}
            className={`pixel-btn font-pixel py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm rounded-lg transition-colors ${focusIndex === 0 ? 'gamepad-focus' : ''}`}
          >
            1 PLAYER
          </button>
          <button
            onClick={() => menuActions(1)}
            className={`pixel-btn font-pixel py-4 bg-green-500 hover:bg-green-400 text-gray-900 text-sm rounded-lg transition-colors ${focusIndex === 1 ? 'gamepad-focus' : ''}`}
          >
            2 PLAYERS
          </button>
          <button
            onClick={() => menuActions(2)}
            className={`pixel-btn font-pixel py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 text-sm rounded-lg transition-colors ${focusIndex === 2 ? 'gamepad-focus' : ''}`}
          >
            3 PLAYERS
          </button>
          <button
            onClick={() => menuActions(3)}
            className={`pixel-btn font-pixel py-4 bg-orange-500 hover:bg-orange-400 text-gray-900 text-sm rounded-lg transition-colors ${focusIndex === 3 ? 'gamepad-focus' : ''}`}
          >
            4 PLAYERS
          </button>
        </div>

        {/* Phone play — full width accent */}
        <button
          onClick={() => menuActions(4)}
          className={`pixel-btn font-pixel w-full py-4 bg-purple-500 hover:bg-purple-400 text-white text-sm rounded-lg transition-colors ${focusIndex === 4 ? 'gamepad-focus' : ''}`}
        >
          PHONE PLAY
        </button>

        {/* Daily Challenge — full width */}
        <button
          onClick={() => menuActions(5)}
          className={`pixel-btn font-pixel w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm rounded-lg transition-colors ${focusIndex === 5 ? 'gamepad-focus' : ''}`}
        >
          DAILY CHALLENGE
        </button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={() => menuActions(6)}
            className={`pixel-btn font-pixel py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg transition-colors ${focusIndex === 6 ? 'gamepad-focus' : ''}`}
          >
            TROPHIES
          </button>
          <button
            onClick={() => menuActions(7)}
            className={`pixel-btn font-pixel py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors ${focusIndex === 7 ? 'gamepad-focus' : ''}`}
          >
            LEADERBOARDS
          </button>
        </div>
      </div>

      {/* Site Code */}
      <div className="flex flex-col items-center gap-2 relative z-10">
        {siteCode ? (
          <div className="pixel-card flex items-center gap-4 px-5 py-3 rounded-lg" style={{ borderColor: 'rgba(34,211,238,0.5)', boxShadow: '0 0 15px rgba(34,211,238,0.15)' }}>
            <div className="flex flex-col items-center">
              <span className="font-pixel text-[8px] text-cyan-300/70 tracking-wider">SITE CODE</span>
              <span className="font-pixel text-base text-cyan-300 tracking-widest" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>{siteCode}</span>
            </div>
            <button
              onClick={() => setSiteCode(null)}
              className="font-pixel-body font-bold text-sm text-red-400 hover:text-red-300 border-2 border-red-400/50 hover:border-red-400 rounded px-3 py-1.5 transition-colors"
            >
              CLEAR
            </button>
          </div>
        ) : showSiteCodeInput ? (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={siteCodeDraft}
              onChange={(e) => setSiteCodeDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && siteCodeDraft.trim()) {
                  setSiteCode(siteCodeDraft.trim())
                  setShowSiteCodeInput(false)
                  setSiteCodeDraft('')
                }
                if (e.key === 'Escape') {
                  setShowSiteCodeInput(false)
                  setSiteCodeDraft('')
                }
              }}
              placeholder="ENTER CODE"
              maxLength={20}
              autoFocus
              className="font-pixel text-sm text-center text-cyan-300 bg-white/10 border-2 border-cyan-400/50 focus:border-cyan-400 rounded-lg px-4 py-2.5 w-52 outline-none tracking-widest placeholder:text-white/30 placeholder:text-[9px] placeholder:tracking-normal"
              style={{ boxShadow: '0 0 10px rgba(34,211,238,0.1)' }}
            />
            <button
              onClick={() => { setShowSiteCodeInput(false); setSiteCodeDraft('') }}
              className="font-pixel-body font-bold text-sm text-white/60 hover:text-white transition-colors"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSiteCodeInput(true)}
            className="pixel-btn font-pixel py-3 px-6 bg-cyan-900/60 hover:bg-cyan-800/70 text-cyan-300 text-[9px] rounded-lg border-2 border-cyan-500/40 hover:border-cyan-400/60 transition-all"
            style={{ boxShadow: '0 0 10px rgba(34,211,238,0.1)' }}
          >
            ENTER SITE CODE
          </button>
        )}
      </div>

      {/* Footer keyboard hints */}
      <div className="flex flex-col items-center gap-2 relative z-10">
        <div className="font-pixel-body font-semibold text-xs text-white/30 text-center leading-relaxed">
          P1: 1-2-3-4 &nbsp;|&nbsp; P2: NUMPAD &nbsp;|&nbsp; P3: Q-W-E-R &nbsp;|&nbsp; P4: U-I-O-P
        </div>
        <ControllerHint controllerType={controllerType} />
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
