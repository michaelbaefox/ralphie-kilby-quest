import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRoadScrollMotion } from '../hooks/useRoadScrollMotion'
import {
  getSceneryTheme,
  listPois,
  milesAheadOfProgress,
} from '../lib/routeEngine'
import { etaMsForMilesAhead } from '../lib/tripEta'
import { getRoadHorizonClips } from '../lib/roadHorizon'
import {
  CLOUD_BACK_CYCLE_PX,
  CLOUD_FRONT_CYCLE_PX,
  CLOUD_MID_CYCLE_PX,
  HILL_TILE_PX,
  ROAD_PARALLAX,
  ROAD_STRIPE_PERIOD_PX,
  wrapPx,
} from '../lib/roadScrollParallax'
import { useTrip } from '../context/TripContext'
import { useWeather } from '../context/WeatherProvider'
import { assetUrl } from '../lib/assetUrl'
import { blendSky } from '../lib/sun'
import { PoiDetailModal } from '../components/PoiDetailModal'
import { SkyAndCelestials } from '../components/road/SkyAndCelestials'
import { WeatherOverlay } from '../components/road/WeatherOverlay'
import { HeadlightCone } from '../components/road/HeadlightCone'
import { RoadStopCarousel } from '../components/road/RoadStopCarousel'
import type { ForecastWaypoint, Poi, WeatherCondition } from '../types'

/** One cycle of clouds per layer (duplicated in JSX for seamless wrap). Paths relative to `public/`. */
const CLOUD_BACK_IMGS = ['cloud-pixel-a.svg', 'cloud-pixel-b.svg', 'cloud-pixel-c.svg', 'cloud-pixel-a.svg', 'cloud-pixel-b.svg'] as const
const CLOUD_MID_IMGS = ['cloud-pixel-b.svg', 'cloud-pixel-c.svg', 'cloud-pixel-a.svg', 'cloud-pixel-b.svg'] as const
const CLOUD_FRONT_IMGS = ['cloud-pixel-c.svg', 'cloud-pixel-a.svg', 'cloud-pixel-b.svg'] as const

