import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import type { Poi, SceneryTheme, StateSegment } from '../types'
import { routeFeature } from '../data/route'
import stateSegments from '../data/state_segments.json'
import sceneryThemes from '../data/scenery_themes.json'
import pois from '../data/pois.json'

const line = routeFeature as Feature<LineString>
const routeLine = turf.lineString(line.geometry.coordinates)

export const ROUTE_TOTAL_MI = turf.length(routeLine, { units: 'miles' })

export const getProgressAlongRoute = (lat: number, lng: number) => {
  const pt = turf.point([lng, lat])
  const nearest = turf.nearestPointOnLine(routeLine, pt, { units: 'miles' })
  const alongMi = nearest.properties.location ?? 0
  const snapped = nearest.geometry.coordinates as [number, number]
  const ratio = Math.min(1, Math.max(0, alongMi / ROUTE_TOTAL_MI))
  const distanceOffRouteMi = turf.distance(pt, nearest, { units: 'miles' })
  return {
    progress: ratio,
    alongMiles: alongMi,
    snapped: { lat: snapped[1], lng: snapped[0] },
    distanceOffRouteMi,
  }
}

export const getPositionAtProgress = (progress: number): { lat: number; lng: number } => {
  const p = Math.min(1, Math.max(0, progress))
  const alongMi = p * ROUTE_TOTAL_MI
  const point = turf.along(routeLine, alongMi, { units: 'miles' })
  const [lng, lat] = point.geometry.coordinates
  return { lat, lng }
}

export const getStateSegment = (progress: number): StateSegment | undefined => {
  const segs = stateSegments as StateSegment[]
  const p = Math.min(1, Math.max(0, progress))
  return segs.find((s, i) => {
    const last = i === segs.length - 1
    return p >= s.startProgress && (last ? p <= s.endProgress + 1e-6 : p < s.endProgress)
  })
}

export const getSceneryTheme = (progress: number): SceneryTheme => {
  const themes = sceneryThemes as SceneryTheme[]
  const hit = themes.find((t) => progress >= t.minProgress && progress <= t.maxProgress)
  return hit ?? themes[themes.length - 1]!
}

export const listPois = (): Poi[] => pois as Poi[]

/** Signed miles along route: positive = POI is ahead of current snapped progress */
export const milesAheadOfProgress = (progress: number, poi: Poi) => {
  const currentAlong = progress * ROUTE_TOTAL_MI
  const poiPt = turf.point([poi.lng, poi.lat])
  const nearest = turf.nearestPointOnLine(routeLine, poiPt, { units: 'miles' })
  const poiAlong = nearest.properties.location ?? 0
  return poiAlong - currentAlong
}

export const formatDistance = (miles: number, units: 'mi' | 'km') => {
  if (units === 'km') {
    const km = miles * 1.60934
    return `${km.toFixed(km < 10 ? 1 : 0)} km`
  }
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`
}
