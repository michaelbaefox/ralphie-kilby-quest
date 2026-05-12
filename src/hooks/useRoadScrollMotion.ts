import { useEffect, useRef, useState } from 'react'

const PROGRESS_EPS = 0.004
/** Pixels per second — base flow speed when on route (stripes/hills multiply on top in the view) */
const FLOW_SPEED_PX = 168

/**
 * Continuous scroll offset + toward-Kilby vs return-home from GPS/demo progress deltas.
 * Optional dev preview forces eastbound (homeward) UI for testing without driving back.
 */
export const useRoadScrollMotion = (
  progress: number,
  reduceMotion: boolean,
  previewEastbound: boolean,
): { scrollPhase: number; headingWest: boolean } => {
  const [flowOffset, setFlowOffset] = useState(0)
  const [headingWestFromDelta, setHeadingWestFromDelta] = useState(true)
  const progressRef = useRef(progress)
  const prevProgressRef = useRef(progress)
  const dirSignRef = useRef(1)

  useEffect(() => {
    progressRef.current = progress
    if (previewEastbound) {
      dirSignRef.current = -1
      prevProgressRef.current = progress
      return
    }
    const d = progress - prevProgressRef.current
    prevProgressRef.current = progress
    if (Math.abs(d) > 3e-6) {
      const west = d > 0
      dirSignRef.current = west ? 1 : -1
      setHeadingWestFromDelta(west)
    }
  }, [progress, previewEastbound])

  const headingWest = previewEastbound ? false : headingWestFromDelta

  useEffect(() => {
    if (reduceMotion) return
    let id = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000)
      last = now
      const p = progressRef.current
      const onRoad = p > PROGRESS_EPS && p < 1 - PROGRESS_EPS
      if (onRoad) {
        setFlowOffset((f) => f + FLOW_SPEED_PX * dt * dirSignRef.current)
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [reduceMotion])

  const scrollPhase = progress * 820 + flowOffset

  return { scrollPhase, headingWest }
}
