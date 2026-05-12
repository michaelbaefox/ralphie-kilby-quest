/**
 * Programmatic "fork" of MapLibre Style JSON colors for a softer, pastel ALTTP-ish palette.
 * Applies to OpenStreetMap Americana (https://github.com/osm-americana/openstreetmap-americana).
 * Walks the entire style object and adjusts string literals that look like CSS colors.
 */

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
    bp = x
  }
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

/**
 * “Cute quest” palette: warmer parchment neutrals, candy-like chroma on features,
 * mintier greens, softer aqua blues — tuned for ALTTP-ish pastels over Americana.
 */
const softenRgb = (r: number, g: number, b: number, a = 1) => {
  let { h, s, l } = rgbToHsl(r, g, b)

  l = clamp(l + (0.56 - l) * 0.16, 0.07, 0.96)

  if (s < 0.14) {
    h = (h * 0.62 + 44 * 0.38 + 360) % 360
    s = clamp(s * 1.25 + 0.035, 0, 0.24)
    l = clamp(l + 0.03, 0, 1)
  } else {
    s = clamp(s * 0.66 + 0.055, 0, 0.64)
  }

  if (s > 0.05 && h >= 62 && h <= 168) {
    h = (h + 18) % 360
    s = clamp(s * 0.88, 0, 0.52)
    l = clamp(l + 0.055, 0, 0.93)
  }

  if (s > 0.07 && h >= 168 && h <= 268) {
    h = (h + 14) % 360
    s = clamp(s * 0.8, 0, 0.52)
    l = clamp(l + 0.045, 0, 0.94)
  }

  if (s > 0.12 && h >= 20 && h <= 58) {
    s = clamp(s * 0.82, 0, 0.52)
    l = clamp(l + 0.03, 0, 0.92)
  }

  if (l > 0.935 && s < 0.11) {
    l = clamp(l - 0.045, 0.84, 0.96)
  }

  const out = hslToRgb(h, clamp(s, 0, 1), clamp(l, 0, 1))
  return { ...out, a }
}

const softenHexString = (hex: string) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const soft = softenRgb(rgb.r, rgb.g, rgb.b, rgb.a)
  return rgbToHex(soft.r, soft.g, soft.b, soft.a)
}

export const softenCssColorString = (input: string): string => {
  const s = input.trim()
  if (HEX_RE.test(s)) return softenHexString(s)

  const rgba =
    /^rgba\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (rgba) {
    const soft = softenRgb(+rgba[1]!, +rgba[2]!, +rgba[3]!, +rgba[4]!)
    return `rgba(${clamp(Math.round(soft.r), 0, 255)}, ${clamp(Math.round(soft.g), 0, 255)}, ${clamp(Math.round(soft.b), 0, 255)}, ${soft.a.toFixed(3)})`
  }

  const rgb = /^rgb\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (rgb) {
    const soft = softenRgb(+rgb[1]!, +rgb[2]!, +rgb[3]!, 1)
    return `rgb(${clamp(Math.round(soft.r), 0, 255)}, ${clamp(Math.round(soft.g), 0, 255)}, ${clamp(Math.round(soft.b), 0, 255)})`
  }

  const hsla = /^hsla\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)$/i.exec(s)
  if (hsla) {
    const hh = +hsla[1]!
    const ss = +hsla[2]! / 100
    const ll = +hsla[3]! / 100
    const aa = +hsla[4]!
    const base = hslToRgb(hh, clamp(ss, 0, 1), clamp(ll, 0, 1))
    const soft = softenRgb(base.r, base.g, base.b, aa)
    return `rgba(${clamp(Math.round(soft.r), 0, 255)}, ${clamp(Math.round(soft.g), 0, 255)}, ${clamp(Math.round(soft.b), 0, 255)}, ${soft.a.toFixed(3)})`
  }

  const hsl = /^hsl\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(s)
  if (hsl) {
    const hh = +hsl[1]!
    const ss = +hsl[2]! / 100
    const ll = +hsl[3]! / 100
    const base = hslToRgb(hh, clamp(ss, 0, 1), clamp(ll, 0, 1))
    const soft = softenRgb(base.r, base.g, base.b, 1)
    return `rgb(${clamp(Math.round(soft.r), 0, 255)}, ${clamp(Math.round(soft.g), 0, 255)}, ${clamp(Math.round(soft.b), 0, 255)})`
  }

  return input
}

const transformNode = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(transformNode)
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as object)) {
      out[k] = transformNode((value as Record<string, unknown>)[k])
    }
    return out
  }
  if (typeof value === 'string') {
    return softenCssColorString(value)
  }
  return value
}

/** Deep clone + soften color-like strings everywhere in the style JSON tree. */
export const softenAmericanaStyle = <T>(style: T): T => {
  const clone = structuredClone(style)
  return transformNode(clone) as T
}
