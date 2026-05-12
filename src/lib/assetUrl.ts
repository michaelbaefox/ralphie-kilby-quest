/**
 * Build a URL for a file shipped in `public/` so it loads correctly under any
 * deployed base path: `/` in local dev, `/ralphie-kilby-quest/` on GitHub
 * project Pages, a custom domain root, etc.
 *
 * `import.meta.env.BASE_URL` is set by Vite from the `base` option in
 * `vite.config.ts` and always ends with a trailing slash. Inputs are accepted
 * with OR without a leading slash so existing data files (e.g. `pois.json`)
 * keep working after a one-line change at the call site.
 *
 * @example
 *   assetUrl('prius.svg')           // dev: '/prius.svg'   prod: '/ralphie-kilby-quest/prius.svg'
 *   assetUrl('/poi/carhenge.jpg')   // same — leading slash is stripped
 */
export const assetUrl = (path: string): string => {
  const base = import.meta.env.BASE_URL
  const cleaned = path.replace(/^\/+/, '')
  return `${base}${cleaned}`
}
