import { lazy, Suspense, useEffect, useState } from 'react'
import { useTrip } from '../context/TripContext'
import { useWeather } from '../context/WeatherProvider'
import { PoiDetailModal } from '../components/PoiDetailModal'
import { ConditionGlyph } from '../components/ConditionGlyph'
import { describeCondition } from '../lib/conditionLabels'
import { formatLocalClock } from '../lib/timezones'
import type { Poi } from '../types'

const AmericanaOverworldMap = lazy(async () => {
  const mod = await import('../components/AmericanaOverworldMap')
  return { default: mod.AmericanaOverworldMap }
})

export const Overworld = () => {
  const trip = useTrip()
  const weather = useWeather()
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [activePoi, setActivePoi] = useState<Poi | null>(null)
  const useCelsius = trip.settings.units === 'km'
  const upcomingForecast = weather.forecast.slice(0, 6)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="pixelPanel">
      <h2>World map</h2>
      <p className="muted">
        Gold line = your route. Red dot = you. Pins are pit stops — tap one.
      </p>
      {!online && (
        <p className="muted" style={{ marginBottom: 12 }}>
          Go online once to grab the map — then you can use it offline.
        </p>
      )}
      <Suspense
        fallback={
          <div className="americanaMap americanaMapFallback" role="status">
            Loading map…
          </div>
        }
      >
        {online ? (
          <AmericanaOverworldMap
            progress={trip.progress}
            reduceMotion={trip.settings.reduceMotion}
            onPoiSelect={setActivePoi}
          />
        ) : (
          <div className="americanaMap americanaMapFallback">
            <p>
              <strong>Offline.</strong>
            </p>
            <p className="muted">Hop online once to download the map.</p>
          </div>
        )}
      </Suspense>
      <p style={{ marginTop: 12 }}>
        You're in <strong>{trip.stateLabel}</strong> — <strong>{Math.round(trip.progress * 100)}%</strong> of the
        way to Kilby.
      </p>

      {upcomingForecast.length > 0 && (
        <section className="overworldForecast" aria-label="Weather up ahead on the route">
          <h3 className="overworldForecastTitle">Weather up ahead</h3>
          <ul className="overworldForecastList">
            {upcomingForecast.map((wp) => {
              const eta = formatLocalClock(weather.tz, new Date(wp.etaMs))
              const tempLabel = useCelsius
                ? `${Math.round(((wp.temperatureF - 32) * 5) / 9)}\u00B0C`
                : `${Math.round(wp.temperatureF)}\u00B0F`
              return (
                <li key={wp.id} className="overworldForecastItem">
                  <ConditionGlyph condition={wp.condition} scale={2} />
                  <div className="overworldForecastInfo">
                    <strong>{wp.label}</strong>
                    <span className="muted">
                      {eta} &middot; {tempLabel} &middot; {describeCondition(wp.condition)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          {weather.isOffline && (
            <p className="muted" style={{ marginTop: 6 }}>
              Offline: rough seasonal weather until you’re back online.
            </p>
          )}
        </section>
      )}
      <PoiDetailModal
        poi={activePoi}
        allowOnlineLinks={trip.settings.allowOnlineBoost}
        onClose={() => setActivePoi(null)}
      />
    </div>
  )
}
