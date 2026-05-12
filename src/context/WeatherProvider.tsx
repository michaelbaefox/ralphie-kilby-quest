import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  ROUTE_TOTAL_MI,
  getPositionAtProgress,
  getStateSegment,
} from '../lib/routeEngine'
import { getSunState, type SunState } from '../lib/sun'
import { getTimezoneForProgress, getTimezoneShortLabel } from '../lib/timezones'
import { ROUTE_AVG_SPEED_MPH } from '../lib/tripEta'
import { getForecastAt, getCurrentWeather, sweepWeatherCache } from '../lib/weather'
import type { ForecastWaypoint, WeatherSnapshot } from '../types'
import stateSegments from '../data/state_segments.json'
import type { StateSegment } from '../types'
import { useTrip } from './TripContext'

const SEGMENTS = stateSegments as StateSegment[]
const CURRENT_REFRESH_MS = 30 * 60 * 1000
const FORECAST_REFRESH_MS = 60 * 60 * 1000
const NOW_TICK_MS = 30 * 1000
const POSITION_REFRESH_DELTA_MI = 8

type WeatherContextValue = {
  /** Real-time `Date.now()` snapshot, refreshed every 30s for the HUD clock. */
  localNow: Date
  /** Short label like "ET" / "CT" / "MT" for the snapped position's timezone. */
  tzLabel: string
  /** Full IANA timezone for the snapped position. */
  tz: string
  /** Sun altitude/azimuth + day/night/golden-hour bucket. */
  sun: SunState
  /** Current weather at Ralphie's snapped position. Null until first fetch resolves. */
  current: WeatherSnapshot | null
  /** Forecast waypoints further down the route. */
  forecast: ForecastWaypoint[]
  /** Last successful (or fallback) refresh time for `current`. */
  lastFetchedMs: number | null
  /** True if the device is offline right now. */
  isOffline: boolean
  /** Force-refresh both current + forecast. Resolves when both attempts are done. */
  refresh: () => Promise<void>
}

const WeatherContext = createContext<WeatherContextValue | null>(null)

const sampleSegmentProgresses = (seg: StateSegment): number[] => {
  const len = seg.endProgress - seg.startProgress
  if (len > 0.12) {
    return [seg.startProgress + len * 0.33, seg.startProgress + len * 0.67]
  }
  return [seg.startProgress + len * 0.5]
}

const buildWaypointPlan = (
  currentProgress: number,
  departMs: number,
): { id: string; label: string; lat: number; lng: number; alongMiles: number; etaMs: number; stateId: string }[] => {
  const currentAlong = currentProgress * ROUTE_TOTAL_MI
  const out: { id: string; label: string; lat: number; lng: number; alongMiles: number; etaMs: number; stateId: string }[] = []
  for (const seg of SEGMENTS) {
    if (seg.endProgress <= currentProgress) continue
    const samples = sampleSegmentProgresses(seg).filter((p) => p > currentProgress)
    samples.forEach((p, i) => {
      const { lat, lng } = getPositionAtProgress(p)
      const alongMiles = p * ROUTE_TOTAL_MI
      const milesAhead = Math.max(0, alongMiles - currentAlong)
      const etaMs = departMs + (milesAhead / ROUTE_AVG_SPEED_MPH) * 3_600_000
      out.push({
        id: `${seg.id}-${i + 1}`,
        label: seg.name,
        lat,
        lng,
        alongMiles,
        etaMs,
        stateId: seg.id,
      })
    })
  }
  return out
}

