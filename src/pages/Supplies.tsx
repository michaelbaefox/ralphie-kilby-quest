import { useMemo, useState } from 'react'
import { formatDistance, listPois, milesAheadOfProgress, ROUTE_TOTAL_MI } from '../lib/routeEngine'
import { useTrip } from '../context/TripContext'
import type { Poi, PoiKind } from '../types'
import { PoiDetailModal } from '../components/PoiDetailModal'

const KINDS: { id: PoiKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'gas', label: 'Gas' },
  { id: 'food', label: 'Food' },
  { id: 'rest', label: 'Rest' },
  { id: 'supplies', label: 'Supplies' },
  { id: 'landmark', label: 'Landmarks' },
  { id: 'fun', label: 'Fun' },
  { id: 'emergency', label: 'Emergency' },
]

export const Supplies = () => {
  const trip = useTrip()
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('all')
  const [activePoi, setActivePoi] = useState<Poi | null>(null)

  const rows = useMemo(() => {
    const pois = listPois()
      .filter((p) => kind === 'all' || p.kind === kind)
      .map((p) => {
        const ahead = milesAheadOfProgress(trip.progress, p)
        return { p, ahead }
      })
      .sort((a, b) => {
        const aa = a.ahead >= 0 ? a.ahead : ROUTE_TOTAL_MI + a.ahead
        const bb = b.ahead >= 0 ? b.ahead : ROUTE_TOTAL_MI + b.ahead
        return aa - bb
      })
    return pois
  }, [kind, trip.progress])

  return (
    <div className="pixelPanel">
      <h2>Supplies & stops</h2>
      <p className="muted">Stops and towns from Lansing to Kilby. Tap a row for the full card.</p>
      <div className="row" style={{ marginBottom: 10, gap: 8 }}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className="btn secondary"
            onClick={() => setKind(k.id)}
            style={{ opacity: kind === k.id ? 1 : 0.65 }}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="list">
        {rows.map(({ p, ahead }) => (
          <button
            key={p.id}
            type="button"
            className="suppliesRowButton"
            onClick={() => setActivePoi(p)}
            aria-label={`Open details for ${p.name}`}
          >
            <div className="listItem">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <span className="tag">{p.kind}</span>
                  <strong>{p.name}</strong>
                </div>
                <div className="muted" style={{ fontSize: 18 }}>
                  {ahead >= 0
                    ? `${formatDistance(ahead, trip.settings.units)} ahead`
                    : `${formatDistance(-ahead, trip.settings.units)} behind`}
                </div>
              </div>
              <div className="muted">{p.note}</div>
              {p.alongRouteHint && <div className="muted">{p.alongRouteHint}</div>}
            </div>
          </button>
        ))}
      </div>
      <PoiDetailModal
        poi={activePoi}
        allowOnlineLinks={trip.settings.allowOnlineBoost}
        onClose={() => setActivePoi(null)}
      />
    </div>
  )
}
