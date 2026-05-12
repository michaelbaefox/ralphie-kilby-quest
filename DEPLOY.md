# Deploy and install on your phone

The app is a **Progressive Web App (PWA)**. After it is hosted on **HTTPS**, you install it from the browser (Add to Home Screen / Install app)—no App Store required for that flow.

## One-time: deploy

### Option A — Netlify (Git or drag-and-drop)

- **Git:** Connect the repo; Netlify reads [`netlify.toml`](netlify.toml) at the **repository root** (`npm run build`, publish `dist`).
- **Manual (Drop):** Run `npm run build`, then drag only the **`dist`** folder into [Netlify Drop](https://app.netlify.com/drop). The root `netlify.toml` is **not** used for Drop uploads—[`public/_redirects`](public/_redirects) is copied into `dist` so SPA routes still work.

### Option B — Vercel

Import the repo; set **Build Command** `npm run build` and **Output Directory** `dist`.  
[`vercel.json`](vercel.json) rewrites unknown paths to `index.html` for the SPA.

### Option C — Cloudflare Pages

Build: `npm run build`, output: `dist`. Add a **SPA fallback** rule in the project (or use the same `_redirects` pattern in `public/` if your setup copies it).

### Option D — GitHub Pages (Actions)

1. In the repo: **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions** (not “Deploy from a branch” unless you commit `dist/` yourself).
2. Push to **`main`** or **`master`**. The workflow [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml) builds with the correct **`VITE_BASE`** for project sites (`/<repo-name>/`) and deploys `dist/`.
3. If GitHub asks you to **approve** the `github-pages` environment the first time, open the workflow run and approve it.
4. **Open the right URL.** For a normal repository (not `<username>.github.io`), the site is always:

   `https://<github-username>.github.io/<exact-repo-name>/`

   The middle path **must match the repository name** (case-sensitive in the URL path). Example: repo `ralphie-kilby-quest` → `https://MichaelBay-Fox.github.io/ralphie-kilby-quest/` (GitHub lowercases the hostname; the path still uses your repo name as published).

5. **Local build with the same base as Pages** (optional check before push):

   ```bash
   VITE_BASE=/your-repo-name/ npm run build
   npm run preview -- --base /your-repo-name/
   ```

#### If you see “does not contain the requested file” / “provide an index.html”

That message usually means one of these:

| Cause | What to do |
| --- | --- |
| **Wrong URL** | You opened `https://user.github.io/` but the app is a **project** site at `https://user.github.io/RepoName/` (trailing slash helps). |
| **Repo name mismatch** | The path segment must equal the **GitHub repo name**. Renaming the repo changes the public URL. |
| **Pages source is a branch** with no `index.html` at that branch root | Either switch source to **GitHub Actions** and use this workflow, or publish a branch whose root contains `index.html`. |
| **Workflow not run / failed** | **Actions** tab → ensure the deploy workflow is green; **Settings → Pages** shows the deployment. |

This project ships **`public/.nojekyll`** into `dist` so GitHub Pages does not run Jekyll on your assets. The workflow sets **`include-hidden-files: true`** on the Pages artifact so `.nojekyll` is not dropped.

## On your phone

1. Open the deployed **https://** URL once while online (service worker + precache).
2. **iPhone:** Safari → Share → **Add to Home Screen** → open from the icon.
3. **Android (including Samsung Galaxy S24):** use **Chrome** (recommended) or **Samsung Internet**.
   - **Chrome:** open your site → tap **⋮** (menu) → **Install app** or **Add to Home screen** (wording varies by Chrome version). If Chrome shows an **Install** banner at the bottom, you can use that instead. Launch from the new home-screen icon; it should open full-screen like a normal app (`display: standalone` in the manifest).
   - **Samsung Internet:** open the same **https://** URL → menu (**≡** or **⋮**) → **Add page to** → **Home screen** (or look for **Install web app** if shown).
4. Grant **location** when you use in-app **Settings** → **Start tracking my trip** (only works on **https://**, not plain `http://`).

**Galaxy tip:** if you do not see **Install app**, open the site again after a full load, pull down to refresh once, or check **Chrome → Settings → Site settings** for anything blocking the install prompt. The site must be served over HTTPS with a valid certificate (Netlify/Vercel/etc. provide this automatically).

## Verify

- DevTools → Application → **Manifest** and **Service workers** show the PWA.
- Airplane mode: core screens still load per [README](README.md) offline notes.

## Optional build env

- `VITE_BASE` — base path for assets and the router (e.g. `/KilbyQueQueQuest/` on GitHub project Pages). Local dev defaults to `/`. CI sets this automatically from the repository name.
- `VITE_ENABLE_SIM=1` — enables the hidden trip simulator in Settings without the 5-tap dev chip (set in the host’s build environment variables).
