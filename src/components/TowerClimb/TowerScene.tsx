import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { VoxelTower } from './VoxelTower'
import { Missile } from './Missile'
import { PlayerSprite } from './PlayerSprite'

export interface TowerPlayer {
  id: number
  name: string
  color: string
  blockCount: number
  wobbleIntensity: number
  type: 'human' | 'cpu'
}

export interface MissileData {
  id: string
  fromIndex: number
  toIndex: number
}

interface TowerSceneProps {
  players: TowerPlayer[]
  missiles: MissileData[]
  onMissileImpact: (missileId: string, targetId: number) => void
}

const TOWER_SPACING = 4

function getTowerX(index: number, count: number): number {
  return (index - (count - 1) / 2) * TOWER_SPACING
}

function CameraController({ players }: { players: TowerPlayer[] }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 5, 15))

  useFrame(() => {
    const maxBlocks = Math.max(1, ...players.map((p) => p.blockCount))
    const centerX = 0
    const targetY = Math.max(5, maxBlocks * 0.6 + 2)
    const targetZ = Math.max(15, players.length * 3)

    targetRef.current.set(centerX, targetY, targetZ)
    camera.position.lerp(targetRef.current, 0.02)
    camera.lookAt(0, maxBlocks * 0.4, 0)
  })

  return null
}

function SceneSetup() {
  const { scene } = useThree()
  useMemo(() => {
    scene.background = new THREE.Color('#0a0a2e')
  }, [scene])
  return null
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#1a1a3a" />
    </mesh>
  )
}

function SceneContent({ players, missiles, onMissileImpact }: TowerSceneProps) {
  return (
    <>
      <SceneSetup />
      <CameraController players={players} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      <Ground />

      {/* Towers and player sprites */}
      {players.map((player, index) => {
        const x = getTowerX(index, players.length)
        return (
          <group key={player.id}>
            <VoxelTower
              blockCount={player.blockCount}
              wobbleIntensity={player.wobbleIntensity}
              color={player.color}
              position={[x, 0, 0]}
            />
            <PlayerSprite
              name={player.name}
              color={player.color}
              position={[x, player.blockCount * 1.05 + 1.5, 0]}
            />
          </group>
        )
      })}

      {/* Missiles */}
      {missiles.map((missile) => {
        const fromX = getTowerX(missile.fromIndex, players.length)
        const toX = getTowerX(missile.toIndex, players.length)
        const fromPlayer = players[missile.fromIndex]
        const toPlayer = players[missile.toIndex]
        const fromY = fromPlayer ? fromPlayer.blockCount * 1.05 : 0
        const toY = toPlayer ? toPlayer.blockCount * 1.05 : 0

        return (
          <Missile
            key={missile.id}
            from={[fromX, fromY, 0]}
            to={[toX, toY, 0]}
            onImpact={() => {
              const targetPlayer = players[missile.toIndex]
              if (targetPlayer) {
                onMissileImpact(missile.id, targetPlayer.id)
              }
            }}
          />
        )
      })}
    </>
  )
}

export function TowerScene({ players, missiles, onMissileImpact }: TowerSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent
        players={players}
        missiles={missiles}
        onMissileImpact={onMissileImpact}
      />
    </Canvas>
  )
}
