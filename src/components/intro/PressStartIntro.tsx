import { useCallback, useEffect, useRef, useState } from 'react'
import { useTrip } from '../../context/TripContext'
import { isoAtLocalHour } from '../../lib/timezones'
import { PixelSprite } from '../PixelSprite'
import { SUN_GOLDEN } from '../../lib/pixelSprites'

type Step = 'title' | 'party' | 'depart'

const HOME_TZ = 'America/Detroit'

/** Picks today vs tomorrow for the "first light" / "tonight" presets, based on current Detroit time. */
const detroitHourNow = (): number => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: HOME_TZ,
      hour: 'numeric',
      hour12: false,
    })
    const parts = fmt.formatToParts(new Date())
    const h = parts.find((p) => p.type === 'hour')
    return h ? Number(h.value) : new Date().getHours()
  } catch {
    return new Date().getHours()
  }
}

const computeFirstLightIso = (): string => {
  const offset: 0 | 1 = detroitHourNow() < 7 ? 0 : 1
  return isoAtLocalHour(HOME_TZ, 7, offset)
}

const computeTonightIso = (): string => {
  const offset: 0 | 1 = detroitHourNow() < 20 ? 0 : 1
  return isoAtLocalHour(HOME_TZ, 20, offset)
}

const formatPreviewIso = (iso: string | null): string => {
  if (!iso) return 'right now'
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: HOME_TZ,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

type MenuItem<T> = {
  value: T
  label: string
  hint?: string
}

type RpgMenuProps<T> = {
  items: readonly MenuItem<T>[]
  onSelect: (value: T) => void
  initialIndex?: number
  ariaLabel: string
}

const RpgMenu = <T,>({ items, onSelect, initialIndex = 0, ariaLabel }: RpgMenuProps<T>) => {
  const [focus, setFocus] = useState(initialIndex)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    refs.current[focus]?.focus()
  }, [focus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocus((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocus((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const item = items[focus]
      if (item) onSelect(item.value)
    }
  }

  return (
    <div className="introMenu" role="menu" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      {items.map((item, i) => (
        <button
          key={String(item.value)}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          className={`introMenuItem${i === focus ? ' is-focused' : ''}`}
          role="menuitem"
          onMouseEnter={() => setFocus(i)}
          onClick={() => onSelect(item.value)}
        >
          <span className="introMenuCursor">{i === focus ? '\u25B6' : ' '}</span>
          <span>
            {item.label}
            {item.hint ? <span className="muted" style={{ marginLeft: 8 }}>{item.hint}</span> : null}
          </span>
        </button>
      ))}
    </div>
  )
}

export const PressStartIntro = () => {
  const trip = useTrip()
  const [step, setStep] = useState<Step>('title')
  const [customIso, setCustomIso] = useState<string>(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() + 1)
    return d.toISOString().slice(0, 16)
  })
  const [showCustomTime, setShowCustomTime] = useState(false)

  const titleRef = useRef<HTMLButtonElement>(null)

  const handleTitleAdvance = useCallback(() => {
    setStep('party')
  }, [])

  useEffect(() => {
    if (step !== 'title') return
    titleRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (step === 'title') return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      if (step === 'party') {
        setStep('title')
        return
      }
      if (step === 'depart') {
        if (showCustomTime) setShowCustomTime(false)
        else setStep('party')
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [step, showCustomTime])

  const handleSelectParty = async (size: 1 | 2) => {
    await trip.setSettings({ partySize: size })
    setStep('depart')
  }

  const finishWithDepart = async (iso: string | null) => {
    await trip.setSettings({ departTimeIso: iso, introCompleted: true })
  }

  const handleSelectDepart = (
    choice: 'now' | 'first-light' | 'tonight' | 'custom',
  ) => {
    if (choice === 'now') {
      void finishWithDepart(null)
      return
    }
    if (choice === 'first-light') {
      void finishWithDepart(computeFirstLightIso())
      return
    }
    if (choice === 'tonight') {
      void finishWithDepart(computeTonightIso())
      return
    }
    setShowCustomTime(true)
  }

  const handleCustomConfirm = () => {
    const local = customIso
    if (!local) {
      void finishWithDepart(null)
      return
    }
    const asDate = new Date(local)
    if (Number.isNaN(asDate.getTime())) {
      void finishWithDepart(null)
      return
    }
    void finishWithDepart(asDate.toISOString())
  }

  return (
    <div
      className="introOverlay animHud"
      data-motion={trip.settings.reduceMotion ? 'off' : 'on'}
      role="dialog"
      aria-modal="true"
      aria-label="Kilby QueQueQuest — Press Start"
    >
      {step === 'title' && (
        <button
          ref={titleRef}
          type="button"
          className="introCard introCard--button"
          aria-label="Press Start to begin the quest"
          onClick={handleTitleAdvance}
        >
          <div className="introHero">
            <div className="introHeroSunWrap">
              <div
                className="celestialHalo"
                style={{
                  width: 110,
                  height: 110,
                  top: -20,
                  left: -20,
                }}
              />
              <PixelSprite sprite={SUN_GOLDEN} scale={6} label="Quest sunrise" />
            </div>
          </div>
          <h1 className="introTitle">KILBY QUEQUEQUEST</h1>
          <p className="introSubtitle">Lansing → Bluffdale</p>
          <p className="introPrompt introPrompt--blink">PRESS START</p>
        </button>
      )}

      {step === 'party' && (
        <div className="introCard">
          <h1 className="introTitle">CHOOSE YOUR PARTY</h1>
          <p className="introSubtitle">{"Who's on the run?"}</p>
          <RpgMenu
            ariaLabel="Choose your party"
            items={[
              { value: 1, label: '1 PLAYER', hint: 'Ralphie, solo' },
              { value: 2, label: '2 PLAYERS', hint: 'Ralphie + a friend' },
            ]}
            onSelect={(v) => void handleSelectParty(v as 1 | 2)}
          />
        </div>
      )}

      {step === 'depart' && (
        <div className="introCard">
          <h1 className="introTitle">THE QUEST BEGINS...</h1>
          <p className="introSubtitle">When do you roll out? Sets your arrival clocks.</p>
          {!showCustomTime ? (
            <RpgMenu
              ariaLabel="When does the quest begin"
              items={[
                { value: 'now', label: 'RIGHT NOW', hint: 'Weather from right now' },
                {
                  value: 'first-light',
                  label: 'AT FIRST LIGHT',
                  hint: formatPreviewIso(computeFirstLightIso()),
                },
                {
                  value: 'tonight',
                  label: 'LATER TONIGHT',
                  hint: formatPreviewIso(computeTonightIso()),
                },
                { value: 'custom', label: "I'LL SET A TIME \u25B8" },
              ]}
              onSelect={(v) =>
                handleSelectDepart(v as 'now' | 'first-light' | 'tonight' | 'custom')
              }
            />
          ) : (
            <div className="introCustomTime">
              <label className="introSubtitle" htmlFor="introCustomTimeInput">
                CHOOSE A DEPARTURE
              </label>
              <input
                id="introCustomTimeInput"
                type="datetime-local"
                value={customIso}
                onChange={(e) => setCustomIso(e.target.value)}
              />
              <div className="introActions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowCustomTime(false)}
                >
                  Back
                </button>
                <button type="button" className="btn" onClick={handleCustomConfirm}>
                  Begin the quest
                </button>
              </div>
            </div>
          )}
          <p className="introNote">Change wheels-up time later in Settings.</p>
        </div>
      )}
    </div>
  )
}
