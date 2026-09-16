# hero-explorations — Capitol ↔ Reichstag overlay experiments

Experiments only. Nothing here ships. Context and findings: [`../hero-capitol-reichstag-notes.md`](../hero-capitol-reichstag-notes.md).

- `gen.sh <front|dome|portico|perspective> <clay|photo>` — one vertical diptych (top Capitol, bottom
  Reichstag) from GPT Image 2 via `codex exec`, reference photos attached from `refs/`. ~3 min. Writes
  `out/<view>-<style>.webp`.
- `split.sh <view>-<style>` — cuts the diptych at the white gutter into `out/…-capitol.webp` and
  `out/…-reichstag.webp` (needs ImageMagick).
- `mask-test.html` — throwaway prototype of the "living mask" overlay: two registered panels, the
  Reichstag revealed through the Capitol by a turbulence mask (or a squares grid, parked) driven by
  pointer + idle drift. Serve this folder statically and open
  `mask-test.html#portico-clay` (`?mode=squares` for the grid). Sliders on the right; per-pair
  registration presets in `PRESET`.
- `out/contact-sheet.jpg` — all six round-1 diptychs at a glance.
- `refs/` — the reference photos handed to the model for accuracy (not for framing).
