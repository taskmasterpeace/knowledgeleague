import { duckMusic, unduckMusic } from './backgroundMusic'

let cachedVoice: SpeechSynthesisVoice | null = null

// Preferred voices in priority order — friendlier, more natural-sounding for kids
// Windows 11 has "Online (Natural)" voices in Edge, plus OneCore voices
// Chrome has high-quality Google voices
// macOS has quality built-in voices
const PREFERRED_VOICES = [
  // Chrome — best quality on any OS
  'Google US English',
  'Google UK English Female',
  // Windows 11 Edge neural voices (Natural series — very good)
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny Online (Natural)',
  'Microsoft Guy Online (Natural)',
  'Microsoft Ana Online (Natural)',
  // Windows Edge "Online" voices (older but still decent)
  'Microsoft Aria Online',
  'Microsoft Jenny Online',
  'Microsoft Guy Online',
  // macOS — quality built-in voices
  'Samantha',
  'Karen',
  'Daniel',
  'Alex',
  // Windows OneCore voices (Windows 10/11 — better than desktop voices)
  'Microsoft Zira',
  'Microsoft Mark',
]

// Voices to explicitly avoid — these sound flat/robotic
const AVOID_VOICES = [
  'Microsoft David',       // Very robotic male
  'Microsoft Hazel',       // Robotic British
  'eSpeak',                // Extremely robotic
  'espeak',
]

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  if (!window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Try preferred voices first (in priority order)
  for (const name of PREFERRED_VOICES) {
    const match = voices.find(v => v.name.includes(name))
    if (match) { cachedVoice = match; return cachedVoice }
  }

  // Fallback: prefer any en-US voice, skip avoided voices
  const isAvoided = (v: SpeechSynthesisVoice) =>
    AVOID_VOICES.some(bad => v.name.toLowerCase().includes(bad.toLowerCase()))

  const enUS = voices.filter(v => v.lang.startsWith('en-US') && !isAvoided(v))
  const enAny = voices.filter(v => v.lang.startsWith('en') && !isAvoided(v))
  const anyVoice = voices.filter(v => !isAvoided(v))

  cachedVoice = enUS[0] ?? enAny[0] ?? anyVoice[0] ?? voices[0] ?? null
  return cachedVoice
}

/** Get the name of the current TTS voice (for debugging / display) */
export function getVoiceName(): string {
  const voice = getVoice()
  return voice?.name ?? 'none'
}

export function speakLocal(text: string): boolean {
  if (!window.speechSynthesis) return false
  const voice = getVoice()
  if (!voice) return false

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice

  // Tune for a more natural, kid-friendly sound
  // Slight pitch up (1.05) sounds warmer and more engaging for kids
  // Rate 1.05 is slightly faster than normal but not rushed
  utterance.pitch = 1.05
  utterance.rate = 1.05
  utterance.volume = 0.75

  utterance.onstart = () => duckMusic()
  utterance.onend = () => unduckMusic()
  utterance.onerror = () => unduckMusic()
  window.speechSynthesis.speak(utterance)
  return true
}

export function isAvailable(): boolean {
  return 'speechSynthesis' in window
}

// Preload voices (needed on some browsers — voices load async)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Initial load attempt
  window.speechSynthesis.getVoices()
  // Listen for async voice loading
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getVoice() }
}
