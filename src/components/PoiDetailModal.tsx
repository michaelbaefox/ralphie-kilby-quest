import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import LanguageRounded from '@mui/icons-material/LanguageRounded'
import DirectionsRounded from '@mui/icons-material/DirectionsRounded'
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded'
import type { Poi, PoiImage, PoiKind } from '../types'
import { useTrip } from '../context/TripContext'
import { BrutalIcon } from './BrutalIcon'
import { POI_KIND_ICON, POI_KIND_LABEL } from '../lib/poiIcons'
import { buildAppleMapsUrl, buildGoogleMapsUrl, buildTelHref } from '../lib/mapsLinks'
import { getPoiHeroSlides } from '../lib/poiGallery'
import { assetUrl } from '../lib/assetUrl'

type Props = {
  poi: Poi | null
  /** When false, Maps and external website buttons stay hidden (hero photos still load their `remote` URL if the local file is missing). */
  allowOnlineLinks: boolean
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const PoiHeroSlide = ({ image, kind }: { image: PoiImage; kind: PoiKind }) => {
  const [stage, setStage] = useState<'local' | 'remote' | 'fallback'>('local')

  if (stage === 'fallback') {
    return (
      <div className="poiModalHeroFallback" aria-hidden>
        <BrutalIcon Icon={POI_KIND_ICON[kind]} variant="tile" size={56} tone="gold" />
      </div>
    )
  }

  // Local `image.src` is relative to public/; rewrite for the current base path.
  // `image.remote` is an absolute external URL (e.g. Wikimedia) — pass through as-is.
  const src = stage === 'local' ? assetUrl(image.src) : image.remote
  if (!src) {
    return (
      <div className="poiModalHeroFallback" aria-hidden>
        <BrutalIcon Icon={POI_KIND_ICON[kind]} variant="tile" size={56} tone="gold" />
      </div>
    )
  }

  return (
    <figure className="poiModalHero">
      <img
        key={`${stage}-${src}`}
        className="poiModalHeroImg"
        src={src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (stage === 'local' && image.remote) {
            setStage('remote')
            return
          }
          setStage('fallback')
        }}
      />
      {image.credit && <figcaption className="poiModalHeroCredit">{image.credit}</figcaption>}
    </figure>
  )
}

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handle = () => setReduce(mq.matches)
    handle()
    mq.addEventListener('change', handle)
    return () => mq.removeEventListener('change', handle)
  }, [])
  return reduce
}

const PoiImageCarousel = ({
  slides,
  kind,
  galleryLabel,
  appReduceMotion,
}: {
  slides: PoiImage[]
  kind: PoiKind
  galleryLabel: string
  appReduceMotion: boolean
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = usePrefersReducedMotion() || appReduceMotion
  const scrollRaf = useRef<number | null>(null)

  const updateIndexFromScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth || 1
    const idx = Math.round(el.scrollLeft / w)
    setActiveIndex(Math.min(slides.length - 1, Math.max(0, idx)))
  }, [slides.length])

  const handleScroll = () => {
    if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current)
    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = null
      updateIndexFromScroll()
    })
  }

  const scrollToIdx = useCallback(
    (i: number) => {
      const el = scrollRef.current
      if (!el) return
      const w = el.clientWidth
      const behavior = reduceMotion ? ('instant' as ScrollBehavior) : ('smooth' as ScrollBehavior)
      el.scrollTo({ left: i * w, behavior })
    },
    [reduceMotion],
  )

  const handlePrev = () => scrollToIdx(Math.max(0, activeIndex - 1))
  const handleNext = () => scrollToIdx(Math.min(slides.length - 1, activeIndex + 1))

  const handleCarouselKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el) return
    const w = el.clientWidth || 1
    const idx = Math.round(el.scrollLeft / w)
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollToIdx(Math.max(0, idx - 1))
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollToIdx(Math.min(slides.length - 1, idx + 1))
    }
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => updateIndexFromScroll())
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateIndexFromScroll])

  useEffect(
    () => () => {
      if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current)
    },
    [],
  )

  const atStart = activeIndex <= 0
  const atEnd = activeIndex >= slides.length - 1

  return (
    <div className="poiModalCarouselShell">
      <div className="poiModalCarouselViewport">
        <button
          type="button"
          className="poiModalCarouselFab poiModalCarouselFab--prev"
          onClick={handlePrev}
          disabled={atStart}
          aria-label="Previous photo"
        >
          <BrutalIcon Icon={ChevronLeftRounded} variant="inline" size={22} tone="ink" />
        </button>
        <div
          ref={scrollRef}
          className="poiModalCarouselTrack"
          onScroll={handleScroll}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={galleryLabel}
          onKeyDown={handleCarouselKeyDown}
        >
          {slides.map((img, i) => (
            <div
              key={`slide-${i}`}
              className="poiModalCarouselSlide"
              aria-hidden={activeIndex !== i}
            >
              <PoiHeroSlide
                key={`${img.src}-${img.remote ?? ''}-${i}`}
                image={img}
                kind={kind}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="poiModalCarouselFab poiModalCarouselFab--next"
          onClick={handleNext}
          disabled={atEnd}
          aria-label="Next photo"
        >
          <BrutalIcon Icon={ChevronRightRounded} variant="inline" size={22} tone="ink" />
        </button>
      </div>
      <div className="poiModalCarouselDots" role="group" aria-label="Choose photo">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`poiModalCarouselDot${activeIndex === i ? ' is-active' : ''}`}
            onClick={() => scrollToIdx(i)}
            aria-label={`Photo ${i + 1} of ${slides.length}`}
            aria-current={activeIndex === i ? true : undefined}
          />
        ))}
      </div>
      <p className="poiModalCarouselSr" aria-live="polite">
        Photo {activeIndex + 1} of {slides.length}
      </p>
    </div>
  )
}

