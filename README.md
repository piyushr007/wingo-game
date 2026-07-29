# WINGO — Slot-Machine Bingo

A single-file, dependency-free web game based on the WINGO rulebook:
- 5 symbol columns, 12 rows organized into 3 blocks of 4 rows each
- Numbers 1–90 drawn one at a time with a random symbol
- Place each number in the matching column, keeping every column in
  ascending (top-to-bottom) order — or anywhere if a Wild (🃏) is drawn
- Scoring: +10/number, +150/column, +200/block, +150 odd-even row bonus,
  +250 ascending-row bonus
- 8-second countdown per draw (auto-skips if you don't place in time)

Everything — HTML, CSS, and JavaScript — lives in one file: `index.html`.
No build step, no npm install, no server required. That makes it about
as easy as possible to host for free.

## Run it locally first
Just double-click `index.html`, or open it directly in any browser.

## Free hosting — pick one

### Option A: GitHub Pages (recommended, free, custom domain support)
1. Create a free GitHub account at github.com if you don't have one.
2. Create a new repository (e.g. `wingo-game`) — public, no need to add
   a README/gitignore since you already have files.
3. Upload `index.html` (and this `README.md` if you like) via
   "Add file → Upload files" in the GitHub web UI, or via git:
   ```
   git init
   git add .
   git commit -m "Initial WINGO game"
   git branch -M main
   git remote add origin https://github.com/<your-username>/wingo-game.git
   git push -u origin main
   ```
4. In the repo, go to **Settings → Pages**.
5. Under "Build and deployment", set **Source** to "Deploy from a branch",
   branch = `main`, folder = `/ (root)`. Save.
6. Wait ~1 minute, then your game is live at:
   `https://<your-username>.github.io/wingo-game/`

### Option B: Netlify (drag-and-drop, free)
1. Go to app.netlify.com and sign up (free tier).
2. Click "Add new site → Deploy manually".
3. Drag the folder containing `index.html` into the upload box.
4. Netlify gives you a live URL instantly (e.g. `random-name.netlify.app`).
   You can rename the site or add a custom domain for free in site settings.

### Option C: Vercel (free)
1. Go to vercel.com and sign up.
2. Click "Add New → Project → Deploy" and either connect the GitHub repo
   from Option A, or drag-and-drop the folder.
3. Vercel deploys automatically and gives you a live URL.

### Option D: Cloudflare Pages (free)
1. Go to pages.cloudflare.com, sign up.
2. "Create a project → Direct Upload", upload `index.html`.
3. Deploy — you get a `*.pages.dev` URL.

All four are free for a static single-page site like this one, and all
support connecting a custom domain later at no extra cost (you'd only
pay if you buy the domain name itself).

## Customizing
- Symbols are defined near the top of the `<script>` block:
  `const SYMBOLS = ['🔔','🍒','⭐','🍀','💎'];` — swap emoji freely.
- Draw countdown: `const DRAW_SECONDS = 8;`
- Wild draw frequency: `const WILD_CHANCE = 0.15;`
- Scoring values: the `POINTS` object.
- Row layout / which rows are ODD-EVEN vs ASCENDING: `ROW_ROLES` array.

## Notes
- No backend, no accounts, no data storage — this is a local, single-player
  browser game. Refreshing the page starts a new game.
- Built with emoji instead of the original slot-reel artwork, since that
  artwork belongs to the original game/brand and isn't something to copy.
