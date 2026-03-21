let cachedVoice: SpeechSynthesisVoice | null = null

function getVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  if (!window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  const enUS = voices.filter(v => v.lang.startsWith('en-US'))
  cachedVoice = enUS[0] ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null
  return cachedVoice
}

export function speakLocal(text: string): boolean {
  if (!window.speechSynthesis) return false
  const voice = getVoice()
  if (!voice) return false

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.rate = 1.1
  utterance.volume = 0.7
  window.speechSynthesis.speak(utterance)
  return true
}

export function isAvailable(): boolean {
  return 'speechSynthesis' in window
}

// Preload voices (needed on some browsers)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getVoice() }
}
