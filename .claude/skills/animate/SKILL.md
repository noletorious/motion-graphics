---
name: animate
description: Make a motion piece for a company in this repo (logo sting, 15s promo, feature loop, social loop, stat, lower third). Storyboards first, builds a self-contained time-driven HTML piece, previews it, exports a 1080p MP4. Use when the user says /animate, asks for a new piece, or says "calibrate my /animate skill".
---

# /animate

Turns a brief into a piece at `companies/<slug>/pieces/<name>.html` that follows the piece contract in `CLAUDE.md`.

**Input:** a company slug, a piece type, and an optional brief, script, or recording.

## Flow

1. **Read** `companies/<slug>/brand.json` and the `assets/` folder. Then read `elements/catalog.json` and reuse what fits before making anything new, because a library only pays off if it gets used.
2. **Plan scenes.** Write one line per scene: start time, what's on screen, what moves, what's heard. Scene lengths follow the type (see Types).
3. **Storyboard.** Build each scene as `storyboard/scenes/<slug>-<piece>.html?shot=N` in its final look, with no motion. Run `npm run storyboard`, add the shots to `storyboard/index.html`, and **stop for comments**. The storyboard costs a third of the build and catches the wrong video early.
4. **Build** the piece. Start from an existing piece of the same type, then run `npm run sync-kit`. One `Piece.render(t)` draws everything. Keep the storyboard's shot layouts as keyframes, so the comments the user gave still apply.
5. **Sound.** Write it as `Piece.sounds` events using the `K.S` synths. Use short hits on cuts, one bed, and nothing louder than −6 dBFS peak.
6. **QA.** Run `npm run frames -- <slug>/<piece> <times…>` and look at the sheet: every scene, mid-transition frames, and for loops `0` and `duration − 0.01`. Then `npm run posters -- <slug>`.
7. **Review.** The user plays it on `/review` at 1× and 2×, pins comments, drags cuts, and pastes the list back. Apply it and change nothing else.
8. **Export**, only when the user says it's done: run `npm run export -- <slug>/<piece>`. It renders at 60fps, muxes the offline audio, and runs an ffprobe check (size, duration, audio stream). Check that the peak stays under −6 dB with `ffmpeg -i out.mp4 -af volumedetect -f null -`.
9. **Register** any reusable element in `elements/catalog.json`: `{ name, category, file, use }`. A piece you can't find again isn't a library.

If a recording is supplied, transcribe it with AssemblyAI (`ASSEMBLYAI_API_KEY`) for word timings. With only a script, time the captions from the script. If a needed tool or key is missing, tell the user what to set up. Don't fake it.

## Types

| type | stage | length | shape |
|---|---|---|---|
| logo-sting | 16:9 | 3–5s | build → resolve to logo → hold ≥1s |
| promo-15s | 16:9 | 15s | hook → product → features → numbers → how it works → CTA (PDF prompt 05) |
| feature-loop | 16:9 | 6–10s | one feature, seamless loop |
| social-loop | 1:1 | 4–8s | last frame = first frame |
| stat | 16:9 or 1:1 | 3–5s | one number counts up, then holds |
| lower-third | 16:9 transparent bg | 4–6s | in, hold, out |

## Rules

- **Facts.** Only use facts from brand.json, because a made-up number is worse than no number. Approximate stays approximate: write "5T+", never "5,012,331,000,000".
- **One idea per scene**, held long enough to read: about 4 words per second, and no scene longer than 6s.
- **Motion.** Moves are sharp in and sharp out, then a clean hold. Nothing drifts unless it's a background.
- **Brand.** Use only brand.json colours and fonts inside the piece. The site frame supplies none.
- **Loops.** A loop shares its first and last frame exactly. Test it by seeking to `duration - 1/60` and `0`.
- **Determinism.** No `Math.random()` without a seeded PRNG, and no `Date.now()` in `render`. Export has to match the preview frame for frame.

## Calibrate

When the user says "calibrate my /animate skill with this feedback", fold each pattern into the rule or step where it belongs, replacing the old wording. Don't append a dated section. Keep the reason next to each rule. Keep the file short; it should usually get shorter. Afterwards, tell the user exactly which lines changed.
