const audioCache = new Map<string, HTMLAudioElement>()

function playSound(file: string, volume = 0.5): void {
  let audio = audioCache.get(file)
  if (!audio) {
    audio = new Audio(`/sounds/${file}`)
    audioCache.set(file, audio)
  }
  audio.volume = volume
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Preload all sounds on first user interaction
let preloaded = false
export function preloadSounds(): void {
  if (preloaded) return
  preloaded = true
  const files = [
    'correct.wav', 'wrong.wav', 'select.wav', 'navigate.wav',
    'timer-warn.wav', 'timer-final.wav', 'streak.wav', 'badge.wav',
    'victory.wav', 'game-start.wav',
  ]
  for (const file of files) {
    const audio = new Audio(`/sounds/${file}`)
    audio.preload = 'auto'
    audioCache.set(file, audio)
  }
}

export const sounds = {
  correct: () => playSound('correct.wav', 0.6),
  wrong: () => playSound('wrong.wav', 0.5),
  select: () => playSound('select.wav', 0.4),
  navigate: () => playSound('navigate.wav', 0.3),
  timerWarn: () => playSound('timer-warn.wav', 0.5),
  timerFinal: () => playSound('timer-final.wav', 0.6),
  streak: () => playSound('streak.wav', 0.6),
  badge: () => playSound('badge.wav', 0.7),
  victory: () => playSound('victory.wav', 0.7),
  gameStart: () => playSound('game-start.wav', 0.6),
}
