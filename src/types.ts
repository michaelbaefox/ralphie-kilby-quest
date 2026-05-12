export type PoiKind = 'gas' | 'food' | 'rest' | 'supplies' | 'landmark' | 'fun' | 'emergency'

export type PoiImage = {
  /**
   * Bundled local image path relative to `public/` (e.g. "/poi/carhenge.jpg" or
   * "poi/carhenge.jpg"). Loaded first. Pass through `assetUrl()` at render time
   * so the path resolves under the current Vite `base` (e.g. on GitHub project Pages).
   */
  src: string
  /** Optional remote URL (Wikimedia, etc.) tried only if bundled `src` fails to load (missing file or offline cache miss). */
  remote?: string
  alt: string
  credit?: string
}

export type Poi = {
  id: string
  name: string
  kind: PoiKind
  lat: number
  lng: number
  note: string
  url?: string
  alongRouteHint?: string
  /** Legacy single hero image at the top of the detail modal. */
  image?: PoiImage
  /** Multiple hero photos (carousel). When set and non-empty, overrides `image`. */
  images?: PoiImage[]
  /** Plain-text history. Use blank lines (\n\n) to break paragraphs. */
  history?: string
  /** 2-5 short bullet items. */
  funFacts?: string[]
  /** Tap-to-call number; rendered as tel: link. */
  phone?: string
  /** Human-readable address shown under the title. */
  address?: string
  /** Canonical website (separate from `url`, which stays as a generic link slot for legacy data). */
  website?: string
}

export type NarrativeStep = {
  id: string
  title: string
  body: string
  minProgress: number
  stateHint?: string
}

export type SceneryTheme = {
  id: string
  label: string
  minProgress: number
  maxProgress: number
  skyTop: string
  skyBottom: string
  farColor: string
  midColor: string
  nearColor: string
  roadColor: string
  accent: string
}

export type StateSegment = {
  id: string
  name: string
  startProgress: number
  endProgress: number
  /** IANA time zone identifier for this segment, e.g. "America/Chicago". */
  tz: string
}

export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm'

export type TimeOfDay = 'night' | 'dawn' | 'goldenHour' | 'day' | 'dusk'

export type WeatherSnapshot = {
  condition: WeatherCondition
  temperatureF: number
  precipitationMm: number
  cloudCoverPct: number
  windMph: number
  fetchedAt: number
  source: 'open-meteo' | 'climatology'
}

export type ForecastWaypoint = {
  id: string
  label: string
  lat: number
  lng: number
  alongMiles: number
  etaMs: number
  condition: WeatherCondition
  temperatureF: number
  source: 'open-meteo' | 'climatology'
}

/** clip-path polygon() strings for Road scroll horizon bands (far / mid / near). */
export type RoadHorizonClipSet = {
  far: string
  mid: string
  near: string
}

export type AppSettings = {
  units: 'mi' | 'km'
  reduceMotion: boolean
  largeText: boolean
  highContrast: boolean
  coPilotMode: boolean
  parkedMode: boolean
  allowOnlineBoost: boolean
  devSimulateProgress: number | null
  /** Dev: force Road scroll to homeward (east) layout + scroll without decreasing progress */
  devRoadPreviewEastbound: boolean
  /** ISO timestamp the player chose for the trip start (or null = "right now"). */
  departTimeIso: string | null
  /** Flavor only: 1 PLAYER (Ralphie solo) or 2 PLAYERS. */
  partySize: 1 | 2
  /** True after the player completes the Press Start intro. */
  introCompleted: boolean
}

export type AchievementIconKey =
  | 'accept_quest'
  | 'first_mile'
  | 'century'
  | 'halfway'
  | 'nebraska'
  | 'wyoming'
  | 'utah'
  | 'inn'
  | 'rest_quest'
  | 'inventory'

export type AchievementDef = {
  id: string
  title: string
  description: string
  iconKey: AchievementIconKey
}

export type AchievementUnlock = {
  id: string
  unlockedAt: number
}
