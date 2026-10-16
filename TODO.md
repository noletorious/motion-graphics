# TODO

What we're doing now, in order. Items come from `BACKLOG.md`; finished ones get checked off, then cleared.

## 👀 Needs your review

- [ ] **Launch post:** read the draft `share/launch/post.md`; edit it freely, it's your voice.
- [x] **Launch thumbnail:** `share/launch/thumbnail-1920x1080.png` (final, unless you want changes).
- [x] **Launch video (built, approved):** watch `share/launch/launch.mp4`. For notes pinned to exact moments, run `npm run dev` and open `/review`, under "Site · launch".
- [ ] **v1 recap storyboards:** open `storyboard/index.html`, section "👀 Needs your review". Comment by shot, e.g. "eBay v1 recap, shot 03: …"
- [ ] **Exposure plan:** read `EXPOSURE.md`. The open questions now are: the goal (who are "the right people"?) and on camera vs screen-only.

## Up next

1. [x] **Top bar → breadcrumbs.** Remove "Work" and "Index", which look like links but don't go anywhere. Show the path instead: `Motion / eBay / v1 Bright Bounce`, plus one button that opens the directory.
2. [x] **Versions structure.** Move the current eBay and Google pieces into `v1`, mark v1 as the showcase, and add routes `/<company>/<version>`.
3. [x] **Directory modal.** A simple tree of every company and its versions, with the showcase marked. Opens from the top bar and closes with Esc or a click outside.
4. [x] **Home redesign.** Centred headline (keep the current words), with a slow rotating carousel of showcases below it in place of the grid. One card per company; companies repeat to fill it for now.
5. [x] **9:16 vertical stage.** Add a third size to the kit, export and site, so every version can have a vertical recap to post.
6. [x] **Headline typeface.** Replaced Instrument Serif with Fraunces (free, OFL). Its softness and wonk axes are tuned, and "motion" animates them.
7. [ ] **v1 recaps.** One 9:16 video per version, in `share/`, on the company's own background: eBay v1, Google v1. Storyboarded; waiting on your review.
8. [ ] **v1 blog headers + thumbnails.** For each version, a 16:9 header graphic for the top of its blog post; its poster frame is the 1920×1080 thumbnail. In `share/`, never shown on the site. Storyboard first.
9. [ ] **v2: eBay "Super Live", Google "Gemini Redesign".** Storyboard, then stop for your comments. No build until you've commented.

## Decisions

- **The versions are explorations, not just styles.** Each version has a name and a premise:

  | | v1 (initial build) | v2 | v3 |
  |---|---|---|---|
  | eBay | Bright Bounce | Super Live: a redesign of eBay Live | Retro Futurism: an experimental redesign of one aspect or feature |
  | Google | Soft Material | Gemini Redesign: exploring a set of new Gemini features | Brutal Elegance: a redesign of an existing feature |

- **Every version gets a 9:16 recap video** of what was built, for posting: 15s by default, 30s when the version needs it.
- The home headline is smaller, so the carousel shows in full on load.
- The carousel shows **one card per company**, each company's showcase. Companies can repeat to fill it for now.
- `/<company>` is a plain list of that company's versions. The directory modal is the real way to navigate.
- v2 uses the same three pieces: logo sting, 15s promo, social loop. Pieces may change to suit the exploration.

## Open questions

- [x] ~~How long should a recap be?~~ **15s by default; 30s when a version has more to show.** (9:16 confirmed.)
