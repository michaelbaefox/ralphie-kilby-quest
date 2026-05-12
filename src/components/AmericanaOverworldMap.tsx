import { useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import maplibregl from 'maplibre-gl'
import type { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import InfoRounded from '@mui/icons-material/InfoRounded'
import { routeFeature } from '../data/route'
import { getPositionAtProgress, listPois } from '../lib/routeEngine'
import { boostRoadContrastInStyle } from '../lib/boostRoadContrastInStyle'
import { addKilbyTerrainLayers } from '../lib/mapTerrain'
import { questDarkAmericanaStyle } from '../lib/questDarkAmericanaStyle'
import type { Poi, PoiKind } from '../types'
import { BrutalIcon } from './BrutalIcon'
import { POI_KIND_ICON } from '../lib/poiIcons'

export const AMERICANA_STYLE_URL = 'https://americanamap.org/style.json'

const STYLE_CACHE_KEY = 'kilby-americana-style-dark-v6'

const ROUTE_SOURCE_ID = 'quest-route'
const ROUTE_LINE_ID = 'quest-route-line'
const ROUTE_GLOW_ID = 'quest-route-glow'
const PROGRESS_SOURCE_ID = 'quest-progress'
const PROGRESS_LAYER_ID = 'quest-progress-dot'

const renderPoiPinHtml = (kind: PoiKind) =>
  renderToStaticMarkup(<BrutalIcon Icon={POI_KIND_ICON[kind]} variant="pin" size={18} />)

type Props = {
  progress: number
  reduceMotion: boolean
  onPoiSelect?: (poi: Poi) => void
}

export const AmericanaOverworldMap = ({ progress, reduceMotion, onPoiSelect }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const progressRef = useRef(progress)
  const onPoiSelectRef = useRef(onPoiSelect)
  const [attribOpen, setAttribOpen] = useState(false)

  useEffect(() => {
    onPoiSelectRef.current = onPoiSelect
  }, [onPoiSelect])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    if (!attribOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAttribOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [attribOpen])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false
    let map: maplibregl.Map | null = null
    const poiMarkers: maplibregl.Marker[] = []

    const line = routeFeature as Feature<LineString>
    const padDeg = 0.85
    const rawBbox = turf.bbox(line)
    const bounds: maplibregl.LngLatBoundsLike = [
      [rawBbox[0]! - padDeg, rawBbox[1]! - padDeg],
      [rawBbox[2]! + padDeg, rawBbox[3]! + padDeg],
    ]

    const attachQuestLayers = () => {
      const m = mapRef.current
      if (!m || cancelled) return

      addKilbyTerrainLayers(m)

      m.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: line })
      m.addLayer({
        id: ROUTE_GLOW_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ff9500',
          'line-width': 16,
          'line-opacity': 0.32,
          'line-blur': 4,
        },
      })
      m.addLayer({
        id: ROUTE_LINE_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffd54a',
          'line-width': 9,
          'line-opacity': 1,
        },
      })

      const p = getPositionAtProgress(progressRef.current)
      m.addSource(PROGRESS_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'You' },
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        },
      })
      m.addLayer({
        id: PROGRESS_LAYER_ID,
        type: 'circle',
        source: PROGRESS_SOURCE_ID,
        paint: {
          'circle-radius': 11,
          'circle-color': '#ff8b7a',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff9f5',
        },
      })

      for (const poi of listPois()) {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = `mapPoiPin mapPoiPin-${poi.kind}`
        btn.innerHTML = renderPoiPinHtml(poi.kind)
        btn.title = poi.name
        btn.setAttribute('aria-label', `${poi.name}. ${poi.note}`)
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onPoiSelectRef.current?.(poi)
        })
        const marker = new maplibregl.Marker({ element: btn, anchor: 'bottom' })
          .setLngLat([poi.lng, poi.lat])
          .addTo(m)
        poiMarkers.push(marker)
      }

      m.fitBounds(bounds, {
        padding: 52,
        duration: reduceMotion ? 0 : 900,
        maxZoom: 6.8,
      })
    }

    const boot = async () => {
      let style: string | StyleSpecification = AMERICANA_STYLE_URL

      try {
        const cached = sessionStorage.getItem(STYLE_CACHE_KEY)
        if (cached) {
          style = JSON.parse(cached) as StyleSpecification
        } else {
          const res = await fetch(AMERICANA_STYLE_URL)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const raw = (await res.json()) as object
          const darkFork = questDarkAmericanaStyle(raw) as StyleSpecification
          const boosted = boostRoadContrastInStyle(darkFork)
          style = boosted
          try {
            sessionStorage.setItem(STYLE_CACHE_KEY, JSON.stringify(boosted))
          } catch {
            /* quota */
          }
        }
      } catch {
        style = AMERICANA_STYLE_URL
      }

      if (cancelled) return

      map = new maplibregl.Map({
        container: el,
        style,
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
      })
      mapRef.current = map

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
      map.once('load', attachQuestLayers)
    }

    void boot()

    const ro = new ResizeObserver(() => {
      mapRef.current?.resize()
    })
    ro.observe(el)

    return () => {
      cancelled = true
      ro.disconnect()
      poiMarkers.forEach((mk) => mk.remove())
      map?.remove()
      mapRef.current = null
    }
  }, [reduceMotion])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.loaded()) return
    const src = map.getSource(PROGRESS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    if (!src) return
    const pos = getPositionAtProgress(progress)
    src.setData({
      type: 'Feature',
      properties: { name: 'You' },
      geometry: { type: 'Point', coordinates: [pos.lng, pos.lat] },
    })
  }, [progress])

  const handleAttribToggle = () => {
    setAttribOpen((o) => !o)
  }

  return (
    <div className="americanaMapWrap americanaMapWrap--pixelEcho">
      <div
        ref={containerRef}
        className="americanaMap"
        role="application"
        aria-label="Adventure map showing your route, stops, and current position."
      />
      <div className="americanaMapVignette" aria-hidden />
      <div className="americanaMapGrain" aria-hidden />
      {attribOpen && (
        <button
          type="button"
          className="mapAttribBackdrop"
          aria-label="Close map credits"
          onClick={() => setAttribOpen(false)}
        />
      )}
      <div className="mapAttribDock">
        <button
          type="button"
          className="mapAttribFab"
          onClick={handleAttribToggle}
          aria-expanded={attribOpen}
          aria-controls="map-attrib-panel"
          aria-label={attribOpen ? 'Close map credits' : 'Open map credits'}
        >
          <BrutalIcon Icon={InfoRounded} variant="inline" size={18} />
        </button>
        {attribOpen && (
          <div
            id="map-attrib-panel"
            className="mapAttribPanel pixelPanel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mapCreditsTitle"
          >
            <p id="mapCreditsTitle" className="mapAttribTitle">
              Map credits
            </p>
            <p className="muted mapAttribBody">
              Map data © OpenStreetMap contributors, available under the{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                ODbL
              </a>
              . Cartography based on the{' '}
              <a href="https://github.com/osm-americana/openstreetmap-americana" target="_blank" rel="noreferrer">
                OpenStreetMap Americana
              </a>{' '}
              style, recolored for this quest. Map powered by{' '}
              <a href="https://maplibre.org/" target="_blank" rel="noreferrer">
                MapLibre GL
              </a>
              .
            </p>
            <button type="button" className="btn secondary mapAttribClose" onClick={() => setAttribOpen(false)}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
