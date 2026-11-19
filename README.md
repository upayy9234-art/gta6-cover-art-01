[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/upayy9234-art/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/upayy9234-art/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Leonida Cover Studio

Turn a photo and a caption into GTA-style cover art: a multi-panel poster with bold lettering and a Vice City sunset or neon grade, exported as a PNG to share. Everything is drawn procedurally in the browser with the Canvas 2D API — no game logos, artwork, or fonts are used.

## What it does

- **Any photo:** load your own photos from your machine (they never leave it), or try the two included samples. Fill one panel or several.
- **Crop and position:** pick a panel, drag it to pan, scroll or slide to zoom — each panel has its own crop.
- **Three layouts:** Poster (one hero panel plus two small ones), Triptych (three tall panels), Duo (two panels).
- **Bold lettering:** edit the caption, its size, and its colour. A spaced `LEONIDA` kicker sits above it.
- **Three grades:** Sunset, Neon, and Noir — gradient skies, a glowing sun, a lit skyline, and palm silhouettes, all drawn in code.
- **Fast export:** one click writes a PNG at 1080×1080, 1080×1350, or 1920×1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request: `app/` is plain static files.

## How it works

- `app/src/cover.js` — `drawCover(canvas, state)` paints the whole poster: sky, sun, skyline, palms, photo panels with white gutters, caption, grain, and vignette.
- `app/src/main.js` — editor wiring: uploads, samples, panel picking, drag/wheel controls, and PNG export.
- `app/src/shots.js` — `?shot=cover` and `?shot=editor` modes used to take the screenshots in `screenshots/`.
- `main.ts` — copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
