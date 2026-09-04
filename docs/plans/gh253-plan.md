# gh#253 — Hero + scrim architecture across `bfHero` and `bfPageHeader`

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/253>
Epic: <https://app.plane.so/ccm-design/browse/BF-220/>
Wave plan: `docs/plans/bf220-design-phase-wave-1-plan.md` §Phase 2

Planning mode: `ce-plan` pipeline mode was **not** invoked. Discovery for this item was
already complete in-session (every file the issue names was read, and the contrast
arithmetic below was computed and re-verified before planning), so the sanctioned
fallback — this hand-written plan — is what ships. Recorded here rather than left to be
inferred.

---

## 1. The measured constraint, recomputed (not taken on faith)

Recomputed with the contrast gate's own maths — `hslToRgba` with 8-bit rounding,
`compositeOver`, WCAG 2.x `contrastRatio` — rather than a colour library, so the numbers
below are the ones `scripts/check-contrast.ts` will print.

`--hsl-navy` is `201, 100%, 18%` → `#003C5C`, relative luminance **0.04004**.

### White on a navy scrim over a blown-out white photograph

| alpha | composited ground | white ratio | verdict |
| --- | --- | --- | --- |
| 0.60 | `#668A9D` | **3.692** | fail |
| 0.65 | `#598095` | **4.245** | fail |
| **0.70** | **`#4D778D`** | **4.840** | **PASS** |
| 0.75 | `#406D85` | 5.609 | pass |
| 0.94 (panel) | `#0F4866` | 9.817 | pass |

The issue quotes 3.69 / 4.25 / 4.90. The first two reproduce exactly; the third is
**4.840** under the gate's rounding, not 4.90. Still a pass, and still the first alpha
that is one. **0.70 confirmed.**

### The programme hues over that same ground

| token | value | vs scrim 0.70 | vs panel 0.94 | vs `--color-surface-inverse` |
| --- | --- | --- | --- | --- |
| `--color-program-on-dark` [democracy] | `#03B3CE` | **1.923** | 3.900 | 7.957 |
| `--color-program-on-dark` [future-leadership] | `#DC7986` | **1.642** | 3.330 | 6.792 |
| `--color-program-on-dark` [transatlantic…] | `#E08F15` | **1.869** | 3.791 | 7.734 |

And the raw `--color-program` fills, as *text*, over the 0.70 scrim: teal 1.026,
red 1.064, amber 1.047. Nowhere near.

**So the design rule holds and is now measured, not asserted: over media, type is white.
Programme colour appears only as an opaque fill — chip, rule, panel — never as text.**

### The fact that decides §3 below

Over the 0.70 navy scrim on white the **maximum attainable ratio is 4.840, and pure white
is what attains it.** Nothing else in the palette can reach 4.5 there; a hue that did
would have to sit at luminance ≥ 0.927, i.e. be white with a tint of colour left in it.

Stronger, and specific to navy: `future-leadership`'s on-dark red needs a ground of
luminance ≤ 0.0291 to clear 4.5. **Navy's own luminance is 0.04004 — higher than that at
alpha 1.0.** So red-on-dark cannot clear 4.5 over a navy scrim at *any* alpha, over any
photograph, ever. This is not a tuning problem.

---

## 2. Tokens

`src/public/css/tokens/semantic-colors.css`, in the `:root` block beside the inverted
colourway pair (`--color-text-inverse` / `--color-surface-inverse`):

```css
--color-scrim:       hsl(var(--hsl-navy), 0.70);
--color-scrim-panel: hsl(var(--hsl-navy), 0.94);
```

`hsl(var(--hsl-*), <a>)` is the file's own alpha idiom — the 63-token alpha ladder above
is built the same way — so no new construction and no new colour *value*: navy is already
in the file's `var()` graph. These are the first scrim/overlay/opacity tokens in the
system.

---

## 3. The contrast gate — what goes live, and the one pair that gets re-pointed

`scripts/check-contrast.ts`.

1. **`white-on-scrim`** — its `pendingFrom` is deleted. Goes live at **4.840**, pass.
2. **`white-on-scrim-panel`** — new pair, the panel mode's own floor. **9.817**, pass.
3. **`program-on-dark--<slug>` × 3** — `pendingFrom` deleted, and the ground changes from
   `over(--color-scrim, --color-surface-page)` to **`--color-surface-inverse`**. Go live
   at **7.957 / 6.792 / 7.734**, pass.

(3) is the one judgement call in this item, so the reasoning is stated in full, in the
gate's own comments and here:

