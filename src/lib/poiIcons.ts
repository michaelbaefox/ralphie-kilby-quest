import LocalGasStationRounded from '@mui/icons-material/LocalGasStationRounded'
import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import LocalCafeRounded from '@mui/icons-material/LocalCafeRounded'
import BackpackRounded from '@mui/icons-material/BackpackRounded'
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded'
import MusicNoteRounded from '@mui/icons-material/MusicNoteRounded'
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import type { PoiKind } from '../types'

export const POI_KIND_ICON: Record<PoiKind, SvgIconComponent> = {
  gas: LocalGasStationRounded,
  food: RestaurantRounded,
  rest: LocalCafeRounded,
  supplies: BackpackRounded,
  landmark: AccountBalanceRounded,
  fun: MusicNoteRounded,
  emergency: LocalHospitalRounded,
}

export const POI_KIND_LABEL: Record<PoiKind, string> = {
  gas: 'Gas',
  food: 'Food',
  rest: 'Rest',
  supplies: 'Supplies',
  landmark: 'Landmark',
  fun: 'Fun',
  emergency: 'Emergency',
}
