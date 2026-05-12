import type { SpriteDef } from './pixelArt'

/**
 * Hand-pixelled 16-bit-style sprites used by the Road scroll weather/time-of-day
 * system. Whitespace in each row is ignored, so the grids read top-down like
 * pixel art on graph paper. Single-character keys map to the sprite's palette.
 *
 * Palette colours intentionally echo the existing `cloud-pixel-*.svg` set
 * (`#f4f8fc` highlight, `#dce8f4` shadow) so the new sprites blend with what's
 * already on the road.
 */

/** 12x12 sun: golden ring, warm inner glow, hot white core. Pair with a CSS halo. */
export const SUN_DAY: SpriteDef = {
  rows: [
    '. . . Y Y Y Y Y Y . . .',
    '. . Y O O O O O O Y . .',
    '. Y O O W W W W O O Y .',
    'Y O O W W H H W W O O Y',
    'Y O W W H W W H W W O Y',
    'Y O W H W W W W H W O Y',
    'Y O W H W W W W H W O Y',
    'Y O W W H W W H W W O Y',
    'Y O O W W H H W W O O Y',
    '. Y O O W W W W O O Y .',
    '. . Y O O O O O O Y . .',
    '. . . Y Y Y Y Y Y . . .',
  ],
  palette: {
    Y: '#ffcf3f',
    O: '#ff9a1f',
    W: '#fff2b0',
    H: '#ffffff',
  },
}

/** Warmer dusk/dawn sun (used at low altitude). */
export const SUN_GOLDEN: SpriteDef = {
  rows: SUN_DAY.rows,
  palette: {
    Y: '#ff9c3f',
    O: '#ff6a1f',
    W: '#ffd28a',
    H: '#fff5c0',
  },
}

/** 12x12 left-facing crescent moon. Cool-white face, slate-blue crater shadows. */
export const MOON_CRESCENT: SpriteDef = {
  rows: [
    '. . . F F F F F . . . .',
    '. . F F F F F F F . . .',
    '. F F F C C F F F F . .',
    '. F F C . . C F F F . .',
    'F F C . . . . C F F F .',
    'F F C . . . . . F F F .',
    'F F C . . . . . F F F .',
    'F F C . . . . C F F F .',
    '. F F C . . C F F F . .',
    '. F F F C C F F F F . .',
    '. . F F F F F F F . . .',
    '. . . F F F F F . . . .',
  ],
  palette: {
    F: '#f4f8fc',
    C: '#cfd8e4',
  },
}

/** 5x5 four-point star with hot white centre. */
export const STAR_TWINKLE: SpriteDef = {
  rows: [
    '. . S . .',
    '. . S . .',
    'S S H S S',
    '. . S . .',
    '. . S . .',
  ],
  palette: {
    S: '#cfd8e4',
    H: '#ffffff',
  },
}

/** 5x5 plus-shaped pinprick star (dimmer fill star). */
export const STAR_DIM: SpriteDef = {
  rows: [
    '. . . . .',
    '. . D . .',
    '. D D D .',
    '. . D . .',
    '. . . . .',
  ],
  palette: {
    D: '#9fb1c8',
  },
}

/** 3x5 raindrop. */
export const RAINDROP: SpriteDef = {
  rows: [
    '. B .',
    '. B .',
    'B I B',
    'B I B',
    '. B .',
  ],
  palette: {
    B: '#6f8db0',
    I: '#bcd4ec',
  },
}

/** 5x5 snowflake. */
export const SNOWFLAKE: SpriteDef = {
  rows: [
    'W . W . W',
    '. W W W .',
    'W W H W W',
    '. W W W .',
    'W . W . W',
  ],
  palette: {
    W: '#f4f8fc',
    H: '#ffffff',
  },
}

/** 5x9 jagged lightning bolt. */
export const LIGHTNING_BOLT: SpriteDef = {
  rows: [
    '. . Y Y .',
    '. . Y . .',
    '. Y Y . .',
    '. Y . . .',
    'Y Y Y Y .',
    '. . Y . .',
    '. Y Y . .',
    '. Y . . .',
    'Y . . . .',
  ],
  palette: {
    Y: '#fff8a0',
  },
}

/** Compact 7x4 condition glyph: a sun for the HUD pill / Overworld marker. */
export const GLYPH_SUN: SpriteDef = {
  rows: [
    '. . Y Y Y . .',
    '. Y O O O Y .',
    '. Y O O O Y .',
    '. . Y Y Y . .',
  ],
  palette: {
    Y: '#ffcf3f',
    O: '#ff9a1f',
  },
}

/** 7x4 cloud glyph (overcast / partly-cloudy / drizzle / rain hint). */
export const GLYPH_CLOUD: SpriteDef = {
  rows: [
    '. . F F F . .',
    '. F F F F F .',
    'F F F F F F F',
    '. C C C C C .',
  ],
  palette: {
    F: '#f4f8fc',
    C: '#dce8f4',
  },
}

/** 7x4 cloud + rain streaks. */
export const GLYPH_RAIN: SpriteDef = {
  rows: [
    '. F F F F F .',
    'F F F F F F F',
    '. C C C C C .',
    '. B . B . B .',
  ],
  palette: {
    F: '#f4f8fc',
    C: '#dce8f4',
    B: '#6f8db0',
  },
}

/** 7x4 cloud + snow dots. */
export const GLYPH_SNOW: SpriteDef = {
  rows: [
    '. F F F F F .',
    'F F F F F F F',
    '. C C C C C .',
    '. W . W . W .',
  ],
  palette: {
    F: '#f4f8fc',
    C: '#dce8f4',
    W: '#ffffff',
  },
}

/** 7x4 thunderstorm (cloud + bolt). */
export const GLYPH_STORM: SpriteDef = {
  rows: [
    '. F F F F F .',
    'F F F F F F F',
    '. C C C C C .',
    '. . Y Y . . .',
  ],
  palette: {
    F: '#f4f8fc',
    C: '#dce8f4',
    Y: '#fff8a0',
  },
}

/** 7x4 fog (stacked horizontal bars). */
export const GLYPH_FOG: SpriteDef = {
  rows: [
    'F F F F F F F',
    '. . . . . . .',
    'F F F F F F F',
    '. . F F F . .',
  ],
  palette: {
    F: '#cfd8e4',
  },
}

/** 7x4 crescent moon glyph for night. */
export const GLYPH_MOON: SpriteDef = {
  rows: [
    '. . F F F . .',
    '. F F . . . .',
    '. F F . . . .',
    '. . F F F . .',
  ],
  palette: {
    F: '#f4f8fc',
  },
}
