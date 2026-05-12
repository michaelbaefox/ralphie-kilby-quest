import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded'
import ExploreRounded from '@mui/icons-material/ExploreRounded'
import DirectionsRunRounded from '@mui/icons-material/DirectionsRunRounded'
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded'
import GrassRounded from '@mui/icons-material/GrassRounded'
import LandscapeRounded from '@mui/icons-material/LandscapeRounded'
import TerrainRounded from '@mui/icons-material/TerrainRounded'
import HotelRounded from '@mui/icons-material/HotelRounded'
import LocalCafeRounded from '@mui/icons-material/LocalCafeRounded'
import BackpackRounded from '@mui/icons-material/BackpackRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useTrip } from '../context/TripContext'
import { BrutalIcon } from '../components/BrutalIcon'
import type { AchievementIconKey } from '../types'

const ACHIEVEMENT_ICON: Record<AchievementIconKey, SvgIconComponent> = {
  accept_quest: MilitaryTechRounded,
  first_mile: ExploreRounded,
  century: DirectionsRunRounded,
  halfway: EmojiEventsRounded,
  nebraska: GrassRounded,
  wyoming: LandscapeRounded,
  utah: TerrainRounded,
  inn: HotelRounded,
  rest_quest: LocalCafeRounded,
  inventory: BackpackRounded,
}

export const Achievements = () => {
  const trip = useTrip()

  return (
    <div className="pixelPanel">
      <h2>Achievements</h2>
      <p className="muted">Badges for miles, state crossings, and trip checklist wins.</p>
      <div className="list">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = trip.unlockedAchievementIds.has(a.id)
          return (
            <div key={a.id} className="listItem" style={{ opacity: unlocked ? 1 : 0.55 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                  <BrutalIcon
                    Icon={ACHIEVEMENT_ICON[a.iconKey]}
                    variant="tile"
                    size={28}
                    tone={unlocked ? 'gold' : 'ink'}
                  />
                  <div>
                    <strong>{a.title}</strong>
                    <div className="muted">{a.description}</div>
                  </div>
                </div>
                <span className="tag">{unlocked ? 'Unlocked' : 'Locked'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
