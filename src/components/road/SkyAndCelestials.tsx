import { useMemo } from 'react'
import { mulberry32, type SunState } from '../../lib/sun'
import { MOON_CRESCENT, STAR_DIM, STAR_TWINKLE, SUN_DAY, SUN_GOLDEN } from '../../lib/pixelSprites'
import { PixelSprite } from '../PixelSprite'

type SkyAndCelestialsProps = {
  sun: SunState
  /** Width of the road stage in CSS pixels. */
  stageWidth: number
  /** Height of the road stage in CSS pixels. */
  stageHeight: number
  /** Where the horizon sits, measured in pixels from the top. */
  horizonY?: number
  /** Stable seed so the star field doesn't reshuffle every render. */
  starSeed?: number
}

const STAR_COUNT = 28

/**
 * Renders the sun (or crescent moon) and a deterministic star field on top of
 * the road stage. The actual sky gradient is applied by the parent so this can
 * focus purely on the celestial bodies.
 */
export const SkyAndCelestials = ({
  sun,
  stageWidth,
  stageHeight,
  horizonY,
  starSeed = 1337,
}: SkyAndCelestialsProps) => {
  const horizon = horizonY ?? Math.round(stageHeight * 0.62)
  const isNight = sun.tod === 'night'

  // Map azimuth (-180..180) to X across the stage. Sun in north hemisphere mostly
  // sweeps from east (~90deg) to south (~180deg) to west (~270deg/-90deg).
  const azNormalized = ((sun.azimuthDeg + 360) % 360) // 0..360 from north
  // We want east -> right side (sunrise/morning), south -> middle, west -> left
  // because the Road art faces west. Map 90 -> right edge, 270 -> left edge.
  const xRatio = Math.min(1, Math.max(0, (azNormalized - 60) / 240))
  const x = Math.round(xRatio * (stageWidth - 80) + 40)

  // Map altitude (-12..70 deg) to Y above the horizon.
  const clampedAlt = Math.min(75, Math.max(-12, sun.altitudeDeg))
  const altRatio = Math.min(1, Math.max(0, clampedAlt / 60))
  const y = Math.round(horizon - altRatio * (horizon - 16))

  const stars = useMemo(() => {
    const rng = mulberry32(starSeed)
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.round(rng() * (stageWidth - 12)),
      y: Math.round(rng() * (horizon - 18)),
      bright: rng() > 0.7,
      delaySec: Math.round(rng() * 240) / 100,
    }))
  }, [stageWidth, horizon, starSeed])

  if (sun.altitudeDeg < -12 || y > horizon + 8) {
    // Sun/moon would be below the visible horizon — only stars at night.
    return isNight ? renderStars(stars) : null
  }

  if (isNight) {
    return (
      <>
        {renderStars(stars)}
        <div className="celestialBody" style={{ left: x - 36, top: y - 36 }}>
          <div
            className="celestialHalo celestialHalo--moon"
            style={{ width: 72, height: 72, top: 0, left: 0 }}
          />
          <PixelSprite sprite={MOON_CRESCENT} scale={3} label="Moon" />
        </div>
      </>
    )
  }

  const sunSprite = sun.tod === 'goldenHour' || sun.tod === 'dawn' || sun.tod === 'dusk'
    ? SUN_GOLDEN
    : SUN_DAY
  return (
    <div className="celestialBody" style={{ left: x - 36, top: y - 36 }}>
      <div
        className="celestialHalo"
        style={{ width: 90, height: 90, top: -9, left: -9 }}
      />
      <PixelSprite sprite={sunSprite} scale={3} label="Sun" />
    </div>
  )
}

const renderStars = (stars: { id: number; x: number; y: number; bright: boolean; delaySec: number }[]) => (
  <div className="starField" aria-hidden>
    {stars.map((s) => (
      <PixelSprite
        key={s.id}
        sprite={s.bright ? STAR_TWINKLE : STAR_DIM}
        scale={1}
        style={{ left: s.x, top: s.y, animationDelay: `${s.delaySec}s` }}
      />
    ))}
  </div>
)
