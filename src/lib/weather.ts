import { loadWeatherCacheRow, pruneWeatherCache, saveWeatherCacheRow, type WeatherCacheRow } from '../db'
import type { WeatherCondition, WeatherSnapshot } from '../types'
import { getClimatologyFallback } from './weatherClimatology'

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast'

/**
 * Maps WMO weather codes (returned by Open-Meteo) to our coarser internal
 * condition set. Code definitions: https://open-meteo.com/en/docs#api_form
 */
export const mapWmoToCondition = (
  code: number,
  cloudPct = 0,
  precipMm = 0,
): WeatherCondition => {
  if (code === 0) return 'clear'
  if (code === 1 || code === 2) return cloudPct > 60 ? 'overcast' : 'partlyCloudy'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return precipMm > 2 ? 'rain' : 'drizzle'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunderstorm'
  return 'partlyCloudy'
}

const round4 = (n: number) => Math.round(n * 10000) / 10000
const cacheKey = (lat: number, lng: number, etaIsoHour: string) =>
  `${round4(lat)},${round4(lng)}|${etaIsoHour}`

/** Truncates a Date to the start of its hour in ISO format (e.g. `2026-04-19T16:00:00.000Z`). */
export const toIsoHour = (date: Date): string => {
  const d = new Date(date)
  d.setMinutes(0, 0, 0)
  return d.toISOString()
}

type OpenMeteoResponse = {
  hourly?: {
    /** Unix seconds because we request `timeformat=unixtime`. */
    time?: number[]
    temperature_2m?: number[]
    precipitation?: number[]
    weather_code?: number[]
    cloud_cover?: number[]
    wind_speed_10m?: number[]
  }
  utc_offset_seconds?: number
}

/**
 * Fetches a multi-day hourly forecast for a single point. Open-Meteo accepts
 * `start_date`/`end_date` as `YYYY-MM-DD`; passing a wide range (up to 16 days)
 * gets all the trip ETAs covered in one request.
 */
const fetchOpenMeteo = async (
  lat: number,
  lng: number,
  startDate: Date,
  endDate: Date,
  unitsF: boolean,
  signal?: AbortSignal,
): Promise<OpenMeteoResponse> => {
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const url =
    `${OPEN_METEO_BASE}` +
    `?latitude=${round4(lat)}` +
    `&longitude=${round4(lng)}` +
    `&hourly=temperature_2m,precipitation,weather_code,cloud_cover,wind_speed_10m` +
    `&temperature_unit=${unitsF ? 'fahrenheit' : 'celsius'}` +
    `&wind_speed_unit=mph` +
    `&precipitation_unit=mm` +
    `&timeformat=unixtime` +
    `&start_date=${fmt(startDate)}` +
    `&end_date=${fmt(endDate)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  return (await res.json()) as OpenMeteoResponse
}

/** Picks the hourly index whose timestamp is closest to `targetMs`. */
const pickHourIndex = (times: number[] | undefined, targetMs: number): number => {
  if (!times || times.length === 0) return -1
  let best = 0
  let bestDelta = Math.abs(times[0]! * 1000 - targetMs)
  for (let i = 1; i < times.length; i++) {
    const d = Math.abs(times[i]! * 1000 - targetMs)
    if (d < bestDelta) {
      best = i
      bestDelta = d
    }
  }
  return best
}

export type ForecastQuery = {
  lat: number
  lng: number
  /** Each ETA we want a snapshot for. */
  etaMs: number
  /** Optional state id used for the climatology fallback. */
  stateId?: string
}

export type ForecastResult = WeatherSnapshot

const inflight = new Map<string, Promise<ForecastResult>>()

/**
 * Returns a single forecast snapshot for one (lat, lng, etaMs) tuple. Always
 * resolves: on network failure or stale Open-Meteo, returns the climatology
 * fallback so the UI never has to render an empty state.
 */
export const getForecastAt = async (q: ForecastQuery): Promise<ForecastResult> => {
  const eta = new Date(q.etaMs)
  const isoHour = toIsoHour(eta)
  const key = cacheKey(q.lat, q.lng, isoHour)

  const cached = await loadWeatherCacheRow(key)
  if (cached) return cacheRowToSnapshot(cached)

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = (async (): Promise<ForecastResult> => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      return climatology(q, eta)
    }
    try {
      const today = new Date()
      const start = today.getTime() < eta.getTime() ? today : eta
      const endLimit = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
      const end = endLimit.getTime() < eta.getTime() ? endLimit : eta
      const data = await fetchOpenMeteo(q.lat, q.lng, start, end, true)
      const idx = pickHourIndex(data.hourly?.time, q.etaMs)
      if (idx < 0) return climatology(q, eta)

      const code = data.hourly?.weather_code?.[idx] ?? 1
      const tempF = data.hourly?.temperature_2m?.[idx] ?? 70
      const precip = data.hourly?.precipitation?.[idx] ?? 0
      const cloud = data.hourly?.cloud_cover?.[idx] ?? 0
      const wind = data.hourly?.wind_speed_10m?.[idx] ?? 0
      const condition = mapWmoToCondition(code, cloud, precip)

      const snapshot: WeatherSnapshot = {
        condition,
        temperatureF: tempF,
        precipitationMm: precip,
        cloudCoverPct: cloud,
        windMph: wind,
        fetchedAt: Date.now(),
        source: 'open-meteo',
      }
      const row: WeatherCacheRow = {
        key,
        lat: q.lat,
        lng: q.lng,
        etaIsoHour: isoHour,
        condition,
        temperatureF: tempF,
        precipitationMm: precip,
        cloudCoverPct: cloud,
        windMph: wind,
        fetchedAt: snapshot.fetchedAt,
      }
      await saveWeatherCacheRow(row)
      return snapshot
    } catch {
      return climatology(q, eta)
    }
  })()

  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

const climatology = (q: ForecastQuery, eta: Date): WeatherSnapshot => {
  const c = getClimatologyFallback(q.stateId ?? 'IA', eta)
  return {
    condition: c.condition,
    temperatureF: c.temperatureF,
    precipitationMm: 0,
    cloudCoverPct: c.condition === 'clear' ? 10 : c.condition === 'partlyCloudy' ? 40 : 80,
    windMph: 8,
    fetchedAt: Date.now(),
    source: 'climatology',
  }
}

const cacheRowToSnapshot = (row: WeatherCacheRow): WeatherSnapshot => ({
  condition: row.condition,
  temperatureF: row.temperatureF,
  precipitationMm: row.precipitationMm,
  cloudCoverPct: row.cloudCoverPct,
  windMph: row.windMph,
  fetchedAt: row.fetchedAt,
  source: 'open-meteo',
})

/** Convenience for the always-current snapshot at Ralphie's snapped position. */
export const getCurrentWeather = async (
  lat: number,
  lng: number,
  stateId?: string,
): Promise<WeatherSnapshot> =>
  getForecastAt({ lat, lng, etaMs: Date.now(), stateId })

/** Run on app startup to drop stale rows. Safe to fire-and-forget. */
export const sweepWeatherCache = async (): Promise<void> => {
  try {
    await pruneWeatherCache()
  } catch {
    /* ignore */
  }
}
