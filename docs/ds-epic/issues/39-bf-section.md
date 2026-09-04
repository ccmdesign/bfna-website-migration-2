# 39 — `bfSection` — base band (fixes two known defects)

One-line objective: evolve `wfSection.vue` into `bfSection`, the base band
every template composes, fixing the `fullWidth` no-op and the prop-leak
defect.

## Context

Depends on 02 (`bf-scaffold`), 03 (`data-gap` on every primitive), 05
(`data-measure` universal rule). Builds from
`src/components/wireframe/wfSection.vue` (as-built A: 12 files/26
conceptual uses — the most-reused wf-* component). Consumed by 40, 44
(compose it), 47–56 (every template). Provenance: BF-168. **Two known
defects fixed here** (component-inventory-v2 §2 Level 3, digest B): (1)
`fullWidth` prop has no CSS behind it today (`ccmSection`'s documented bug,
same shape carried into `wfSection`) — `bfSection` gives it real CSS; (2)
props leak onto the DOM as junk attributes (e.g. `image-left` rendered
literally on `<section>`) — `bfSection` stops that via `inheritAttrs: false`
plus explicit `v-bind` of only the intended pass-through attrs.

## Scope

- File: `src/components/bf/Section.vue` → `<bfSection>`.
- Props:
  ```ts
  interface Props {
    label?: string
    heading?: string
    gap?: string           // default 'm'
    layout?: 'stack' | 'switcher' | 'cluster' | 'plain'   // default 'stack'
    measure?: string
    padded?: boolean
    fullWidth?: boolean    // NEW — real CSS behind it, was a no-op upstream
  }
  ```
  Default slot only.

  > **Amended 2026-09-04, gh#253.** A second, named slot — `bleed` — renders as the
  > first child of the root `<section>`, **outside** `.center`, for a full-bleed layer
  > behind the band's own copy. It exists because `.center` is `content-box` with
  > `padding-inline`, so nothing passed through the default slot can paint edge to edge.
  > Purely additive: unused it renders no element, this component declares no rule for
  > it, and the consumer owns the containing block. `bfPageHeader` is its first and only
  > caller. The decision text above is kept rather than rewritten, per gh#249 §5.
- Root: `<section class="bf-section" :data-label="label">` with an inner
  wrapper `:class="layout === 'plain' ? 'center' : \`center | ${layout}\`"`,
  `:data-gap` (omitted when `layout === 'plain'`, matching the wf source),
  `:data-measure="measure"` (now universally honoured per issue 05, not
  just through `.center`), padding-block applied via a CSS class/variable
  when `padded` is true (never an inline `style="padding-block: ..."` —
  the wf source's inline style is exactly the "junk on the DOM" pattern
  this issue retires).
- `fullWidth` fix: when true, the section breaks out of its container to
  the viewport edge (real CSS — e.g. a `width: 100vw; margin-inline:
  calc(50% - 50vw)` break-out rule or the composition layer's own
  break-out primitive if one exists) — must be visibly different from
  `fullWidth=false` in the probe.
- Prop-leak fix: `inheritAttrs: false` on the component; `$attrs` is
  forwarded **only** to the root `<section>` via an explicit `v-bind=
  "$attrs"` (so `class`/`data-*`/`id` still compose from outside per the
  ADR-1 attrs-fallthrough contract), while none of the typed props above
  ever appear as raw DOM attributes.
