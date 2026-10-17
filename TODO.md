# TODO

What we're doing now, in order. Items come from `BACKLOG.md`; finished ones get checked off, then cleared.

## 👀 Needs your review

- [ ] **Spray lettering source:** where `il_1588xN.6983742403_crj3.svg` came from, for the credits in `companies/tesla/versions/v1/version.json`.
- [ ] **Launch post:** read the draft `share/launch/post.md`; edit it freely, it's your voice.
- [ ] **Exposure plan:** read `EXPOSURE.md`. Open questions: the goal (who are "the right people"?) and on camera vs screen-only.
- [ ] **Push:** 3 commits on `main` are waiting for you (`git push`): Tesla v1 second pass, publish, recap.

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
   - [x] Recap (`share/recap.mp4`, not reviewed; may not be used) and final MP4s in `exports/tesla/v1/` (will likely be redone after later edits)
2. [ ] **Directory modal: breadcrumb-style "Home".** On routes other than home, "Home" in the slide-out directory works like a breadcrumb link (clickable, goes home) instead of a plain button.
3. [ ] **Directory modal: show v2s before they're published.** List each company's upcoming v2 in the lineup, muted and not clickable.
   Needs a way to list a version that isn't published yet (e.g. `version.json` with `"upcoming": "2026-10-21"`), while drafts stay hidden.
4. [ ] **Directory modal: date capsule replaces "Showcase".** Drop the "Showcase" capsule; only unpublished versions get a capsule, showing their publish date.
5. [ ] **Version page: "elements used" lineup.** A visual strip on each `/<company>/<vN>` page: a row of cards, one per element,
   each showing the real thing (3D model render, photo thumbnails, colour swatches, a type sample, a playable sound, a short clip of a transition).
   Covers both ingredients (models, photos, type, colours, sound/music) and techniques (transitions, 3D scenes, UI like the hail screen).
   Listed per version (e.g. `version.json` → `elements`). Mock up first, then build.
6. [ ] **v2 builds** (storyboard first, stop for your comments, then build; 2 days each, weekdays):

   | Version | Build | Publish date (capsule: the day after the build) |
   |---|---|---|
   | eBay v2 "Super Live": a redesign of eBay Live | Mon Oct 19 – Tue Oct 20 | 2026-10-21 |
   | Google v2 "Gemini Redesign": a set of new Gemini features | Wed Oct 21 – Thu Oct 22 | 2026-10-23 |
   | Tesla v2 "Roadster" (assets in `companies/tesla/assets/roadster/`; optimize the GLB, credit krea.ai) | Fri Oct 23 + Mon Oct 26 | 2026-10-27 |

   Before Monday: a sharper brief for eBay and Google v2 (which eBay Live moments, which Gemini features). I can draft options.
7. [ ] **v1 blog headers + thumbnails.** For each version, a 16:9 header graphic for the top of its blog post; its poster frame is the 1920×1080 thumbnail. In `share/`, never shown on the site. Storyboard first.

## Done (clear when stale)

- [x] Breadcrumbs, versions structure, directory modal, home carousel, 9:16 stage, Fraunces headline
- [x] v1 recaps (eBay, Google); launch video and thumbnail
- [x] Tesla v1 storyboard and first build (draft)
- [x] SEO: per-route title, description, canonical, Open Graph, Twitter and JSON-LD; prerendered route heads, `sitemap.xml`, `robots.txt`; share image `public/og.jpg` from `npm run og` (used for every route)

## Decisions

- **The versions are explorations, not just styles.** Each version has a name and a premise:

  | | v1 (initial build) | v2 |
  |---|---|---|
  | eBay | Bright Bounce | Super Live: a redesign of eBay Live |
  | Google | Soft Material | Gemini Redesign: exploring a set of new Gemini features |
  | Tesla | Cybercab | Roadster |

- **Versions go up to v2 for now.** The v3 ideas are parked in `BACKLOG.md`.

- **Recaps are optional per version.** When a version is done, ask: recap or skip? (15s by default, 30s when needed.) eBay v1 and Google v1 have one.
- **Drafts:** a version stays `draft` until you say otherwise; I ask when its fixes are done.
- **Share image:** every route uses the front-page `og.jpg`; re-run `npm run og` when home changes.
- The home headline is smaller, so the carousel shows in full on load.
- The carousel shows **one card per company**, each company's showcase. Companies can repeat to fill it for now.
- `/<company>` is a plain list of that company's versions. The directory modal is the real way to navigate.
- v2 uses the same three pieces: logo sting, 15s promo, social loop. Pieces may change to suit the exploration.

## Open questions

- [x] ~~How long should a recap be?~~ **15s by default; 30s when a version has more to show.** (9:16 confirmed.)
