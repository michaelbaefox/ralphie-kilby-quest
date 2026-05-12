import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  loadAchievementUnlocks,
  loadRun,
  loadSettings,
  saveRun,
  saveSettings,
  unlockAchievement,
} from '../db'
import { evaluateAchievements } from '../lib/achievements'
import {
  ROUTE_TOTAL_MI,
  getPositionAtProgress,
  getProgressAlongRoute,
  getSceneryTheme,
  getStateSegment,
} from '../lib/routeEngine'
import type { AppSettings } from '../types'

type TripContextValue = {
  settings: AppSettings
  setSettings: (next: Partial<AppSettings>) => Promise<void>
  updateManualFlags: (patch: Record<string, boolean>) => Promise<void>
  progress: number
  alongMiles: number
  snapped: { lat: number; lng: number } | null
  gpsError: string | null
  gpsActive: boolean
  distanceOffRouteMi: number | null
  sceneryId: string
  stateLabel: string
  unlockedAchievementIds: Set<string>
  refreshAchievements: () => Promise<void>
  requestGps: () => void
  stopGps: () => void
}

const TripContext = createContext<TripContextValue | null>(null)

const GPS_MIN_MS = 4000
const MAX_OFF_ROUTE_MI = 35

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<AppSettings | null>(null)
  const [progress, setProgress] = useState(0)
  const [alongMiles, setAlongMiles] = useState(0)
  const [snapped, setSnapped] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [distanceOffRouteMi, setDistanceOffRouteMi] = useState<number | null>(null)
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set())

  const watchId = useRef<number | null>(null)
  const lastGpsMs = useRef(0)
  const smoothedProgress = useRef(0)
  const unlockedRef = useRef<Set<string>>(new Set())
  const progressRef = useRef(0)
  const alongRef = useRef(0)

  useEffect(() => {
    progressRef.current = progress
    alongRef.current = alongMiles
  }, [progress, alongMiles])

  useEffect(() => {
    unlockedRef.current = unlockedAchievementIds
  }, [unlockedAchievementIds])

  const refreshAchievements = useCallback(async () => {
    const rows = await loadAchievementUnlocks()
    const next = new Set(rows.map((r) => r.id))
    unlockedRef.current = next
    setUnlockedAchievementIds(next)
  }, [])

  useEffect(() => {
    void (async () => {
      const [s, run, ach] = await Promise.all([loadSettings(), loadRun(), loadAchievementUnlocks()])
      setSettingsState(s)
      smoothedProgress.current = run.progress
      setProgress(run.progress)
      setAlongMiles(run.progress * ROUTE_TOTAL_MI)
      if (run.lastLat != null && run.lastLng != null) {
        setSnapped({ lat: run.lastLat, lng: run.lastLng })
      }
      const ids = new Set(ach.map((a) => a.id))
      unlockedRef.current = ids
      setUnlockedAchievementIds(ids)
    })()
  }, [])

  const runAchievementPass = useCallback(
    async (nextProgress: number, nextAlong: number, manualFlags: Record<string, boolean>) => {
      const newly = evaluateAchievements({
        progress: nextProgress,
        alongMiles: nextAlong,
        unlocked: unlockedRef.current,
        manualFlags,
      })
      for (const id of newly) {
        await unlockAchievement(id)
      }
      if (newly.length) await refreshAchievements()
    },
    [refreshAchievements],
  )

  const applyProgressUpdate = useCallback(
    async (rawProgress: number, rawAlong: number, snap: { lat: number; lng: number }, offMi: number) => {
      const run = await loadRun()
      let nextProgress = rawProgress
      if (offMi > MAX_OFF_ROUTE_MI) {
        nextProgress = smoothedProgress.current
      } else {
        smoothedProgress.current = smoothedProgress.current * 0.85 + nextProgress * 0.15
        nextProgress = smoothedProgress.current
      }
      const nextAlong = nextProgress * ROUTE_TOTAL_MI
      setProgress(nextProgress)
      setAlongMiles(nextAlong)
      setSnapped(snap)
      setDistanceOffRouteMi(offMi)

      await runAchievementPass(nextProgress, Math.max(rawAlong, nextAlong), run.manualFlags)

      await saveRun({
        progress: nextProgress,
        lastLat: snap.lat,
        lastLng: snap.lng,
      })
    },
    [runAchievementPass],
  )

  const handlePosition = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now()
      if (now - lastGpsMs.current < GPS_MIN_MS) return
      lastGpsMs.current = now
      const res = getProgressAlongRoute(lat, lng)
      void applyProgressUpdate(res.progress, res.alongMiles, res.snapped, res.distanceOffRouteMi)
    },
    [applyProgressUpdate],
  )

  const requestGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError("Location services aren't available right now.")
      return
    }
    setGpsError(null)
    setGpsActive(true)
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null)
        handlePosition(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setGpsError(err.message || "Couldn't get your location.")
      },
      { enableHighAccuracy: false, maximumAge: 10_000, timeout: 20_000 },
    )
  }, [handlePosition])

  const stopGps = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    setGpsActive(false)
  }, [])

  useEffect(() => {
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    const sim = settings.devSimulateProgress
    if (sim == null) return
    const p = Math.min(1, Math.max(0, sim))
    const g = getPositionAtProgress(p)
    const r = getProgressAlongRoute(g.lat, g.lng)
    smoothedProgress.current = p
    queueMicrotask(() => {
      setProgress(p)
      setAlongMiles(p * ROUTE_TOTAL_MI)
      setSnapped(r.snapped)
      setDistanceOffRouteMi(r.distanceOffRouteMi)
    })
    void (async () => {
      const run = await loadRun()
      await runAchievementPass(p, p * ROUTE_TOTAL_MI, run.manualFlags)
      await saveRun({ progress: p, lastLat: r.snapped.lat, lastLng: r.snapped.lng })
    })()
  }, [settings, runAchievementPass])

  const setSettings = useCallback(async (next: Partial<AppSettings>) => {
    const merged = { ...(await loadSettings()), ...next }
    setSettingsState(merged)
    await saveSettings(merged)
    if (Object.prototype.hasOwnProperty.call(next, 'devSimulateProgress') && next.devSimulateProgress === null) {
      const run = await loadRun()
      smoothedProgress.current = run.progress
      setProgress(run.progress)
      setAlongMiles(run.progress * ROUTE_TOTAL_MI)
      if (run.lastLat != null && run.lastLng != null) {
        setSnapped({ lat: run.lastLat, lng: run.lastLng })
      }
    }
  }, [])

  const updateManualFlags = useCallback(
    async (patch: Record<string, boolean>) => {
      const run = await loadRun()
      const flags = { ...run.manualFlags, ...patch }
      await saveRun({ manualFlags: flags })
      await runAchievementPass(progressRef.current, alongRef.current, flags)
    },
    [runAchievementPass],
  )

  const stateSeg = getStateSegment(progress)
  const scenery = getSceneryTheme(progress)

  const tripApi: TripContextValue | null = settings
    ? {
        settings,
        setSettings,
        updateManualFlags,
        progress,
        alongMiles,
        snapped,
        gpsError,
        gpsActive,
        distanceOffRouteMi,
        sceneryId: scenery.id,
        stateLabel: stateSeg?.name ?? 'Open road',
        unlockedAchievementIds,
        refreshAchievements,
        requestGps,
        stopGps,
      }
    : null

  if (!tripApi) {
    return <div className="bootScreen">Loading your adventure…</div>
  }

  return <TripContext.Provider value={tripApi}>{children}</TripContext.Provider>
}

export const useTrip = () => {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}
