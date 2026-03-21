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

export const towerSounds = {
  blockPlace: () => playSound('tower/block-place.wav', 0.5),
  blockCrumble: () => playSound('tower/block-crumble.wav', 0.5),
  towerCreak: () => playSound('tower/tower-creak.wav', 0.5),
  towerCollapse: () => playSound('tower/tower-collapse.wav', 0.6),
  missileLaunch: () => playSound('tower/missile-launch.wav', 0.6),
  missileHit: () => playSound('tower/missile-hit.wav', 0.6),
  splashHit: () => playSound('tower/splash-hit.wav', 0.3),
  towerComplete: () => playSound('tower/tower-complete.wav', 0.7),
}