- Absorbs "split section" and "video section" variants as **`layout`
  options**, not separate components (per BRIEF/inventory: "Absorbs the
  split and video section variants as layout options rather than separate
  components") — if no wf-* evidence of a distinct split/video markup
  exists beyond `switcher` (media-beside-text), treat `switcher` as already
  covering it and record that finding in Decisions rather than inventing
  new layout values.

## Out of scope

- CTA, contact and page-header specialisations (issues 40, 44, 38 — those
  compose `bfSection`, they are not folded into it).
- The `data-compact` band chrome (that's `wfSection`'s sibling
  `.wf-slot[data-compact]` pattern used raw in `index.vue`'s Announcement
  band — out of scope here, addressed if/when that band gets its own
  component).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-section-gap`, `--_bf-section-padding-block`,
  `--_bf-section-measure`. `fullWidth`'s break-out rule lives in
  `@layer components`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Section.vue
grep -q "inheritAttrs: false" src/components/bf/Section.vue
grep -q "fullWidth" src/components/bf/Section.vue
```
Probe page `src/pages/bf-probe/39-bf-section.vue` renders every `layout`
value plus a `fullWidth` on/off pair with a custom `data-testid` attr and a
bogus prop-like attribute to prove it does NOT leak:
```bash
grep -q 'width: 100vw\|break-out' src/components/bf/Section.vue
grep -Lq 'data-image-left\|image-left=' .output/public/bf-probe/39-bf-section/index.html
```
The rendered `<section>` carries no stray prop attributes. Fails today (no
`bf/Section.vue`), passes once done.

## Decisions

### D-39.1 — `switcher` already covers the split and video variants; no new `layout` value

The Scope section permits recording that `switcher` covers the absorbed
variants "if no wf-* evidence of a distinct split/video markup exists beyond
`switcher`". That evidence was looked for, not assumed.

All **26** `wf-section` call sites (9 pages under `pages/wireframes/` plus
`wfCtaSection.vue`) were enumerated. Exactly one passes a non-default layout of
either kind: `about.vue:25`,
`<wf-section label="Bertelsmann Stiftung" layout="switcher" gap="l">` — media
beside text, which *is* the split shape. One other passes `layout="plain"`
(`insights/[slug].vue:17`, the archive banner). Every remaining call site takes
the `stack` default. Nothing under `pages/wireframes/` or
`components/wireframe/` renders a video band at all; the only occurrences of
"video" in the wireframe layer are a **filter option** on `insights/index.vue`
and `search.vue` (`{ key: 'video', label: 'Videos' }`), which is a `format`
facet on an insight, not a section layout.

So `SectionLayout` stays the four values `wfSection` declares. A `split` value
would ship a synonym for `switcher`, and a `video` value would ship a layout
with nothing to lay out — both are the "invent a layout value" the spec
forbids. A real video band, when one exists, is slot content inside a
`switcher` or a `plain` section.

### D-39.2 — `$attrs` is filtered, not merely redirected

The Scope section says `$attrs` is forwarded "**only** to the root
`<section>`", and the Context section says the fix is "`inheritAttrs: false`
plus explicit `v-bind` of only the **intended pass-through attrs**". Only the
second is sufficient: with `inheritAttrs: false` and an unfiltered
`v-bind="$attrs"`, a caller's `image-left` still lands on the `<section>` —
the acceptance line ("the rendered `<section>` carries no stray prop
attributes") would fail with the defect visibly unfixed.

`Section.vue` therefore forwards an **allowlist**: `class`, `style`, `id`,
`role`, `title`, `lang`, `dir`, `hidden`, `tabindex`, every `data-*`, every
`aria-*`, and every listener (`onXxx` — not an attribute, never markup).
Everything else is dropped. An allowlist rather than a denylist because a
denylist has to enumerate every prop name every future caller might mistype,
which is the game the defect came from.

`id` is on the list because the wireframe's own call sites depend on it:
`about.vue` passes `id="board"` and `id="team"`, `[area].vue` passes
`id="projects"`, all three as in-page anchor targets.

Proof, from the generated probe HTML:

```html
<section class="bf-section probe__marker" data-label="Attrs" id="attrs-band"
         data-testid="probe-39-attrs" data-probe-case="attrs" …>
```

— the call site passed `image-left` alongside those; it is not there.

### D-39.3 — the spec's two static greps are defective; verified equivalents used

The same class of defect D-37.5 recorded for issue 37, and it applies to both
lines in the Acceptance block:

```bash
grep -q 'width: 100vw\|break-out' src/components/bf/Section.vue          # ok
grep -Lq 'data-image-left\|image-left=' .output/public/…/index.html      # broken
```

1. **`grep -Lq` never asserts anything.** `-L` lists files *without* a match
   and `-q` suppresses all output; combined, the exit status follows `-L`, so
   the line passes whether or not the leak is present, and prints nothing
   either way. The intent is plainly the negation of a match.
2. **A substring search for `image-left` over the prerendered page is a false
   positive by construction.** Probe 39's own prose explains the case and
   writes `<code>image-left</code>`; so does its legend. The needle must be
   the attribute *assignment*, `image-left=`, which prose cannot produce.

Verified equivalents, both run and both green:

```bash
# 1 — the break-out rule exists (unchanged; passes on `--_bf-section-full-width: 100vw`)
grep -q 'width: 100vw\|break-out' src/components/bf/Section.vue

# 2 — no leaked attribute in the prerendered probe
! grep -qE 'image-left=|data-image-left' .output/public/bf-probe/39-bf-section/index.html
```

The runtime half is stronger and is what actually gates the PR: probe 39 walks
**every element in the document** and fails on any attribute *name* containing
`image-left`, and separately fails if any `.bf-section` on the page carries an
attribute named after a typed prop (`fullwidth`, `full-width`, `padded`,
`layout`, `measure`, `gap`, `heading`, `label`).

### D-39.4 — acceptance is probe 39, not vitest

`npm run typecheck` in the Acceptance block is read as the epic's standing
**no-new-errors** gate (orchestrator decision after #10, residual #71): `dev`
carries 178 legacy `error TS` lines and green is not reachable. Measured on
this worktree — baseline **178**, after implementation **178**, and **0** in
`src/components/bf|src/types|src/composables/bf|content.config`.

The vitest harness on `dev` is broken and pre-existing (residual #86), so the
runtime acceptance is `npx tsx scripts/check-probes.ts --only 39` (36/36 rows)
plus the full run (30 probes, 1360 rows, 0 failures) — the gh#20–#46 precedent
and the #109 harness decision.

### D-39.5 — `fullWidth` uses `100vw`, hooked, and the scrollbar caveat is accepted

The break-out rule is the one the spec names:

```css
.bf-section--full-width {
  width: var(--_bf-section-full-width);       /* 100vw */
  max-inline-size: var(--_bf-section-full-width);
  margin-inline: calc(50% - var(--_bf-section-full-width) / 2);
}
```

`50%` resolves against the parent's content box, so the band lands flush with
both viewport edges whatever its container's measure is. `max-inline-size` is
reset alongside `width` so an ancestor measure cap cannot quietly re-narrow it.

`100vw` includes the vertical scrollbar's gutter, so on a scrolling page a
broken-out band is a scrollbar's width wider than the layout viewport and adds
a horizontal scrollbar. That is inherent to the primitive the spec asks for:
`100dvw` behaves identically and `100cqw` needs a container this band does not
have. It is therefore **hooked** rather than hard-coded —
`--_bf-section-full-width` — so a shell that would rather clip sets `100%` (or
pins `scrollbar-gutter: stable`) without touching the component. Probe 39's own
page sets `overflow-x: clip` on its root for exactly this reason; `clip` rather
than `hidden`, which would force a scroll container and cannot be applied to
one axis alone. Layout is untouched by it, so the probe still measures the
band's full `100vw`.

### D-39.6 — `--_bf-section-gap` and `--_bf-section-measure` are theme inputs, and `.cluster` has none

The Styling section names three CSS variables. `--_bf-section-padding-block` is
straightforward: `.bf-section--padded` reads it, and it defaults to
`var(--space-3xl)` — `.wireframe .wf-slot`'s own band `padding-block`, ported
**by value** the way `bfHero` ported `min-height: 60svh` (gh#46), never by
class name from the frozen file.

The other two cannot be written as `--_stack-space` / `--_center-measure`
directly: those live in `@layer composition`, and a components-layer
declaration of them would outrank the whole `data-gap` / `data-measure` scale
(layers beat specificity), making the component's own documented `gap` and
`measure` props inert. They are written instead to the composition layer's own
**`--theme-*` inputs**, which sit below the data-attribute rules:

```css
.bf-section > .center {
  --theme-stack-space: var(--_bf-section-gap);
  --theme-switcher-space: var(--_bf-section-gap);
  --theme-center-measure: var(--_bf-section-measure);
}
```

Each hook defaults to the value the composition layer would have used anyway
(`--space-s`; `var(--theme-center-measure, 1100px)`), so declaring them changes
nothing until a call site sets one.

`.cluster` is deliberately absent from that list: `composition/cluster.css`
reads `var(--_cluster-space, var(--space-s))` and exposes **no**
`--theme-cluster-space` input, so there is nothing to write to. Adding one is a
composition-layer change and this issue does not own that layer (D9's fixes
landed in 03–05). Recorded rather than fixed; a clustered band still takes
`data-gap` per call site, which is the documented API.

### D-39.7 — D-31.1's follow-up is closed here

Issue 31 could not nest its accordion inside a `bfSection` because this
component did not exist yet, and left the gap "to be closed from the other
side". Probe 39 now mounts a `bfAccordion` inside a band and asserts it is no
wider than the band's inner box and that the band has no horizontal overflow.
**No change to `bfAccordion` was needed**, as issue 31 predicted, and probe 31
is untouched — it still passes (51/51) in the full harness run.