export const RoadScroll = () => {
  const trip = useTrip()
  const weather = useWeather()
  const theme = getSceneryTheme(trip.progress)
  const motion = trip.settings.reduceMotion || trip.settings.parkedMode ? 'off' : 'on'
  const { scrollPhase, headingWest } = useRoadScrollMotion(
    trip.progress,
    trip.settings.reduceMotion,
    trip.settings.devRoadPreviewEastbound,
  )

  const horizon = useMemo(() => getRoadHorizonClips(trip.progress), [trip.progress])

  // Sky tinting blends the biome theme with the time-of-day overlay.
  const sky = useMemo(
    () => blendSky(theme.skyTop, theme.skyBottom, weather.sun.tod, weather.sun.altitudeDeg),
    [theme.skyTop, theme.skyBottom, weather.sun.tod, weather.sun.altitudeDeg],
  )

  const stageRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState(360)
  useLayoutEffect(() => {
    const node = stageRef.current
    if (!node) return
    const measure = () => setStageWidth(node.clientWidth || 360)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  const upcoming = useMemo(() => {
    return listPois()
      .map((p) => ({ p, ahead: milesAheadOfProgress(trip.progress, p) }))
      .filter((x) => x.ahead > 0 && x.ahead < 220)
      .sort((a, b) => a.ahead - b.ahead)
      .slice(0, 8)
  }, [trip.progress])

  const upcomingWithWeather = useMemo(() => {
    return upcoming.map((u) => {
      const wp = pickClosestWaypoint(weather.forecast, u.ahead)
      return { ...u, wx: wp }
    })
  }, [upcoming, weather.forecast])

  const [activePoi, setActivePoi] = useState<Poi | null>(null)
  const [stopCarouselHidden, setStopCarouselHidden] = useState(false)

  const handleOpenPoi = useCallback((poi: Poi) => {
    setActivePoi(poi)
  }, [])

  const handleClosePoi = useCallback(() => {
    setActivePoi(null)
  }, [])

  const laneBobX = Math.sin(scrollPhase * 0.032) * 3
  const laneBobY = Math.sin(scrollPhase * 0.027) * 2
  const headingLabel = headingWest ? 'West toward Kilby' : 'East toward Lansing'

  const condition: WeatherCondition = weather.current?.condition ?? 'partlyCloudy'
  const temperatureF = weather.current?.temperatureF ?? 70
  const useCelsius = trip.settings.units === 'km'
  const cloudOpacity = condition === 'clear'
    ? 0.25
    : condition === 'partlyCloudy'
      ? 0.7
      : 1
  const cloudTint = condition === 'thunderstorm' || condition === 'overcast'
    ? 'brightness(0.7)'
    : condition === 'rain' || condition === 'drizzle'
      ? 'brightness(0.85)'
      : 'none'

  // Prius nose anchor for the headlight cone.
  const noseTop = 240 - 18 - 49 + 22
  const noseLeft = headingWest ? Math.max(0, stageWidth - 126) : 14 + 112

  /** Forward motion (car faces west): scenery drifts toward +X — use +scrollPhase. Looped strips wrap for seamless tiling. */
  const txCloudBack = wrapPx(scrollPhase * ROAD_PARALLAX.cloudBack, CLOUD_BACK_CYCLE_PX)
  const txCloudMid = wrapPx(scrollPhase * ROAD_PARALLAX.cloudMid, CLOUD_MID_CYCLE_PX)
  const txCloudFront = wrapPx(scrollPhase * ROAD_PARALLAX.cloudFront, CLOUD_FRONT_CYCLE_PX)
  const txFarHill = wrapPx(scrollPhase * ROAD_PARALLAX.farHill, HILL_TILE_PX)
  const txMidHill = wrapPx(scrollPhase * ROAD_PARALLAX.midHill, HILL_TILE_PX)
  const txNearHill = wrapPx(scrollPhase * ROAD_PARALLAX.nearHill, HILL_TILE_PX)
  const txShoulder = wrapPx(scrollPhase * ROAD_PARALLAX.shoulder, HILL_TILE_PX)
  const txStripe = wrapPx(scrollPhase * ROAD_PARALLAX.stripe, ROAD_STRIPE_PERIOD_PX)

  return (
    <div className="pixelPanel">
      <h2>The open road</h2>
      <p className="muted">
        Tap a stop in the row below for what's ahead.{' '}
        {headingWest ? 'Westbound → Kilby.' : 'Eastbound → Lansing.'}
      </p>
      <div
        ref={stageRef}
        className="roadStage animHud roadScrollPixel"
        data-motion={motion}
        style={{
          position: 'relative',
          height: 240,
          overflow: 'hidden',
          border: '2px solid var(--border)',
          borderRadius: 6,
          background: `linear-gradient(180deg, ${sky.top}, ${sky.bottom})`,
        }}
      >
        <SkyAndCelestials
          sun={weather.sun}
          stageWidth={stageWidth}
          stageHeight={240}
          starSeed={Math.floor(trip.progress * 1000) || 7}
        />
        <div
          className="roadScrollClouds"
          aria-hidden
          style={{ opacity: cloudOpacity, filter: cloudTint }}
        >
          <div
            className="roadScrollCloudTrack roadScrollCloudTrackBack hudGlow"
            style={{ transform: `translateX(${txCloudBack}px)` }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="roadScrollCloudDup">
                {CLOUD_BACK_IMGS.map((src, i) => (
                  <img key={`${dup}-${i}`} src={assetUrl(src)} alt="" className="roadScrollCloudImg" />
                ))}
              </div>
            ))}
          </div>
          <div
            className="roadScrollCloudTrack roadScrollCloudTrackMid hudGlow"
            style={{ transform: `translateX(${txCloudMid}px)` }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="roadScrollCloudDup">
                {CLOUD_MID_IMGS.map((src, i) => (
                  <img key={`${dup}-${i}`} src={assetUrl(src)} alt="" className="roadScrollCloudImg" />
                ))}
              </div>
            ))}
          </div>
          <div
            className="roadScrollCloudTrack roadScrollCloudTrackFront hudGlow"
            style={{ transform: `translateX(${txCloudFront}px)` }}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="roadScrollCloudDup">
                {CLOUD_FRONT_IMGS.map((src, i) => (
                  <img
                    key={`${dup}-${i}`}
                    src={assetUrl(src)}
                    alt=""
                    className="roadScrollCloudImg roadScrollCloudImgSmall"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lower wedge guard — narrow band only where mid/near layers overlap, so sky stays visible above peaks */}
        <div
          aria-hidden
          className="roadScrollHillCarpet"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 34,
            height: 28,
            zIndex: 0,
            pointerEvents: 'none',
            background: `linear-gradient(180deg, ${theme.midColor} 0%, ${theme.nearColor} 100%)`,
            opacity: 0.85,
          }}
        />

        <div
          aria-hidden
          className="roadScrollHillTrack roadHillLayer"
          style={{
            position: 'absolute',
            left: -HILL_TILE_PX,
            bottom: 70,
            display: 'flex',
            flexWrap: 'nowrap',
            width: 'max-content',
            transform: `translateX(${txFarHill}px)`,
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((dup) => (
            <div
              key={dup}
              className="roadScrollHillTile"
              style={{
                width: HILL_TILE_PX,
                height: 90,
                flexShrink: 0,
                background: `linear-gradient(180deg, transparent, ${theme.farColor})`,
                clipPath: horizon.far,
              }}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="roadScrollHillTrack roadHillLayer"
          style={{
            position: 'absolute',
            left: -HILL_TILE_PX,
            bottom: 52,
            display: 'flex',
            flexWrap: 'nowrap',
            width: 'max-content',
            transform: `translateX(${txMidHill}px)`,
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((dup) => (
            <div
              key={dup}
              className="roadScrollHillTile"
              style={{
                width: HILL_TILE_PX,
                height: 70,
                flexShrink: 0,
                background: theme.midColor,
                clipPath: horizon.mid,
                opacity: 0.95,
              }}
            />
          ))}
        </div>
        <div
          aria-hidden
          className="roadScrollHillTrack roadHillLayer"
          style={{
            position: 'absolute',
            left: -HILL_TILE_PX,
            bottom: 38,
            display: 'flex',
            flexWrap: 'nowrap',
            width: 'max-content',
            transform: `translateX(${txNearHill}px)`,
            zIndex: 1,
          }}
        >
          {[0, 1, 2].map((dup) => (
            <div
              key={dup}
              className="roadScrollHillTile"
              style={{
                width: HILL_TILE_PX,
                height: 50,
                flexShrink: 0,
                background: theme.nearColor,
                clipPath: horizon.near,
              }}
            />
          ))}
        </div>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 34,
            height: 10,
            background: 'var(--road-shoulder)',
            transform: `translateX(${txShoulder}px)`,
            opacity: 0.85,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 36,
            background: `linear-gradient(180deg, ${theme.roadColor}, var(--road-asphalt))`,
            borderTop: `3px solid ${theme.accent}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 10,
            height: 3,
            background: 'repeating-linear-gradient(90deg, var(--road-stripe) 0 26px, transparent 26px 44px)',
            opacity: 0.35,
            transform: `translateX(${txStripe}px)`,
          }}
        />
        <div className="roadScrollDither" aria-hidden />
        <WeatherOverlay
          condition={condition}
          temperatureF={temperatureF}
          stageWidth={stageWidth}
          stageHeight={240}
          motionOff={motion === 'off'}
          seed={Math.floor(trip.progress * 1000) || 11}
        />
        {weather.sun.tod === 'night' && (
          <HeadlightCone headingWest={headingWest} noseLeft={noseLeft} noseTop={noseTop} />
        )}
        <div className="roadStopCarouselHost">
          {stopCarouselHidden ? (
            <button
              type="button"
              className="roadStopCarouselToggle"
              onClick={() => setStopCarouselHidden(false)}
              aria-label="Show upcoming stop carousel"
            >
              Show stops
            </button>
          ) : upcomingWithWeather.length > 0 ? (
            <RoadStopCarousel
              items={upcomingWithWeather.map((u) => ({
                poi: u.p,
                aheadMiles: u.ahead,
                etaMs: etaMsForMilesAhead(u.ahead, trip.settings.departTimeIso),
                wx: u.wx,
              }))}
              activePoiId={activePoi?.id ?? null}
              onOpenPoi={handleOpenPoi}
              onRequestHide={() => setStopCarouselHidden(true)}
              tz={weather.tz}
              sunTod={weather.sun.tod}
              useCelsius={useCelsius}
              tripHeadingWest={headingWest}
            />
          ) : (
            <div className="roadStopCarouselEmpty muted">
              {trip.progress >= 0.985
                ? "You're nearly at Kilby — keep your eyes on the road."
                : 'No upcoming stops in the next 220 miles.'}
            </div>
          )}
        </div>
        <div
          className={`roadScrollCar ${headingWest ? 'roadScrollCar--west' : 'roadScrollCar--east'}`}
          style={{
            /* prius.svg is drawn facing west (nose left); mirror only when heading home / east */
            transform: `scaleX(${headingWest ? 1 : -1}) translate(${laneBobX}px, ${laneBobY}px)`,
          }}
        >
          <img
            className="roadScrollCarSprite roadScrollPixel"
            src={assetUrl('prius.svg')}
            alt="Your Prius on the road"
            width={112}
            height={49}
            decoding="async"
          />
        </div>
        <div className="roadScrollBiomeRibbon">
          {headingLabel}
          {' · '}
          {theme.label}
        </div>
      </div>
      <PoiDetailModal
        poi={activePoi}
        allowOnlineLinks={trip.settings.allowOnlineBoost}
        onClose={handleClosePoi}
      />
    </div>
  )
}

const pickClosestWaypoint = (
  forecast: ForecastWaypoint[],
  milesAhead: number,
): ForecastWaypoint | undefined => {
  if (forecast.length === 0) return undefined
  let best = forecast[0]
  let bestDelta = Math.abs(best!.alongMiles - milesAhead)
  for (let i = 1; i < forecast.length; i++) {
    const wp = forecast[i]!
    const d = Math.abs(wp.alongMiles - milesAhead)
    if (d < bestDelta) {
      best = wp
      bestDelta = d
    }
  }
  return best
}