- The pair as written asserts *programme colour as text over media*, which is precisely
  what this item's measurement forbids. It cannot be satisfied: §1 shows the ceiling over
  the 0.70 scrim is 4.840 for pure white, and that navy makes the red tier unsatisfiable
  at any alpha. Left as written the pair is a permanent red, or a licence to bleach the
  three programme hues to near-white.
- `--color-surface-inverse` (`#080808`) is the ground the tier is actually for, and the
  one the tokens' own comments already record ratios against
  (`semantic-colors.css`: 7.96 / 6.79 / 7.73). Those comments have never been checked by
  anything. Now they are.
- This is **residual #264's own suggested fix, verbatim**: "add a fourth pair per
  programme measuring `--color-program-on-dark` directly against
  `--color-surface-inverse`, floor 4.5, no `pendingFrom`." #264 expected the
  scrim-composited pairs to survive alongside; the measurement says they cannot, so they
  are re-pointed rather than duplicated — one pair per tier per programme, asserting the
  thing that is true.
- The scrim ground does not stop being measured: `white-on-scrim` and
  `white-on-scrim-panel` measure it, at the only foreground the architecture puts there.

`--color-scrim` still unblocks pending pairs, as the item requires — two of them — and
after this change **no pair in the gate is pending at all.**

`KNOWN_FAILURES` is not touched. One row (amber, #263) remains, as it must.
`SHIPPED_BASELINE` is not touched — no palette value moves.

---

## 4. The shared media/scrim layer

New: `src/components/bf/HeroMedia.vue` → `bfHeroMedia`.

```
<div class="bf-hero-media" aria-hidden="true">
  <bfMedia v-if="src" class="bf-hero-media__image" :src :alt loading="eager" fetchpriority="high" />
  <div class="bf-hero-media__scrim" />
</div>
```

- `position: absolute; inset: 0; z-index: -1; overflow: hidden` — and **the host sets
  `position: relative; isolation: isolate`**. `isolation` makes the host a stacking
  context, so `z-index: -1` paints above the host's own background and below every
  in-flow descendant, with **no rule needed on the content column at all**. That is what
  keeps this working identically inside `bfHero` (which renders its own `.center`) and
  inside `bfPageHeader` (whose `.center` belongs to `bfSection` and is unreachable from
  `bfPageHeader`'s scoped styles).
- The image is rendered through `bfMedia`, so a **local** path gets `NuxtImg` and a real
  srcset (`Media.vue:70-76` — external Directus URLs deliberately do not). Its
  `aspect-ratio: 16/9` and `inline-size: 100%` are overridden to `auto` / `100%` block
  size by `.bf-hero-media > .bf-hero-media__image` (specificity 0,2,0 against `bfMedia`'s
  own 0,1,0 in the same layer, so the win is by specificity and not by source order).
- `bfMedia` requires `alt`. It is passed `''` deliberately: the photograph is decorative,
  the `<h1>` carries the meaning.
- **Two modes on one attribute.** `data-scrim` sits on the *host band* — `.bf-hero` /
  `.bf-page-header` — and the scrim element keys off it as an ancestor:
  - `full` (default): `inset: 0`, `background-color: var(--color-scrim)`.
  - `panel`: `background-color: var(--color-scrim-panel)`, `inline-size` clamped to the
    content column's own border box
    (`calc(var(--theme-center-measure, 1100px) + 2 * var(--theme-center-padding, var(--space-s)))`)
    and centred with `margin-inline: auto` — which is what centres an absolutely
    positioned box that has `inset-inline: 0` and a definite width. The photograph is
    uncovered either side. The measure and padding are read through the composition
    layer's own `--theme-*` inputs, so a band that retunes them retunes the panel with
    them.

The layer is **never a `.stack` child** — it is a direct child of the band root, which is
a grid (`bfHero`) or a plain `<section>` (`bfSection`), never a stack. That is the
gotcha with three logged defects behind it.

---

## 5. `bfSection` gains one slot

`src/components/bf/Section.vue`: `<slot name="bleed" />` as the **first child of
`<section>`, outside `.center`**.

`bfPageHeader` composes `bfSection`; `bfSection`'s only slot today renders *inside*
`.center`, which is `content-box` with `padding-inline` (`center.css:50-58`) and therefore
cannot host a full-bleed layer. A named slot outside the measure is the minimum change
that makes a band paint behind its own copy. Purely additive: unused, it renders nothing,
and the eight existing call sites are untouched.

---

## 6. `bfHero`

- `HeroProps` (`src/types/bf-contracts.ts`) gains `image?: string | null`,
  `imageAlt?: string`, `scrim?: 'full' | 'panel'`.
- Template: `<bfHeroMedia v-if="image" …>` as a sibling of the existing
  `.center | stack`, plus `:class="{ 'bf-hero--media': !!image }"` and
  `:data-scrim="image ? scrim : undefined"` on the root.
- Style: `position: relative; isolation: isolate` on `.bf-hero`;
  `color: var(--color-text-inverse)` on `.bf-hero--media`. **`--_bf-hero-min-height:
  60svh` is unchanged — `svh`, not `vh`, deliberately** (`Hero.vue:227-229`).
- `showActions()` and `hasRenderedContent()` are untouched: an empty `.cluster` in a
  `.stack` still takes a gap, and that is still true with a photograph behind it.
- No `.cover`, no `.frame`, no `.imposter`.

## 7. `bfPageHeader`

- Same three props (declared on its local, unexported `Props` bag — `Crumb` is the only
  shared type it imports, and BRIEF §5 rule 11 is about shared types).
- `<template #bleed><bfHeroMedia …/></template>` into `bfSection`, plus the modifier class
  and `data-scrim` — both pass `bfSection`'s attribute allow-list (`class` explicitly,
  `data-*` by prefix).
- **Its first `<style scoped>` block**, wrapped in `@layer components { }` by hand
  (`nuxt.config.ts:200` disables the cascade-layers polyfill; `check-routes.ts` gates it).

## 8. Focus on a dark scrim

`base/focus.css` outlines with `--color-text` (near-black) and has no inverse variant;
it sits in `@layer defaults`, so a component-layer rule wins outright. Each band with
media adds, inside its own `@layer components`:

```css
.bf-hero--media :deep(:focus-visible) { outline-color: var(--color-text-inverse); }
```

`:deep()` because the focusable elements are slot content and child-component roots, which
do not carry the band's scope id. Setting `outline-color` (a longhand) at specificity
(0,3,0) also beats `bfButton`'s and `bfBreadcrumb`'s own `outline:` shorthands at (0,2,0)
in the same layer, so one rule covers every control in the band. The breadcrumb's
separator hook is retuned the same way, since `.bf-breadcrumb`'s own rule declares it and
inheritance alone cannot reach it.

## 9. Imagery — the mapping, stated deliberately

Local files under `src/public/images/hero/`, read by nothing today:

| route | file | note |
| --- | --- | --- |
| `/` | `homepage.jpg` | + `.webp` on disk |
| `/democracy` | `democracy.jpg` | + `@2x`, `@2x.webp` |
| `/future-leadership` | `future-leadership.jpg` | + `@2x`, `@2x.webp` |
| `/transatlantic-relations-global-challenges` | **`politics-society.jpg`** | + `@2x`, `@2x.webp` |

The filenames still carry the **old topic taxonomy**. `politics-society` is the nearest
asset on disk for the merged `transatlantic-relations-global-challenges` programme, and it
is mapped there deliberately, not by coincidence of name. Recorded in the mapping's own
comment so a later reader does not read it as a mistake — and flagged as art-direction
work a human should confirm.

The slug→file record lives in `pages/[program].vue`, its only consumer. The programme
documents' own `image` field is a Directus URL and is deliberately not used: external URLs
bypass `NuxtImg` and get no srcset.

The other four `bfPageHeader` routes (`/about`, `/archive`, `/insights`, `/projects`, …)
pass **no** image and render exactly as they do today. The architecture is available to
them; wiring their art direction is not this item's scope.

## 10. Verification

- `check:contrast` (+ `:ci` and `:self-check`), `validate:tokens`, `lint:css` (baseline
  422 warnings), `typecheck` (baseline 89-90 diagnostics, assert no new), `nuxt generate`
  + `check-routes`.
- Browser, dev server + headless `/browse`: `/`, `/democracy`, `/future-leadership`,
  `/transatlantic-relations-global-challenges`, desktop **and** 375×812 with a reload
  after the switch; in-page WCAG against **sampled composited pixels under the real
  text**, not the token; keyboard focus ring screenshotted on the scrim;
  `documentElement.scrollWidth` vs `clientWidth` at 375 and 1440; console clean.

## 11. Risks

- `bfSection` is composed by eight templates. The new slot is additive and unused by all
  of them; the risk is a review objection to widening a shared component, not a runtime
  one.
- `bfMedia` hard-codes `loading="lazy"`. `loading="eager"` / `fetchpriority="high"` are
  passed through `$attrs`; if Vue's merge does not let the fallthrough win, the hero image
  stays lazy and the LCP regresses. Verified in the browser against the rendered
  attribute; if it does not take, it becomes a residual rather than a change to `bfMedia`.
- `/[program]`'s header renders the whole two-paragraph `intro` over the photograph. It
  will pass contrast and read heavy. Art direction, flagged, not fixed here.
