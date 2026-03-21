import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlayerSpriteProps {
  name: string
  color: string
  position: [number, number, number]
}

function createTextTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function PlayerSprite({ name, color, position }: PlayerSpriteProps) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const labelRef = useRef<THREE.Mesh>(null)

  const labelTexture = useMemo(() => createTextTexture(name), [name])

  useFrame((_state, _delta, frame) => {
    // In R3F v9 the frame might be an XRFrame; camera is on state
    // Use the _state to get camera quaternion for billboard effect
    const camera = _state.camera
    if (bodyRef.current) {
      bodyRef.current.quaternion.copy(camera.quaternion)
    }
    if (labelRef.current) {
      labelRef.current.quaternion.copy(camera.quaternion)
    }
  })

  return (
    <group position={position}>
      {/* Character body — flat colored plane */}
      <mesh ref={bodyRef} position={[0, 0.75, 0]}>
        <planeGeometry args={[1, 1.5]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>

      {/* Name label below */}
      <mesh ref={labelRef} position={[0, -0.3, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshStandardMaterial
          map={labelTexture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
