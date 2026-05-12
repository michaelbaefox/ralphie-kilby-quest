/** Pixel loop for repeating road stripe (matches `repeating-linear-gradient` 26px + 18px). */
export const ROAD_STRIPE_PERIOD_PX = 44

/** One hill tile width — duplicated in RoadScroll for horizontal wrap (must match JSX). */
export const HILL_TILE_PX = 480

/** Horizontal width of one cloud strip (imgs + gaps) — must match JSX + CSS. */
export const CLOUD_BACK_CYCLE_PX = 5 * 72 + 4 * 24
export const CLOUD_MID_CYCLE_PX = 4 * 72 + 3 * 24
export const CLOUD_FRONT_CYCLE_PX = 3 * 56 + 2 * 24

export const wrapPx = (value: number, period: number): number => {
  if (period <= 0 || !Number.isFinite(period)) return value
  return ((value % period) + period) % period
}

/** Far → near parallax factors (multiply `scrollPhase`, then loop where needed). */
export const ROAD_PARALLAX = {
  cloudBack: 0.15,
  cloudMid: 0.24,
  cloudFront: 0.34,
  farHill: 0.14,
  midHill: 0.24,
  nearHill: 0.38,
  shoulder: 0.46,
  stripe: 0.58,
  poi: 0.4,
} as const
