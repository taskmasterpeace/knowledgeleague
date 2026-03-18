// Lazy-initialize AudioContext (browsers require user gesture)
let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

function playNotes(notes: [number, number][], type: OscillatorType = 'square', volume = 0.12) {
  const c = getCtx()
  let offset = 0
  for (const [freq, dur] of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, c.currentTime + offset)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime + offset)
    osc.stop(c.currentTime + offset + dur)
    offset += dur * 0.8 // slight overlap for melody flow
  }
}

export const sounds = {
  /** Correct answer — happy ascending arpeggio */
  correct() {
    playNotes([
      [523, 0.08],  // C5
      [659, 0.08],  // E5
      [784, 0.12],  // G5
    ], 'square', 0.1)
  },

  /** Wrong answer — descending buzz */
  wrong() {
    playNotes([
      [300, 0.1],
      [200, 0.15],
    ], 'sawtooth', 0.08)
  },

  /** Button/menu select — short boop */
  select() {
    playTone(880, 0.06, 'square', 0.08)
  },

  /** Menu navigate — subtle tick */
  navigate() {
    playTone(660, 0.03, 'square', 0.05)
  },

  /** Timer warning — urgent beep */
  timerWarn() {
    playTone(440, 0.08, 'square', 0.1)
  },

  /** Timer final beep — higher pitch */
  timerFinal() {
    playTone(880, 0.12, 'square', 0.12)
  },

  /** Streak milestone — triumphant fanfare */
  streak() {
    playNotes([
      [523, 0.06],  // C5
      [659, 0.06],  // E5
      [784, 0.06],  // G5
      [1047, 0.15], // C6
    ], 'square', 0.1)
  },

  /** Badge earned — celebration jingle */
  badge() {
    playNotes([
      [523, 0.08],  // C5
      [659, 0.08],  // E5
      [784, 0.08],  // G5
      [1047, 0.1],  // C6
      [784, 0.06],  // G5
      [1047, 0.15], // C6
    ], 'square', 0.12)
  },

  /** Victory — triumphant fanfare */
  victory() {
    playNotes([
      [392, 0.12],  // G4
      [523, 0.12],  // C5
      [659, 0.12],  // E5
      [784, 0.15],  // G5
      [659, 0.08],  // E5
      [784, 0.08],  // G5
      [1047, 0.25], // C6
    ], 'square', 0.12)
  },

  /** Game start — countdown beep */
  gameStart() {
    playNotes([
      [440, 0.15],  // A4
      [440, 0.15],  // A4
      [440, 0.15],  // A4
      [880, 0.3],   // A5
    ], 'square', 0.1)
  },
}
