/**
 * TTS Audio Cache — 2-tier caching for Qwen3 TTS
 *
 * Tier 1: Lines cached in IndexedDB (persists across sessions)
 * Tier 2: Dynamic lines generated on-demand via Replicate Qwen3 TTS API
 *
 * Flow: check IndexedDB → generate via API → cache to IndexedDB
 */

import { duckMusic, unduckMusic } from './backgroundMusic'

const DB_NAME = 'knowledgeLeagueKids-tts'
const DB_VERSION = 1
const STORE_NAME = 'audioCache'

// ─── IndexedDB Cache ────────────────────────────────────────

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function getCached(key: string): Promise<Blob | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function setCached(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(blob, key)
  } catch {
    // Cache write failures are non-critical
  }
}

// ─── Cache Key Generation ───────────────────────────────────

function cacheKey(text: string, voice: string): string {
  return `${voice}:${text.toLowerCase().trim()}`
}

// ─── Qwen3 TTS via Replicate ────────────────────────────────

interface TTSConfig {
  voice: string
  style?: string
}

/** Map our game voice names → Qwen3 preset speaker names */
const VOICE_MAP: Record<string, string> = {
  aiden: 'Aiden',
  dylan: 'Dylan',
  eric: 'Eric',
  ryan: 'Ryan',
  serena: 'Serena',
  vivian: 'Vivian',
  // Legacy names → map to closest Qwen3 speaker
  alex: 'Aiden',
  ashley: 'Serena',
  dennis: 'Eric',
  darlene: 'Vivian',
}

/** Available Qwen3 speakers for the settings UI */
export const AVAILABLE_VOICES = [
  { id: 'aiden', label: 'Aiden', description: 'Warm & enthusiastic' },
  { id: 'dylan', label: 'Dylan', description: 'Friendly & upbeat' },
  { id: 'eric', label: 'Eric', description: 'Deep & confident' },
  { id: 'ryan', label: 'Ryan', description: 'Energetic & fun' },
  { id: 'serena', label: 'Serena', description: 'Bright & cheerful' },
  { id: 'vivian', label: 'Vivian', description: 'Gentle & warm' },
] as const

/** Default style instruction for a kids game announcer */
const DEFAULT_STYLE = 'Speak with enthusiasm and energy, like a fun kids game show host. Be encouraging and upbeat.'

async function generateWithQwen3(text: string, config: TTSConfig, signal?: AbortSignal): Promise<Blob | null> {
  try {
    const speaker = VOICE_MAP[config.voice] || 'Aiden'
    const styleInstruction = config.style || DEFAULT_STYLE

    const response = await fetch('/api/replicate/v1/models/qwen/qwen3-tts/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          text,
          mode: 'custom_voice',
          speaker,
          language: 'English',
          style_instruction: styleInstruction,
        },
      }),
      signal,
    })

    if (!response.ok) return null

    const prediction = await response.json()
    const id = prediction.id

    // Poll for result (max 15 seconds)
    for (let i = 0; i < 30; i++) {
      if (signal?.aborted) return null
      await new Promise(r => setTimeout(r, 500))
      if (signal?.aborted) return null

      const statusRes = await fetch(`/api/replicate/v1/predictions/${id}`, { signal })
      const status = await statusRes.json()

      if (status.status === 'succeeded' && status.output) {
        const audioUrl = typeof status.output === 'string'
          ? status.output
          : Array.isArray(status.output) ? status.output[0] : null
        if (!audioUrl || typeof audioUrl !== 'string') return null
        const audioRes = await fetch(audioUrl, { signal })
        if (audioRes.ok) return audioRes.blob()
      }

      if (status.status === 'failed') return null
    }
  } catch (e) {
    // AbortError is expected when a newer speak() call cancels us
    if (e instanceof DOMException && e.name === 'AbortError') return null
    // Other errors are non-critical
  }
  return null
}

// ─── Playback State ─────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null
let currentAbort: AbortController | null = null

// Monotonically increasing ID — each speakTTS call gets one.
// If a newer call starts, older calls check this and bail out
// before playing audio, preventing overlap.
let speakGeneration = 0

export async function speakTTS(text: string, voice: string, style?: string): Promise<boolean> {
  // Cancel any in-flight API requests from previous speak calls
  if (currentAbort) {
    currentAbort.abort()
    currentAbort = null
  }

  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
    unduckMusic()
  }

  // Claim a new generation — older async chains will see they're stale
  const myGeneration = ++speakGeneration
  const abort = new AbortController()
  currentAbort = abort

  const key = cacheKey(text, voice)

  // Tier 1: Check IndexedDB cache
  const cached = await getCached(key)
  if (myGeneration !== speakGeneration) return false // preempted
  if (cached) {
    currentAbort = null
    return playBlob(cached, myGeneration)
  }

  // Tier 2: Generate with Qwen3 TTS, then cache
  const blob = await generateWithQwen3(text, { voice, style }, abort.signal)
  if (myGeneration !== speakGeneration) return false // preempted
  if (blob) {
    await setCached(key, blob)
    if (myGeneration !== speakGeneration) return false // preempted
    currentAbort = null
    return playBlob(blob, myGeneration)
  }

  currentAbort = null
  return false
}

function playBlob(blob: Blob, generation: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Final preemption check right before playing
    if (generation !== speakGeneration) { resolve(false); return }

    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.volume = 0.75
    currentAudio = audio
    audio.onplay = () => duckMusic()
    audio.onended = () => { unduckMusic(); URL.revokeObjectURL(url); currentAudio = null; resolve(true) }
    audio.onerror = () => { unduckMusic(); URL.revokeObjectURL(url); currentAudio = null; resolve(false) }
    audio.play().catch(() => { URL.revokeObjectURL(url); resolve(false) })
  })
}

export function stopTTS(): void {
  // Cancel in-flight API requests
  if (currentAbort) {
    currentAbort.abort()
    currentAbort = null
  }
  // Bump generation so any pending async chains bail out
  speakGeneration++

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
    unduckMusic()
  }
}

/** Check if TTS is currently playing audio */
export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused
}

// ─── Pre-warm Cache ─────────────────────────────────────────

/**
 * Pre-generate and cache name-based lines for a player.
 * Call this when a player name is entered (e.g., avatar select screen).
 * Generates in background — doesn't block gameplay.
 */
export async function prewarmPlayerCache(playerName: string, voice: string): Promise<void> {
  const nameLines = [
    `Nice one, ${playerName}!`,
    `Way to go, ${playerName}!`,
    `${playerName} gets it!`,
    `${playerName} is on fire!`,
    `Tough luck, ${playerName}!`,
    `Not this time, ${playerName}.`,
    `${playerName} takes the lead!`,
    `And the winner is ${playerName}! What a game!`,
    `Welcome back, ${playerName}!`,
    `${playerName} has entered the game!`,
    `Welcome, ${playerName}!`,
    `${playerName} locks it in first!`,
    `First answer is in from ${playerName}!`,
    `${playerName} is quick!`,
  ]

  // Check which lines aren't cached yet
  const uncached: string[] = []
  for (const line of nameLines) {
    const key = cacheKey(line, voice)
    const existing = await getCached(key)
    if (!existing) uncached.push(line)
  }

  if (uncached.length === 0) return

  // Generate uncached lines (one at a time to avoid rate limits)
  for (const line of uncached) {
    const blob = await generateWithQwen3(line, { voice })
    if (blob) {
      await setCached(cacheKey(line, voice), blob)
    }
    // Small delay between generations to be respectful
    await new Promise(r => setTimeout(r, 1000))
  }
}
