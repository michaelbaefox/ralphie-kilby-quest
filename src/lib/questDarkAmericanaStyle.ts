/**
 * Darkness-first fork of MapLibre style JSON for Americana — matches the app shell
 * (forest / charcoal greens) instead of pastel parchment.
 * Second pass fixes symbol layers so labels read on dark fills.
 */

import type { StyleSpecification } from 'maplibre-gl'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const expandHexBody = (body: string) => {
  if (body.length === 3) {
    return body
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return body
}

const hexToRgb = (hex: string): { r: number; g: number; b: number; a: number } | null => {
  const m = hex.match(HEX_RE)
  if (!m) return null
  const body = expandHexBody(m[1]!)
  const r = parseInt(body.slice(0, 2), 16)
  const g = parseInt(body.slice(2, 4), 16)
  const b = parseInt(body.slice(4, 6), 16)
  let a = 1
  if (body.length === 8) {
    a = parseInt(body.slice(6, 8), 16) / 255
  }
  return { r, g, b, a }
}

const rgbToHex = (r: number, g: number, b: number, a = 1) => {
  const ri = clamp(Math.round(r), 0, 255)
  const gi = clamp(Math.round(g), 0, 255)
  const bi = clamp(Math.round(b), 0, 255)
  if (a >= 1 - 1e-6) {
    return `#${ri.toString(16).padStart(2, '0')}${gi.toString(16).padStart(2, '0')}${bi.toString(16).padStart(2, '0')}`
  }
  const ai = clamp(Math.round(a * 255), 0, 255)
  return `#${ri.toString(16).padStart(2, '0')}${gi.toString(16).padStart(2, '0')}${bi.toString(16).padStart(2, '0')}${ai.toString(16).padStart(2, '0')}`
}

const rgbToHsl = (r: number, g: number, b: number) => {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d > 1e-6) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case R:
        h = ((G - B) / d + (G < B ? 6 : 0)) / 6
        break
      case G:
        h = ((B - R) / d + 2) / 6
        break
      default:
        h = ((R - G) / d + 4) / 6
    }
  }
  return { h: h * 360, s, l }
}

const hslToRgb = (h: number, s: number, l: number) => {
  const hh = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = l - c / 2
  let rp = 0
  let gp = 0
  let bp = 0
  if (hh < 60) {
    rp = c
    gp = x
  } else if (hh < 120) {
    rp = x
    gp = c
  } else if (hh < 180) {
    gp = c
    bp = x
  } else if (hh < 240) {
    gp = x
    bp = c
  } else if (hh < 300) {
    rp = x
    bp = c
  } else {
    rp = c
    bp = c
  }
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

/** App-adjacent dark map: charcoal forest land, subdued water/greens. */
const darkQuestRgb = (r: number, g: number, b: number, a = 1) => {
  let { h, s, l } = rgbToHsl(r, g, b)

  // Water — deep blue-teal, still reads as water on dark bg
  if (s > 0.06 && h >= 165 && h <= 275) {
    l = clamp(0.06 + l * 0.3, 0.05, 0.34)
    s = clamp(s * 0.82, 0.06, 0.42)
    h = (h + 6) % 360
    const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
    return { ...out, a }
  }

  // Vegetation / parks
  if (s > 0.05 && h >= 48 && h <= 168) {
    l = clamp(0.08 + l * 0.27, 0.06, 0.34)
    s = clamp(s * 0.74, 0.05, 0.4)
    h = (h + 10) % 360
    const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
    return { ...out, a }
  }

  // Warm earth / desert
  if (s > 0.07 && h >= 15 && h <= 55) {
    l = clamp(0.09 + l * 0.3, 0.07, 0.36)
    s = clamp(s * 0.7, 0.05, 0.38)
    const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
    return { ...out, a }
  }

  // Neutral parchment / gray land (pull toward forest charcoal)
  if (s < 0.13) {
    h = (h * 0.42 + 132 * 0.58 + 360) % 360
    s = clamp(s * 1.15 + 0.04, 0, 0.2)
    l = clamp(0.065 + l * 0.24, 0.055, 0.27)
    const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
    return { ...out, a }
  }

  // Other chroma — keep hue, stay in dark band
  l = clamp(0.085 + l * 0.32, 0.06, 0.38)
  s = clamp(s * 0.68, 0, 0.48)
  const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
  return { ...out, a }
}

const darkQuestHexString = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const next = darkQuestRgb(rgb.r, rgb.g, rgb.b, rgb.a)
  return rgbToHex(next.r, next.g, next.b, next.a)
}

