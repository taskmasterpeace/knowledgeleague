import { useEffect, useRef, useCallback } from 'react'

export type ControllerType = 'xbox' | 'playstation' | 'generic' | null

interface GamepadState {
  controllerType: ControllerType
  // Face buttons mapped to answer indices 0-3
  // Xbox: A=0, B=1, X=2, Y=3
  // PS: Cross=0, Circle=1, Square=2, Triangle=3
}

function detectControllerType(gamepad: Gamepad): ControllerType {
  const id = gamepad.id.toLowerCase()
  if (id.includes('dualsense') || id.includes('dualshock') || id.includes('054c') ||
      id.includes('playstation') || id.includes('sony') ||
      id.includes('054c:0ce6') || id.includes('054c:09cc')) {
    return 'playstation'
  }
  if (id.includes('xbox') || id.includes('xinput') || id.includes('045e') || id.includes('microsoft')) {
    return 'xbox'
  }
  return 'generic'
}

// Standard gamepad mapping: button indices
// 0 = A/Cross (bottom), 1 = B/Circle (right), 2 = X/Square (left), 3 = Y/Triangle (top)
// 12 = D-pad up, 13 = D-pad down, 14 = D-pad left, 15 = D-pad right
const FACE_BUTTON_MAP: Record<number, number> = {
  0: 0, // A/Cross → choice 0 (top-left)
  2: 1, // X/Square → choice 1 (top-right)
  1: 2, // B/Circle → choice 2 (bottom-left)
  3: 3, // Y/Triangle → choice 3 (bottom-right)
}

const DPAD_MAP: Record<number, number> = {
  12: 0, // Up → choice 0
  15: 1, // Right → choice 1
  14: 2, // Left → choice 2
  13: 3, // Down → choice 3
}

interface UseGamepadProps {
  onP1Answer: (choiceIndex: number) => void
  onP2Answer: (choiceIndex: number) => void
  enabled: boolean
  onControllerChange?: (type: ControllerType) => void
  onPause?: () => void
  vibrationEnabled?: boolean
}

export function useGamepad({ onP1Answer, onP2Answer, enabled, onControllerChange, onPause }: UseGamepadProps) {
  const prevButtonsRef = useRef<Map<number, boolean[]>>(new Map())
  const onP1Ref = useRef(onP1Answer)
  const onP2Ref = useRef(onP2Answer)
  const onControllerRef = useRef(onControllerChange)
  const onPauseRef = useRef(onPause)
  const rafRef = useRef<number>(0)

  onP1Ref.current = onP1Answer
  onP2Ref.current = onP2Answer
  onControllerRef.current = onControllerChange
  onPauseRef.current = onPause

  const poll = useCallback(() => {
    if (!enabled) {
      rafRef.current = requestAnimationFrame(poll)
      return
    }

    const gamepads = navigator.getGamepads()

    for (let gi = 0; gi < gamepads.length; gi++) {
      const gp = gamepads[gi]
      if (!gp) continue

      // Detect controller type on first see
      const type = detectControllerType(gp)
      if (onControllerRef.current) {
        onControllerRef.current(type)
      }

      const prev = prevButtonsRef.current.get(gp.index) || []
      const handler = gi === 0 ? onP1Ref.current : onP2Ref.current

      // Check face buttons and d-pad
      const allMaps = { ...FACE_BUTTON_MAP, ...DPAD_MAP }
      for (const [btnIdx, choiceIdx] of Object.entries(allMaps)) {
        const idx = Number(btnIdx)
        if (idx < gp.buttons.length) {
          const pressed = gp.buttons[idx].pressed
          const wasPressed = prev[idx] || false
          if (pressed && !wasPressed) {
            handler(choiceIdx)
          }
        }
      }

      // Start/Options button (index 9) → pause
      if (gp.buttons[9]?.pressed && !(prev[9] || false)) {
        if (onPauseRef.current) onPauseRef.current()
      }

      // Save current state
      prevButtonsRef.current.set(gp.index, gp.buttons.map(b => b.pressed))
    }

    rafRef.current = requestAnimationFrame(poll)
  }, [enabled])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafRef.current)
  }, [poll])
}

export function vibrateController(durationMs = 200, intensity = 0.5) {
  const gamepads = navigator.getGamepads()
  for (const gp of gamepads) {
    if (!gp?.vibrationActuator) continue
    gp.vibrationActuator.playEffect('dual-rumble', {
      duration: durationMs,
      strongMagnitude: intensity,
      weakMagnitude: intensity * 0.5,
    }).catch(() => {})
  }
}

// Button label configs for different controller types
export const BUTTON_LABELS: Record<Exclude<ControllerType, null>, { labels: string[]; colors: string[] }> = {
  xbox: {
    labels: ['A', 'X', 'B', 'Y'],
    colors: ['#107c10', '#0078d7', '#e81123', '#ffb900'],
  },
  playstation: {
    labels: ['✕', '□', '○', '△'],
    colors: ['#2e6db4', '#d64292', '#e8554e', '#2ea18d'],
  },
  generic: {
    labels: ['1', '2', '3', '4'],
    colors: ['#6b7280', '#6b7280', '#6b7280', '#6b7280'],
  },
}
