# Ralphie's Kilby QueQueQuest

A mobile-first **Progressive Web App (PWA)** for a solo road trip from **Lansing, MI** to **Bluffdale, UT** (Kilby Block Party, May 15–17, 2026). It is **offline-first**: the UI, curated route, POIs, quest log, and achievements are bundled and cached by a service worker.

## Install on your phone (Ralphie)

See **[DEPLOY.md](DEPLOY.md)** for Netlify / Vercel / Cloudflare / **GitHub Pages** steps and a phone install checklist.

1. Deploy the `dist/` folder to any host that serves **HTTPS** (required for GPS in the browser). This repo includes [`netlify.toml`](netlify.toml) and [`vercel.json`](vercel.json) for common hosts.
2. Open the site in **Safari** (iPhone) or **Chrome** (Android / **Samsung Galaxy**—e.g. S24). **DEPLOY.md** has Galaxy-specific menu paths.
3. **Add to Home Screen** / **Install app** so it behaves like a standalone app.
4. In **Settings** inside the app, use **Start tracking my trip** and allow location when prompted.

## What works offline

- Road scroll view, supplies list, quest log, achievements, and settings.
- Progress along the **curated** polyline (not live Google-style rerouting).
- Optional **demo slider** in Settings to simulate progress without driving.

## What needs the network

- **Overworld map**: uses [OpenStreetMap Americana](https://github.com/osm-americana/openstreetmap-americana). On load, the app **forks** the official [`style.json`](https://americanamap.org/style.json) in memory: it remaps colors to a **dark quest** palette (charcoal / forest land, deep water, readable symbol labels), then applies a **road contrast** pass so highways and streets pop on the dark basemap. The result is **cached in `sessionStorage`** (key `kilby-americana-style-dark-v6`) so repeat visits avoid re-parsing. **Vector tiles** still load from the network the first time; this build does not fully precache the whole U.S. for offline.
- **Terrain & tints (no API key)**: the map adds **coarse US “physiographic” tint polygons** from bundled GeoJSON (`src/data/terrain_style_regions.json`) for atmospheric color variation everywhere. **Optional hillshade** uses MapLibre’s **public Terrain-RGB demo** at `https://demotiles.maplibre.org/terrain-tiles/tiles.json` — it only has real relief where those demo tiles cover (not the full United States); outside that area it is effectively flat. Attribution for the renderer and demo terrain is summarized in the in-app map credits (ⓘ).
- **Tuning the fork**: edit [`src/lib/questDarkAmericanaStyle.ts`](src/lib/questDarkAmericanaStyle.ts) (dark remap + label pass) and [`src/lib/boostRoadContrastInStyle.ts`](src/lib/boostRoadContrastInStyle.ts). To write a static JSON for diffing or hosting, run `npm run style:americana-soft` (requires network) — output: `public/maps/americana-soft.json` (same pipeline as the live app).
- **Google / Apple Maps** links from the Supplies screen (optional; can be disabled in Settings).
- **Fonts** from Google Fonts the first time; they are cached for later offline use when available.

## Development

```bash
npm install
npm run dev
```

```bash
npm run build
npm run preview
```

Then open the preview URL over **localhost** or **https** (for example `vite preview --host` with HTTPS tooling) to test geolocation.

## Tech

- Vite 5, React 19, TypeScript
- MapLibre GL + **dark Americana** style fork (see above)
- `vite-plugin-pwa` (**injectManifest** + Workbox precache + navigation fallback for SPA)
- Dexie (IndexedDB), Turf (route snapping / distances), React Router

## Offline QA checklist

1. Visit the deployed HTTPS URL once online so the service worker installs.
2. Turn on **airplane mode** and reload: Home, Overworld, Road scroll, Supplies, Quest log, Achievements, and Settings should still load.
3. GPS will not work in airplane mode; use **Settings → Developer / demo GPS** to move progress for demos.

## Safety

Use the app **only when parked** for longer interactions. It is a companion, not a replacement for road signs or a dedicated navigator.
