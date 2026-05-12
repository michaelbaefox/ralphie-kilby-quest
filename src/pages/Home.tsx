import { Link } from 'react-router-dom'
import MapRounded from '@mui/icons-material/MapRounded'
import DirectionsCarFilledRounded from '@mui/icons-material/DirectionsCarFilledRounded'
import BackpackRounded from '@mui/icons-material/BackpackRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import { useTrip } from '../context/TripContext'
import { formatDistance, ROUTE_TOTAL_MI } from '../lib/routeEngine'
import { BrutalIcon } from '../components/BrutalIcon'

type Tile = { to: string; Icon: SvgIconComponent; label: string }

const TILES: readonly Tile[] = [
  { to: '/overworld', Icon: MapRounded, label: 'Map' },
  { to: '/road', Icon: DirectionsCarFilledRounded, label: 'Road' },
  { to: '/supplies', Icon: BackpackRounded, label: 'Supplies' },
  { to: '/quest-log', Icon: MenuBookRounded, label: 'Quest log' },
  { to: '/achievements', Icon: MilitaryTechRounded, label: 'Medals' },
  { to: '/settings', Icon: SettingsRounded, label: 'Settings' },
] as const

export const Home = () => {
  const trip = useTrip()
  const pct = Math.round(trip.progress * 100)
  const totalLabel = formatDistance(ROUTE_TOTAL_MI, trip.settings.units)
  const doneLabel = formatDistance(trip.alongMiles, trip.settings.units)

  return (
    <div className="pixelPanel">
      <h2>Quest board</h2>
      <p className="muted">
        Lansing → Bluffdale. Kilby Block Party <strong>May 15–17</strong>, checkout <strong>May 18</strong>.
      </p>
      <p>
        Quest progress: <strong>{pct}%</strong> ({doneLabel} / {totalLabel})
      </p>
      {trip.settings.coPilotMode && (
        <p className="muted">On the Road screen, tap a stop for the full rundown.</p>
      )}
      {trip.distanceOffRouteMi != null && trip.distanceOffRouteMi > 8 && (
        <p className="muted">
          {trip.distanceOffRouteMi.toFixed(0)} mi off-route — your bar on the board pauses until you’re back on the gold line.
        </p>
      )}
      <div className="navGrid">
        {TILES.map(({ to, Icon, label }) => (
          <Link key={to} className="navTile" to={to} aria-label={label}>
            <BrutalIcon Icon={Icon} variant="tile" size={32} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
