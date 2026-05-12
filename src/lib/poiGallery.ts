import type { Poi, PoiImage } from '../types'

/** Bundled hero slides for the POI modal. Prefer `images` when present; otherwise legacy `image`. */
export const getPoiHeroSlides = (poi: Poi): PoiImage[] => {
  if (poi.images?.length) return poi.images
  if (poi.image) return [poi.image]
  return []
}
