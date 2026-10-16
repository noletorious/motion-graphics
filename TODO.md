# TODO

What we're doing now, in order. Items come from `BACKLOG.md`; finished ones get checked off, then cleared.

## 👀 Needs your review

- [ ] **Spray lettering source:** where `il_1588xN.6983742403_crj3.svg` came from, for the credits in `companies/tesla/versions/v1/version.json`.
- [ ] **Launch post:** read the draft `share/launch/post.md`; edit it freely, it's your voice.
- [ ] **Exposure plan:** read `EXPOSURE.md`. Open questions: the goal (who are "the right people"?) and on camera vs screen-only.
- [ ] **Push:** 3 commits on `main` are waiting for you (`git push`). They include Tesla v1 as a draft and the SEO work.

## Up next

1. [x] **Tesla v1: Cybercab** published (out of draft 2026-10-16).
   - [x] First pass: turntable loop, music in code, sound timed to picture
   - [x] Second pass (your notes): rainbow chrome lettering; loop = car-only 360 with a light riding on it, brighter;
         promo re-cut (chrome lettering opener with `tron.wav` → hail-screen phone over the blurred street → focus pull into
         "It comes to you" → 3D drive with streaks, lidar, chevrons, gates → green charging pulses); light-bar wipes,
         zoom-through, dip and crossfade replace the glitch/slash/flash; music pitched lower and darker everywhere
   - [ ] Your /review notes on the second pass
   - [ ] More real sounds: send any Tesla clips you record into `companies/tesla/assets/sounds/`
   - [x] Out of draft
   - [ ] Ask recap or skip; final MP4 export when you say done
2. [ ] **Tesla v2: Roadster.** Assets are arriving in `companies/tesla/assets/roadster/` (untracked, ~91 MB). Convert the GLB to an optimized copy, credit it (krea.ai, like v1), then storyboard and stop for comments.
3. [ ] **v1 blog headers + thumbnails.** For each version, a 16:9 header graphic for the top of its blog post; its poster frame is the 1920×1080 thumbnail. In `share/`, never shown on the site. Storyboard first.
4. [ ] **v2: eBay "Super Live", Google "Gemini Redesign".** Storyboard, then stop for your comments. No build until you've commented.

## Done (clear when stale)

- [x] Breadcrumbs, versions structure, directory modal, home carousel, 9:16 stage, Fraunces headline
- [x] v1 recaps (eBay, Google); launch video and thumbnail
- [x] Tesla v1 storyboard and first build (draft)
- [x] SEO: per-route title, description, canonical, Open Graph, Twitter and JSON-LD; prerendered route heads, `sitemap.xml`, `robots.txt`; share image `public/og.jpg` from `npm run og` (used for every route)

## Decisions

- **The versions are explorations, not just styles.** Each version has a name and a premise:

  | | v1 (initial build) | v2 | v3 |
  |---|---|---|---|
  | eBay | Bright Bounce | Super Live: a redesign of eBay Live | Retro Futurism: an experimental redesign of one aspect or feature |
  | Google | Soft Material | Gemini Redesign: exploring a set of new Gemini features | Brutal Elegance: a redesign of an existing feature |

- **Recaps are optional per version.** When a version is done, ask: recap or skip? (15s by default, 30s when needed.) eBay v1 and Google v1 have one.
- **Drafts:** a version stays `draft` until you say otherwise; I ask when its fixes are done.
- **Share image:** every route uses the front-page `og.jpg`; re-run `npm run og` when home changes.
- The home headline is smaller, so the carousel shows in full on load.
- The carousel shows **one card per company**, each company's showcase. Companies can repeat to fill it for now.
- `/<company>` is a plain list of that company's versions. The directory modal is the real way to navigate.
- v2 uses the same three pieces: logo sting, 15s promo, social loop. Pieces may change to suit the exploration.

## Open questions

- [x] ~~How long should a recap be?~~ **15s by default; 30s when a version has more to show.** (9:16 confirmed.)
