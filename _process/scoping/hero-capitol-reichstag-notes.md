# Capitol ↔ Reichstag hero — scoping notes

Status: **exploring options, nothing decided.** 2026-09-16.

## The idea

Two buildings as one symbol of the transatlantic integration BFNA works toward: the US Capitol and the
Reichstag/Bundestag. Rendered in a matte clay / low-poly 3D style like the hero on
<https://www.eventbeds.com/>, with some animation or transition between the two.

Reference photos: `~/Desktop/New Folder With Items/` (14 files: Capitol front, oblique, aerial; Reichstag
exterior, glass dome at night, chamber interior under the dome).

Image generation: **GPT Image 2 via Codex** (`codex -i <ref.png> …`), not Higgsfield.

## What the reference actually is

EventBeds is not low-poly. It is a matte white clay/plastic 3D city, isometric-ish camera, soft studio
light, greyscale scene with one brand accent (green), floating UI chips over it. A rendered 3D scene,
not a flat illustration. Two style vocabularies are on the table and should not be mixed:

- **Clay / matte white** — smooth, soft shadows, reads premium and calm. Keeps landmark detail (columns,
  dome ribs) so both buildings stay recognisable.
- **Low-poly** — faceted, flat-shaded. More "tech". Risk: the Capitol survives faceting, the Reichstag's
  glass dome and towers may not.

## The hook

Both buildings are domes. Capitol = stone dome, Reichstag = glass dome, and the current homepage hero
(`src/public/images/hero/homepage.jpg`) is already a dome oculus. Dome-to-dome says transatlantic with no
flag and no map, and gives a transition a shape.

## Option space

### A. How the two buildings relate

| # | Idea | Notes |
|---|------|-------|
| A1 | **One composite scene** — both buildings in the same clay world, domes facing or a shared plaza / bridge between them | No morph needed. Motion = camera drift + parallax across separately generated layers. Static fallback is free. |
| A2 | **Two states + transition** — Capitol scene → Reichstag scene on scroll or loop | Cheapest. Reads as before/after rather than integration. |
| A3 | **True morph** — one building becomes the other | Frame sequences from GPT Image 2 will not stay consistent across 20+ frames. Only viable through a 3D pipeline (Blender / Spline), which is a different project. |
| A4 | **Split / mirror** — one building, half Capitol half Reichstag, seam down the dome | Single still, strongest "one thing" statement, could look like a gimmick. Worth one test render. |
| A5 | **Dome only** — crop to the two domes, no bodies | Abstract, close to the current hero. Loses the landmark reading. |
| A6 | **Registered overlay + living mask** (Claudio's original idea) — two renders, same camera, silhouettes aligned (dome apex, cornice, portico centre, ground line), stacked; an organic mask driven by pointer and/or idle drift reveals one through the other, always a mix | The mix *is* the message, so it beats A2. Forms accurate, relative scale not (the Capitol dome is tall, the Reichstag's squat). Generate as **one diptych** — single run, identical camera/light — then split; two separate runs drift. |

### B. Motion

| # | Idea | Notes |
|---|------|-------|
| B1 | **Scroll-scrubbed parallax** | Still at rest, layers shift with scroll. No loop competing with the copy. |
| B2 | **Slow autoplay drift** | Continuous camera drift, feels alive. Loops forever next to the h1. |
| B3 | **Hover / pointer parallax** | Desktop only, dead on touch. |
| B4 | **Frame sequence on canvas** (12–24 stills) | Needed for A3 or any "build-up" animation. Heavy: deferred load, not the LCP image. |
| B5 | **Static** | Composite only, motion later. |
| B6 | **Living mask** (for A6) — noise/turbulence mask (SVG `feTurbulence` + `feDisplacementMap`, or a 2-texture WebGL shader) dragged by the pointer, with an idle breathing drift that swings near each full state | Hard vertical split = before/after slider; pointer spotlight = flashlight gimmick; organic mask = fluid. Idle drift covers touch and gives the eye moments of resolution under the h1. Reduced motion → fixed blend. |

All motion options collapse to a static composite under `prefers-reduced-motion`.

### C. Placement

| # | Idea | Notes |
|---|------|-------|
| C1 | **Replace the homepage hero photo** | Highest impact. `bfHero` / `bfHeroMedia` only know the gh#253 contract: white type over a 0.70 navy scrim. A white clay scene wants dark type on a light ground → new `ScrimMode` + a new measured contrast threshold. |
| C2 | **New band below the hero** | No hero contract change. Lower impact, faster. |
| C3 | **Hero, but scene sits beside the copy** (split layout) | Copy on a plain ground, scene in its own column. Sidesteps the scrim question, changes the hero from a band to a switcher. |

### D. Palette

| # | Idea | Notes |
|---|------|-------|
| D1 | **White clay + one navy accent** | Closest to the reference. Timeless. |
| D2 | **Program-colour tinted clay** | More "ours", busier. Which colour for which building? |
| D3 | **Warm stone vs cool glass** | Material tells the story: sandstone Capitol, glass-and-steel Reichstag. Two materials in one scene. |

## Why clay serves A6

Two greyscale clay renders share a palette, so the blend reads as one object shifting identity. Two
photographs blended read as a collage.

## Round 1 — six diptychs + mask test (2026-09-16)

Files: `hero-explorations/` — `gen.sh <view> <style>` (GPT Image 2 via `codex exec`, ~3 min each, ran 5 in
parallel), `split.sh <name>` (cuts the diptych at the white gutter), `out/*.webp` (diptychs + split panels,
`contact-sheet.jpg`), `mask-test.html` (throwaway turbulence-mask prototype; serve the folder and open
`mask-test.html#dome-clay`; launch config `hero-explorations` in `.claude/launch.json`).

