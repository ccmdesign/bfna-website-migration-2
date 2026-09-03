# Plan — gh#26 / issue 17: `bfMedia`

**Spec:** [`docs/ds-epic/issues/17-bf-media.md`](../ds-epic/issues/17-bf-media.md) ·
**Issue:** [gh#26](https://github.com/ccmdesign/bfna-website-migration-2/issues/26) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh26-bfmedia` off `dev`

> Written inline by the item-runner rather than through `ce-plan`: the previous
> runner on this issue stalled inside a skill invocation before doing any work.
> A degraded inline step beats a stranded item (runner rule).

## Approach

`wfMedia.vue` is nine lines: an `<img>` with an **inline `aspect-ratio`** when
`src` is set, else a `.wf-media` placeholder `<div>` with an inline `--wf-ratio`.
`bfMedia` keeps the two-branch shape and changes three things:

1. `<img>` → `<NuxtImg loading="lazy">` (the `@nuxt/image` module is already in
   `src/nuxt.config.ts` `modules:` and 9 legacy components already use it).
2. The inline `aspect-ratio` string is **deleted**. Both branches carry the same
   `.bf-media` class, and one stylesheet rule in `@layer components` reads
   `aspect-ratio: var(--_bf-media-ratio)`. This is the whole point of the issue:
   an inline `aspect-ratio` cannot be overridden by a consumer's own stylesheet,
   which is why the full-width Transponder card could not get a different ratio
   out of `wfMedia`.
3. The crosshatch placeholder is re-drawn from **semantic tokens** rather than
   the wireframe skin's three colour literals.

### The override contract (the load-bearing design decision)

Putting the ratio in a custom property is only half a fix. If the component
*always* writes `--_bf-media-ratio` inline, a consumer stylesheet still cannot
win against it — inline declarations outrank every author rule. So:

| `ratio` prop | What the component emits | How a consumer overrides |
|---|---|---|
| not passed | **nothing inline**; the default `16 / 9` comes from the `.bf-media` rule | its own CSS rule (class, ancestor, `:has()`), *or* an inline `style` |
| passed | `style="--_bf-media-ratio: …"` via the computed `cssVars` | an inline `style` through `$attrs` (which merges last and wins) |

Both rows are asserted on the probe. The observable default is `16/9` either
way, matching `wfMedia.vue`; the difference is only *where* the default lives.

### CLS

`aspect-ratio` + `inline-size: 100%` reserves the box before the bitmap
arrives, on both branches, so there is no shift when the image decodes. The
spec allows this explicitly ("explicit `width`/`height` **or** `aspect-ratio`
CSS"). Intrinsic `width`/`height` attributes are deliberately *not* synthesised
from the ratio: on `NuxtImg` those are resize modifiers, not layout hints, and
would make the component silently request a fixed pixel size from the provider.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | add `MediaProps` (BRIEF §5 rule 11 — shared types have exactly one home) |
| `bfna-website-nuxt/src/components/bf/Media.vue` | new — the component |
| `bfna-website-nuxt/src/pages/bf-probe/17-bf-media.vue` | new — the probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/17-bf-media.md` | append to **Decisions** only |
| `docs/plans/gh26-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched (D2 / DoD-4).

## Colour

No new literal, no new `--color-*` token, no primitive. The placeholder reuses:

* `--color-light` (→ `--color-base-tint-02`) for the box ground — the semantic
  stand-in for the skin's `#f4f4f4`;
* `--color-base-super-light` (→ `--color-base-tint-11`) for the border and the
  two crosshatch diagonals — the stand-in for `#ccc`.

Both already exist in `tokens/semantic-colors.css`.

## `alt`

`alt` is required whenever `src` is set. Enforced as a **dev-time
`console.warn` in a `watchEffect`** (`import.meta.dev` guarded), per the spec —
not a silent `alt=""`. Decorative use is still expressible: pass `alt=""`
explicitly, which is truthy-empty and therefore warns… so the rule is stated
precisely in the component: the warning fires when `alt` is `null`/`undefined`,
i.e. *unspecified*. An explicit `alt=""` is a deliberate decorative
declaration and passes silently. That distinction is what makes the check
useful rather than noise.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe plus the headless harness, per the gh#20–#23 / #109
precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck   # gate: no NEW errors vs the 178-error baseline on dev
npx nuxt generate    # exits 0 — never `npm run generate`
npx tsx scripts/check-probes.ts --only 17   # exits 0
npx tsx scripts/check-probes.ts             # every probe, exits 0
```

Probe `/bf-probe/17-bf-media` renders **1/1, 3/2 and 16/9 in both the real-image
and the placeholder branch** (six boxes) plus an override row, and asserts in
`onMounted`:

* measured `width / height` of every box equals its declared ratio (±1px) —
  this is the CLS check made machine-readable, since a box whose ratio is not
  reserved measures wrong;
* the real and placeholder branches at the same ratio measure the **same** box;
* neither branch carries an inline `aspect-ratio` (the regression this issue
  exists to prevent);
* a consumer CSS class overrides the default-ratio instance;
* a consumer inline `style` overrides an explicit-`ratio` instance;
* `.bf-media` rules live inside `@layer components` in the live CSSOM;
* the real branch renders `loading="lazy"` and a non-empty `alt`;
* the placeholder branch is painted by the two semantic tokens.

## Risks

| Risk | Mitigation |
|---|---|
| `NuxtImg` under `nuxt generate` emits an `/_ipx/…` URL with no server behind it, so the bitmap 404s in the harness | The assertions measure the **reserved box**, which is exactly what must hold when the bitmap is missing or slow — that is the CLS property. A `naturalWidth`-based check would be the flaky one, so none is written. The probe additionally uses an image that already ships in `src/public/images/`. |
| A `data-` attribute on the root collides with `$attrs` fallthrough | The component sets no `data-*` of its own; the probe's markers ride `$attrs`. |
| Inline `cssVars` defeating consumer stylesheets | Solved by the override contract above; asserted, not assumed. |
