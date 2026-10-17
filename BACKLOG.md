# Backlog

Everything we'll do eventually. Pull items into `TODO.md` when they're next.

## Roadmap

1. **Structure.** Each company gets multiple versions (v1, v2, v3…). Each is an exploration with its own premise and style: a redesign of a feature, new features, or an experimental take. One version per company is marked as its showcase. Navigation is breadcrumbs plus a directory modal.
2. **The hook.** The home page is the pitch: a centred headline, with a slowly rotating carousel of company showcases below it.
3. **Range.** v2 for every company (up to v2 for now), then more companies. Each version proves a different style, so the site shows range rather than one look.
4. **Launch.** Verified facts, real logos, hosting, share previews, performance and accessibility.
5. **Exposure.** Each version ships as a drop: recap, case study, Substack letter, LinkedIn post, process clip. See `EXPOSURE.md`.

## Structure & navigation

- [x] Versions data model: `companies/<slug>/versions/<vN>/` with its own `version.json` (name, style, showcase flag) and `pieces/`. Adding a version still means adding a folder.
- [x] Routes: `/` → `/<company>` → `/<company>/<version>`
- [x] Top bar becomes breadcrumbs: `Motion / eBay / v1 Bright Bounce`
- [x] Directory modal: the whole tree (company → versions), opened from the top bar. It's the main way to navigate.
- [x] Mark the existing eBay and Google pieces as v1, the showcase
- [x] `/<company>`: a plain list of its versions (low priority; the modal is the main way to navigate)

## Home (the hook)

- [x] Centred headline: byline, "Exploring motion, by company", intro line
- [x] Slow, continuously rotating carousel of showcases below the headline
- [x] Carousel performance: only the front card plays live; the others show posters
- [x] Carousel on mobile: swipe, and still drifts slowly when idle
- [x] Reduced-motion fallback for the carousel

## Content

- [x] Recap template (9:16). Recaps are optional per version: ask each time.
- [ ] eBay v2 "Super Live": a redesign of eBay Live
- [ ] (parked; only up to v2 for now) eBay v3 "Retro Futurism": an experimental redesign of one aspect or feature
- [ ] Google v2 "Gemini Redesign": exploring a set of new Gemini features
- [ ] (parked; only up to v2 for now) Google v3 "Brutal Elegance": a redesign of an existing feature
- [ ] More companies: Tesla v1 Cybercab in progress, Tesla v2 Roadster next; more to come
- [ ] Verify every number marked "verify before publishing" (eBay 134M, $75B; Google 5T+, 6 products)
- [ ] Real company logos in `assets/` (currently typeset stand-ins)
- [ ] Decide on 15s vs 20s promos

## More piece types

Supported now (kit + site): `feature-loop`, `stat`, `lower-third`, at 16:9 or 1:1.

- [ ] Product UI walkthrough: an animated browser or phone mockup of the product in use
- [ ] Kinetic type / manifesto: a brand line or quote, set word by word
- [ ] Data viz: a chart or map that builds from real numbers
- [ ] 3D hero object (three.js): a product or brand shape, turntable or interactive
- [ ] Generative brand pattern: an endless, never-repeating background in brand colours
- [ ] Title card and end card / CTA templates, reusable in every promo
- [ ] Transition pack: wipes and morphs in each brand's shapes
- [ ] Ad sizes: 300×250 and 728×90 animated banners
- [ ] UI micro-animations: loaders, success states, button feedback (for product teams)
- [ ] Explainer with voiceover: script → TTS or your recording, captions timed with AssemblyAI

## Workflow & tooling (from the PDFs)

- [ ] Commentable storyboard: click a still to pin a comment, copy all (prompt 09)
- [ ] Element picker: pause a piece, hover to outline an element, save it to the library (prompts 06–07)
- [ ] Element library index page that previews everything in `elements/catalog.json`
- [ ] Architecture diagram of the pipeline in Excalidraw (prompt 02)
- [ ] Calibrate `/animate` after each review round, with feedback written as rules

## Exposure (see EXPOSURE.md)

- [ ] Embed URL for blog posts: `/embed/<company>/<v>/<piece>`
- [ ] Case-study page per version: storyboard rounds + comments + final pieces
- [ ] Newsletter signup (Substack embed) in the footer and on version pages
- [ ] UTM-tagged share links per channel
- [ ] Launch post: "Why I'm redesigning brands in motion"
- [ ] Process-clip template (screen recording of a /review comment → fix)

## Launch

- [ ] Hosting and deploy (static build, SPA fallback for routes)
- [ ] Share previews: Open Graph image and title per company and version
- [ ] MP4 downloads or a reel export for pitching
- [ ] Accessibility pass: keyboard navigation in the modal and carousel, focus states
- [ ] Analytics (maybe)
