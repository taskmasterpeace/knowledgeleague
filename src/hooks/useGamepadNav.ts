import { useEffect, useRef, useCallback, useState } from 'react'
import type { ControllerType } from './useGamepad'

/**
 * Gamepad navigation for menu screens.
 * D-pad moves focus, A/Cross selects, B/Circle goes back.
 *
 * Usage:
 *   const { focusIndex } = useGamepadNav({
 *     itemCount: buttons.length,
 *     columns: 2,
 *     onSelect: (i) => handleClick(i),
 *     onBack: () => goBack(),
 *     enabled: true,
 *   })
 *   // Apply `data-nav-focused` or a highlight class to items[focusIndex]
 */

interface UseGamepadNavProps {
  /** Total number of navigable items */
  itemCount: number
  /** Number of columns in the grid layout (1 for vertical list) */
  columns?: number
  /** Called when A/Cross is pressed on the focused item */
  onSelect: (index: number) => void
  /** Called when B/Circle is pressed */
  onBack?: () => void
  /** Whether navigation is active */
  enabled?: boolean
  /** Callback when a controller is detected */
  onControllerChange?: (type: ControllerType) => void
}

// Standard gamepad button indices
const BTN_A = 0        // A / Cross — select
const BTN_B = 1        // B / Circle — back
const DPAD_UP = 12
const DPAD_DOWN = 13
const DPAD_LEFT = 14
const DPAD_RIGHT = 15
const LEFT_STICK_THRESHOLD = 0.5

export function useGamepadNav({
  itemCount,
  columns = 1,
  onSelect,
  onBack,
  enabled = true,
  onControllerChange,
}: UseGamepadNavProps) {
  const [focusIndex, setFocusIndex] = useState(0)
  const prevButtonsRef = useRef<boolean[]>([])
  const prevAxesRef = useRef<number[]>([])
  const rafRef = useRef<number>(0)
  const onSelectRef = useRef(onSelect)
  const onBackRef = useRef(onBack)
  const onControllerRef = useRef(onControllerChange)
  const focusRef = useRef(focusIndex)

  onSelectRef.current = onSelect
  onBackRef.current = onBack
  onControllerRef.current = onControllerChange
  focusRef.current = focusIndex

  // Reset focus when item count changes
  useEffect(() => {
    setFocusIndex(prev => prev >= itemCount ? 0 : prev)
  }, [itemCount])

  const detectControllerType = useCallback((gamepad: Gamepad): ControllerType => {
    const id = gamepad.id.toLowerCase()
    if (id.includes('dualsense') || id.includes('dualshock') || id.includes('054c') ||
        id.includes('playstation') || id.includes('sony')) {
      return 'playstation'
    }
    if (id.includes('xbox') || id.includes('xinput') || id.includes('045e') || id.includes('microsoft')) {
      return 'xbox'
    }
    return 'generic'
  }, [])

  const pollRef = useRef<() => void>(() => {})

  useEffect(() => {
    pollRef.current = () => {
      if (!enabled || itemCount === 0) {
        rafRef.current = requestAnimationFrame(pollRef.current)
        return
      }

      const gamepads = navigator.getGamepads()
      const gp = gamepads[0]

      if (gp) {
        // Report controller type
        if (onControllerRef.current) {
          onControllerRef.current(detectControllerType(gp))
        }

        const prev = prevButtonsRef.current
        const prevAxes = prevAxesRef.current
        const cols = columns

        // Helper: check button just pressed (rising edge)
        const justPressed = (idx: number) =>
          idx < gp.buttons.length && gp.buttons[idx].pressed && !(prev[idx] || false)

        // Helper: check left stick just crossed threshold
        const stickJust = (axis: number, dir: 1 | -1) => {
          if (axis >= gp.axes.length) return false
          const val = gp.axes[axis]
          const prevVal = prevAxes[axis] ?? 0
          return (dir === 1 ? val > LEFT_STICK_THRESHOLD && prevVal <= LEFT_STICK_THRESHOLD
                           : val < -LEFT_STICK_THRESHOLD && prevVal >= -LEFT_STICK_THRESHOLD)
        }

        // Navigation
        const moveUp = justPressed(DPAD_UP) || stickJust(1, -1)
        const moveDown = justPressed(DPAD_DOWN) || stickJust(1, 1)
        const moveLeft = justPressed(DPAD_LEFT) || stickJust(0, -1)
        const moveRight = justPressed(DPAD_RIGHT) || stickJust(0, 1)

        if (moveUp) {
          setFocusIndex(p => {
            const next = p - cols
            return next >= 0 ? next : p
          })
        } else if (moveDown) {
          setFocusIndex(p => {
            const next = p + cols
            return next < itemCount ? next : p
          })
        } else if (moveLeft) {
          setFocusIndex(p => {
            const col = p % cols
            return col > 0 ? p - 1 : p
          })
        } else if (moveRight) {
          setFocusIndex(p => {
            const col = p % cols
            const next = p + 1
            return col < cols - 1 && next < itemCount ? next : p
          })
        }

        // Select (A / Cross)
        if (justPressed(BTN_A)) {
          onSelectRef.current(focusRef.current)
        }

        // Back (B / Circle)
        if (justPressed(BTN_B)) {
          if (onBackRef.current) onBackRef.current()
        }

        // Save state
        prevButtonsRef.current = gp.buttons.map(b => b.pressed)
        prevAxesRef.current = [...gp.axes]
      }

      rafRef.current = requestAnimationFrame(pollRef.current)
    }
  }, [enabled, itemCount, columns, detectControllerType])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(() => pollRef.current())
    return () => cancelAnimationFrame(rafRef.current)
  }, [enabled, itemCount, columns, detectControllerType])

  return { focusIndex, setFocusIndex }
}
