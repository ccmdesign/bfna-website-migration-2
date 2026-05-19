---
title: "fix: Port BF-51 blur + BF-50 crop/centering image fixes into the Nuxt rebuild [BF-60]"
type: fix
status: active
created: 2026-05-19
ticket: BF-60
target_repo: bfna-website-migration-2 (app subdir: bfna-website-nuxt/)
branch: feature/BF-60-image-parity-migration2
---

# fix: Port BF-51 blur + BF-50 crop/centering image fixes into the Nuxt rebuild [BF-60]

> **Target repo:** `bfna-website-migration-2`. The Nuxt 4 app lives in the `bfna-website-nuxt/`
> subdirectory; **all paths in this plan are relative to `bfna-website-nuxt/`** unless stated
> otherwise. The Eleventy reference repo (`ccmdesign/bfna-website`, read-only) and the abandoned
> Contentful rebuild (`ccmdesign/bfna-website-v2`, read-only) are cited as proven prior art only —
> never edited by this plan.

---

## Summary

Two image-handling fixes are already shipped and proven on the **live Eleventy** BFNA site
(`ccmdesign/bfna-website`, PR #109 = BF-51 blur, PR #110 = BF-50 crop/centering). This rebuild
(`bfna-website-migration-2`, Nuxt 4 + `@directus/sdk` + `@nuxt/image ^2`) still carries the
**pre-fix behavior** and must reach parity before cutover:

1. **Blur (BF-51 parity):** product/cover images render blurry on desktop/retina because the
   responsive source the browser fetches is too small for the rendered box. On the live site the
   cause + fix lived in a Contentful `srcset` ladder and a pre-bake URL helper. **In this rebuild
   the equivalent surface is different:** product images flow through `<NuxtImg>` +
   `@nuxt/image` config, with raw, param-less Directus asset URLs. The fix is to make
   `@nuxt/image` actually emit a high-ceiling `srcset`, correct the understated `sizes`
   attributes, raise quality toward ~90, and stop forcing webp on PNG cover art.

2. **Crop / centering (BF-50 parity):** the rebuild's `src/public/css-legacy/global.css` is
   **byte-identical to the pre-BF-50 Eleventy CSS**, including the deliberate oversize/bleed
   "background-cover" rules on the product hero and product cards, and the same broken
   `--black--hsl` (double-dash) shadow token. The fix is the same CSS edit, translated 1:1: show
   the image contained at natural aspect ratio, centered, `max-width:90%`, with the standard
   elevation shadow — while preserving the publication ("Nate 3D book") presentation.

This is a parity port. The live PRs are the **source of truth** for the intended behavior; the
job here is to map each Eleventy/Contentful change onto its Nuxt 4 + Directus + `@nuxt/image`
equivalent, not to redesign.

---

## Problem Frame

### Architecture mapping (Eleventy live → this Nuxt rebuild)

| Concern | Live Eleventy (`bfna-website`, source of truth) | This rebuild (`bfna-website-nuxt/`) |
|---|---|---|
| Image source URL | Contentful URL pre-baked by `getImageAssetUrl()` in `src/_data/contentful/common.js` (`?w=800&fm=webp&q=80&fit=fill`) | Directus asset URL built by `getImage()` in `src/directus/common.js` line 62-64: `${BASE_URL}/assets/{id}` — **no transform params at all** |
| Responsive ladder | Per-component `srcset` built from `contentfulImage()` filter (`src/_filters/contentfulImage.js`) at 360–2400w | **No explicit ladder.** `<NuxtImg>` + `@nuxt/image` config in `src/nuxt.config.ts` (`quality: 80`, `screens`, `domains: ['bfna.simplyas.com']`) generates srcset |
| `sizes` attribute | Hardcoded per `.njk` module (understated → blur) | Hardcoded per `.vue` component (`ProductHero.vue`, `ProductCard.vue`, `ProductCardWebsite.vue`, `ProductCardThin.vue`) — **same understated values** |
| Quality default | `quality || "80"` in filter; `q=80` in pre-bake | `quality: 80` in `@nuxt/image` config; `format="webp"` hardcoded on every `<NuxtImg>` |
| PNG passthrough | filter + pre-bake skip `fm=webp` for `.png` | none — `format="webp"` is hardcoded on the `<NuxtImg>` tags |
| Hero / card CSS | `src/assets/css/global.css` (fixed in PR #110) | `src/public/css-legacy/global.css` — **identical to pre-fix Eleventy**, lines ~2334–2640 |
| Shadow token | `--black-hsl: 0, 0%, 15%`; broken `--black--hsl` typo fixed in #110 | **identical**: `--black-hsl` at line 240; broken `--black--hsl` at line 2623 |
| Publication / "Nate 3D book" | `.product-card--report` kept at `max-width:50%` (scope guard) | Two candidates — see Decision D6 / Open Question Q1 |

### Blur — root cause in *this* stack (differs from Eleventy)

On Eleventy the blur was a too-low Contentful `srcset` ceiling. Here there is **no Contentful
filter and no hand-built ladder**. Instead:

- `product.image.url` is a raw Directus URL (`https://<directus>/assets/{id}` with no `?w=`).
  Verified: `src/directus/products.js:24-27` sets `i.image.url = common.getImage(item.cover_image.id)`.
- Components render `<NuxtImg :src="product.image.url" :width="1024" format="webp" sizes="...">`.
- `@nuxt/image` generates the `srcset` from its `screens` map (max `xxl: 1536`) and the
  per-component `sizes`. The `sizes` values were copied verbatim from the **pre-BF-51** Eleventy
  modules (e.g. hero `(min-width: 64em) 480px`), so they understate the true rendered width and
  the browser under-fetches → blur. The BF-50 CSS scales the rendered image to 150–180% of its
  column, compounding the gap.

So the BF-51 *intent* (raise ceiling, correct `sizes`, raise quality, PNG passthrough) ports,
but the *mechanism* is `@nuxt/image` config + component `sizes`/`format` props, **not** a
Contentful filter. Whether `@nuxt/image`'s active provider can even resize the external Directus
domain is a decision point (D2 / Q2).

### Crop — root cause in *this* stack (identical to Eleventy)

`src/public/css-legacy/global.css` is the literal pre-BF-50 file. The exact rules PR #110
removed/rewrote are present at the same offsets:

- `.product-card--report .product-card__image > img`: `margin: -30% 0 -15%` (line 2442-2443);
  `@64em` `position: absolute; max-width: 110%; margin: -15% -2% -8%` (line 2451-2457).
- `.product-card--website .product-card__image > img` `@64em`: `margin: -12.7%; max-width:180%;
  width:180%` (line 2471-2475); `.product-card__image { z-index:-1 }` (line 2468).
- `.product-hero--website, .product-hero--video { overflow: hidden }` (line 2617-2620);
  shared hero img `box-shadow: 4px 4px 8px hsl(var(--black--hsl), 0.15)` — **broken token**
  (line 2623); `@64em max-width:150%; width:150%` (line 2625-2631).

The BF-50 CSS port is a near-1:1 transcription of the PR #110 + follow-up (`e791506` +
`e58f9ea`) diffs onto this file.

---

## Requirements

Traced to the live PRs (source of truth) and BF-60:

- **R1 (blur ceiling):** Product/cover images must offer responsive sources up to ~2400w
  (hero/website) / ~1920w (smaller card) so retina/desktop boxes are not upscaled. (live: PR #109
  U1–U3 ladders)
- **R2 (sizes correctness):** `sizes` on each product image must reflect the *true rendered
  width* after the BF-50 contain/center CSS, not the pre-fix understated values. (live: PR #109
  U1–U3 `sizes` rewrites)
- **R3 (quality):** Default optimized-image quality raised toward ~90. (live: PR #109/#7599ca7
  `q=80 → q=90`)
- **R4 (PNG passthrough):** Lossless PNG cover art must not be force-converted to lossy webp.
  (live: PR #109 `contentfulImage.js` + `common.js` PNG branch)
- **R5 (contain/center hero):** Product hero (`--website`/`--video`) image shown contained,
  natural aspect ratio, vertically + horizontally centered, `max-width:90%`, standard elevation
  shadow; remove `overflow:hidden` clip and `@64em` 150% oversize; fix broken `--black--hsl`
  token. (live: PR #110 U1 + `e58f9ea`)
- **R6 (contain/center website card):** `.product-card--website` image contained/centered/
  `max-width:90%`/standard shadow at all widths; remove `@64em` 180%/negative-margin bleed and
  `z-index:-1` overlap. (live: PR #110 U2 + `e58f9ea`)
- **R7 (contain report card, preserve publication):** Remove `.product-card--report` oversize
  bleed (`margin:-30%...`, `@64em` absolute 110%); contain/center + standard shadow; **preserve
  the `>=40em max-width:50%` "Nate 3D book" presentation**. (live: PR #110 U3)
- **R8 (scope guard):** Publication / `.product-card--item` path and the shared base
  `.product-card__image > img` rule must not regress. (live: PR #110 scope guard)
- **R9 (parity, not redesign):** Behavior must match the live site; no new product/visual
  identity introduced.

---

## Scope Boundaries

**In scope**
- `@nuxt/image` config (quality, screens/ceiling) in `src/nuxt.config.ts`.
- Per-component `sizes` (and `format` / PNG handling) on the product image tags in
  `ProductHero.vue`, `ProductCard.vue`, `ProductCardWebsite.vue`, `ProductCardThin.vue`.
- The product hero + product card CSS blocks in `src/public/css-legacy/global.css`
  (the BF-50 rules), including the `--black--hsl` token typo.
- Confirming the publication ("Nate 3D book") presentation is not regressed.

**Out of scope / non-goals**
- Any change to the live Eleventy repo or the abandoned `bfna-website-v2` repo (read-only refs).
- Redesigning the product page, card layout, or visual identity beyond BF-50/BF-51 parity.
- Migrating the dormant Contentful `getImageAssetUrl()` path (`src/directus/common.js:48-53`)
  unless research shows a product surface still consumes it (it does not today — only
  `src/directus/docs.js` calls it). See Q3.
- Broader image-pipeline rework (CDN choice, Directus transform presets) beyond what parity
  requires.

### Deferred to Follow-Up Work
- If Q2 resolves that the active `@nuxt/image` provider cannot resize the external Directus
  domain, a follow-up may introduce a Directus-aware custom provider or switch product images to
  Directus native transform params (`?width=&quality=&format=`). The minimal parity path
  (correct `sizes` + quality + PNG, accept provider's native srcset behavior) stays in this plan;
  the provider rework is deferred unless it proves to be the *only* way to satisfy R1.

---

## Key Technical Decisions

- **D1 — CSS port is authoritative and ~1:1.** Because `src/public/css-legacy/global.css` is
  byte-identical to the pre-BF-50 Eleventy file, transcribe the PR #110 (`e791506`) +
  follow-up (`e58f9ea`) diffs directly onto the matching rules. Do not re-derive the values.
- **D2 — Blur fix is realized in `@nuxt/image` config + component props, not a URL filter.**
  This rebuild has no `contentfulImage` equivalent in the product path. R1/R3/R4 are satisfied by
  (a) `@nuxt/image` `quality` and a higher screen/ceiling, (b) per-component `sizes` rewrites,
  (c) PNG-aware `format` handling on `<NuxtImg>`. The Eleventy ladder widths are the *target
  ceiling reference*, not literal code to copy.
- **D3 — `sizes` values are recomputed against the post-BF-50 layout.** The Eleventy PR #109
  `sizes` rewrites assumed Eleventy's column math. Re-derive from this rebuild's CSS after the
  BF-50 contain/center change (image is now `max-width:90%` of its flex column, no 150–180%
  oversize), using the live values as the sanity ceiling (hero desktop ~1000px, website card
  ~1280px, item ~600px from PR #109 as upper bounds).
- **D4 — Quality ~90.** Raise `@nuxt/image` `quality: 80 → 90` (config-level, matches live
  `q=80 → q=90`).
- **D5 — PNG passthrough.** Stop unconditionally forcing `format="webp"` on `<NuxtImg>` for PNG
  cover art; let PNG sources keep their format (drop/condition the `format` prop, or detect
  `.png` on `product.image.url`). Mirrors the live `isPng` branch.
- **D6 — Publication presentation is `ProductCardThin.vue` (`.product-card--item`), not
  `.product-card--report`.** In this rebuild the live `.product-card--report` "Nate 3D book"
  look has effectively moved into `ProductCardThin.vue`, which renders `.product-card--item` and
  applies a **scoped JS resize** (`adjustImageSize()`: `objectFit:contain`,
  `objectPosition:bottom`, height = card+4px) plus scoped CSS. The BF-50 scope guard
  (R7/R8 "preserve Nate 3D book") therefore means: leave `ProductCardThin.vue`'s JS/scoped CSS
  and the `.product-card--item` global rules **untouched**, and still apply the live
  `.product-card--report` rewrite to the global `.product-card--report` block for any surface
  that uses it. Confirm during implementation which surfaces actually render
  `.product-card--report` vs `.product-card--item` (Q1).
- **D7 — Standard elevation shadow token.** Use `0px 8px 32px hsl(var(--black-hsl), 0.15)`
  (already used at lines 2366, 2480, 3477 of this file) and fix the broken `--black--hsl`
  double-dash typo at line 2623 — identical to the live fix.

---

## Implementation Units

### U1. Contain & center the product hero image; fix broken shadow token

**Goal:** Bring the product hero (`--website` / `--video`) image to BF-50 parity: contained,
natural aspect ratio, vertically + horizontally centered, `max-width:90%`, standard elevation
shadow; remove the `overflow:hidden` clip frame and the `@64em` 150% oversize; fix the broken
`--black--hsl` token.

**Requirements:** R5, R8, R9

**Dependencies:** none

**Files:**
- `src/public/css-legacy/global.css` (rules around lines 2567–2631: `.product-hero__image`,
  `.product-hero__image > img`, `.product-hero--website,.product-hero--video` block)

**Approach:** Transcribe the `e791506` + `e58f9ea` hero hunks: add `display:flex;
align-items:center; justify-content:center` to `.product-hero__image`; set
`.product-hero__image > img` to `display:block; max-width:90%; width:auto; height:auto;
margin-inline:auto; object-fit:contain`; **delete** the `.product-hero--website,
.product-hero--video { overflow:hidden }` rule and the `@64em` `max-width:150%; width:150%`
rule; replace the broken `box-shadow: 4px 4px 8px hsl(var(--black--hsl), 0.15)` with
`box-shadow: 0px 8px 32px hsl(var(--black-hsl), 0.15)`. Do not touch unrelated
`.product-hero--<theme>` color tokens.

**Patterns to follow:** the standard shadow already present at `global.css` lines 2366/2480/3477;
the live diff `e791506`/`e58f9ea` hunks for `.product-hero__image`.

**Test scenarios:**
- `Covers R5.` Visual/browser: on a `--website` product hero (e.g. a `future-leadership`
  product detail page) at >=64em the cover image is fully visible (not clipped/cropped), centered
  horizontally and vertically in its column, `<=90%` width, with a soft drop-shadow rendered
  (token resolves — shadow visible, proving the `--black--hsl` typo fix).
- Edge: very tall and very wide cover images both stay contained (no overflow, no clip) at
  320px, 768px, 1024px, 1440px viewport widths.
- Scope: a non-`--website`/`--video` hero (e.g. `--democracy` plain hero) is visually unchanged.

**Verification:** Build succeeds (`npm run build`); on the rendered product hero the image is
contained/centered with a visible standard shadow and no `overflow:hidden` clipping at all
breakpoints; diff limited to the hero block of `global.css`.

---

### U2. Contain & center the `--website` listing card image

**Goal:** Bring `.product-card--website` to BF-50 parity at all widths: contained, centered,
`max-width:90%`, standard shadow; remove the `@64em` 180%/negative-margin bleed and the
`z-index:-1` overlap crop.

**Requirements:** R6, R8, R9

**Dependencies:** none (independent of U1)

**Files:**
- `src/public/css-legacy/global.css` (rules around lines 2460–2493:
  `.product-card--website .product-card__image` and its `> img`, base + `@64em`)

**Approach:** Transcribe the `e791506` + `e58f9ea` website-card hunks: add a `--website`-scoped
base rule `.product-card--website .product-card__image { display:flex; align-items:center;
justify-content:center }` and `.product-card--website .product-card__image > img { display:block;
max-width:90%; width:auto; height:auto; margin:0 auto; object-fit:contain;
box-shadow:0px 8px 32px hsl(var(--black-hsl),0.15) }`; in the `@64em` block remove
`z-index:-1` from `.product-card--website .product-card__image` and replace the
`margin:-12.7%; max-width:180%; width:180%` img rule with the contained/centered/`max-width:90%`/
shadow rule. **Do not** alter the shared base `.product-card__image > img` rule (lines
2347–2357) — it is the report/video/item scope guard.

**Patterns to follow:** live diff `e791506`/`e58f9ea` `.product-card--website` hunks; existing
standard shadow usages in the file.

**Test scenarios:**
- `Covers R6.` Browser: on a workstream listing page that renders a website-type product card
  (e.g. `future-leadership/index.vue` via `ProductCardWebsite.vue`) at >=64em the card image is
  fully visible, centered, `<=90%` width, soft shadow, and no longer bleeds under/over the
  content block (no `z-index:-1` overlap).
- Edge: <64em (mobile/tablet) the same card image is contained/centered, not negative-margin
  bled.
- Scope: a `--report`-type and `--item`-type card on the same or adjacent page is visually
  unchanged by this unit.

**Verification:** Build succeeds; website card image contained/centered/shadowed at <64em and
>=64em; shared base `.product-card__image > img` rule untouched (grep-diff confirms).

---

### U3. Contain `.product-card--report` oversize; preserve publication ("Nate 3D book")

**Goal:** Remove the `.product-card--report` oversize/bleed (`margin:-30% 0 -15%`; `@64em`
`position:absolute; max-width:110%; margin:-15% -2% -8%`); show it contained/centered with the
standard shadow; **preserve the `>=40em max-width:50%` "Nate 3D book" presentation** and do not
regress `.product-card--item` / `ProductCardThin.vue`.

**Requirements:** R7, R8, R9

**Dependencies:** none (independent of U1/U2)

**Files:**
- `src/public/css-legacy/global.css` (rules around lines 2436–2458:
  `.product-card--report .product-card__image > img` base, `@40em`, `@64em`)

**Approach:** Transcribe the `e791506` report hunk: base
`.product-card--report .product-card__image > img` → `display:block; max-width:100%;
width:auto; height:auto; margin:0 auto; object-fit:contain;
box-shadow:0px 8px 32px hsl(var(--black-hsl),0.15)`; keep the `@40em max-width:50%` rule exactly;
replace the `@64em` `top/left/position:absolute/max-width:110%/margin:-15% -2% -8%` with
`position:static; max-width:50%; margin:0 auto` (preserves the 50% "Nate 3D book" look at >=64em,
matching the live fix). **Do not** touch `.product-card--item` global rules (lines 2392–2435)
or `ProductCardThin.vue` (scoped JS resize + scoped CSS = the rebuild's publication path; see
D6/Q1).

**Patterns to follow:** live diff `e791506` `.product-card--report` hunk verbatim.

**Test scenarios:**
- `Covers R7.` Browser: a surface rendering `.product-card--report` shows the cover/book image
  contained, centered, with the standard shadow, and at >=40em the book stays at `max-width:50%`
  (the deliberate "Nate 3D book" small-book look is visually identical to the live site).
- `Covers R8.` Scope: a publication rendered via `ProductCardThin.vue` (`.product-card--item`)
  and the shared base `.product-card__image > img` rule are pixel-unchanged by this unit
  (before/after screenshot diff on a `future-leadership` publication card).
- Edge: <40em report card is contained/centered (no `-30%/-15%` negative-margin bleed).

**Verification:** Build succeeds; report card contained with preserved 50% book at >=40em;
`.product-card--item` and base `.product-card__image > img` diffs are empty.

---

### U4. Correct `sizes`, raise quality, PNG passthrough on product `<NuxtImg>` tags

**Goal:** Eliminate the desktop/retina blur (BF-51 parity) by correcting the understated `sizes`
attributes against the post-BF-50 layout, raising quality toward 90, and stopping forced webp
on PNG cover art — across the product hero and card components.

**Requirements:** R1, R2, R3, R4, R9

**Dependencies:** U1, U2, U3 (the corrected `sizes` must reflect the *post*-contain/center
layout, so the CSS units land first)

**Files:**
- `src/components/legacy/molecules/ProductHero.vue`
- `src/components/legacy/molecules/ProductCard.vue`
- `src/components/legacy/molecules/ProductCardWebsite.vue`
- `src/components/legacy/molecules/ProductCardThin.vue`

**Approach:**
- Rewrite the `sizes` attribute on each product image (both the `<NuxtImg>` and the external
  `<img>` fallback branch where present) to reflect the true rendered width after U1–U3
  (image is `max-width:90%` of its flex column; no 150–180% oversize). Use the live PR #109
  values as upper-bound sanity references (hero desktop ~1000px; website card ~1280px;
  thin/item ~600px) and re-derive against this rebuild's column flex ratios per D3. Replace the
  current understated values (hero `(min-width: 64em) 480px`; website/card
  `(min-width: 64em) 400px`; thin `(min-width: 64em) 360px`; item `(min-width: 64em) 320px`).
- For PNG cover art (D5): make `format` conditional — do not pass `format="webp"` when
  `product.image.url` is a `.png` (mirror the live `isPng` regex on the URL). Keep webp for
  non-PNG.
- Note `ProductCardThin.vue` renders a raw `<img>` (no `<NuxtImg>`) with a hardcoded
  understated `sizes`; correct its `sizes` too, and confirm its JS `adjustImageSize()` is left
  intact (D6 scope guard).
- Quality (R3/D4) is config-level — see U5; this unit only touches per-component `sizes`/
  `format`.

**Patterns to follow:** live PR #109 module `sizes`/ladder/PNG intent (`product-hero.njk`,
`product-card--website.njk`, `product-card--item.njk`, `contentfulImage.js` PNG branch); the
existing `useExternalImage()` composable for the external-vs-NuxtImg branching already in these
components.

**Test scenarios:**
- `Covers R2.` Browser/devtools: on a `--website` product hero at a 1440px (retina-emulated)
  viewport, the `<img>` `currentSrc` resolves to a source whose intrinsic width is `>=` the
  rendered box width (no upscaling) — i.e. the previously-blurry image is now sharp.
- `Covers R2.` Same check on a `--website` listing card (`ProductCardWebsite.vue`) and a
  thin/item card (`ProductCardThin.vue`).
- `Covers R4.` A product whose `cover_image` is a `.png` does **not** request a `?format=webp`
  / `f_webp` variant (network panel shows PNG preserved); a `.jpg` cover still gets webp.
- Edge: external image URL (where `isExternalImage` is true) still renders via the raw `<img>`
  fallback with the corrected `sizes` and is not broken.
- Edge: a product with a missing/empty `image.url` renders no broken `<img>` (existing
  `v-if="product.image?.url"` guard still holds).

**Verification:** Build succeeds; on representative product detail + workstream listing pages
the rendered `srcset`/`currentSrc` provides a source `>=` the rendered box at desktop/retina
(visually sharp); PNG covers retain PNG; external-image fallback unaffected.

---

### U5. Raise `@nuxt/image` quality and responsive ceiling

**Goal:** Make `@nuxt/image` emit higher-quality, higher-ceiling responsive sources so the
corrected `sizes` (U4) can actually pick a large-enough source (BF-51 R1/R3 parity).

**Requirements:** R1, R3, R9

**Dependencies:** none (config), but only meaningful together with U4

**Files:**
- `src/nuxt.config.ts` (the `image: { ... }` block — `quality`, `screens`)

**Approach:** Raise `image.quality` from `80` to `90` (D4, matches live `q=80 → q=90`). Raise
the responsive ceiling so retina desktop boxes are covered up to the live ~2400w reference:
extend the `screens` map (currently max `xxl: 1536`) with higher steps (e.g. add ~1920/2400) so
the generated `srcset` includes large candidates — bounded by Q2 (whether the active provider
resizes the external Directus domain). Do not change `domains` or `provider` unless Q2 forces
a provider decision (then it is the deferred follow-up, not this unit).

**Patterns to follow:** live PR #109 ladder ceilings (2400w hero/website, 1920w smaller card)
as the target; the existing `screens`/`quality` shape in `src/nuxt.config.ts`.

**Test scenarios:**
- `Covers R3.` Built/dev: an optimized product image request uses quality ~90 (URL/param or
  visibly reduced compression softening vs. baseline).
- `Covers R1.` The generated `srcset` for a product hero includes candidate widths up to the
  raised ceiling (so a 1440–2400px box is not forced to upscale a small source).
- Edge: non-product `<NuxtImg>` usages elsewhere (e.g. infographic figure in
  `pages/[...slug].vue`) still render and are not regressed by the quality/screens change.

**Verification:** Build succeeds; product image `srcset` shows raised ceiling and quality;
spot-check an unrelated `<NuxtImg>` page for no regression.
`Test expectation:` behavioral via U4's browser checks — this unit is config; its effect is
observed through U4 scenarios plus the srcset-ceiling check above.

---

### U6. Cross-surface parity verification & scoped-diff guard

**Goal:** Confirm BF-50 + BF-51 parity holds across every product surface and that the scope
guards (publication / `.product-card--item` / shared base img rule / unrelated `<NuxtImg>`
pages) did not regress.

**Requirements:** R8, R9 (and verification of R1–R7)

**Dependencies:** U1, U2, U3, U4, U5

**Files:** none modified — verification only. Surfaces to check:
- `src/pages/[...slug].vue` (product/super-product/publication detail → `ProductHero`,
  `ProductCardThin`)
- `src/pages/future-leadership/index.vue` (workstream listing → `ProductCardWebsite`,
  `ProductCard`)
- `src/pages/democracy/index.vue`, `digital-world/index.vue`, `politics-society/index.vue`,
  `archives/index.vue`, `podcasts/index.vue`, `podcasts/[slug].vue` (other product-card
  surfaces)

**Approach:** Build, then visually compare each surface to the live site behavior for: hero
contained/centered/sharp; website card contained/centered/sharp; report card contained with
preserved 50% book; publication (`ProductCardThin` / `.product-card--item`) **unchanged**;
shared base `.product-card__image > img` rule **unchanged** (grep the final `global.css` diff);
unrelated `<NuxtImg>` pages unaffected. Confirm Q1/Q2/Q3 resolutions are reflected.

**Patterns to follow:** the live PR #110 "scope guard verified" / PR #109 "rendered srcset/sizes
verified for all three components" verification posture.

**Test scenarios:**
- `Covers R8.` Final `git diff src/public/css-legacy/global.css` touches **only** the hero +
  `--website` + `--report` blocks; `.product-card--item` and shared base
  `.product-card__image > img` hunks are absent.
- `Covers R9.` Side-by-side with the live site: hero, website card, report/book card render
  visually equivalent; publication card visually equivalent (no regression).
- Browser sweep at 375px / 768px / 1024px / 1440px on the surface list above: no clipped,
  blurry, bled, or shadow-missing product images.

**Verification:** Build succeeds; scoped-diff guard passes; visual sweep matches live parity;
open questions Q1–Q3 resolved or explicitly carried as documented assumptions.

---

## System-Wide Impact

- **CSS bundle:** `src/public/css-legacy/global.css` is loaded for the legacy layout
  (`legacy-base`); changes affect every product hero/card surface site-wide. The scope guard
  (U6) bounds this to the three intended blocks.
- **Image requests:** raising quality + ceiling increases per-image bytes on product surfaces;
  acceptable and intended (parity with live, which already shipped this). Bounded by Q2 (whether
  the provider resizes the external Directus domain at all).
- **Affected parties:** end users (sharper, correctly-framed product imagery — the visible
  cutover-blocking defect); content team (no workflow change); ops (slightly larger image
  payloads on product pages).

---

## Open Questions / Decisions for the Implementer

- **Q1 — Which surfaces render `.product-card--report` vs `.product-card--item` in this
  rebuild?** Live BF-50 kept `.product-card--report` at `max-width:50%` ("Nate 3D book"). Here
  `ProductCardThin.vue` renders `.product-card--item` with a JS resize and *appears* to be the
  publication path, while the global `.product-card--report` block still exists in
  `global.css`. The implementer must confirm at runtime which product/publication surfaces emit
  which class (grep component `:class` bindings + render an actual publication/Nate page) so the
  R7/R8 scope guard is applied to the right element. Plan assumes D6 (leave
  `.product-card--item`/`ProductCardThin.vue` untouched, still fix the global
  `.product-card--report` block).

- **Q2 — Can the active `@nuxt/image` provider actually resize the external Directus domain?**
  `nuxt.config.ts` sets `provider: process.env.NUXT_IMAGE_PROVIDER || undefined` and
  `domains: ['bfna.simplyas.com']`. The product image URLs are raw Directus `/assets/{id}`
  (no params). If the deployed provider (likely Netlify Image CDN, or IPX in dev) does **not**
  proxy/resize this external host, then raising `screens`/`quality` (U5) and `sizes` (U4) won't
  produce larger sources and the blur persists — the real fix would be a Directus-aware provider
  or Directus native transform params (`?width=&quality=&format=` appended in
  `src/directus/common.js getImage()`), which is the **Deferred to Follow-Up** item. The
  implementer must verify the rendered `srcset` in a production-like build before declaring R1
  done; if the provider can't resize the external domain, escalate to the deferred provider
  rework rather than silently shipping an inert config change.

- **Q3 — Is the dormant Contentful `getImageAssetUrl()` path truly unused by product
  surfaces?** `src/directus/common.js:48-53` still pre-bakes `?w=800&fm=webp&q=80&fit=fill`
  (the exact live BF-51 U4 target), but only `src/directus/docs.js` calls it; products/
  publications use the param-less `getImage()`. Plan treats `getImageAssetUrl()` as out of scope
  (docs path only). Implementer should confirm no product/publication/super_product importer
  path reaches it before finalizing; if one does, the live `7599ca7` `q=90`/PNG branch should be
  ported to it as well.

- **Q4 — `sizes` recomputation (D3).** The live PR #109 `sizes` values encode Eleventy's
  column math. This rebuild's flex ratios differ (`product-hero__content` vs
  `product-hero__image` are both `flex:1`; cards use `flex:5/6/3`). The implementer should
  derive `sizes` from the *actual rendered box* at each breakpoint after U1–U3, using the live
  values only as an upper bound, rather than copying the Eleventy strings verbatim.

- **Q5 — `directus/*.js` are build-time importer scripts feeding `@nuxt/content` JSON.**
  `useProducts()` calls `queryCollection('products')`; the JSON is produced by
  `node ./contentImporter.js` (the `generate` script). Any `getImage()`/`getImageAssetUrl()`
  change requires re-running the importer to take effect; for BF-60 the chosen approach avoids
  importer changes (config + component + CSS only), so this is a confirmation, not a task —
  flagged so the implementer doesn't expect a `common.js` edit to change rendered output without
  re-import.
