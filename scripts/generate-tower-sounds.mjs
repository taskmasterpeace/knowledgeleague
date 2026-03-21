/**
 * Generate retro game sound effects for Tower Climb, Marathon, and Tug of War modes
 * No external dependencies needed
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SAMPLE_RATE = 44100

mkdirSync(join(import.meta.dirname, '..', 'public', 'sounds', 'tower'), { recursive: true })
mkdirSync(join(import.meta.dirname, '..', 'public', 'sounds', 'marathon'), { recursive: true })
mkdirSync(join(import.meta.dirname, '..', 'public', 'sounds', 'tug'), { recursive: true })

function createWav(samples) {
  const numSamples = samples.length
  const byteRate = SAMPLE_RATE * 2 // 16-bit mono
  const blockAlign = 2
  const dataSize = numSamples * 2
  const fileSize = 44 + dataSize

  const buffer = Buffer.alloc(fileSize)
  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(fileSize - 8, 4)
  buffer.write('WAVE', 8)
  // fmt chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // chunk size
  buffer.writeUInt16LE(1, 20)  // PCM
  buffer.writeUInt16LE(1, 22)  // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 30)
  buffer.writeUInt16LE(16, 32) // bits per sample
  // data chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]))
    buffer.writeInt16LE(Math.round(val * 32767), 44 + i * 2)
  }

  return buffer
}

function square(t, freq) {
  return Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1
}

function sine(t, freq) {
  return Math.sin(2 * Math.PI * freq * t)
}

function sawtooth(t, freq) {
  return 2 * (t * freq - Math.floor(t * freq + 0.5))
}

function envelope(t, attack, decay, sustain, release, total) {
  if (t < attack) return t / attack
  if (t < attack + decay) return 1 - (1 - sustain) * (t - attack) / decay
  if (t < total - release) return sustain
  return sustain * (total - t) / release
}

function generateTone(freq, duration, waveform = 'square', volume = 0.3) {
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * duration))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    let val
    switch (waveform) {
      case 'sine': val = sine(t, freq); break
      case 'sawtooth': val = sawtooth(t, freq); break
      default: val = square(t, freq)
    }
    val *= envelope(t, 0.01, 0.05, 0.6, 0.1, duration) * volume
    samples[i] = val
  }
  return samples
}

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const result = new Float64Array(total)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

function silence(duration) {
  return new Float64Array(Math.floor(SAMPLE_RATE * duration))
}

function noise(duration, volume = 0.3) {
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * duration))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = envelope(t, 0.001, 0.05, 0.4, 0.1, duration)
    samples[i] = (Math.random() * 2 - 1) * volume * env
  }
  return samples
}

// === TOWER SOUNDS ===

// block-place: short low thud (sine ~100Hz, 0.1s, quick decay)
const blockPlace = (() => {
  const dur = 0.1
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.005 ? t / 0.005 : Math.exp(-(t - 0.005) * 30)
    samples[i] = sine(t, 100) * env * 0.4
  }
  return samples
})()

// block-crumble: crackle/shatter (noise burst + descending freq, 0.3s)
const blockCrumble = (() => {
  const dur = 0.3
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 8)
    // noise component
    const n = (Math.random() * 2 - 1) * 0.35
    // descending sine component
    const freq = 400 * Math.exp(-t * 6)
    const s = sine(t, freq) * 0.2
    samples[i] = (n + s) * env
  }
  return samples
})()

// tower-creak: creaking (slow freq modulation, 0.4s)
const towerCreak = (() => {
  const dur = 0.4
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = envelope(t, 0.05, 0.1, 0.6, 0.1, dur)
    // frequency modulated low tone - slow wobble
    const baseFreq = 120
    const modFreq = 3
    const freq = baseFreq + 40 * Math.sin(2 * Math.PI * modFreq * t)
    samples[i] = sawtooth(t, freq) * env * 0.25
  }
  return samples
})()

// tower-collapse: crash with debris (noise + descending sweep, 0.5s)
const towerCollapse = (() => {
  const dur = 0.5
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const noiseEnv = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 4)
    const sweepEnv = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 5)
    // heavy noise burst
    const n = (Math.random() * 2 - 1) * 0.5 * noiseEnv
    // descending frequency sweep
    const freq = 300 * Math.exp(-t * 5)
    const s = sine(t, freq) * sweepEnv * 0.3
    // low rumble
    const rumble = sine(t, 60 + 20 * Math.sin(2 * Math.PI * 8 * t)) * 0.15 * noiseEnv
    samples[i] = n + s + rumble
  }
  return samples
})()

// missile-launch: whoosh ascending pitch (sine sweep 200→800Hz, 0.3s)
const missileLaunch = (() => {
  const dur = 0.3
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  let phase = 0
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.02 ? t / 0.02 : Math.min(1, 1 - (t - dur + 0.05) / 0.05)
    // exponential frequency sweep 200→800Hz
    const freq = 200 * Math.pow(4, t / dur)
    phase += (2 * Math.PI * freq) / SAMPLE_RATE
    // mix sine with some noise for whoosh texture
    const s = Math.sin(phase)
    const n = (Math.random() * 2 - 1) * 0.15
    samples[i] = (s * 0.25 + n) * Math.max(0, env)
  }
  return samples
})()

// missile-hit: explosion (noise burst + low boom, 0.4s)
const missileHit = (() => {
  const dur = 0.4
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const noiseEnv = t < 0.005 ? t / 0.005 : Math.exp(-(t - 0.005) * 7)
    const boomEnv = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 5)
    // sharp noise burst
    const n = (Math.random() * 2 - 1) * 0.5 * noiseEnv
    // low boom
    const boom = sine(t, 80) * boomEnv * 0.35
    // mid punch
    const punch = sine(t, 200 * Math.exp(-t * 10)) * boomEnv * 0.2
    samples[i] = n + boom + punch
  }
  return samples
})()

// splash-hit: light impact (quick sine blip, 0.1s)
const splashHit = (() => {
  const dur = 0.1
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.005 ? t / 0.005 : Math.exp(-(t - 0.005) * 25)
    // bright blip + small noise
    const s = sine(t, 800) * 0.2
    const n = (Math.random() * 2 - 1) * 0.15
    samples[i] = (s + n) * env
  }
  return samples
})()

// tower-complete: triumphant chime (ascending arpeggio, 0.5s)
const towerComplete = concat(
  generateTone(523, 0.08, 'square', 0.2),   // C5
  generateTone(659, 0.08, 'square', 0.2),   // E5
  generateTone(784, 0.08, 'square', 0.22),  // G5
  generateTone(1047, 0.12, 'square', 0.25), // C6
  generateTone(1319, 0.14, 'square', 0.2),  // E6
)

// === MARATHON SOUNDS ===

// step: footstep (quick noise click, 0.05s)
const step = (() => {
  const dur = 0.05
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.002 ? t / 0.002 : Math.exp(-(t - 0.002) * 60)
    // sharp noise click with low thud
    const n = (Math.random() * 2 - 1) * 0.35 * env
    const thud = sine(t, 150) * Math.exp(-t * 80) * 0.2
    samples[i] = n + thud
  }
  return samples
})()

// finish-line: crossing finish (bright ascending sweep, 0.3s)
const finishLine = (() => {
  const dur = 0.3
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  let phase = 0
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.01 ? t / 0.01 : Math.max(0, 1 - (t - 0.01) / (dur - 0.01))
    // bright ascending sweep 400→1600Hz
    const freq = 400 * Math.pow(4, t / dur)
    phase += (2 * Math.PI * freq) / SAMPLE_RATE
    samples[i] = Math.sin(phase) * 0.3 * env
  }
  return samples
})()

// === TUG SOUNDS ===

// rope-pull: rope tug (low groan, 0.15s)
const ropePull = (() => {
  const dur = 0.15
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = envelope(t, 0.02, 0.05, 0.4, 0.05, dur)
    // low frequency groan with slight pitch wobble
    const freq = 90 + 15 * Math.sin(2 * Math.PI * 6 * t)
    const s = sawtooth(t, freq) * 0.2
    // texture noise
    const n = (Math.random() * 2 - 1) * 0.08
    samples[i] = (s + n) * env
  }
  return samples
})()

// super-pull: powerful pull (deeper + impact, 0.25s)
const superPull = (() => {
  const dur = 0.25
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 6)
    // deep low groan
    const freq = 70 + 20 * Math.sin(2 * Math.PI * 4 * t)
    const s = sawtooth(t, freq) * 0.25
    // initial impact noise
    const impactEnv = Math.exp(-t * 20)
    const n = (Math.random() * 2 - 1) * 0.3 * impactEnv
    // sub-bass thud
    const sub = sine(t, 50) * Math.exp(-t * 8) * 0.3
    samples[i] = (s + n + sub) * env
  }
  return samples
})()

// rope-snap: snapping sound (sharp noise crack, 0.1s)
const ropeSnap = (() => {
  const dur = 0.1
  const samples = new Float64Array(Math.floor(SAMPLE_RATE * dur))
  for (let i = 0; i < samples.length; i++) {
    const t = i / SAMPLE_RATE
    // sharp transient decay
    const env = t < 0.001 ? t / 0.001 : Math.exp(-(t - 0.001) * 40)
    // noise crack
    const n = (Math.random() * 2 - 1) * 0.5 * env
    // high click
    const click = sine(t, 1200) * Math.exp(-t * 60) * 0.2
    samples[i] = n + click
  }
  return samples
})()

// Write all tower sounds
const towerDir = join(import.meta.dirname, '..', 'public', 'sounds', 'tower')
const towerSounds = {
  'block-place': blockPlace,
  'block-crumble': blockCrumble,
  'tower-creak': towerCreak,
  'tower-collapse': towerCollapse,
  'missile-launch': missileLaunch,
  'missile-hit': missileHit,
  'splash-hit': splashHit,
  'tower-complete': towerComplete,
}

for (const [name, samples] of Object.entries(towerSounds)) {
  const wav = createWav(samples)
  const path = join(towerDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`Generated: ${path} (${(wav.length / 1024).toFixed(1)} KB)`)
}

// Write all marathon sounds
const marathonDir = join(import.meta.dirname, '..', 'public', 'sounds', 'marathon')
const marathonSounds = {
  'step': step,
  'finish-line': finishLine,
}

for (const [name, samples] of Object.entries(marathonSounds)) {
  const wav = createWav(samples)
  const path = join(marathonDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`Generated: ${path} (${(wav.length / 1024).toFixed(1)} KB)`)
}

// Write all tug sounds
const tugDir = join(import.meta.dirname, '..', 'public', 'sounds', 'tug')
const tugSounds = {
  'rope-pull': ropePull,
  'super-pull': superPull,
  'rope-snap': ropeSnap,
}

for (const [name, samples] of Object.entries(tugSounds)) {
  const wav = createWav(samples)
  const path = join(tugDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`Generated: ${path} (${(wav.length / 1024).toFixed(1)} KB)`)
}

console.log('\nDone! All sound effects generated.')
