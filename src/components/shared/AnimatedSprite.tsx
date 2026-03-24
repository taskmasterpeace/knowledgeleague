import { useState, useEffect, useRef } from 'react'

interface AnimatedSpriteProps {
  frames: string[]
  fps?: number
  width: number
  height: number
  style?: React.CSSProperties
  className?: string
  alt?: string
}

export function AnimatedSprite({
  frames,
  fps = 8,
  width,
  height,
  style,
  className,
  alt = '',
}: AnimatedSpriteProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (frames.length <= 1) return
    intervalRef.current = setInterval(() => {
      setFrameIndex(i => (i + 1) % frames.length)
    }, 1000 / fps)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [frames.length, fps])

  const src = frames[frameIndex] || frames[0]
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
      style={{
        width,
        height,
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  )
}
