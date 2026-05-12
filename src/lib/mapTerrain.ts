import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import terrainRegions from '../data/terrain_style_regions.json'
import terrainMeta from '../data/terrain_style_regions.meta.json'

/** Public Terrain-RGB tiles (no API key). Coverage is limited — see README. */
export const PUBLIC_DEM_TILEJSON = 'https://demotiles.maplibre.org/terrain-tiles/tiles.json'

type TerrainMetaFile = { default: string; regions: Record<string, string> }

export const buildTerrainRegionFillColorExpr = (): unknown => {
  const meta = terrainMeta as TerrainMetaFile
  const expr: unknown[] = ['match', ['get', 'regionId']]
  for (const [rid, rgba] of Object.entries(meta.regions)) {
    expr.push(rid, rgba)
  }
  expr.push(meta.default)
  return expr
}

export const findBeforeRoadLayerId = (style: StyleSpecification): string | undefined => {
  const layers = style.layers
  if (!layers) return undefined

  for (const layer of layers) {
    const id = layer.id ?? ''
    const low = id.toLowerCase()
    const sl = (layer as { 'source-layer'?: string })['source-layer'] ?? ''
    if (layer.type !== 'line') continue
    if (sl === 'transportation' || sl.startsWith('transportation')) return id
    if (/motorway|trunk|primary|secondary|road|street|highway|ramp/.test(low)) return id
  }

  const firstLine = layers.find((l) => l.type === 'line')
  return firstLine?.id
}

const DEM_SOURCE_ID = 'kilby-dem-public'
const HILLSHADE_LAYER_ID = 'kilby-hillshade'
const REGION_SOURCE_ID = 'kilby-terrain-style-regions'
const REGION_FILL_LAYER_ID = 'kilby-terrain-region-fill'

/** Hillshade (public DEM where tiles exist) + low-opacity physiographic tint fills under roads. */
export const addKilbyTerrainLayers = (map: MapLibreMap) => {
  const spec = map.getStyle() as StyleSpecification
  const beforeId = findBeforeRoadLayerId(spec)

  if (!map.getSource(DEM_SOURCE_ID)) {
    try {
      map.addSource(DEM_SOURCE_ID, {
        type: 'raster-dem',
        url: PUBLIC_DEM_TILEJSON,
        tileSize: 256,
      })
      map.addLayer(
        {
          id: HILLSHADE_LAYER_ID,
          type: 'hillshade',
          source: DEM_SOURCE_ID,
          paint: {
            'hillshade-shadow-color': '#1a2228',
            'hillshade-highlight-color': '#4a5660',
            'hillshade-accent-color': '#2c343c',
            'hillshade-exaggeration': 0.18,
            'hillshade-illumination-direction': 335,
            'hillshade-illumination-anchor': 'viewport',
          },
        },
        beforeId,
      )
    } catch {
      /* Optional: unsupported or blocked */
    }
  }

  if (!map.getSource(REGION_SOURCE_ID)) {
    map.addSource(REGION_SOURCE_ID, {
      type: 'geojson',
      data: terrainRegions as FeatureCollection,
    })
    map.addLayer(
      {
        id: REGION_FILL_LAYER_ID,
        type: 'fill',
        source: REGION_SOURCE_ID,
        paint: {
          'fill-color': buildTerrainRegionFillColorExpr() as never,
          'fill-antialias': true,
        },
      },
      beforeId,
    )
  }
}
