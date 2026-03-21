let currentTrack: HTMLAudioElement | null = null
let currentTrackName: string | null = null

const TRACKS: Record<string, string> = {
  menu: '/music/menu.mp3',
  marathon: '/music/marathon.mp3',
  'tug-of-war': '/music/tug-of-war.mp3',
  'tower-climb': '/music/tower-climb.mp3',
  victory: '/music/victory.mp3',
}

export function playMusic(trackName: string, volume = 0.3): void {
  if (currentTrackName === trackName && currentTrack && !currentTrack.paused) return

  stopMusic()

  const src = TRACKS[trackName]
  if (!src) return

  const audio = new Audio(src)
  audio.loop = trackName !== 'victory'
  audio.volume = volume
  audio.play().catch(() => {})
  currentTrack = audio
  currentTrackName = trackName
}

export function stopMusic(): void {
  if (currentTrack) {
    currentTrack.pause()
    currentTrack.currentTime = 0
    currentTrack = null
    currentTrackName = null
  }
}

export function setMusicVolume(volume: number): void {
  if (currentTrack) currentTrack.volume = volume
}
