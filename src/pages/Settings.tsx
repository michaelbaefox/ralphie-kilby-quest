import { useState } from 'react'
import { clearAllLocalData } from '../db'
import { useTrip } from '../context/TripContext'
import { ROUTE_TOTAL_MI } from '../lib/routeEngine'

const SIM_TAPS_NEEDED = 5
const SIM_FORCE_ENABLED = import.meta.env.VITE_ENABLE_SIM === '1'

export const Settings = () => {
  const trip = useTrip()
  const [busy, setBusy] = useState(false)
  const [simTaps, setSimTaps] = useState(0)
  const simEnabled = SIM_FORCE_ENABLED || simTaps >= SIM_TAPS_NEEDED

  const handleClear = async () => {
    if (!confirm('Clear all local quest data on this device?')) return
    setBusy(true)
    try {
      await clearAllLocalData()
      await trip.refreshAchievements()
      await trip.setSettings({
        units: 'mi',
        reduceMotion: false,
        largeText: false,
        highContrast: false,
        coPilotMode: true,
        parkedMode: false,
        allowOnlineBoost: true,
        devSimulateProgress: null,
        devRoadPreviewEastbound: false,
        departTimeIso: null,
        partySize: 1,
        introCompleted: false,
      })
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  const shareEta = () => {
    const text = encodeURIComponent(
      `Hey MichaelBayFox — Ralphie update from Kilby QueQueQuest. Rough progress: ${Math.round(trip.progress * 100)}% along the trip plan.`,
    )
    window.open(`sms:&body=${text}`, '_blank')
  }

  const handleDevChipTap = () => {
    if (simEnabled) return
    setSimTaps((n) => n + 1)
  }

  return (
    <div className="pixelPanel">
      <h2>Adventurer settings</h2>
      <section className="list">
        <div className="listItem">
          <strong>Location</strong>
          <p className="muted">
            Puts your dot on the gold route. Needs location permission and a secure site (HTTPS); updates stay
            light on the battery.
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={trip.requestGps} disabled={trip.gpsActive}>
              Start tracking my trip
            </button>
            <button type="button" className="btn secondary" onClick={trip.stopGps} disabled={!trip.gpsActive}>
              Stop tracking
            </button>
          </div>
          {trip.gpsError && <p style={{ color: 'var(--danger)' }}>{trip.gpsError}</p>}
          {trip.gpsActive && <p className="muted">Tracking on.</p>}
        </div>

        <div className="listItem">
          <strong>Parked confirmations</strong>
          <p className="muted">Park first.</p>
          <div className="row">
            <button
              type="button"
              className="btn secondary"
              onClick={() => trip.updateManualFlags({ rest_break: true })}
            >
              I took a rest break
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => trip.updateManualFlags({ supplies_check: true })}
            >
              Supplies checklist done
            </button>
          </div>
        </div>

        <div className="listItem">
          <strong>Display & motion</strong>
          <label className="row" style={{ marginTop: 8 }}>
            <input
              type="checkbox"
              checked={trip.settings.units === 'km'}
              onChange={(e) => void trip.setSettings({ units: e.target.checked ? 'km' : 'mi' })}
            />
            Use kilometers
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.largeText}
              onChange={(e) => void trip.setSettings({ largeText: e.target.checked })}
            />
            Larger text
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.highContrast}
              onChange={(e) => void trip.setSettings({ highContrast: e.target.checked })}
            />
            High contrast
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.reduceMotion}
              onChange={(e) => void trip.setSettings({ reduceMotion: e.target.checked })}
            />
            Reduce motion
          </label>
        </div>

        <div className="listItem">
          <strong>Safety toggles</strong>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.coPilotMode}
              onChange={(e) => void trip.setSettings({ coPilotMode: e.target.checked })}
            />
            Show co-pilot reminders
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.parkedMode}
              onChange={(e) => void trip.setSettings({ parkedMode: e.target.checked })}
            />
            I am parked (planning mode)
          </label>
          <label className="row">
            <input
              type="checkbox"
              checked={trip.settings.allowOnlineBoost}
              onChange={(e) => void trip.setSettings({ allowOnlineBoost: e.target.checked })}
            />
            Allow online map links
          </label>
        </div>

        {simEnabled && (
          <div className="listItem">
            <strong>Trip simulator (hidden mode)</strong>
            <p className="muted">
              Slide to jump your quest percent — no GPS. <strong>100%</strong> is almost Kilby, <strong>0%</strong>{' '}
              is Lansing.
            </p>
            <div className="sliderRow">
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round((trip.settings.devSimulateProgress ?? trip.progress) * 1000)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 1000
                  void trip.setSettings({ devSimulateProgress: v })
                }}
              />
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span className="muted">
                  Simulated: {Math.round((trip.settings.devSimulateProgress ?? trip.progress) * 100)}%
                </span>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => void trip.setSettings({ devSimulateProgress: null })}
                >
                  Use my real location
                </button>
              </div>
              <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    const base = trip.settings.devSimulateProgress ?? trip.progress
                    void trip.setSettings({
                      devSimulateProgress: Math.max(0, Math.min(1, base - 0.05)),
                    })
                  }}
                >
                  Nudge −5% (toward Lansing)
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    const base = trip.settings.devSimulateProgress ?? trip.progress
                    void trip.setSettings({
                      devSimulateProgress: Math.min(1, Math.max(0, base + 0.05)),
                    })
                  }}
                >
                  Nudge +5% (toward Kilby)
                </button>
              </div>
              <label className="row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={trip.settings.devRoadPreviewEastbound}
                  onChange={(e) =>
                    void trip.setSettings({ devRoadPreviewEastbound: e.target.checked })
                  }
                />
                Eastbound preview — flip the drive for fun (dev)
              </label>
            </div>
          </div>
        )}

        <div className="listItem">
          <strong>Prius notes</strong>
          <ul className="muted" style={{ paddingLeft: 18 }}>
            <li>12V drains if the car sits too long between drives.</li>
            <li>Long descents: light braking; check the manual for regen behavior.</li>
            <li>Wyoming: gusty wind next to trucks.</li>
          </ul>
        </div>

        <div className="listItem">
          <strong>Emergency card</strong>
          <p className="muted">Paper backup. Phones fail.</p>
          <ul className="muted" style={{ paddingLeft: 18 }}>
            <li>Roadside assistance number from your insurance card</li>
            <li>Non-emergency police lines for states you cross</li>
            <li>Airbnb host contact (saved separately)</li>
          </ul>
        </div>

        <div className="listItem">
          <strong>Share ping</strong>
          <p className="muted">Opens a text draft when your phone allows.</p>
          <button type="button" className="btn secondary" onClick={shareEta}>
            Text MichaelBayFox a quick update
          </button>
        </div>

        <div className="listItem">
          <strong>Privacy</strong>
          <p className="muted">Location never leaves this device. Map links open in your maps app.</p>
        </div>

        <div className="listItem">
          <strong>Trip details</strong>
          <p className="muted">
            ~{ROUTE_TOTAL_MI.toFixed(0)} mi Lansing → Bluffdale (I-80 corridor).
          </p>
        </div>

        <div className="listItem">
          <strong>Replay the intro</strong>
          <p className="muted">Intro only — party and depart time. Progress and medals unchanged.</p>
          <button
            type="button"
            className="btn secondary"
            onClick={() =>
              void trip.setSettings({ introCompleted: false, departTimeIso: null })
            }
          >
            &#9656; Restart your quest
          </button>
        </div>

        <div className="row">
          <button type="button" className="btn danger" disabled={busy} onClick={handleClear}>
            Clear local data
          </button>
          <button type="button" className="btn secondary" onClick={() => window.location.reload()}>
            Restart the adventure
          </button>
        </div>

        <p className="settingsDevToolsFooter">
          <button
            type="button"
            className="settingsDevChip"
            onClick={handleDevChipTap}
            aria-label="Reveal developer tools"
            disabled={simEnabled}
          >
            Dev tools
          </button>
        </p>
      </section>
    </div>
  )
}
