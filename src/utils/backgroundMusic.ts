let currentTrack: HTMLAudioElement | null = null
let currentTrackName: string | null = null
let playlistIndex = 0

// Single tracks
const TRACKS: Record<string, string> = {
  marathon: '/music/marathon.mp3',
  'tug-of-war': '/music/tug-of-war.mp3',
  victory: '/music/victory.mp3',
}

// Shuffle pools — each play picks a random track, then loops it
const SHUFFLE_POOLS: Record<string, string[]> = {
  menu: ['/music/menu.mp3', '/music/menu-vocal-1.mp3', '/music/menu-vocal-2.mp3'],
  lobby: ['/music/lobby-1.mp3', '/music/lobby-2.mp3'],
  stats: ['/music/stats-1.mp3', '/music/stats-2.mp3'],
}

function startAudio(src: string, trackName: string, volume: number, onEnded?: () => void): void {
  const audio = new Audio(src)
  audio.volume = volume
  baseVolume = volume
  if (onEnded) {
    audio.onended = onEnded
  } else {
    audio.loop = trackName !== 'victory'
  }
  audio.play().catch(() => {})
  currentTrack = audio
  currentTrackName = trackName
}

export function playMusic(trackName: string, volume = 0.15): void {
  if (currentTrackName === trackName && currentTrack && !currentTrack.paused) return

  stopMusic()

  // Check shuffle pools first — pick a random track, play sequentially through the rest
  const pool = SHUFFLE_POOLS[trackName]
  if (pool && pool.length > 0) {
    playlistIndex = Math.floor(Math.random() * pool.length)
    const playNext = () => {
      if (currentTrackName !== trackName) return
      playlistIndex = (playlistIndex + 1) % pool.length
      startAudio(pool[playlistIndex], trackName, baseVolume, playNext)
    }
    startAudio(pool[playlistIndex], trackName, volume, playNext)
    return
  }

  // Single track
  const src = TRACKS[trackName]
  if (!src) return
  startAudio(src, trackName, volume)
}

export function stopMusic(): void {
  if (currentTrack) {
    currentTrack.onended = null
    currentTrack.pause()
    currentTrack.currentTime = 0
    currentTrack = null
    currentTrackName = null
  }
}

let baseVolume = 0.15
let muted = false

export function isMusicPlaying(): boolean {
  return currentTrack !== null && !currentTrack.paused
}

export function isMusicMuted(): boolean {
  return muted
}

export function toggleMute(): boolean {
  if (!currentTrack) return muted
  muted = !muted
  currentTrack.volume = muted ? 0 : baseVolume
  return muted
}

export function setMusicVolume(volume: number): void {
  if (currentTrack) currentTrack.volume = volume
}

/** Temporarily lower music for speech, then restore */
export function duckMusic(): void {
  if (currentTrack) {
    baseVolume = currentTrack.volume
    currentTrack.volume = baseVolume * 0.3
  }
}

export function unduckMusic(): void {
  if (currentTrack) {
    currentTrack.volume = baseVolume
  }
}
