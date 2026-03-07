import { useState, useRef, createRef } from 'react'
import { useGameState } from '../../hooks/useGameState'
import { PLAYER_COLORS } from '../../utils/constants'
import { PlayerAvatar } from '../shared/PlayerAvatar'
import { generateAvatar, fileToDataUrl } from '../../utils/replicate'
import { loadPlayer, savePlayer, clearPlayer } from '../../utils/playerStorage'
import type { PlayerId } from '../../types'

type AvatarMode = 'none' | 'upload' | 'describe'

interface PlayerSetup {
  name: string
  mode: AvatarMode
  description: string
  uploadedImage: string | null
  generating: boolean
  error: string | null
}

export function AvatarSelect() {
  const { players, setPlayerName, setPlayerColor, setPlayerAvatar, setPhase } = useGameState()

  const humanPlayers = players.filter(p => p.type === 'human')
  const fileInputRefs = useRef(humanPlayers.map(() => createRef<HTMLInputElement>()))

  const [setups, setSetups] = useState<PlayerSetup[]>(() => {
    return humanPlayers.map((p) => {
      const id = p.id as PlayerId
      const saved = loadPlayer(id)
      if (saved) {
        if (saved.name) setPlayerName(id, saved.name)
        if (saved.color) setPlayerColor(id, saved.color)
        if (saved.avatarUrl) setPlayerAvatar(id, saved.avatarUrl)
        return {
          name: saved.name || `Player ${id}`,
          mode: 'none' as AvatarMode,
          description: saved.description || '',
          uploadedImage: null,
          generating: false,
          error: null,
        }
      }
      return { name: p.name, mode: 'none' as AvatarMode, description: '', uploadedImage: null, generating: false, error: null }
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

  const handleFileUpload = async (idx: number, file: File) => {
    const dataUrl = await fileToDataUrl(file)
    updateSetup(idx, { uploadedImage: dataUrl, mode: 'upload' })
  }

  const handleGenerate = async (idx: number) => {
    const setup = setups[idx]
    const playerId = humanPlayers[idx]?.id as PlayerId
    if (!playerId) return

    updateSetup(idx, { generating: true, error: null })

    try {
      let prompt = ''
      let inputImage: string | undefined

      if (setup.mode === 'upload' && setup.uploadedImage) {
        prompt = setup.name || `Player ${playerId}`
        inputImage = setup.uploadedImage
      } else if (setup.mode === 'describe' && setup.description.trim()) {
        prompt = setup.description.trim()
      } else {
        prompt = `${setup.name || `Player ${playerId}`}, game character`
      }

      const url = await generateAvatar({ prompt, inputImage })
      setPlayerAvatar(playerId, url)
      updateSetup(idx, { generating: false })
    } catch (err) {
      updateSetup(idx, {
        generating: false,
        error: err instanceof Error ? err.message : 'Generation failed',
      })
    }
  }

  const handleClearPlayer = (idx: number, id: PlayerId) => {
    clearPlayer(id)
    setWelcomeBack(prev => ({ ...prev, [id]: false }))
    setPlayerAvatar(id, '')
    updateSetup(idx, { name: `Player ${id}`, description: '', uploadedImage: null })
    setPlayerName(id, `Player ${id}`)
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
    <div className="min-h-screen bg-gradient-to-b from-teal-500 to-blue-700 flex flex-col items-center justify-center gap-6 p-8">
      <h2 className="text-5xl font-black text-white tracking-tight">CREATE YOUR PLAYER{humanPlayers.length > 1 ? 'S' : ''}</h2>

      <div className="flex gap-6 flex-wrap justify-center">
        {humanPlayers.map((player, idx) => {
          const setup = setups[idx]
          if (!setup) return null
          const pid = player.id as PlayerId
          return (
            <div key={player.id} className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-6 border-2 border-white/20 w-72">
              {/* Avatar preview */}
              <div className="relative">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={`${player.name} avatar`}
                    className="w-24 h-24 rounded-xl border-2 border-white/40 object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <PlayerAvatar name={setup.name || `P${player.id}`} color={player.color} size={70} />
                )}
                {setup.generating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
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
                className="text-center text-xl font-bold bg-white/20 text-white placeholder-white/40 border-2 border-white/30 rounded-xl px-3 py-2 w-full focus:outline-none focus:border-white/60"
              />

              {/* Color picker */}
              <div className="flex gap-2">
                {PLAYER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setPlayerColor(pid, color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${player.color === color ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Avatar mode selector */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => updateSetup(idx, { mode: 'upload' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${setup.mode === 'upload' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  Upload Photo
                </button>
                <button
                  onClick={() => updateSetup(idx, { mode: 'describe' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${setup.mode === 'describe' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                >
                  Describe Me
                </button>
              </div>

              {/* Upload mode */}
              {setup.mode === 'upload' && (
                <div className="w-full flex flex-col gap-2">
                  <input
                    ref={fileInputRefs.current[idx]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(idx, file)
                    }}
                  />
                  <button
                    onClick={() => fileInputRefs.current[idx]?.current?.click()}
                    className="w-full py-2 bg-white/15 hover:bg-white/25 text-white rounded-lg text-sm font-medium transition-all border border-dashed border-white/30"
                  >
                    {setup.uploadedImage ? 'Change Photo' : 'Choose Photo'}
                  </button>
                  {setup.uploadedImage && (
                    <img src={setup.uploadedImage} alt="Upload preview" className="w-16 h-16 rounded-lg object-cover mx-auto border border-white/30" />
                  )}
                </div>
              )}

              {/* Describe mode */}
              {setup.mode === 'describe' && (
                <textarea
                  value={setup.description}
                  onChange={(e) => updateSetup(idx, { description: e.target.value })}
                  placeholder="Describe how you look... e.g. 'A girl with curly brown hair and glasses wearing a blue hoodie'"
                  maxLength={200}
                  rows={3}
                  className="w-full text-sm bg-white/20 text-white placeholder-white/40 border-2 border-white/30 rounded-xl px-3 py-2 focus:outline-none focus:border-white/60 resize-none"
                />
              )}

              {/* Generate button */}
              {setup.mode !== 'none' && (
                <button
                  onClick={() => handleGenerate(idx)}
                  disabled={setup.generating || (setup.mode === 'upload' && !setup.uploadedImage) || (setup.mode === 'describe' && !setup.description.trim())}
                  className="w-full py-2 bg-purple-500 hover:bg-purple-400 disabled:bg-gray-500/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all"
                >
                  {setup.generating ? 'Generating...' : 'Generate Character'}
                </button>
              )}

              {/* Error */}
              {setup.error && (
                <p className="text-red-300 text-xs text-center">{setup.error}</p>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={handleContinue}
        disabled={anyGenerating}
        className="py-4 px-14 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-500/50 text-gray-900 text-3xl font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg mt-2"
      >
        {anyGenerating ? 'GENERATING...' : 'NEXT'}
      </button>
    </div>
  )
}
