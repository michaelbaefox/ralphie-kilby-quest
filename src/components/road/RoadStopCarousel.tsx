import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEventHandler, PointerEventHandler } from 'react'
import type { ForecastWaypoint, Poi } from '../../types'
import type { TimeOfDay, WeatherCondition } from '../../types'
import { ConditionGlyph } from '../ConditionGlyph'
import { formatLocalClock } from '../../lib/timezones'

export type RoadStopCarouselItem = {
  poi: Poi
  aheadMiles: number
  /** Wall-clock ETA at this stop (depart time + miles / avg speed). */
  etaMs: number
  wx?: ForecastWaypoint
}

type RoadStopCarouselProps = {
  items: readonly RoadStopCarouselItem[]
  activePoiId: string | null
  onOpenPoi: (poi: Poi) => void
  tz: string
  sunTod: TimeOfDay
  useCelsius: boolean
  /** Westbound toward Kilby: left / west on the map matches farther stops (higher index). East preview keeps classic prev/next. */
  tripHeadingWest: boolean
  /** When set, a compact “Hide” control appears on the toolbar (screen readers use aria-label). */
  onRequestHide?: () => void
  className?: string
}

const CarouselChevron = ({ direction }: { direction: 'prev' | 'next' }) => (
  <svg
    className="roadStopCarouselChevron"
    width="10"
    height="12"
    viewBox="0 0 10 12"
    aria-hidden
    focusable="false"
  >
    {direction === 'prev' ? (
      <polygon points="9,1 9,11 1,6" fill="currentColor" />
    ) : (
      <polygon points="1,1 1,11 9,6" fill="currentColor" />
    )}
  </svg>
)

const toTempLabel = (useCelsius: boolean, temperatureF: number): string => {
  if (!useCelsius) return `${Math.round(temperatureF)}\u00B0F`
  const c = ((temperatureF - 32) * 5) / 9
  return `${Math.round(c)}\u00B0C`
}

const toConditionAria = (condition: WeatherCondition | undefined, sunTod: TimeOfDay) => {
  if (!condition) return 'Mixed weather'
  // ConditionGlyph already has label logic via `describeCondition`.
  // Here we keep aria simple and robust.
  if (condition === 'clear') return sunTod === 'night' ? 'Clear night' : 'Sunny'
  if (condition === 'partlyCloudy') return 'Partly cloudy'
  if (condition === 'overcast') return 'Overcast'
  if (condition === 'fog') return 'Foggy'
  if (condition === 'drizzle') return 'Light rain'
  if (condition === 'rain') return 'Rain'
  if (condition === 'snow') return 'Snow'
  if (condition === 'thunderstorm') return 'Thunderstorm'
  return 'Mixed weather'
}

