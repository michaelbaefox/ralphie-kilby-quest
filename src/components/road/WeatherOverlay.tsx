import { useMemo } from 'react'
import { mulberry32 } from '../../lib/sun'
import { LIGHTNING_BOLT, RAINDROP, SNOWFLAKE } from '../../lib/pixelSprites'
import { PixelSprite } from '../PixelSprite'
import type { WeatherCondition } from '../../types'

type WeatherOverlayProps = {
  condition: WeatherCondition
  temperatureF: number
  stageWidth: number
  stageHeight: number
  /** Disable particle/animation effects (parked mode, reduce motion). */
  motionOff?: boolean
  /** Stable seed so raindrop/snow positions don't reshuffle every frame. */
  seed?: number
}

const RAIN_DROPS = 28
const SNOW_FLAKES = 20

/**
 * Layered weather effect — only what's relevant for the current condition is
 * mounted. Particles use deterministic positions from the seed so they don't
 * jitter when other state updates trigger a re-render.
 */
export const WeatherOverlay = ({
  condition,
  temperatureF,
  stageWidth,
  stageHeight,
  motionOff = false,
  seed = 7,
}: WeatherOverlayProps) => {
  const drops = useMemo(() => {
    const rng = mulberry32(seed)
    return Array.from({ length: RAIN_DROPS }, (_, i) => ({
      id: i,
      x: Math.round(rng() * stageWidth),
      delay: Math.round(rng() * 200) / 100,
      duration: 0.7 + Math.round(rng() * 80) / 100,
    }))
  }, [stageWidth, seed])

  const flakes = useMemo(() => {
    const rng = mulberry32(seed + 99)
    return Array.from({ length: SNOW_FLAKES }, (_, i) => ({
      id: i,
      x: Math.round(rng() * stageWidth),
      delay: Math.round(rng() * 600) / 100,
      duration: 4 + Math.round(rng() * 300) / 100,
    }))
  }, [stageWidth, seed])

  const isWet = condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm'
  const isSnow = condition === 'snow'
  const isFog = condition === 'fog' || condition === 'overcast'
  const isStorm = condition === 'thunderstorm'
  const isHot = temperatureF >= 90
  const isCold = temperatureF <= 32

  return (
    <>
      {isFog && (
        <div className="weatherFog" aria-hidden>
          <div className="fogBand fogBand--upper" />
          <div className="fogBand fogBand--lower" />
        </div>
      )}

      {isWet && (
        <div className="weatherRain" aria-hidden>
          {drops.map((d) => (
            <PixelSprite
              key={d.id}
              sprite={RAINDROP}
              scale={2}
              style={{
                left: d.x,
                animationDelay: `${d.delay}s`,
                animationDuration: motionOff ? undefined : `${d.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {isSnow && (
        <div className="weatherSnow" aria-hidden>
          {flakes.map((f) => (
            <PixelSprite
              key={f.id}
              sprite={SNOWFLAKE}
              scale={2}
              style={{
                left: f.x,
                animationDelay: `${f.delay}s`,
                animationDuration: motionOff ? undefined : `${f.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {isCold && !isSnow && <div className="weatherCold" aria-hidden />}

      {isHot && (
        <div className="weatherHeat" aria-hidden style={{ width: stageWidth }} />
      )}

      {isStorm && !motionOff && (
        <div className="weatherLightning" aria-hidden>
          <div className="lightningFlash" />
          <div
            className="lightningBolt"
            style={{ left: Math.round(stageWidth * 0.62) }}
          >
            <PixelSprite sprite={LIGHTNING_BOLT} scale={3} />
          </div>
        </div>
      )}

      {/* Parameter is referenced just to silence an unused warning when only fog/wet active. */}
      <span hidden aria-hidden>{stageHeight}</span>
    </>
  )
}
