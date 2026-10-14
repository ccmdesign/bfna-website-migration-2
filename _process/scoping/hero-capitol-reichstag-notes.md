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

## Concept space beyond Capitol ↔ Reichstag (2026-09-21)

The overlay mechanic wants a pair with **shared structure and different identity**. Test for any pair:
reads in one second to both audiences · registers · is not state heraldry or a cliché · survives 400px ·
is not dated by whoever is in office.

| # | Pair | Why it could work | Risk |
|---|------|-------------------|------|
| K1 | **"We the People" ↔ "DEM DEUTSCHEN VOLKE"** — the Constitution's opening words and the Reichstag's pediment inscription | Same sentence, two democracies: both name the people as the source. Typographic, so it is sharp at any size and needs no AI imagery; can sit on the portico work already done | Needs the right lettering (engrossed script vs Behrens' bronze capitals) to be legible as a pair |
| K2 | **Brandenburg Gate ↔ Lincoln Memorial** | Both Doric colonnades, near-perfect registration, and the Gate says "Germany" to an American faster than the Reichstag does | Gate = Berlin/reunification more than democracy; Lincoln = a president, not the people |
| K3 | **Plenary hemicycles** — Bundestag chamber ↔ House chamber, or abstracted to seat-map diagrams | Same geometry, registers exactly; the abstract version is data-native for a think tank and can be real seat data | Party colours make it partisan and dated the day after an election; keep it monochrome |
| K4 | **One sun, six hours apart** — live day/night terminator over the Atlantic, DC and Berlin marked | Always a mix, by physics; genuinely live; no symbols to argue about | Cartographic heroes are common; needs craft to not look like a weather widget |
| K5 | **What actually connects them** — undersea cables, flight tracks, trade or data flows across the Atlantic | The subject becomes the ocean between, not the two shores; ties to the digital and trade work | Reads "tech infrastructure" unless drawn warmly |
| K6 | **Roebling's bridge** — Brooklyn Bridge, designed by a German immigrant | A literal German-American bridge that is true, not a metaphor | "Bridge" is the oldest transatlantic cliché (Atlantik-Brücke); only one side is pictured |
| K7 | **Braided lines** — two opinion/indicator series from the Transatlantic Barometer converging and diverging | Honest: the relationship has friction, and BFNA measures it. Uses their own data | Abstract; says "report" more than "institution" |
| K8 | **Everyday civic pairs** — Rathaus ↔ town hall, Marktplatz ↔ Main Street, ballot ↔ Stimmzettel | Democracy as lived, not monumental; good for program pages | Low recognisability per image; needs a series to land |
| K9 | **Two eagles** — Bundesadler ↔ Great Seal eagle | Same animal, registers perfectly | State heraldry on a private foundation's site; heavy historical freight on the German side. Avoid |
| K10 | **Flags / colours** | Shared red | Cliché, nationalistic, and BFNA's palette is neither. Avoid |

Caution on the premise: a **merge** claims harmony. BFNA's work is about a relationship with tension in it.
Mechanics that never settle (the living mask, the braided lines, the moving terminator) are truer than
ones that resolve into a single fused object.

## Round 3 — minimalist big-sky pair, dome centred (2026-09-21)

Goal (Claudio): a minimalist image of each building, dome centred, large clear sky with sparse clouds
above, as raw material for another pass at the overlay. References: Claudio's Unsplash set in
`_process/images/` (downsized copies of the four straight-on shots in `hero-explorations/refs2/`).

Script: `hero-explorations/gen-sky.sh <diptych|capitol|reichstag> [tag]`. Framing pinned in the prompt:
dome at 50% width, building in the bottom 40% of the frame, top 60% open sky, frame cropped just under
the steps, three or four sparse clouds, no people/flags/trees/lawn.

- `out/sky-diptych.webp` — one run, two stacked panels. Same sky **and the same clouds in the same
  places** in both panels. Buildings sit small (each panel is only 1024×756).
- `out/sky-capitol.webp` → `out/sky-reichstag.webp` — **chained singles** at 1536×1024: Capitol first,
  then the Reichstag generated with the Capitol render attached and told to match camera, light and sky.
  The second run reproduced the sky cloud for cloud (RMSE 6% over the top 380px, and
  `out/sky-blend-5050.jpg` shows no cloud ghosting). Dome axes coincide at x≈765.
- This overturns the round-1 rule "never generate the two buildings independently". Independent runs
  drift; a **chained** run with the first image as reference holds, and gives 1.5× the resolution of a
  diptych panel. Chained singles are now the preferred method.
- Registration as generated: domes share the vertical axis; the Reichstag fills more of the width
  (pediment 37–62% vs the Capitol's 43–56%) and its roofline sits ~50px higher. Fine for a mask overlay;
  a scale on one layer would tighten it.
- Since the skies match, a mask only ever swaps the building: no seams or double clouds in the top 60%.
  Fallback if a future pair's skies differ: generate on a cloudless gradient and add one shared cloud
  layer on top (which can also drift).
- The Codex image tool does not expose which model version it routes to.

## Round 4 — the pair on the real homepage hero, plain crossfade (2026-09-21)

`bfHero` takes a new optional `imageSecondary` (`HeroProps`), passed to `bfHeroMedia` as `srcSecondary`.
The second image is stacked over the first and faded by a CSS keyframe loop: 20s cycle, 7s holds, 3s
fades, hook `--_bf-hero-media-crossfade-duration`. Stops under `prefers-reduced-motion`, leaving the
Capitol. The first image keeps `fetchpriority="high"`; the second has none, so LCP is unchanged.
`pages/index.vue` points at `/images/hero/homepage-capitol.jpg` + `homepage-reichstag.jpg` and sets
`--_bf-hero-media-image-position: center 80%` so the band's wide crop keeps the domes rather than the sky.

- Hero images live in **two** tracked places, `src/public/images/hero/` and `public/images/hero/`; the dev
  server serves the latter. New images have to go in both.
- Open: **no pause control** (WCAG 2.2.2 asks for one on anything that auto-updates for more than 5s).
- Open: the existing 0.70 navy scrim flattens the blue sky the images were made for. The minimalist
  big-sky look only pays off with a lighter scrim or the `panel` mode.

## Round 5 — square (1:1) pair, sky expanded, buildings untouched (2026-09-21)

Goal (Claudio): 1:1 images so the hero can anchor them at the bottom and `cover`, gaining sky as the band
gets taller. Buildings must stay exactly as they are.

Asking the model to "extend the canvas" re-renders the whole picture, building included (confirmed: the
Capitol in `out/sky-extension.webp` differs from the original). So the model only supplies new sky:

1. `gen-square.sh` — the model extends `sky-capitol` upward to 1024×1024, adding sky and two clouds.
2. `compose-square.sh <capitol|reichstag>` — upscales that to 1536, keeps **only the top band** as a sky
   plate, colour-matches it per channel to the original's top 160 rows, and pastes the **original
   1536×1024 render** at the bottom with a 160-row sigmoidal alpha ramp. The seam sits in empty sky.

Results: `out/sky-capitol-square.webp`, `out/sky-reichstag-square.webp` (1536×1536). Bottom 864 rows are
the originals (RMSE 0.4%, recompression only). Both buildings share one plate, so the added sky and its
clouds are identical across the pair. No seam visible under extreme contrast stretch; the only tell is a
slope change in the gradient (the plate is flatter than the original sky).

Gotcha: `codex exec` run in the **foreground** blocks on "Reading additional input from stdin". All three
gen scripts now redirect `< /dev/null`.

On the homepage: `homepage-capitol-square.jpg` / `homepage-reichstag-square.jpg` (both public folders),
`--_bf-hero-media-image-position: center bottom`, `object-fit: cover` (already the component's), and the
home band's height hook set to `max(60svh, min(56.25vw, 100svh))` — 16:9 on desktop, never taller than
the viewport, unchanged on phones. At 16:9 the visible window is the bottom 56% of the square; on a
2.67:1 band (the old 60svh) bottom-anchoring would clip the Statue of Freedom, which is why the height
moved with the anchor.

## Round 6 — wider: sky to the sides, buildings at two thirds width (2026-09-23)

Goal (Claudio): more sky beside the buildings, buildings smaller/shorter in the hero. Buildings still not
regenerated. Files `hero-explorations/gen-wide.sh`, `gen-plate.sh`, `skyline-mask.py`, `compose-wide.sh`.

What did not work first:
- Colour-matching a zoom-out plate to the original's sky: the original's gradient is compressed when
  scaled down, so a rectangle shows around it.
- Keying the building by colour (`r > 0.95·b`): eats the glass dome and every sky-coloured window.
- Erasing the model's building from the plate by row-filling: fill bands and rectangle edges visible.

What works — three layers:
1. **Empty plate** from the model (`gen-plate.sh`): the zoomed-out scene with the building removed, sky
   and plaza only. Shared by both images, so the crossfade sees one sky.
2. **Original render, skyline-masked** (`skyline-mask.py`): per column, everything below the first
   solid pixel (warm or dark) is kept, with a morphological closing of the skyline (45px) so glass
   between dome ribs is filled without widening spires. Scaled to the zoom-out footprint (0.66).
3. **Capitol only**: the model's end pavilions from the zoom-out (`gen-wide.sh capitol`), because the
   original's wings are cut at its frame edge. 56px overlap under a 28px feather. Visible on close
   inspection as a slightly soft, slightly taller pavilion at each end; fine at hero scale.

Results: `out/wide-capitol.webp`, `out/wide-reichstag.webp` (1536², building ≈ 67% of width, both on
the plate's plaza line at row 1476). Installed as `homepage-*-square.jpg` in both public folders; hero
settings from round 5 unchanged (bottom anchor, cover, 16:9 band).

To zoom out further: change the footprint in `gen-wide.sh`'s prompt (currently "central 60%"), re-run
`gen-wide.sh capitol`, `gen-plate.sh`, re-measure with `measure-footprint.py`, update CL/CR/CTOP in
`compose-wide.sh`.

## Round 7 — square pair straight from the model (2026-09-23)

Claudio rejected the round-6 composite. Replaced by a pure generation: `gen-square-pair.sh capitol`
then `gen-square-pair.sh reichstag` (chained, Capitol image as the match reference), 1024², building in
the central 55% of the width, dome top no higher than 72% down, plaza strip at the bottom, six clouds.
Result: `out/sq-capitol.webp`, `out/sq-reichstag.webp` — same sky, same clouds in the same places,
same plaza line. Installed (upscaled to 1536) as `homepage-*-square.jpg` in both public folders.
Compositing scripts from rounds 5–6 stay in the folder as a record of what not to do.

## Round 8 — blur investigation (2026-09-23)

Cause: the image tool caps output at ~1.57 MP whatever the aspect (square → 1024², or 1254² when asked
for "largest"; landscape → 1536×1024). Round 7's square put the building in 55% of 1024 px = ~560
native px, and the hero paints it across ~3800 device px on a retina 1900-px-wide pane: a 3.7× stretch
(rounds 3–5 were 2.5×). No local upscaler on this Mac (no Real-ESRGAN/Upscayl; Higgsfield CLI has no
upscale model).

Fix: generate the pair in **landscape 1536×1024** (`gen-landscape-pair.sh`, chained as before, building
in the central 57%, ~880 native px) and extend the sky upward to a square with the round-5 method
(`PREFIX=ls ./gen-square.sh` → `PREFIX=ls ./compose-square.sh capitol|reichstag`), which touches only
empty sky and was seamless. Results `out/ls-*-square.webp`, installed as `homepage-*-square.jpg` at
q90 4:4:4. ~1.6× more building detail than round 7; still a 2.4× stretch on a 2× display, the same as
every other hero on the site (1600-px sources).

The only way past that ceiling is an upscaler (Real-ESRGAN locally, or a hosted one) on the 1536 source.

## Round 9 — WebGL shader hero, option 1 saved (2026-10-09)

`hero-explorations/hero-option-1-living-mask-pairs.html` (frozen; `hero-shader.html` is the working copy).
One fragment shader over the 11 photographic pairs in `hero-images.json` (symlinked in as
`hero-images.json` and `site-hero/`):

- **Within a pair**: the living mask from round 1 — drifting noise blend that never settles, boundary
  refracts and splits colour slightly. The pointer opens whichever building is currently less visible
  (`?spot=0.45` radius, `?pull=3.2` strength).
- **Between pairs**: every 11s (`?hold=`) a second, larger noise front sweeps left to right (3.6s) and
  swaps the pair.
- Word-by-word heading entrance, pause button, static frame under reduced motion.
- `?scrim=full|panel|light` — `light` (no wash, copy on an opaque navy panel) shows the effect best and
  would need a new hero mode plus a decision record. `?set=ai` runs the round-8 generated pair instead.

Not yet in `bfHero`. Open: scrim mode, soft sources under 1000px, image rights flagged in the JSON.
