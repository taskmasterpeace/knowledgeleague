/**
 * TTS Audio Cache — 3-tier caching for Qwen3 TTS
 *
 * Tier 1: Pre-generated static MP3s shipped with the app (/sounds/announcer/)
 * Tier 2: Name-based lines cached in IndexedDB (generated once per player name)
 * Tier 3: Dynamic lines generated on-demand via Replicate API
 *
 * Flow: check Tier 1 → check Tier 2 → generate Tier 3 → cache to Tier 2
 */

import { duckMusic, unduckMusic } from './backgroundMusic'

const DB_NAME = 'knowledgeLeagueKids-tts'
const DB_VERSION = 1
const STORE_NAME = 'audioCache'

// ─── IndexedDB (Tier 2 Cache) ───────────────────────────────

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

/** Create a stable cache key from text + voice config */
function cacheKey(text: string, voice: string): string {
  return `${voice}:${text.toLowerCase().trim()}`
}

// ─── Tier 1: Static Pre-generated Lines ─────────────────────

/** All lines that can be pre-generated as static MP3 files */
export const STATIC_LINES: Record<string, string[]> = {
  // Correct answers
  correct: [
    'Nice one!', "That's right!", 'Brilliant!', 'Correct!',
    'You got it!', 'Nailed it!', 'Perfect!', 'Way to go!',
  ],
  // Wrong answers
  wrong: [
    'Not quite!', 'Ooh, so close!', 'Almost!', 'Try again next time!',
  ],
  // Game flow
  flow: [
    "It's neck and neck!",
    "Let's do this! Game on!",
    "All answers are in! Let's see the results!",
    'What a game!',
    'Time for some math!',
    'Time for some science!',
    'Time for some reading!',
    'Time for some spelling!',
    'Time for some images!',
  ],
  // Welcome / time of day
  greetings: [
    'Welcome to Knowledge League Kids! Are you ready to play?',
    "Knowledge League Kids! Let's get those brains fired up!",
    "Welcome back to Knowledge League Kids! Who's ready to learn?",
    'Good morning! Rise and shine, brain time!',
    'Morning champion! Ready to learn?',
    "Top of the morning! Let's get those neurons firing!",
    'Good afternoon! Perfect time for a brain workout!',
    "Afternoon brain boost! Let's go!",
    'Hey there! Afternoon knowledge time!',
    "Good evening! Winding down with some brain games?",
    'Evening scholar! One more round?',
    'Good evening! Late night learning is the best!',
    'Burning the midnight oil! Respect!',
    "Night owl mode activated! Let's do this!",
    "Up late learning? That's dedication!",
    'Weekend gaming! No homework, just fun!',
    "It's the weekend! Extra brain power mode!",
    "Weekend warrior! Let's rack up some points!",
  ],
  // Holidays
  holidays: [
    "Happy New Year! Let's start the year smart!",
    "Happy Martin Luther King Jr. Day! Let's dream big today!",
    "Happy Valentine's Day! We love learning!",
    'Happy Presidents Day! Did you know there have been 46 presidents?',
    'Happy Pi Day! 3.14159... How many digits can you remember?',
    "Happy St. Patrick's Day! Feeling lucky today?",
    "Happy April Fools! Don't trust any tricky answers today!",
    "Happy Earth Day! Let's learn about our planet!",
    "Happy Cinco de Mayo! Let's celebrate learning!",
    'Happy Memorial Day! We honor those who served.',
    'Happy Juneteenth! Freedom and knowledge go hand in hand!',
    'Happy 4th of July! Time for some fireworks and brainpower!',
    "Welcome back to school! Let's sharpen those skills!",
    'Happy Labor Day! Hard work pays off — in games too!',
    "Happy Halloween! Don't be scared of these questions!",
    'Happy Veterans Day! Thank you to all who served!',
    "Happy Thanksgiving! We're thankful for big brains!",
    'Happy Hanukkah! Eight nights of learning!',
    'Merry Christmas! The best gift is knowledge!',
    "Happy Kwanzaa! Let's celebrate unity and learning!",
    "Happy New Year's Eve! One last brain workout this year!",
  ],
  // Season facts
  seasons: [
    'Spring is here! Did you know plants grow faster in spring because of more sunlight?',
    'Fun spring fact: baby animals are born in spring because there is more food!',
    'Summer vibes! Did you know the longest day of the year is in June?',
    'Summer fun fact: ice cream was invented in China around 200 BC!',
    'Fall is here! Did you know leaves change color because they stop making chlorophyll?',
    'Autumn fact: squirrels bury thousands of acorns but forget where most of them are!',
    'Winter wonderland! Did you know no two snowflakes are exactly alike?',
    'Winter fact: the coldest temperature ever recorded was minus 128.6 degrees in Antarctica!',
  ],
}

