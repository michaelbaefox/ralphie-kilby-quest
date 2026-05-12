/**
 * Tiny CSS pixel-art renderer.
 *
 * Each "sprite" is declared as an array of ASCII rows + a palette. Whitespace in
 * a row is ignored so the source stays readable. The renderer turns the grid
 * into a single `box-shadow` string that paints every coloured cell as a tiny
 * square offset from the anchor element.
 *
 * Pair each sprite with `<PixelSprite />` (see `src/components/road/PixelSprite.tsx`)
 * which handles wrapper sizing and `image-rendering: pixelated` so the output is
 * crisp on retina + GPU-composited for animations.
 */

export type Palette = Record<string, string>

export type SpriteDef = {
  rows: readonly string[]
  palette: Palette
}

export type SpriteSize = { cols: number; rows: number }

/** Counts non-space cells per row; the widest row defines the grid width. */
export const getSpriteSize = (sprite: SpriteDef): SpriteSize => {
  let cols = 0
  for (const row of sprite.rows) {
    let count = 0
    for (const ch of row) {
      if (ch === ' ') continue
      count++
    }
    if (count > cols) cols = count
  }
  return { cols, rows: sprite.rows.length }
}

/** Builds a comma-separated `box-shadow` string for the sprite at the given pixel scale. */
export const buildPixelShadow = (sprite: SpriteDef, scale = 3): string => {
  const out: string[] = []
  sprite.rows.forEach((row, y) => {
    let xx = 0
    for (const ch of row) {
      if (ch === ' ') continue
      const color = sprite.palette[ch]
      if (color) {
        out.push(`${xx * scale}px ${y * scale}px 0 0 ${color}`)
      }
      xx++
    }
  })
  return out.join(', ')
}
