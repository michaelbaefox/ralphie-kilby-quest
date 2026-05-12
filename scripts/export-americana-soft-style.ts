/**
 * Optional: write a static dark-quest style JSON for inspection or hosting (same pipeline as the app).
 * Requires network. Usage: npx tsx scripts/export-americana-soft-style.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StyleSpecification } from 'maplibre-gl'
import { boostRoadContrastInStyle } from '../src/lib/boostRoadContrastInStyle.ts'
import { questDarkAmericanaStyle } from '../src/lib/questDarkAmericanaStyle.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'maps', 'americana-soft.json')

const SOURCE = process.env.AMERICANA_STYLE_URL ?? 'https://americanamap.org/style.json'

const main = async () => {
  console.info(`Fetching ${SOURCE} …`)
  const res = await fetch(SOURCE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = await res.json()
  const darkFork = questDarkAmericanaStyle(raw)
  const boosted = boostRoadContrastInStyle(darkFork as StyleSpecification)
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(boosted), 'utf8')
  console.info(`Wrote ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KiB)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