/** Check if a line exists as a pre-generated static file */
function getStaticPath(text: string, voice: string): string | null {
  // Normalize text for matching
  const normalized = text.toLowerCase().trim()

  // Check all static categories
  for (const [_category, lines] of Object.entries(STATIC_LINES)) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().trim() === normalized) {
        // Static file path: /sounds/tts/{voice}/{category}-{index}.mp3
        return `/sounds/tts/${voice}/${_category}-${i}.mp3`
      }
    }
  }
  return null
}

// ─── Tier 3: Qwen3 TTS via Replicate ────────────────────────

interface TTSConfig {
  voice: string
  style?: string // "speak with excitement", "speak slowly and calmly", etc.
}

/** Map our game voice names → Qwen3 preset speaker names */
const VOICE_MAP: Record<string, string> = {
  aiden: 'Aiden',
  dylan: 'Dylan',
  eric: 'Eric',
  ryan: 'Ryan',
  serena: 'Serena',
  vivian: 'Vivian',
  sohee: 'Sohee',
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

async function generateWithQwen3(text: string, config: TTSConfig): Promise<Blob | null> {
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
    })

    if (!response.ok) return null

    const prediction = await response.json()
    const id = prediction.id

    // Poll for result (max 15 seconds)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 500))
      const statusRes = await fetch(`/api/replicate/v1/predictions/${id}`)
      const status = await statusRes.json()

      if (status.status === 'succeeded' && status.output) {
        const audioUrl = typeof status.output === 'string' ? status.output : status.output[0]
        const audioRes = await fetch(audioUrl)
        if (audioRes.ok) return audioRes.blob()
      }

      if (status.status === 'failed') return null
    }
  } catch {
    // TTS generation is non-critical
  }
  return null
}

// ─── Main TTS Function ──────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null

export async function speakTTS(text: string, voice: string, style?: string): Promise<boolean> {
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  const key = cacheKey(text, voice)

  // Tier 1: Check static pre-generated files
  const staticPath = getStaticPath(text, voice)
  if (staticPath) {
    return playAudioFile(staticPath)
  }

  // Tier 2: Check IndexedDB cache
  const cached = await getCached(key)
  if (cached) {
    return playBlob(cached)
  }

  // Tier 3: Generate with Qwen3 TTS, then cache
  const blob = await generateWithQwen3(text, { voice, style })
  if (blob) {
    // Cache for next time (Tier 2)
    await setCached(key, blob)
    return playBlob(blob)
  }

  return false
}

function playAudioFile(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(path)
    audio.volume = 0.75
    currentAudio = audio
    audio.onplay = () => duckMusic()
    audio.onended = () => { unduckMusic(); currentAudio = null; resolve(true) }
    audio.onerror = () => { unduckMusic(); currentAudio = null; resolve(false) }
    audio.play().catch(() => { resolve(false) })
  })
}

function playBlob(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
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
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
    unduckMusic()
  }
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

// ─── Stats ──────────────────────────────────────────────────

export async function getCacheStats(): Promise<{ totalEntries: number; totalSizeBytes: number }> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAllKeys()
      request.onsuccess = () => {
        const keys = request.result
        let totalSize = 0
        let processed = 0
        if (keys.length === 0) { resolve({ totalEntries: 0, totalSizeBytes: 0 }); return }

        for (const key of keys) {
          const getReq = store.get(key)
          getReq.onsuccess = () => {
            if (getReq.result instanceof Blob) totalSize += getReq.result.size
            processed++
            if (processed === keys.length) {
              resolve({ totalEntries: keys.length, totalSizeBytes: totalSize })
            }
          }
          getReq.onerror = () => {
            processed++
            if (processed === keys.length) {
              resolve({ totalEntries: keys.length, totalSizeBytes: totalSize })
            }
          }
        }
      }
      request.onerror = () => resolve({ totalEntries: 0, totalSizeBytes: 0 })
    })
  } catch {
    return { totalEntries: 0, totalSizeBytes: 0 }
  }
}
