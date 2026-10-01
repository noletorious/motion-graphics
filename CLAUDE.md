# Motion

Portfolio site showing motion graphics made for companies. The site itself is a portfolio piece, so it has to look exceptional. The frame stays quiet, and each company's pieces carry their own brand.

Workflow source: `The 3 Levels of AI Motion Graphics.pdf` (storyboard → comment → build → direct). Skill: `/animate` (`.claude/skills/animate/SKILL.md`).

## Stack

Vite + React + TypeScript + Tailwind v4, scaffolded from `../vitejs-starter` with Convex, Stripe and shadcn removed. Keep it minimal. Only add a dependency when a piece or the export pipeline actually needs it.

```
npm run dev                          # site (5173, or next free port); /review = Level 3 review page, dev only
npm run sync-kit                     # copy elements/piece-kit.js into every piece (run after editing the kit)
npm run frames -- <slug>/<piece> [t…] # QA contact sheet → exports/frames/
npm run posters [-- <slug>]          # <piece>.poster.jpg at each piece's piece:poster time
npm run export -- <slug>/<piece> | <slug> | --all [--fps 60]   # → exports/<slug>/<piece>.mp4, ffprobe-checked
npm run storyboard                   # re-screenshot storyboard stills
```

## Layout

```
companies/<slug>/brand.json     # one company = one folder; nothing else to register
companies/<slug>/assets/        # logo, images used by that company's pieces
companies/<slug>/pieces/*.html  # self-contained motion pieces (+ generated *.poster.jpg)
scripts/companies-plugin.ts     # scans companies/ → `virtual:companies`; copies folder into dist on build
scripts/*.mjs                   # export, posters, frames, storyboard, sync-kit (headless Chrome via puppeteer-core)
src/                            # site: Home grid, Company page, Review page (dev only)
exports/                        # MP4s + QA sheets (gitignored)
storyboard/                     # Level 2 stills: scenes/*.html → shots/*.png → index.html
elements/                       # piece-kit.js (shared runtime) + catalog.json (reusable element library)
```

Adding a company means adding `companies/<slug>/` with a `brand.json` and a `pieces/` folder. Do not hardcode slugs anywhere in `src/`.

## brand.json

`name, tagline, description, website, order, colors{}, fonts{display, body, note}, logo, featured, hero, cta, features[], howItWorks[], keyFacts[{label, value, source}]`

- `featured` is the piece that loops on the home tile when hovered. `hero` is the reel at the top of the company page. Both default to the first piece.
- Every number in `keyFacts` needs a `source`. Never invent figures. If a fact is unverified, its source says "verify before publishing".
- Use real brand colours. For proprietary fonts, pick a stand-in and say so in `fonts.note`.

## Piece contract

Each piece is one HTML file that runs in the site (inside an iframe) and on its own.

- **Metadata** goes in the head: `<meta name="piece:type|title|duration|aspect|loop|poster" content="…">`. Types: `logo-sting`, `promo-15s`, `feature-loop`, `social-loop`, `stat`, `lower-third`. `poster` is the time of the still used for tiles.
- **Kit**: every piece carries `<script id="piece-kit">` (copied from `elements/piece-kit.js` by `npm run sync-kit`; never edit it in place). The piece defines `Piece.render(t)`, `Piece.sounds = [{ t, fn(ctx, out, at) }]`, optional `Piece.setup()` (measure layout after fonts load) , `Piece.cuts` (scene cuts, shown as trim handles on /review) and `Piece.gain` (master trim; keep export peaks between −6 and −10 dBFS). Helpers live on `K` (`tw`, `css`, `ease`, `S` synths, `note`, `rng`).
- **Fixed stage**: 1920×1080 (16:9) or 1080×1080 (1:1), scaled to fit with a CSS transform. Layout is never responsive inside the stage.
- **Time-driven**: everything is drawn from one `render(t)`. Nothing runs on wall-clock timers, so any frame can be reproduced exactly for export.
- **API** (from the kit): `window.piece = { duration, loop, seek(t), play(), pause(), setMuted, setRate, buildAudio(ctx, when) }`. The site drives it over postMessage (`{ source: 'site', type: play|pause|seek|restart|mute|rate }`); the piece reports `{ source: 'piece', type: ready|time|play|pause|ended }`. Audio is built through a `BaseAudioContext`, so `OfflineAudioContext` renders it for export.
- **URL params**: `?autoplay=1&muted=1` for hover previews, `?t=2.5` for a frozen still, `?export=1` to hide any UI.
- **Self-contained**: inline CSS and JS. Load fonts from Google Fonts, three.js from a CDN only when needed. Assets use relative paths (`../assets/…`).
- **Export**: 1080p MP4 via headless Chrome frame-stepping, piped into ffmpeg, with the offline-rendered audio muxed in. Requires ffmpeg (Homebrew, `/opt/homebrew/bin/ffmpeg`).

## Site look

Dark, editorial, big type, minimal chrome. Near-black `#0a0a0b`, off-white `#ecebe6`, one hairline `#232326`. Top-left mark: `src/assets/noletorious-logo-dark.svg` + "Motion". Instrument Serif for display, Inter Tight for UI, JetBrains Mono for labels and timecodes. No brand colour in the frame itself. Page transitions use the View Transitions API. Previews lazy-load: a tile mounts its iframe only on hover or when it comes into view.

## Legal

The work is spec and unaffiliated. The site footer and each company page must say so. Logos in `assets/` are type-set stand-ins until real files are supplied.

## Process

Storyboard first (PDF prompt 08). Build each scene as HTML in its final look, screenshot it, and put the stills on one page with start times and descriptions. Then stop for comments. Apply comments exactly and change nothing else (prompt 10). After a build, the user reviews on `/review` (prompt 11) and pastes comments back; apply them, change nothing else, and re-render posters. The final MP4 renders only when the user says the piece is done (prompt 12). Draft exports are fine for checking the pipeline.