export const RoadStopCarousel = ({
  items,
  activePoiId,
  onOpenPoi,
  tz,
  sunTod,
  useCelsius,
  tripHeadingWest,
  onRequestHide,
  className,
}: RoadStopCarouselProps) => {
  const [index, setIndex] = useState(0)
  const swipeStartX = useRef<number | null>(null)
  const swipeActivePointerId = useRef<number | null>(null)
  const suppressCardClickRef = useRef(false)

  useEffect(() => {
    queueMicrotask(() => {
      setIndex((i) => Math.max(0, Math.min(items.length - 1, i)))
    })
  }, [items.length])

  const current = items[index]

  const canPrev = index > 0
  const canNext = index < items.length - 1

  const aria = useMemo(() => {
    if (!current) return 'No upcoming stops'
    const eta = formatLocalClock(tz, new Date(current.etaMs))
    const wx = current.wx
    if (!wx) {
      return `${current.poi.name}. ${current.aheadMiles.toFixed(0)} miles ahead. ETA ${eta}. Tap for more.`
    }
    return `${current.poi.name}. ${current.aheadMiles.toFixed(0)} miles ahead. ETA ${eta}. ${toTempLabel(
      useCelsius,
      wx.temperatureF,
    )}. ${toConditionAria(wx.condition, sunTod)}. Tap for more.`
  }, [current, tz, sunTod, useCelsius])

  const handlePrev = () => {
    if (!canPrev) return
    setIndex((i) => i - 1)
  }

  const handleNext = () => {
    if (!canNext) return
    setIndex((i) => i + 1)
  }

  const swipeThresholdPx = 48

  const handlePointerDown: PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
    /* Avoid competing with arrow / Hide taps (those use click, not horizontal swipe). */
    if ((e.target as HTMLElement).closest('.roadStopCarouselNavBtn, .roadStopCarouselToggle')) return
    swipeStartX.current = e.clientX
    swipeActivePointerId.current = e.pointerId
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* setPointerCapture optional */
    }
  }

  const handlePointerUp: PointerEventHandler<HTMLDivElement> = (e) => {
    if (swipeActivePointerId.current !== e.pointerId) return
    swipeActivePointerId.current = null
    const startX = swipeStartX.current
    swipeStartX.current = null
    if (startX == null) return
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
    const dx = e.clientX - startX
    if (Math.abs(dx) < swipeThresholdPx) return
    /** Westbound: finger moves right (east / Lansing) → closer stop; left (west / Kilby) → farther. */
    const goPrev = tripHeadingWest ? dx < 0 && canPrev : dx > 0 && canPrev
    const goNext = tripHeadingWest ? dx > 0 && canNext : dx < 0 && canNext
    if (!goPrev && !goNext) return
    suppressCardClickRef.current = true
    window.setTimeout(() => {
      suppressCardClickRef.current = false
    }, 320)
    if (goPrev) handlePrev()
    else handleNext()
  }

  const handlePointerCancel: PointerEventHandler<HTMLDivElement> = (e) => {
    if (swipeActivePointerId.current === e.pointerId) {
      swipeActivePointerId.current = null
      swipeStartX.current = null
    }
  }

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (tripHeadingWest) handleNext()
      else handlePrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (tripHeadingWest) handlePrev()
      else handleNext()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (current) onOpenPoi(current.poi)
    }
  }

  if (!current) return null

  const wx = current.wx
  const etaLabel = formatLocalClock(tz, new Date(current.etaMs))
  const isActive = activePoiId === current.poi.id

  return (
    <div
      className={className ?? 'roadStopCarousel'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="region"
      aria-label="Upcoming stop carousel"
    >
      <div className="roadStopCarouselTopRow">
        <div className="roadStopCarouselTopRowNav">
          <button
            type="button"
            className="roadStopCarouselNavBtn"
            onClick={tripHeadingWest ? handleNext : handlePrev}
            aria-label={
              tripHeadingWest ? 'Next stop toward Kilby (west along route)' : 'Previous stop'
            }
            disabled={tripHeadingWest ? !canNext : !canPrev}
          >
            <CarouselChevron direction="prev" />
          </button>

          <div className="roadStopCarouselDots" aria-hidden>
            {items.map((_, i) => (
              <span key={String(i)} className={`roadStopCarouselDot${i === index ? ' is-active' : ''}`} />
            ))}
          </div>

          <button
            type="button"
            className="roadStopCarouselNavBtn"
            onClick={tripHeadingWest ? handlePrev : handleNext}
            aria-label={
              tripHeadingWest ? 'Previous stop toward Lansing (east along route)' : 'Next stop'
            }
            disabled={tripHeadingWest ? !canPrev : !canNext}
          >
            <CarouselChevron direction="next" />
          </button>
        </div>

        {onRequestHide ? (
          <button
            type="button"
            className="roadStopCarouselToggle roadStopCarouselToggle--toolbar"
            onClick={onRequestHide}
            aria-label="Hide upcoming stop carousel"
          >
            Hide
          </button>
        ) : null}
      </div>

      {items.length === 1 ? (
        <p className="roadStopCarouselSingleHint muted">One stop ahead — tap for the full card.</p>
      ) : null}

      <button
        type="button"
        className={`roadStopCarouselCard${isActive ? ' is-active' : ''}`}
        onClick={() => {
          if (suppressCardClickRef.current) return
          onOpenPoi(current.poi)
        }}
        aria-label={aria}
      >
        <div className="roadStopCarouselCardTop">
          <div className="roadStopCarouselDist">{current.aheadMiles.toFixed(0)} mi</div>
          <div className="roadStopCarouselName">{current.poi.name}</div>
        </div>

        <div className="roadStopCarouselEta">
          <span className="roadStopCarouselEtaLabel">ETA</span>
          <span className="roadStopCarouselEtaTime">{etaLabel}</span>
        </div>

        {wx ? (
          <div className="roadStopCarouselWx">
            <ConditionGlyph condition={wx.condition} tod={sunTod} scale={1} />
            <span>{toTempLabel(useCelsius, wx.temperatureF)}</span>
          </div>
        ) : null}
      </button>
    </div>
  )
}

