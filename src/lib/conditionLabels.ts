import type { TimeOfDay, WeatherCondition } from '../types'

/** Human-readable description for a weather condition + (optional) time of day. */
export const describeCondition = (
  condition: WeatherCondition,
  tod?: TimeOfDay,
): string => {
  switch (condition) {
    case 'clear':
      return tod === 'night' ? 'Clear night' : 'Sunny'
    case 'partlyCloudy':
      return 'Partly cloudy'
    case 'overcast':
      return 'Overcast'
    case 'fog':
      return 'Foggy'
    case 'drizzle':
      return 'Light rain'
    case 'rain':
      return 'Rain'
    case 'snow':
      return 'Snow'
    case 'thunderstorm':
      return 'Thunderstorm'
    default:
      return 'Mixed weather'
  }
}