Pairs generated: {front, dome, perspective} × {clay, photo}. One generation each, no cherry-picking.

Findings:

- **The diptych trick works.** One run, two stacked panels, identical camera/light/material in every pair.
  No drift between panels. This is the way to generate pairs.
- **Dome pair is the strongest** for the overlay: both domes centred, apex within a few % of each other,
  similar width. Stone ribs vs glass ribs read instantly. Clay and photo both good.
- **Front pair**: silhouettes rhyme, but the Reichstag body sits ~15% taller in frame than the Capitol's
  (squat dome + tall body vs tall dome + low body). Needs either a manual scale/offset on one layer
  (the prototype has sliders for it) or a re-prompt that pins cornice height instead of ground line.
  Photo version registers better than clay.
- **Perspective pair is the weakest**: the model drifted the camera between panels (different elevation
  and off-axis angle) and hallucinated extra towers on the clay Reichstag. Would need its own prompt
  iteration; not worth it before the view is chosen.
- **Accuracy**: Capitol is right in all six. Reichstag is right in front/dome; the clay front's tower
  spacing is slightly off, the pediment inscription renders correctly in all.
- **Clay vs photo**: clay blends as one object (as predicted). Photo pairs blend as a double exposure —
  still interesting, more "editorial", and the cool sky gives navy type somewhere to sit. Both viable;
  photo is the riskier brand fit next to the current photographic heroes, clay is the bigger departure.
- **Mask prototype**: SVG `feTurbulence` → contrast → + pointer spotlight → blur, as a mask on the top
  layer. Idle breathing + lissajous wander when no pointer; static under reduced-motion. Fluid enough
  to keep; blob scale, contrast, spot radius and drift speed are sliders. No library, ~80 lines.
- **Randomised pairs** (Claudio's item 1): trivial once the set exists — pick a pair at load. Each pair
  needs its own registration offsets, so store {a, b, scale, dx, dy} per pair.

## Round 2 — portico as the registration anchor (Claudio, 2026-09-16)

Decision: **register on the central portico** (pediment apex, entablature line, pediment width, column
bases), not on the dome or the ground. Both buildings have one at nearly the same relative width, so
pinning it lets the dome, towers and wings do the differing.

`gen.sh portico <style>` pins: apex 42%, entablature 50%, pediment 36–64% of width, column bases 76%.

- **portico-clay**: registered straight out of the model — pediment apex, base and width land within
  ~2–3% in both panels, column bases within 3%. In the mask test the Reichstag's DEM DEUTSCHEN VOLKE
  surfaces inside the Capitol's pediment and the glass dome ghosts through the drum. This is the pair.
  Flaw: the model kept the whole Reichstag inside the frame, so it sits small with empty ground above;
  the wings do not run off the panel as asked.
- **portico-photo**: pediment widths match (both 37–63%) but the model ignored the vertical pin; the
  Reichstag pediment sits ~29% higher than the Capitol's. A single offset (B down 220px on the 756-high
  panel) registers it, now stored as a preset in `mask-test.html`. Registered, it works as well as clay.
- Rule that falls out: **prompt for the width and the horizontal centre; fix the vertical by offset.**
  The model holds x-registration reliably, y only sometimes.

## Round 2b — squares mask (Claudio's reference: FlowOS-style tinted square grid)

Added `mask: squares` mode to `mask-test.html` (`?mode=squares#portico-clay`). One canvas: Capitol drawn
underneath, the registered Reichstag drawn per grid cell with that cell's own alpha. Alpha per cell =
3-D value noise (drifts with time) + pointer spotlight, quantised to N levels (`levels` slider, 0 =
smooth) and eased per cell so tiles fade instead of popping. `cell size`, `cell gap`, `cell noise
scale`, `cell ease` sliders. Reads as a tiled mosaic of the two buildings — closer to the brand
background than the turbulence blobs, and the quantised levels are what make it look like the reference
rather than like a pixelated crossfade.

Caveat seen in the photo pair: registering by offset exposes the top edge of the shifted layer as a
seam. Production fix is to generate B with headroom (or scale rather than shift), not to mask the seam.

Both masks now live side by side in the prototype; the switch is one dropdown.

**Verdict (Claudio): squares are not great.** Kept in the prototype for reference; turbulence stays the
working direction.

Next: re-run `portico` 3–4× per style for variance and pick the best pair per style; then decide clay vs
photo with BFNA. Perspective and dome views are parked.

## Pipeline constraints (GPT Image 2)

- **Consistency is the risk.** Order of work: one style-anchor render → approve → every other image derived
  from it with the anchor attached as reference (`-i`). Never generate the two buildings independently.
- Layers need **transparent backgrounds** for parallax.
- Hero budget: roughly 3–5 layers at 2× WebP, under the LCP budget. A 24-frame sequence blows it.
- Recognisability check per render: Capitol = dome + Statue of Freedom + portico; Reichstag = glass dome +
  four corner towers + "DEM DEUTSCHEN VOLKE" pediment. If a render loses those, it is a generic
  neoclassical building.
- Mobile: two buildings side by side do not fit at 400px. Either stack vertically, crop to the domes, or
  show one building at a time.

## Explicitly out of round one

Interior chamber views, people, flags, the floating UI chips from the reference, any 3D runtime
(Three.js / Spline).

## Open questions

- Is the pairing meant to be literal (the two parliaments) or symbolic (two governments, two publics)?
  Changes whether the plaza between them matters.
- Does this replace the dome oculus hero everywhere, or only on `/`?
- Any sensitivity about the Capitol image post-2021 that BFNA would want to steer around?
