import type { StyleSpecification } from 'maplibre-gl'

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

const expandHexBody = (body: string) =>
  body.length === 3 ? body.split('').map((c) => c + c).join('') : body

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = hex.match(HEX_RE)
  if (!m) return null
  const body = expandHexBody(m[1]!)
  return {
    r: parseInt(body.slice(0, 2), 16),
    g: parseInt(body.slice(2, 4), 16),
    b: parseInt(body.slice(4, 6), 16),
  }
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${clamp(Math.round(r), 0, 255)
    .toString(16)
    .padStart(2, '0')}${clamp(Math.round(g), 0, 255)
    .toString(16)
    .padStart(2, '0')}${clamp(Math.round(b), 0, 255).toString(16).padStart(2, '0')}`

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
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 }
}

/** Brighten line colors so roads stay readable over darker hillshade / land tints. */
const brightenLineColor = (hex: string, strength: number) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const base = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const l = clamp(base.l + (0.9 - base.l) * 0.3 * strength, 0, 1)
  const s = clamp(base.s * (1 + 0.18 * strength), 0, 1)
  const out = hslToRgb(base.h, s, l)
  return rgbToHex(out.r, out.g, out.b)
}

const transformColorStrings = (value: unknown, strength: number, topLevelKey?: string): unknown => {
  if (Array.isArray(value)) {
    return value.map((v) => transformColorStrings(v, strength, topLevelKey))
  }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(o)) {
      out[k] = transformColorStrings(o[k], strength, topLevelKey)
    }
    return out
  }
  if (typeof value === 'string' && HEX_RE.test(value.trim())) {
    if (topLevelKey === 'line-opacity' || topLevelKey === 'line-blur') return value
    return brightenLineColor(value.trim(), strength)
  }
  return value
}

const isRoadishLayer = (id: string, sourceLayer: string | undefined): boolean => {
  const low = id.toLowerCase()
  if (
    low.includes('admin') ||
    low.includes('boundary') ||
    low.includes('protected') ||
    low.includes('water') ||
    low.includes('river') ||
    low.includes('ferry') ||
    low.includes('aerialway') ||
    low.includes('piste')
  ) {
    return false
  }
  if (/rail|tram|subway|narrow|gauge|light_rail/.test(low)) return false
  if (sourceLayer === 'transportation' || (sourceLayer?.startsWith('transportation') ?? false)) return true
  return /road|motorway|trunk|primary|secondary|tertiary|street|minor|bridge|tunnel|ramp|track|construction|path|raceway/.test(
    low,
  )
}

const strengthForLayerId = (id: string): number => {
  const low = id.toLowerCase()
  if (/motorway|trunk|expressway|freeway/.test(low)) return 1.58
  if (/primary|secondary/.test(low)) return 1.38
  return 1.22
}

/** Boost perceived contrast for highway/road line layers on dark land (bright line colors). */
export const boostRoadContrastInStyle = (style: StyleSpecification): StyleSpecification => {
  const out = structuredClone(style)
  if (!out.layers) return out

  for (const layer of out.layers) {
    if (layer.type !== 'line') continue
    const id = layer.id ?? ''
    const sl = (layer as { 'source-layer'?: string })['source-layer']
    if (!isRoadishLayer(id, sl)) continue
    const paint = layer.paint as Record<string, unknown> | undefined
    if (!paint) continue
    const str = strengthForLayerId(id)
    const next: Record<string, unknown> = {}
    for (const k of Object.keys(paint)) {
      const key = k
      next[key] = transformColorStrings(paint[key], str, key)
    }
    if (typeof paint['line-opacity'] === 'number') {
      next['line-opacity'] = clamp((paint['line-opacity'] as number) * 1.08, 0, 1)
    }
    layer.paint = next as typeof layer.paint
  }

  return out
}
