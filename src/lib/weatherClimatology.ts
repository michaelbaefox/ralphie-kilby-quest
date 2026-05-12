import type { WeatherCondition } from '../types'

/**
 * Coarse offline fallback for when the Open-Meteo fetch fails or the device is
 * offline. Numbers are NOAA-ish averages for I-80 corridor cities, rounded
 * generously. Index 0 is January, 11 is December. The trip happens mid-May
 * (months 4-5), so those entries are tuned to be the most accurate.
 */

type ClimRow = {
  /** Average daytime high in degrees Fahrenheit. */
  highF: number[]
  /** Most likely condition for that month, in priority order. */
  conditions: WeatherCondition[]
}

const CLIM: Record<string, ClimRow> = {
  MI: {
    highF: [30, 33, 44, 58, 70, 79, 83, 81, 73, 60, 47, 35],
    conditions: [
      'overcast', 'overcast', 'partlyCloudy', 'partlyCloudy', 'partlyCloudy',
      'partlyCloudy', 'partlyCloudy', 'partlyCloudy', 'partlyCloudy',
      'overcast', 'overcast', 'overcast',
    ],
  },
  IN: {
    highF: [36, 41, 52, 64, 74, 83, 86, 84, 78, 65, 52, 40],
    conditions: [
      'overcast', 'overcast', 'partlyCloudy', 'partlyCloudy', 'partlyCloudy',
      'partlyCloudy', 'thunderstorm', 'partlyCloudy', 'clear',
      'partlyCloudy', 'overcast', 'overcast',
    ],
  },
  IL: {
    highF: [33, 38, 50, 62, 73, 83, 86, 84, 77, 64, 49, 37],
    conditions: [
      'snow', 'overcast', 'partlyCloudy', 'partlyCloudy', 'thunderstorm',
      'thunderstorm', 'thunderstorm', 'partlyCloudy', 'clear',
      'partlyCloudy', 'overcast', 'snow',
    ],
  },
  IA: {
    highF: [30, 36, 49, 62, 73, 83, 86, 84, 77, 63, 47, 33],
    conditions: [
      'snow', 'snow', 'overcast', 'partlyCloudy', 'thunderstorm',
      'thunderstorm', 'thunderstorm', 'partlyCloudy', 'clear',
      'partlyCloudy', 'overcast', 'snow',
    ],
  },
  NE: {
    highF: [37, 42, 53, 64, 74, 84, 89, 87, 79, 66, 51, 39],
    conditions: [
      'clear', 'clear', 'partlyCloudy', 'partlyCloudy', 'thunderstorm',
      'thunderstorm', 'thunderstorm', 'clear', 'clear',
      'clear', 'partlyCloudy', 'snow',
    ],
  },
  WY: {
    highF: [36, 38, 46, 55, 65, 76, 84, 82, 73, 60, 45, 35],
    conditions: [
      'snow', 'clear', 'clear', 'partlyCloudy', 'thunderstorm',
      'thunderstorm', 'clear', 'clear', 'clear',
      'clear', 'snow', 'snow',
    ],
  },
  UT: {
    highF: [38, 44, 55, 63, 72, 84, 92, 89, 79, 66, 50, 39],
    conditions: [
      'snow', 'partlyCloudy', 'partlyCloudy', 'partlyCloudy', 'partlyCloudy',
      'clear', 'clear', 'clear', 'clear',
      'partlyCloudy', 'overcast', 'snow',
    ],
  },
}

/** Returns a coarse fallback {temperatureF, condition} for a given state + date. */
export const getClimatologyFallback = (
  stateId: string,
  date: Date = new Date(),
): { temperatureF: number; condition: WeatherCondition } => {
  const row = CLIM[stateId] ?? CLIM.IA
  const month = date.getMonth()
  return {
    temperatureF: row.highF[month] ?? 70,
    condition: row.conditions[month] ?? 'partlyCloudy',
  }
}
