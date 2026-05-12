import stateSegments from '../data/state_segments.json'
import type { StateSegment } from '../types'

const SEGMENTS = stateSegments as StateSegment[]

const FALLBACK_TZ = 'America/Detroit'

/** Returns the IANA tz for the segment a given progress value lands in. */
export const getTimezoneForProgress = (progress: number): string => {
  const p = Math.min(1, Math.max(0, progress))
  const hit = SEGMENTS.find((s, i) => {
    const last = i === SEGMENTS.length - 1
    return p >= s.startProgress && (last ? p <= s.endProgress + 1e-6 : p < s.endProgress)
  })
  return hit?.tz ?? FALLBACK_TZ
}

/** Returns a short readable label like "ET" / "CT" / "MT" / "PT" for the given tz at the given date. */
export const getTimezoneShortLabel = (tz: string, date: Date = new Date()): string => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    })
    const parts = fmt.formatToParts(date)
    const part = parts.find((p) => p.type === 'timeZoneName')
    return part?.value ?? ''
  } catch {
    return ''
  }
}

/** Formats a date as a local clock string (e.g. "4:12 PM") for the given tz. */
export const formatLocalClock = (tz: string, date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }
}

/**
 * Returns an ISO timestamp at the given hour today (or tomorrow) in the given tz.
 * Used by the Press Start intro to translate "AT FIRST LIGHT" / "LATER TONIGHT"
 * into an actual ISO string.
 */
export const isoAtLocalHour = (tz: string, hour: number, dayOffset: 0 | 1 = 0): string => {
  const now = new Date()
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => Number(localParts.find((p) => p.type === type)?.value ?? '0')

  const yyyy = get('year')
  const mm = get('month')
  const dd = get('day') + dayOffset

  // Build a local-naive ISO and let the Date constructor in UTC + tz offset math sort it out.
  // We approximate by computing the offset in minutes between UTC and the tz at this date.
  const naiveUtc = Date.UTC(yyyy, mm - 1, dd, hour, 0, 0, 0)
  const offsetMs = getTzOffsetMs(tz, new Date(naiveUtc))
  return new Date(naiveUtc - offsetMs).toISOString()
}

/** Returns the offset (in ms) between UTC and the given tz at the given instant. */
const getTzOffsetMs = (tz: string, at: Date): number => {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const parts = dtf.formatToParts(at)
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0')
    const local = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    )
    return local - at.getTime()
  } catch {
    return 0
  }
}
