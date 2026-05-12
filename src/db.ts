import Dexie, { type Table } from 'dexie'
import type { AchievementUnlock, AppSettings, WeatherCondition } from './types'

const defaultSettings: AppSettings = {
  units: 'mi',
  reduceMotion: false,
  largeText: false,
  highContrast: false,
  coPilotMode: true,
  parkedMode: false,
  allowOnlineBoost: true,
  devSimulateProgress: null,
  devRoadPreviewEastbound: false,
  departTimeIso: null,
  partySize: 1,
  introCompleted: false,
}

export type RunRow = {
  id: 'singleton'
  progress: number
  lastLat: number | null
  lastLng: number | null
  lastUpdated: number
  manualFlags: Record<string, boolean>
}

export type WeatherCacheRow = {
  /** `${lat4},${lng4}|${etaIsoHour}` — primary key. */
  key: string
  lat: number
  lng: number
  etaIsoHour: string
  condition: WeatherCondition
  temperatureF: number
  precipitationMm: number
  cloudCoverPct: number
  windMph: number
  fetchedAt: number
}

export class KilbyDB extends Dexie {
  settings!: Table<{ id: 'singleton'; value: AppSettings }>
  run!: Table<RunRow>
  achievements!: Table<AchievementUnlock>
  weatherCache!: Table<WeatherCacheRow>

  constructor() {
    super('ralphie_kilby_quest')
    this.version(1).stores({
      settings: 'id',
      run: 'id',
      achievements: 'id',
    })
    this.version(2).stores({
      settings: 'id',
      run: 'id',
      achievements: 'id',
      weatherCache: 'key, fetchedAt',
    })
  }
}

export const db = new KilbyDB()

export const loadSettings = async (): Promise<AppSettings> => {
  const row = await db.settings.get('singleton')
  return { ...defaultSettings, ...(row?.value ?? {}) }
}

export const saveSettings = async (value: AppSettings) => {
  await db.settings.put({ id: 'singleton', value })
}

export const loadRun = async (): Promise<RunRow> => {
  const row = await db.run.get('singleton')
  return (
    row ?? {
      id: 'singleton',
      progress: 0,
      lastLat: null,
      lastLng: null,
      lastUpdated: Date.now(),
      manualFlags: {},
    }
  )
}

export const saveRun = async (partial: Partial<Omit<RunRow, 'id'>>) => {
  const prev = await loadRun()
  await db.run.put({
    ...prev,
    ...partial,
    id: 'singleton',
    lastUpdated: Date.now(),
  })
}

export const loadAchievementUnlocks = async () => {
  return db.achievements.toArray()
}

export const unlockAchievement = async (id: string) => {
  const exists = await db.achievements.get(id)
  if (exists) return
  await db.achievements.put({ id, unlockedAt: Date.now() })
}

const WEATHER_CACHE_TTL_MS = 1000 * 60 * 60 * 24

export const loadWeatherCacheRow = async (key: string): Promise<WeatherCacheRow | undefined> => {
  const row = await db.weatherCache.get(key)
  if (!row) return undefined
  if (Date.now() - row.fetchedAt > WEATHER_CACHE_TTL_MS) {
    await db.weatherCache.delete(key)
    return undefined
  }
  return row
}

export const saveWeatherCacheRow = async (row: WeatherCacheRow) => {
  await db.weatherCache.put(row)
}

export const pruneWeatherCache = async () => {
  const cutoff = Date.now() - WEATHER_CACHE_TTL_MS
  const stale = await db.weatherCache.where('fetchedAt').below(cutoff).primaryKeys()
  if (stale.length) await db.weatherCache.bulkDelete(stale)
}

export const clearAllLocalData = async () => {
  await db.transaction('rw', db.settings, db.run, db.achievements, db.weatherCache, async () => {
    await db.settings.clear()
    await db.run.clear()
    await db.achievements.clear()
    await db.weatherCache.clear()
  })
}