const darkQuestCssColorString = (input: string): string => {
  const s = input.trim()
  if (HEX_RE.test(s)) return darkQuestHexString(s)

  const rgba =
    /^rgba\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (rgba) {
    const next = darkQuestRgb(+rgba[1]!, +rgba[2]!, +rgba[3]!, +rgba[4]!)
    return `rgba(${clamp(Math.round(next.r), 0, 255)}, ${clamp(Math.round(next.g), 0, 255)}, ${clamp(Math.round(next.b), 0, 255)}, ${next.a.toFixed(3)})`
  }

  const rgb = /^rgb\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (rgb) {
    const next = darkQuestRgb(+rgb[1]!, +rgb[2]!, +rgb[3]!, 1)
    return `rgb(${clamp(Math.round(next.r), 0, 255)}, ${clamp(Math.round(next.g), 0, 255)}, ${clamp(Math.round(next.b), 0, 255)})`
  }

  const hsla = /^hsla\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (hsla) {
    const hh = +hsla[1]!
    const ss = +hsla[2]! / 100
    const ll = +hsla[3]! / 100
    const aa = +hsla[4]!
    const base = hslToRgb(hh, clamp(ss, 0, 1), clamp(ll, 0, 1))
    const next = darkQuestRgb(base.r, base.g, base.b, aa)
    return `rgba(${clamp(Math.round(next.r), 0, 255)}, ${clamp(Math.round(next.g), 0, 255)}, ${clamp(Math.round(next.b), 0, 255)}, ${next.a.toFixed(3)})`
  }

  const hsl = /^hsl\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(s)
  if (hsl) {
    const hh = +hsl[1]!
    const ss = +hsl[2]! / 100
    const ll = +hsl[3]! / 100
    const base = hslToRgb(hh, clamp(ss, 0, 1), clamp(ll, 0, 1))
    const next = darkQuestRgb(base.r, base.g, base.b, 1)
    return `rgb(${clamp(Math.round(next.r), 0, 255)}, ${clamp(Math.round(next.g), 0, 255)}, ${clamp(Math.round(next.b), 0, 255)})`
  }

  return input
}

const transformDarkNode = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(transformDarkNode)
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as object)) {
      out[k] = transformDarkNode((value as Record<string, unknown>)[k])
    }
    return out
  }
  if (typeof value === 'string') {
    return darkQuestCssColorString(value)
  }
  return value
}

const relLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((c) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * a[0]! + 0.7152 * a[1]! + 0.0722 * a[2]!
}

/** Light ink + dark halo for symbol layers (after global dark remap). */
const LABEL_TEXT = '#dce8dc'
const LABEL_HALO = '#0d1610'

const rewriteColorStringForSymbolKey = (raw: string, paintKey: string): string => {
  const s = raw.trim()
  if (!HEX_RE.test(s)) return raw
  const rgb = hexToRgb(s)
  if (!rgb) return raw
  const L = relLuminance(rgb.r, rgb.g, rgb.b)
  if (paintKey === 'text-color' || paintKey === 'icon-color') {
    if (L < 0.52) return LABEL_TEXT
    return raw
  }
  if (paintKey === 'text-halo-color' || paintKey === 'icon-halo-color') {
    if (L > 0.35) return LABEL_HALO
    return raw
  }
  return raw
}

const transformSymbolPaintSubtree = (value: unknown, paintKey: string): unknown => {
  if (Array.isArray(value)) {
    return value.map((v) => transformSymbolPaintSubtree(v, paintKey))
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as object)) {
      out[k] = transformSymbolPaintSubtree((value as Record<string, unknown>)[k], paintKey)
    }
    return out
  }
  if (typeof value === 'string') {
    return rewriteColorStringForSymbolKey(value, paintKey)
  }
  return value
}

const SYMBOL_PAINT_KEYS = ['text-color', 'text-halo-color', 'icon-color', 'icon-halo-color'] as const

const lightenSymbolLayersForDarkMap = (style: StyleSpecification): StyleSpecification => {
  if (!style.layers) return style
  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue
    const paint = layer.paint as Record<string, unknown> | undefined
    if (!paint) continue
    const next: Record<string, unknown> = { ...paint }
    for (const pk of SYMBOL_PAINT_KEYS) {
      if (next[pk] !== undefined) {
        next[pk] = transformSymbolPaintSubtree(next[pk], pk)
      }
    }
    layer.paint = next as typeof layer.paint
  }
  return style
}

/** Americana → dark quest basemap + readable labels. */
export const questDarkAmericanaStyle = <T extends StyleSpecification | object>(style: T): T => {
  const clone = structuredClone(style) as StyleSpecification
  const pass1 = transformDarkNode(clone) as StyleSpecification
  return lightenSymbolLayersForDarkMap(pass1) as T
}