export const WeatherProvider = ({ children }: { children: ReactNode }) => {
  const trip = useTrip()
  const [localNow, setLocalNow] = useState(() => new Date())
  const [current, setCurrent] = useState<WeatherSnapshot | null>(null)
  const [forecast, setForecast] = useState<ForecastWaypoint[]>([])
  const [lastFetchedMs, setLastFetchedMs] = useState<number | null>(null)
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false,
  )
  const lastFetchedPositionRef = useRef<{ lat: number; lng: number } | null>(null)

  const snappedNow = useMemo(() => {
    if (trip.snapped) return trip.snapped
    return getPositionAtProgress(trip.progress)
  }, [trip.snapped, trip.progress])

  const tz = useMemo(() => getTimezoneForProgress(trip.progress), [trip.progress])
  const tzLabel = useMemo(() => getTimezoneShortLabel(tz, localNow), [tz, localNow])
  const sun = useMemo(
    () => getSunState(localNow, snappedNow.lat, snappedNow.lng),
    [localNow, snappedNow.lat, snappedNow.lng],
  )

  // Tick the clock every 30s so the HUD time + sun position drift live.
  useEffect(() => {
    const id = window.setInterval(() => setLocalNow(new Date()), NOW_TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  const milesBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const dLat = (a.lat - b.lat) * 69
    const dLng = (a.lng - b.lng) * 53
    return Math.sqrt(dLat * dLat + dLng * dLng)
  }

  const refreshCurrent = useCallback(async () => {
    const seg = getStateSegment(trip.progress)
    try {
      const snap = await getCurrentWeather(snappedNow.lat, snappedNow.lng, seg?.id)
      setCurrent(snap)
      setLastFetchedMs(snap.fetchedAt)
      lastFetchedPositionRef.current = { lat: snappedNow.lat, lng: snappedNow.lng }
    } catch {
      /* getCurrentWeather already falls back internally; this is just a safety net */
    }
  }, [snappedNow.lat, snappedNow.lng, trip.progress])

  const refreshForecast = useCallback(async () => {
    const departMs = trip.settings.departTimeIso
      ? new Date(trip.settings.departTimeIso).getTime()
      : Date.now()
    const plan = buildWaypointPlan(trip.progress, departMs)
    if (plan.length === 0) {
      setForecast([])
      return
    }
    const results = await Promise.all(
      plan.map(async (wp) => {
        const snap = await getForecastAt({
          lat: wp.lat,
          lng: wp.lng,
          etaMs: wp.etaMs,
          stateId: wp.stateId,
        })
        const waypoint: ForecastWaypoint = {
          id: wp.id,
          label: wp.label,
          lat: wp.lat,
          lng: wp.lng,
          alongMiles: wp.alongMiles,
          etaMs: wp.etaMs,
          condition: snap.condition,
          temperatureF: snap.temperatureF,
          source: snap.source,
        }
        return waypoint
      }),
    )
    setForecast(results)
  }, [trip.progress, trip.settings.departTimeIso])

  const refresh = useCallback(async () => {
    await Promise.all([refreshCurrent(), refreshForecast()])
  }, [refreshCurrent, refreshForecast])

  // Initial fetches + cache prune. Fire on a microtask so React doesn't see
  // setState inside the effect body (the work happens after the effect returns).
  useEffect(() => {
    queueMicrotask(() => {
      void sweepWeatherCache()
      void refresh()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Periodic refreshes.
  useEffect(() => {
    const a = window.setInterval(() => void refreshCurrent(), CURRENT_REFRESH_MS)
    const b = window.setInterval(() => void refreshForecast(), FORECAST_REFRESH_MS)
    return () => {
      window.clearInterval(a)
      window.clearInterval(b)
    }
  }, [refreshCurrent, refreshForecast])

  // Refresh when the player moves a meaningful distance.
  useEffect(() => {
    const last = lastFetchedPositionRef.current
    if (!last) return
    if (milesBetween(last, snappedNow) >= POSITION_REFRESH_DELTA_MI) {
      void refreshCurrent()
    }
  }, [snappedNow, refreshCurrent])

  // Refresh whenever depart time changes (intro picks a new "quest begins").
  useEffect(() => {
    queueMicrotask(() => {
      void refreshForecast()
    })
  }, [trip.settings.departTimeIso, refreshForecast])

  // Online/offline awareness.
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      void refresh()
    }
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refresh])

  const value: WeatherContextValue = {
    localNow,
    tzLabel,
    tz,
    sun,
    current,
    forecast,
    lastFetchedMs,
    isOffline,
    refresh,
  }

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWeather = (): WeatherContextValue => {
  const ctx = useContext(WeatherContext)
  if (!ctx) throw new Error('useWeather must be used within WeatherProvider')
  return ctx
}
