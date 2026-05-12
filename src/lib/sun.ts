import SunCalc from 'suncalc'
import type { TimeOfDay } from '../types'

export type SunState = {
  altitudeDeg: number
  azimuthDeg: number
  isDay: boolean
  tod: TimeOfDay
}

/**
 * Returns sun altitude/azimuth (degrees), an isDay flag, and a coarse "time of
 * day" bucket used to drive sky tinting and sun/moon sprite swapping.
 */
export const getSunState = (date: Date, lat: number, lng: number): SunState => {
  const pos = SunCalc.getPosition(date, lat, lng)
  const altitudeDeg = (pos.altitude * 180) / Math.PI
  const azimuthDeg = (pos.azimuth * 180) / Math.PI

  let tod: TimeOfDay
  if (altitudeDeg < -6) tod = 'night'
  else if (altitudeDeg < 0) tod = 'dawn'
  else if (altitudeDeg < 8) tod = 'goldenHour'
  else if (altitudeDeg > 60) tod = 'day'
  else tod = 'day'

  // Differentiate dawn vs dusk by checking whether the sun is rising or setting.
  if (tod === 'dawn' || tod === 'goldenHour') {
    const earlier = SunCalc.getPosition(new Date(date.getTime() - 5 * 60 * 1000), lat, lng)
    const rising = pos.altitude > earlier.altitude
    if (!rising && tod === 'dawn') tod = 'night'
    if (!rising && tod === 'goldenHour') tod = 'dusk'
  }

  return {
    altitudeDeg,
    azimuthDeg,
    isDay: altitudeDeg > -0.83,
    tod,
  }
}

/** Linear interpolation. */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Parses `#rrggbb` to an `[r,g,b]` tuple. Falls back to black on bad input. */
const hexToRgb = (hex: string): [number, number, number] => {
  const s = hex.replace('#', '')
  if (s.length !== 6) return [0, 0, 0]
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ]
}

const rgbToHex = ([r, g, b]: [number, number, number]) =>
  '#' +
  [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')

const blend = (a: string, b: string, t: number): string => {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex([lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t)])
}

/**
 * Mixes the biome's base sky colours with a time-of-day overlay so the same
 * scenery theme reads as morning, midday, dusk, or night without per-theme
 * extra art.
 */
export const blendSky = (
  baseTop: string,
  baseBottom: string,
  tod: TimeOfDay,
  altitudeDeg: number,
): { top: string; bottom: string } => {
  switch (tod) {
    case 'night': {
      // Deep navy sky regardless of biome.
      return {
        top: blend(baseTop, '#050a1f', 0.85),
        bottom: blend(baseBottom, '#0c1538', 0.7),
      }
    }
    case 'dawn': {
      // Cool-violet predawn -> orange horizon.
      return {
        top: blend(baseTop, '#3b2a55', 0.6),
        bottom: blend(baseBottom, '#f08a55', 0.45),
      }
    }
    case 'goldenHour': {
      // Warm gold wash; intensity scales with how close to horizon the sun is.
      const warmth = Math.min(1, Math.max(0, 1 - altitudeDeg / 12))
      return {
        top: blend(baseTop, '#e87c2a', 0.25 + 0.2 * warmth),
        bottom: blend(baseBottom, '#ffb347', 0.35 + 0.2 * warmth),
      }
    }
    case 'dusk': {
      return {
        top: blend(baseTop, '#3a1d4a', 0.55),
        bottom: blend(baseBottom, '#e85d3a', 0.45),
      }
    }
    case 'day':
    default:
      return { top: baseTop, bottom: baseBottom }
  }
}

/** Deterministic seeded PRNG (Mulberry32). Used so the night sky doesn't reshuffle every render. */
export const mulberry32 = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
