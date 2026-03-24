import { useState, useRef, createRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { PLAYER_COLORS } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { AnimatedSprite } from '../shared/AnimatedSprite'
import { fileToDataUrl } from '../../utils/replicate'
import { loadPlayer, savePlayer, clearPlayer } from '../../utils/playerStorage'
import { sounds } from '../../utils/sounds'
import { useSettings } from '../../hooks/useSettings'
import { generatePixelCharacter, hasPixelLabApiKey, setPixelLabApiKey, getPixelLabApiKey } from '../../utils/pixelLabClient'
import { saveCustomCharacter, getCustomCharacter, deleteCustomCharacter } from '../../utils/customCharacters'
import type { PlayerId } from '../../types'
import type { GenerationProgress } from '../../utils/pixelLabClient'

type AvatarMode = 'none' | 'describe'

interface PlayerSetup {
  name: string
  mode: AvatarMode
  description: string
  generating: boolean
  progress: GenerationProgress | null
  error: string | null
  previewFrames: string[]
}

export function AvatarSelect() {
  const { players, setPlayerName, setPlayerColor, setPlayerAvatar, setPhase, playerCount } = useGameState()
  const { soundEnabled } = useSettings()

  const humanPlayers = players.filter(p => p.type === 'human')

  const [apiKeyInput, setApiKeyInput] = useState(getPixelLabApiKey())
  const [showApiKeyInput, setShowApiKeyInput] = useState(!hasPixelLabApiKey())

  const [setups, setSetups] = useState<PlayerSetup[]>(() => {
    return humanPlayers.map((p) => {
      const id = p.id as PlayerId
      const saved = loadPlayer(id)
      const custom = getCustomCharacter(saved?.name || p.name)
      if (saved) {
        if (saved.name) setPlayerName(id, saved.name)
        if (saved.color) setPlayerColor(id, saved.color)
        if (saved.avatarUrl) setPlayerAvatar(id, saved.avatarUrl)
        return {
          name: saved.name || `Player ${id}`,
          mode: 'none' as AvatarMode,
          description: saved.description || '',
          generating: false,
          progress: null,
          error: null,
          previewFrames: custom?.runFrames || (custom?.idle ? [custom.idle] : []),
        }
      }
      return {
        name: p.name,
        mode: 'none' as AvatarMode,
        description: '',
        generating: false,
        progress: null,
        error: null,
        previewFrames: [],
      }
    })
  })

  const [welcomeBack, setWelcomeBack] = useState<Record<number, boolean>>(() => {
    const wb: Record<number, boolean> = {}
    humanPlayers.forEach(p => { wb[p.id] = !!loadPlayer(p.id as PlayerId) })
    return wb
  })

  const updateSetup = (idx: number, patch: Partial<PlayerSetup>) => {
    setSetups(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const handleGenerate = async (idx: number) => {
    const setup = setups[idx]
    const playerId = humanPlayers[idx]?.id as PlayerId
    if (!playerId) return

    if (!hasPixelLabApiKey()) {
      updateSetup(idx, { error: 'Please enter your PixelLab API key first' })
      setShowApiKeyInput(true)
      return
    }

    const description = setup.description.trim()
    if (!description) {
      updateSetup(idx, { error: 'Please describe your character first' })
      return
    }

    updateSetup(idx, { generating: true, error: null, progress: { step: 'starting', detail: 'Starting...' } })

    try {
      const result = await generatePixelCharacter(description, (progress) => {
        updateSetup(idx, { progress })
      })

      // Save the custom character
      saveCustomCharacter({
        name: setup.name || `Player ${playerId}`,
        description,
        idle: result.idle,
        runFrames: result.runFrames,
        south: result.south,
        createdAt: new Date().toISOString(),
      })

      // Set the portrait as avatar for non-pixel-art contexts
      setPlayerAvatar(playerId, result.south || result.idle)

      updateSetup(idx, {
        generating: false,
        progress: null,
        previewFrames: result.runFrames.length > 0 ? result.runFrames : (result.idle ? [result.idle] : []),
      })

      if (soundEnabled) sounds.correct()
    } catch (err) {
      updateSetup(idx, {
        generating: false,
        progress: null,
        error: err instanceof Error ? err.message : 'Generation failed',
      })
    }
  }

  const handleClearPlayer = (idx: number, id: PlayerId) => {
    const setup = setups[idx]
    clearPlayer(id)
    deleteCustomCharacter(setup.name)
    setWelcomeBack(prev => ({ ...prev, [id]: false }))
    setPlayerAvatar(id, '')
    updateSetup(idx, { name: `Player ${id}`, description: '', previewFrames: [] })
    setPlayerName(id, `Player ${id}`)
  }

  const handleSaveApiKey = () => {
    setPixelLabApiKey(apiKeyInput.trim())
    setShowApiKeyInput(false)
  }

  const handleContinue = () => {
    humanPlayers.forEach((p, idx) => {
      const pid = p.id as PlayerId
      const setup = setups[idx]
      setPlayerName(pid, setup.name || `Player ${pid}`)
      savePlayer(pid, {
        name: setup.name || `Player ${pid}`,
        color: p.color,
        avatarUrl: p.avatarUrl,
        description: setup.description,
      })
    })
    setPhase('event-select')
  }

  const anyGenerating = setups.some(s => s.generating)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900 stars-bg screen-enter flex flex-col items-center justify-center gap-6 p-8 relative">
      {/* Back button */}
      <button
        onClick={() => { if (soundEnabled) sounds.navigate(); setPhase('menu') }}
        className="absolute top-6 left-6 pixel-card px-4 py-2 rounded-lg font-pixel text-[8px] text-white/70 hover:text-white hover:scale-105 transition-all"
      >
        BACK
      </button>

      <div className="text-center">
        <h2 className="font-pixel text-2xl text-white text-glow leading-relaxed">CREATE YOUR</h2>
        <h2 className="font-pixel text-2xl text-cyan-300 text-glow leading-relaxed">CHARACTER{humanPlayers.length > 1 ? 'S' : ''}</h2>
      </div>

      {/* API Key Setup */}
      {showApiKeyInput && (
        <div className="pixel-card rounded-lg p-4 max-w-md w-full">
          <p className="text-white/70 text-sm mb-2">Enter your PixelLab API key to generate custom pixel art characters:</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="PixelLab API Key"
              className="flex-1 text-sm bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-500/50 text-white rounded-lg text-sm font-bold transition-all"
            >
              Save
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2">Get a key at pixellab.ai — each character costs ~2 generations</p>
        </div>
      )}

      <div className="flex gap-6 flex-wrap justify-center">
        {humanPlayers.map((player, idx) => {
          const setup = setups[idx]
          if (!setup) return null
          const pid = player.id as PlayerId
          return (
            <div key={player.id} className="flex flex-col items-center gap-3 pixel-card rounded-lg p-6 w-80">
              {/* Character preview */}
              <div className="relative">
                {setup.previewFrames.length > 0 ? (
                  <div className="rounded-xl border-2 border-white/40 bg-black/30 p-2 flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    <AnimatedSprite
                      frames={setup.previewFrames}
                      fps={8}
                      width={96}
                      height={96}
                      alt={setup.name}
                    />
                  </div>
                ) : player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={`${player.name} avatar`}
                    className="w-28 h-28 rounded-xl border-2 border-white/40 object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <PlayerAvatar name={setup.name || `P${player.id}`} color={player.color} size={80} />
                )}
                {setup.generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl gap-2">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    {setup.progress && (
                      <span className="text-white/80 text-[10px] font-pixel text-center px-2">{setup.progress.detail}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Welcome back */}
              {welcomeBack[player.id] && (
                <div className="flex items-center gap-2">
                  <span className="text-green-300 text-sm font-bold">Welcome back, {setup.name}!</span>
                  <button
                    onClick={() => handleClearPlayer(idx, pid)}
                    className="text-white/40 hover:text-red-300 text-xs underline transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Name input */}
              <input
                type="text"
                value={setup.name}
                onChange={(e) => updateSetup(idx, { name: e.target.value })}
                placeholder={`Player ${player.id} name`}
                maxLength={10}
                className="text-center font-pixel text-sm bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-lg px-3 py-2 w-full focus:outline-none focus:border-cyan-400/50"
              />

              {/* Color picker */}
              <div className="flex gap-2 flex-wrap justify-center">
                {PLAYER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPlayerColor(pid, color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${player.color === color ? 'border-white scale-125' : 'border-white/20 hover:scale-110'}`}
                    style={{ backgroundColor: color, opacity: player.color === color ? 1 : 0.6 }}
                  />
                ))}
              </div>

              {/* Describe your character */}
              <button
                onClick={() => updateSetup(idx, { mode: setup.mode === 'describe' ? 'none' : 'describe' })}
                className={`w-full py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  setup.mode === 'describe'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
                }`}
              >
                <span style={{ fontSize: '16px' }}>&#x1F3A8;</span>
                Create Pixel Art Character
              </button>

              {setup.mode === 'describe' && (
                <div className="w-full flex flex-col gap-3">
                  <textarea
                    value={setup.description}
                    onChange={(e) => updateSetup(idx, { description: e.target.value })}
                    placeholder="Describe how you want to look...&#10;&#10;Examples:&#10;- A pink furry monster with big eyes&#10;- A girl with colorful hair beads and a pink shirt&#10;- A blue robot with a jetpack&#10;- A ninja cat with a sword"
                    maxLength={200}
                    rows={4}
                    className="w-full text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400/50 resize-none"
                  />

                  <button
                    onClick={() => handleGenerate(idx)}
                    disabled={setup.generating || !setup.description.trim()}
                    className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 disabled:bg-gray-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all"
                  >
                    {setup.generating ? 'Generating...' : setup.previewFrames.length > 0 ? 'Regenerate Character' : 'Generate Character'}
                  </button>
                </div>
              )}

              {/* Error */}
              {setup.error && (
                <p className="text-red-300 text-xs text-center">{setup.error}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* API key toggle */}
      {!showApiKeyInput && (
        <button
          onClick={() => setShowApiKeyInput(true)}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          {hasPixelLabApiKey() ? 'Change API Key' : 'Set PixelLab API Key'}
        </button>
      )}

      <button
        onClick={() => { if (soundEnabled) sounds.select(); handleContinue() }}
        disabled={anyGenerating}
        className="pixel-btn font-pixel py-4 px-14 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-500/50 text-gray-900 text-sm rounded-lg transition-all hover:scale-105 active:scale-95 mt-2"
      >
        {anyGenerating ? 'GENERATING...' : 'NEXT'}
      </button>
    </div>
  )
}
