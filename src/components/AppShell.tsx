import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import HomeRounded from '@mui/icons-material/HomeRounded'
import MapRounded from '@mui/icons-material/MapRounded'
import DirectionsCarFilledRounded from '@mui/icons-material/DirectionsCarFilledRounded'
import BackpackRounded from '@mui/icons-material/BackpackRounded'
import MenuBookRounded from '@mui/icons-material/MenuBookRounded'
import MilitaryTechRounded from '@mui/icons-material/MilitaryTechRounded'
import SettingsRounded from '@mui/icons-material/SettingsRounded'
import MenuRounded from '@mui/icons-material/MenuRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import type { SvgIconComponent } from '@mui/icons-material'
import { useTrip } from '../context/TripContext'
import { useWeather } from '../context/WeatherProvider'
import { formatLocalClock } from '../lib/timezones'
import { BrutalIcon } from './BrutalIcon'
import { ConditionGlyph } from './ConditionGlyph'
import { describeCondition } from '../lib/conditionLabels'

type NavItem = { to: string; label: string; Icon: SvgIconComponent; end?: boolean }

const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Quests', Icon: HomeRounded, end: true },
  { to: '/overworld', label: 'Map', Icon: MapRounded },
  { to: '/road', label: 'Road', Icon: DirectionsCarFilledRounded },
  { to: '/supplies', label: 'Supplies', Icon: BackpackRounded },
  { to: '/quest-log', label: 'Log', Icon: MenuBookRounded },
] as const

const MENU_NAV_ITEMS: readonly NavItem[] = [
  { to: '/achievements', label: 'Medals', Icon: MilitaryTechRounded },
  { to: '/settings', label: 'Settings', Icon: SettingsRounded },
] as const

export const AppShell = () => {
  const trip = useTrip()
  const weather = useWeather()
  const location = useLocation()
  const motion = trip.settings.reduceMotion ? 'off' : 'on'

  const useCelsius = trip.settings.units === 'km'
  const tempLabel = weather.current
    ? useCelsius
      ? `${Math.round(((weather.current.temperatureF - 32) * 5) / 9)}\u00B0C`
      : `${Math.round(weather.current.temperatureF)}\u00B0F`
    : null
  const localTime = formatLocalClock(weather.tz, weather.localNow)
  const tzSuffix = weather.tzLabel ? ` ${weather.tzLabel}` : ''
  const conditionAria = weather.current
    ? `, ${describeCondition(weather.current.condition, weather.sun.tod)}, ${tempLabel}`
    : ''
  const offlineSuffix = weather.isOffline ? ' (offline)' : ''
  const pillAria = `Local time ${localTime}${tzSuffix}${conditionAria}${offlineSuffix}`

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    queueMicrotask(closeMenu)
  }, [location.pathname, closeMenu])

  useEffect(() => {
    if (!menuOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        buttonRef.current?.focus()
      }
    }

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      closeMenu()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [menuOpen, closeMenu])

  const handleToggleMenu = () => setMenuOpen((open) => !open)

  return (
    <div
      className="appShell animHud"
      data-motion={motion}
      data-large-text={trip.settings.largeText ? 'true' : 'false'}
      data-high-contrast={trip.settings.highContrast ? 'true' : 'false'}
    >
      <header className="topBar">
        <h1 className="hudGlow">Kilby QueQueQuest</h1>
        <div className="topBarRight">
          <span className="pill floatSprite hudWeatherPill" aria-label={pillAria}>
            <span>{trip.stateLabel}</span>
            <span className="hudPillSep" aria-hidden>|</span>
            <span>{localTime}{tzSuffix}</span>
            {weather.current && (
              <>
                <ConditionGlyph
                  condition={weather.current.condition}
                  tod={weather.sun.tod}
                  scale={1}
                  className="hudConditionGlyph"
                />
                <span>{tempLabel}</span>
              </>
            )}
            {weather.isOffline && <span className="hudPillOffline">(offline)</span>}
          </span>
          <button
            ref={buttonRef}
            type="button"
            className="topBarMenuButton"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="appShellMenu"
            aria-haspopup="menu"
            onClick={handleToggleMenu}
          >
            <BrutalIcon
              Icon={menuOpen ? CloseRounded : MenuRounded}
              variant="inline"
              size={22}
              tone="gold"
            />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              id="appShellMenu"
              className="topBarMenu pixelPanel"
              role="menu"
              aria-label="More pages"
            >
              {MENU_NAV_ITEMS.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `topBarMenuLink${isActive ? ' is-active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  <BrutalIcon Icon={Icon} variant="inline" size={18} tone="gold" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <Outlet />
      </main>
      <nav className="bottomNav" aria-label="Main navigation">
        {PRIMARY_NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `bottomNavLink${isActive ? ' is-active' : ''}`}
            aria-label={label}
          >
            <BrutalIcon Icon={Icon} variant="nav" size={22} />
            <span className="bottomNavLabel">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
