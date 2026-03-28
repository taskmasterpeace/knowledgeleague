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

/** Synthesized "ding" lock-in confirmation sound via Web Audio API */
function playLockInDing(volume = 0.4): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)

    // Two-tone ding: quick rising pitch
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08)
    osc1.connect(gain)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)

    // Cleanup
    osc1.onended = () => ctx.close()
  } catch {
    // Fallback to select sound
    playSound('select.wav', 0.35)
  }
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
  lockIn: () => playLockInDing(),
}

// Mode-specific sounds
export const marathonSounds = {
  step: () => playSound('marathon/step.wav', 0.4),
  finishLine: () => playSound('marathon/finish-line.wav', 0.7),
}

export const tugSounds = {
  ropePull: () => playSound('tug/rope-pull.wav', 0.5),
  superPull: () => playSound('tug/super-pull.wav', 0.6),
  ropeSnap: () => playSound('tug/rope-snap.wav', 0.7),
}
