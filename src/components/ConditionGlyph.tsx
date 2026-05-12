import {
  GLYPH_CLOUD,
  GLYPH_FOG,
  GLYPH_MOON,
  GLYPH_RAIN,
  GLYPH_SNOW,
  GLYPH_STORM,
  GLYPH_SUN,
} from '../lib/pixelSprites'
import { describeCondition } from '../lib/conditionLabels'
import { PixelSprite } from './PixelSprite'
import type { TimeOfDay, WeatherCondition } from '../types'

type ConditionGlyphProps = {
  condition: WeatherCondition
  /** Optional time-of-day so "clear" can become a moon at night. */
  tod?: TimeOfDay
  scale?: number
  className?: string
}

/** Maps a (condition, time-of-day) pair to one of the small HUD/POI glyphs. */
export const ConditionGlyph = ({
  condition,
  tod,
  scale = 2,
  className,
}: ConditionGlyphProps) => {
  const sprite = (() => {
    if (condition === 'clear') return tod === 'night' ? GLYPH_MOON : GLYPH_SUN
    if (condition === 'partlyCloudy') return GLYPH_CLOUD
    if (condition === 'overcast') return GLYPH_CLOUD
    if (condition === 'fog') return GLYPH_FOG
    if (condition === 'drizzle') return GLYPH_RAIN
    if (condition === 'rain') return GLYPH_RAIN
    if (condition === 'snow') return GLYPH_SNOW
    if (condition === 'thunderstorm') return GLYPH_STORM
    return GLYPH_CLOUD
  })()
  return (
    <PixelSprite
      sprite={sprite}
      scale={scale}
      label={describeCondition(condition, tod)}
      className={className}
    />
  )
}

