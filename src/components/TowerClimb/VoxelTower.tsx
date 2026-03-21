import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'

interface VoxelTowerProps {
  blockCount: number
  wobbleIntensity: number
  color: string
  position: [number, number, number]
}

export function VoxelTower({ blockCount, wobbleIntensity, color, position }: VoxelTowerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const blockRefs = useRef<(THREE.Mesh | null)[]>([])

  const blocks = useMemo(() => {
    return Array.from({ length: blockCount }, (_, i) => i)
  }, [blockCount])

  useFrame((state) => {
    if (wobbleIntensity <= 0) return
    const time = state.clock.getElapsedTime()
    const topStart = Math.max(0, blockCount - 3)
    for (let i = topStart; i < blockCount; i++) {
      const mesh = blockRefs.current[i]
      if (mesh) {
        const distFromTop = blockCount - 1 - i
        const factor = 1 - distFromTop * 0.3
        mesh.rotation.z = Math.sin(time * 3) * wobbleIntensity * 0.05 * factor
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {blocks.map((i) => (
        <mesh
          key={i}
          ref={(el) => { blockRefs.current[i] = el }}
          position={[0, i * 1.05, 0]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}
