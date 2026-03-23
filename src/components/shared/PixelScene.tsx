import type { ReactNode, CSSProperties } from 'react'

export interface PixelSceneLayer {
  src: string
  speed: number
  y: number
  height?: number
  repeat?: boolean
  scale?: number
}

export interface PixelSceneProps {
  layers: PixelSceneLayer[]
  cameraX: number
  children?: ReactNode
  height: number
  groundY: number
  className?: string
}

// Pixel-art rendering: 'pixelated' is standard, '-moz-crisp-edges' is the Firefox legacy fallback.
// React only accepts camelCase so we set the vendor prefix via a raw style string on mount.
const PIXEL_ART_CLASS = 'pixel-scene-layer'

// Inject the Firefox fallback once
if (typeof document !== 'undefined' && !document.getElementById('pixel-scene-styles')) {
  const style = document.createElement('style')
  style.id = 'pixel-scene-styles'
  style.textContent = `.${PIXEL_ART_CLASS} { image-rendering: -moz-crisp-edges; image-rendering: pixelated; }`
  document.head.appendChild(style)
}

const pixelRendering: CSSProperties = {
  imageRendering: 'pixelated',
}

export function PixelScene({ layers, cameraX, children, height, groundY, className }: PixelSceneProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        height,
        width: '100%',
      }}
    >
      {layers.map((layer, i) => {
        const scale = layer.scale ?? 2
        const shouldRepeat = layer.repeat ?? true

        const layerStyle: CSSProperties = {
          ...pixelRendering,
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${layer.y}%`,
          height: layer.height != null ? layer.height : '100%',
          backgroundImage: `url(${layer.src})`,
          backgroundRepeat: shouldRepeat ? 'repeat-x' : 'no-repeat',
          backgroundSize: `auto ${scale * 100}%`,
          transform: `translateX(${-cameraX * layer.speed}px)`,
          willChange: 'transform',
          pointerEvents: 'none',
        }

        return <div key={i} className={PIXEL_ART_CLASS} style={layerStyle} />
      })}

      {/* Children container positioned at groundY */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${groundY}%`,
          pointerEvents: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
}
