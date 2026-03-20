import type { Subject } from '../types'

export interface AnnouncerLine {
  text: string
  priority: 'high' | 'normal' | 'low'
  pregenId?: string
}

interface AnnouncerConfig {
  enabled: boolean
  voice: string
  frequency: 'chatty' | 'normal' | 'quiet'
}

const RATE_LIMITS: Record<string, number> = {
  chatty: 3000,
  normal: 5000,
  quiet: 10000,
}

let lastSpoken = 0
let currentAudio: HTMLAudioElement | null = null
const recentLines = new Set<string>()

export function speak(line: AnnouncerLine, config: AnnouncerConfig): void {
  if (!config.enabled) return

  const now = Date.now()
  const rateLimit = RATE_LIMITS[config.frequency] || 5000

  // Rate limiting (high priority bypasses)
  if (line.priority !== 'high' && now - lastSpoken < rateLimit) return

  // Quiet mode only plays high priority
  if (config.frequency === 'quiet' && line.priority !== 'high') return

  // Don't repeat same line within 30s
  if (recentLines.has(line.text)) return
  recentLines.add(line.text)
  setTimeout(() => recentLines.delete(line.text), 30000)

  // Stop current audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  lastSpoken = now

  // Try pre-generated file first
  if (line.pregenId) {
    const audio = new Audio(`/sounds/announcer/${config.voice}/${line.pregenId}.mp3`)
    audio.volume = 0.7
    currentAudio = audio
    audio.play().catch(() => {
      // Pre-generated file not found, try dynamic TTS
      generateAndSpeak(line.text, config.voice)
    })
    return
  }

  // Dynamic TTS via Replicate
  generateAndSpeak(line.text, config.voice)
}

async function generateAndSpeak(text: string, voice: string): Promise<void> {
  try {
    // Strip emotion tags for the API call
    const cleanText = text.replace(/\[.*?\]\s*/g, '')

    const response = await fetch('/api/replicate/v1/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: 'inworld/tts-1.5-mini',
        input: {
          text: cleanText,
          speaker: voice,
          output_format: 'mp3',
        },
      }),
    })

    if (!response.ok) return

    const prediction = await response.json()
    const id = prediction.id

    // Poll for result
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300))
      const statusRes = await fetch(`/api/replicate/v1/predictions/${id}`)
      const status = await statusRes.json()

      if (status.status === 'succeeded' && status.output) {
        const audioUrl = typeof status.output === 'string' ? status.output : status.output[0]
        const audio = new Audio(audioUrl)
        audio.volume = 0.7
        currentAudio = audio
        audio.play().catch(() => {})
        return
      }

      if (status.status === 'failed') return
    }
  } catch {
    // Silently fail — announcer is non-critical
  }
}

export function stopAnnouncer(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  recentLines.clear()
}

// Pre-built announcer line generators
export function correctLine(playerName: string, streak: number): AnnouncerLine {
  if (streak >= 5) return { text: `${playerName} is unstoppable! ${streak} in a row!`, priority: 'high' }
  if (streak >= 3) return { text: `${playerName} is on fire!`, priority: 'normal' }
  // Use name ~40% of the time for normal correct answers
  const namedLines = [`Nice one, ${playerName}!`, `Way to go, ${playerName}!`, `${playerName} gets it!`]
  const genericLines = ['Nice one!', "That's right!", 'Brilliant!', 'Correct!']
  const pool = Math.random() < 0.4 ? namedLines : genericLines
  return { text: pool[Math.floor(Math.random() * pool.length)], priority: 'low' }
}

export function wrongLine(playerName: string, hadStreak: boolean): AnnouncerLine {
  if (hadStreak) return { text: `Ooh, ${playerName} breaks the streak!`, priority: 'normal' }
  // Use name ~30% of the time for wrong answers
  const namedLines = [`Tough luck, ${playerName}!`, `Not this time, ${playerName}.`]
  const genericLines = ['Not quite!', 'Ooh, so close!']
  const pool = Math.random() < 0.3 ? namedLines : genericLines
  return { text: pool[Math.floor(Math.random() * pool.length)], priority: 'low' }
}

export function leadChangeLine(playerName: string): AnnouncerLine {
  return { text: `${playerName} takes the lead!`, priority: 'normal' }
}

export function closeRaceLine(): AnnouncerLine {
  return { text: "It's neck and neck!", priority: 'high' }
}

export function subjectChangeLine(subject: Subject): AnnouncerLine {
  const labels = { math: 'math', science: 'science', reading: 'reading' }
  return { text: `Time for some ${labels[subject]}!`, priority: 'low' }
}

export function victoryLine(playerName: string): AnnouncerLine {
  return { text: `And the winner is ${playerName}! What a game!`, priority: 'high' }
}

export function playerJoinLine(playerName: string): AnnouncerLine {
  const lines = [
    `${playerName} has entered the game!`,
    `Welcome, ${playerName}!`,
    `${playerName} is here! Let's go!`,
    `Look who showed up! It's ${playerName}!`,
  ]
  return { text: lines[Math.floor(Math.random() * lines.length)], priority: 'normal' }
}

export function gameStartLine(playerCount: number): AnnouncerLine {
  if (playerCount >= 6) return { text: `${playerCount} players! This is going to be wild!`, priority: 'high' }
  if (playerCount >= 4) return { text: `${playerCount} players ready! Let the games begin!`, priority: 'high' }
  return { text: "Let's do this! Game on!", priority: 'high' }
}
