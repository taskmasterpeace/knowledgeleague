/**
 * Generate retro game sound effects as WAV files using pure Node.js
 * No external dependencies needed
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SAMPLE_RATE = 44100
const outDir = join(import.meta.dirname, '..', 'public', 'sounds')
mkdirSync(outDir, { recursive: true })

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

// === CORRECT: bright ascending arpeggio ===
const correct = concat(
  generateTone(523, 0.08, 'square', 0.25),  // C5
  generateTone(659, 0.08, 'square', 0.25),  // E5
  generateTone(784, 0.12, 'square', 0.3),   // G5
  generateTone(1047, 0.15, 'square', 0.2),  // C6
)

// === WRONG: descending buzz ===
const wrong = concat(
  generateTone(400, 0.1, 'sawtooth', 0.2),
  generateTone(300, 0.1, 'sawtooth', 0.2),
  generateTone(200, 0.2, 'sawtooth', 0.15),
)

// === SELECT: button click pop ===
const select = concat(
  generateTone(880, 0.04, 'square', 0.2),
  generateTone(1100, 0.06, 'square', 0.15),
)

// === NAVIGATE: subtle tick ===
const navigate = generateTone(660, 0.03, 'square', 0.12)

// === TIMER WARN: warning beep ===
const timerWarn = concat(
  generateTone(440, 0.06, 'square', 0.2),
  silence(0.04),
  generateTone(440, 0.06, 'square', 0.2),
)

// === TIMER FINAL: urgent high beep ===
const timerFinal = concat(
  generateTone(880, 0.08, 'square', 0.25),
  silence(0.04),
  generateTone(880, 0.08, 'square', 0.25),
  silence(0.04),
  generateTone(1100, 0.12, 'square', 0.3),
)

// === STREAK: power-up fanfare ===
const streak = concat(
  generateTone(523, 0.06, 'square', 0.2),   // C5
  generateTone(659, 0.06, 'square', 0.2),   // E5
  generateTone(784, 0.06, 'square', 0.2),   // G5
  generateTone(1047, 0.1, 'square', 0.25),  // C6
  generateTone(1319, 0.15, 'square', 0.2),  // E6
)

// === BADGE: unlock jingle ===
const badge = concat(
  generateTone(523, 0.07, 'square', 0.2),
  generateTone(659, 0.07, 'square', 0.2),
  generateTone(784, 0.07, 'square', 0.2),
  generateTone(1047, 0.1, 'square', 0.25),
  silence(0.05),
  generateTone(784, 0.06, 'square', 0.2),
  generateTone(1047, 0.06, 'square', 0.2),
  generateTone(1319, 0.15, 'square', 0.3),
)

// === VICTORY: triumphant fanfare ===
const victory = concat(
  generateTone(392, 0.12, 'square', 0.2),   // G4
  generateTone(523, 0.12, 'square', 0.2),   // C5
  generateTone(659, 0.12, 'square', 0.2),   // E5
  generateTone(784, 0.15, 'square', 0.25),  // G5
  silence(0.05),
  generateTone(659, 0.08, 'square', 0.2),   // E5
  generateTone(784, 0.08, 'square', 0.2),   // G5
  generateTone(1047, 0.3, 'square', 0.3),   // C6
  silence(0.1),
  generateTone(1047, 0.1, 'square', 0.2),   // C6
  generateTone(1319, 0.1, 'square', 0.2),   // E6
  generateTone(1568, 0.4, 'square', 0.25),  // G6
)

// === GAME START: countdown beeps ===
const gameStart = concat(
  generateTone(440, 0.12, 'square', 0.2),
  silence(0.2),
  generateTone(440, 0.12, 'square', 0.2),
  silence(0.2),
  generateTone(440, 0.12, 'square', 0.2),
  silence(0.15),
  generateTone(880, 0.3, 'square', 0.3),
)

// Write all files
const sounds = {
  correct, wrong, select, navigate,
  'timer-warn': timerWarn, 'timer-final': timerFinal,
  streak, badge, victory, 'game-start': gameStart,
}

for (const [name, samples] of Object.entries(sounds)) {
  const wav = createWav(samples)
  const path = join(outDir, `${name}.wav`)
  writeFileSync(path, wav)
  console.log(`Generated: ${path} (${(wav.length / 1024).toFixed(1)} KB)`)
}

console.log('\nDone! All sound effects generated.')