const PoiHero = ({ poi, appReduceMotion }: { poi: Poi; appReduceMotion: boolean }) => {
  const slides = useMemo(() => getPoiHeroSlides(poi), [poi])

  if (slides.length === 0) {
    return (
      <div className="poiModalHeroFallback" aria-hidden>
        <BrutalIcon Icon={POI_KIND_ICON[poi.kind]} variant="tile" size={56} tone="gold" />
      </div>
    )
  }

  if (slides.length === 1) {
    return (
      <PoiHeroSlide
        key={`${poi.id}-solo`}
        image={slides[0]!}
        kind={poi.kind}
      />
    )
  }

  return (
    <PoiImageCarousel
      slides={slides}
      kind={poi.kind}
      galleryLabel={`Photos for ${poi.name}`}
      appReduceMotion={appReduceMotion}
    />
  )
}

export const PoiDetailModal = ({ poi, allowOnlineLinks, onClose }: Props) => {
  const trip = useTrip()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = poi ? `poi-modal-title-${poi.id}` : 'poi-modal-title'
  /** Stable between POI A ↔ B so scroll-lock/focus-restore only runs on open/close. */
  const modalOpenState = poi ? 'open' : 'closed'

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  /** Open / close only — avoid restoring focus when swapping POI while modal stays open. */
  useEffect(() => {
    if (modalOpenState === 'closed') return
    previousFocusRef.current = (document.activeElement as HTMLElement | null) ?? null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus?.()
    }
  }, [modalOpenState])

  /** Initial focus when opening or when the displayed POI changes. */
  useEffect(() => {
    if (!poi) return
    const dialog = dialogRef.current
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    focusables?.[0]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refocus when poi id changes
  }, [poi?.id])

  useEffect(() => {
    if (!poi) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [poi, handleClose])

  const historyParagraphs = useMemo(
    () => (poi?.history ? poi.history.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : []),
    [poi],
  )

  if (!poi) return null

  const hasFunFacts = poi.funFacts && poi.funFacts.length > 0
  const hasContact = Boolean(poi.phone) || (allowOnlineLinks && Boolean(poi.website))
  const subtitle = poi.address ?? poi.alongRouteHint ?? null

  return (
    <div
      className="poiModalBackdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className="poiModalDialog pixelPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
      >
        <button
          type="button"
          className="poiModalCloseFab"
          onClick={handleClose}
          aria-label="Close stop details"
        >
          <BrutalIcon Icon={CloseRounded} variant="inline" size={18} tone="ink" />
        </button>

        <PoiHero key={poi.id} poi={poi} appReduceMotion={trip.settings.reduceMotion} />

        <div className="poiModalScroll">
          <header className="poiModalHeader">
            <div className="poiModalHeaderIcon">
              <BrutalIcon Icon={POI_KIND_ICON[poi.kind]} variant="tile" size={24} />
            </div>
            <div className="poiModalHeaderText">
              <p className="poiModalKind">{POI_KIND_LABEL[poi.kind]}</p>
              <h3 id={titleId} className="poiModalTitle">
                {poi.name}
              </h3>
              {subtitle && <p className="poiModalSubtitle">{subtitle}</p>}
            </div>
          </header>

          <section className="poiModalSection">
            <h4>About</h4>
            <p>{poi.note}</p>
          </section>

          {historyParagraphs.length > 0 && (
            <section className="poiModalSection">
              <h4>History</h4>
              {historyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          )}

          {hasFunFacts && (
            <section className="poiModalSection">
              <h4>Fun facts</h4>
              <ul className="poiModalFacts">
                {poi.funFacts!.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </section>
          )}

          {hasContact && (
            <section className="poiModalSection">
              <h4>Contact</h4>
              <div className="poiModalActions">
                {poi.phone && (
                  <a className="btn secondary poiModalAction" href={buildTelHref(poi.phone)}>
                    <BrutalIcon Icon={PhoneRounded} variant="inline" size={16} />
                    <span>{poi.phone}</span>
                  </a>
                )}
                {allowOnlineLinks && poi.website && (
                  <a
                    className="btn secondary poiModalAction"
                    href={poi.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BrutalIcon Icon={LanguageRounded} variant="inline" size={16} />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </section>
          )}

          <section className="poiModalSection">
            <h4>Get there</h4>
            {allowOnlineLinks ? (
              <div className="poiModalActions">
                <a
                  className="btn poiModalAction"
                  href={buildGoogleMapsUrl(poi.lat, poi.lng, poi.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BrutalIcon Icon={DirectionsRounded} variant="inline" size={16} tone="ink" />
                  <span>Google Maps</span>
                </a>
                <a
                  className="btn secondary poiModalAction"
                  href={buildAppleMapsUrl(poi.lat, poi.lng, poi.name)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BrutalIcon Icon={DirectionsRounded} variant="inline" size={16} />
                  <span>Apple Maps</span>
                </a>
                {poi.url && poi.url !== poi.website && (
                  <a
                    className="btn secondary poiModalAction"
                    href={poi.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BrutalIcon Icon={OpenInNewRounded} variant="inline" size={16} />
                    <span>More info</span>
                  </a>
                )}
              </div>
            ) : (
              <p className="muted">
                External maps off (Settings). {poi.lat.toFixed(3)}, {poi.lng.toFixed(3)}
              </p>
            )}
          </section>
        </div>

        <div className="poiModalFooter">
          <button type="button" className="btn secondary poiModalCloseBtn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
