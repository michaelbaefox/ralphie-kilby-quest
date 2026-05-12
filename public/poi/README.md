# POI hero images

Drop landmark / fun-stop hero images here. They are referenced from
[`src/data/pois.json`](../../src/data/pois.json).

## One photo (legacy)

Use a single `image` object:

```json
"image": {
  "src": "/poi/carhenge.jpg",
  "remote": "https://…",
  "alt": "Short description for screen readers."
}
```

## Multiple photos (carousel)

Use an `images` array (two or more items). When present, it replaces `image`.
The modal shows a swipeable carousel with arrow buttons and dot indicators.

```json
"images": [
  {
    "src": "/poi/carhenge.jpg",
    "remote": "https://…",
    "alt": "Front view of the stone circle."
  },
  {
    "src": "/poi/carhenge-2.jpg",
    "remote": "https://…",
    "alt": "Wide prairie view."
  }
]
```

Name extra files `<poi-id>-2.jpg`, `<poi-id>-3.jpg`, etc., or any clear pattern you
like — only the `src` paths in JSON need to match the files on disk.

## Naming

- Paths are served from the site root, e.g. `/poi/carhenge.jpg` → this folder.
- Keep filenames ASCII and URL-safe.

## Sizing

- Target **640 x 360** (16:9) so they fill the modal hero cleanly.
- Keep each file **under ~120 KB** for snappy offline loads.
- JPEG `quality=80` or WebP `quality=78` is usually enough.

## Fallback chain

For each slide, the modal loads **`src` first**. If that request fails (file not in
`/public/poi` yet, wrong path, etc.), it tries that slide’s **`remote`** URL so
photos still appear when you’re online. Maps / website buttons in the same modal
stay controlled by **Allow online map links** in Adventurer settings — hero
images do not require that toggle.

If both fail, you see the neu-brutalist placeholder with the POI kind icon.

`_placeholder.svg` in this folder is the generic “photo coming soon” panel and
can be referenced directly from JSON if you want a known-good placeholder.
