import { useMemo, type CSSProperties } from 'react'
import { buildPixelShadow, getSpriteSize, type SpriteDef } from '../lib/pixelArt'

type PixelSpriteProps = {
  sprite: SpriteDef
  /** Pixel size of one cell, in CSS pixels. */
  scale?: number
  /** Optional aria-label for screen readers. Sprites are decorative by default. */
  label?: string
  className?: string
  style?: CSSProperties
}

/**
 * Renders a CSS pixel-art sprite via a single 1x1 anchor element + a long
 * `box-shadow` string. The wrapper sizes itself to the full grid so layout works
 * naturally; the inner anchor sits at the top-left corner.
 */
export const PixelSprite = ({
  sprite,
  scale = 3,
  label,
  className,
  style,
}: PixelSpriteProps) => {
  const { cols, rows } = useMemo(() => getSpriteSize(sprite), [sprite])
  const shadow = useMemo(() => buildPixelShadow(sprite, scale), [sprite, scale])

  return (
    <div
      className={`pixelSprite${className ? ` ${className}` : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        width: cols * scale,
        height: rows * scale,
        ...style,
      }}
    >
      <span
        className="pixelSpriteAnchor"
        style={{
          width: scale,
          height: scale,
          boxShadow: shadow,
        }}
      />
    </div>
  )
}
