import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MissileProps {
  from: [number, number, number]
  to: [number, number, number]
  onImpact: () => void
}

const FLIGHT_DURATION = 1.0
const TRAIL_LENGTH = 6
const ARC_HEIGHT = 4

export function Missile({ from, to, onImpact }: MissileProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [progress, setProgress] = useState(0)
  const [trail, setTrail] = useState<[number, number, number][]>([])
  const startTime = useRef<number | null>(null)
  const impactCalled = useRef(false)

  const getArcPosition = (t: number): [number, number, number] => {
    const x = from[0] + (to[0] - from[0]) * t
    const z = from[2] + (to[2] - from[2]) * t
    const baseY = from[1] + (to[1] - from[1]) * t
    const arcY = ARC_HEIGHT * 4 * t * (1 - t)
    return [x, baseY + arcY, z]
  }

  useEffect(() => {
    return () => {
      startTime.current = null
    }
  }, [])

  useFrame((state) => {
    if (impactCalled.current) return

    if (startTime.current === null) {
      startTime.current = state.clock.getElapsedTime()
    }

    const elapsed = state.clock.getElapsedTime() - startTime.current
    const t = Math.min(elapsed / FLIGHT_DURATION, 1)
    setProgress(t)

    const pos = getArcPosition(t)
    if (meshRef.current) {
      meshRef.current.position.set(pos[0], pos[1], pos[2])
    }

    setTrail((prev) => {
      const next = [...prev, pos]
      if (next.length > TRAIL_LENGTH) next.shift()
      return next
    })

    if (t >= 1 && !impactCalled.current) {
      impactCalled.current = true
      onImpact()
    }
  })

  if (progress >= 1 && impactCalled.current) return null

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={2} />
      </mesh>
      {trail.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.15 * ((i + 1) / TRAIL_LENGTH), 6, 6]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff4400"
            emissiveIntensity={1}
            transparent
            opacity={(i + 1) / TRAIL_LENGTH * 0.6}
          />
        </mesh>
      ))}
    </group>
  )
}
