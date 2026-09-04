# 38 — `bfPageHeader` — inner-page hero unit

One-line objective: evolve `wfPageHeader.vue` into `bfPageHeader`, the
inner-page hero composing `bfBreadcrumb` and `bfChip`, used by eight
templates.

## Context

Depends on 28 (`bfBreadcrumb`), 16 (`bfChip`). Builds from
`src/components/wireframe/wfPageHeader.vue` (as-built A: 8 files, the
single most-reused wf-* component after `wfSection`). Consumed by 48, 49,
50, 51, 52, 53, 54, 55 (every Phase 6 template except home and 404).
Provenance: BF-167.

## Scope

- File: `src/components/bf/PageHeader.vue` → `<bfPageHeader>`.
- Props:
  ```ts
  interface Props {
    label?: string             // default 'Page header' (wf-slot annotation label — record whether bf-* keeps this dev-only label at all, or drops it as wireframe-only chrome; if kept, it should not render visible in bf-*'s finished chrome — see Decisions)
    crumbs?: Crumb[]            // from src/types/bf-contracts.ts (issue 02)
    chips?: string[]
    heading?: string | null
    tagline?: string | string[] | null
  }
  ```
  Slots: `default` (by-lines, meta rows, header actions — matches the wf
  source's own slot usage for e.g. the search input on `/search`), `chips`
  (rich chip content beyond plain strings).
- Renders, in order: `<bfBreadcrumb v-if="crumbs?.length" :items=
  "crumbs" />`, a `.cluster` of `<bfChip>` for each string in `chips` **plus**
  the `#chips` slot content (both render together when both are present —
  matches `v-if="chipList.length || $slots.chips"` in the wf source), the
  page's single `<h1>{{ heading }}</h1>`, one `<p data-measure="normal">`
  per tagline paragraph (string or array, normalised the same way the wf
  source's `taglines` computed does), then the default slot.
- Composes `bfSection` internally (not a literal slot-fill — same
  base+specialization shape the as-built inventory documents for
  `wfPageHeader`/`wfCtaSection`/`wfContactSection`), passing through
  `gap="s"` and `padded` as `wfPageHeader.vue` does (`<wf-section :label=
  "label" gap="s" padded>`).

## Out of scope

- Page-specific content such as the search input or filters — templates
  add those into the default slot, this component does not know about
  search/filters.
- Deriving crumbs from the route (pages pass them in, per every wf-*
  call site).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfSection`'s, `bfBreadcrumb`'s and
  `bfChip`'s existing hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/PageHeader.vue
grep -q "crumbs?: Crumb\[\]" src/components/bf/PageHeader.vue
```
Probe page `src/pages/bf-probe/38-bf-page-header.vue` renders all five prop
permutations (crumbs-only, chips-as-strings, chips-via-slot, tagline-as-
string, tagline-as-array):
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/38-bf-page-header/index.html)" = "5" ]
```
A page using it has exactly one `h1` per instance. Fails today (no
`bf/PageHeader.vue`), passes once done.

## Decisions

### D-38.1 — `label` is kept, and it renders as `data-label` and nothing else

The spec asks the runner to record whether `bf-*` keeps this prop at all. It
does, default (`'Page header'`) and all, and it is forwarded to `bfSection`
unchanged — where gh#48 already renders it as `data-label` on the root
`<section>`.

What changes is its *meaning*, not its wiring. Upstream, `label` drives the
wireframe's dashed corner tag, which is `.wireframe .wf-slot` skin rather than
band geometry and has no counterpart in finished `bf-*` chrome. So in `bf-*` it
is invisible on the page, invisible to the accessibility tree, and useful as
exactly one thing: a stable identifier a template, a probe or a test can select
a header by. `SectionProps.label` already documents that contract; this
component inherits it rather than inventing a second one.

Dropping it was the alternative, and it was rejected on two counts: eight wf
call sites pass a label each, and Phase 6 ports them, so dropping it would make
every one of those ports a rewrite rather than a rename; and `bfSection` accepts
a label whether or not this component forwards one, so removing the prop would
only push the same string into each template's `$attrs`.

### D-38.2 — a local, unexported `interface Props`, not a `PageHeaderProps` in contracts

The same call `bfBreadcrumb` made in D-28.3, for the same reasons, and this
spec's own code block designs it that way.

BRIEF §5 rule 11 forbids a component declaring a **shared** type inline. The
shared type here is `Crumb`, and it is imported from
`src/types/bf-contracts.ts` rather than redeclared — which is what the wf source
also gets right, importing `WfCrumb` instead of restating it. `Props` is
unexported and unimportable, so it is shared with nobody, and this spec's own
acceptance greps *this file* for `crumbs?: Crumb[]`.

`src/types/bf-contracts.ts` is therefore **not edited by this issue**. (It was,
briefly, during implementation; reverted once D-28.3 was read, so the diff shows
no change to it.)

### D-38.3 — `layout`, `measure` and `fullWidth` are deliberately not forwarded

`bfPageHeader` passes `bfSection` exactly the three arguments the wf source
passes — `label`, `gap="s"`, `padded` — and exposes no way to change the rest.
A caller who wants a different band shape wants a `bfSection`, not a
differently-shaped page header, and every one of the eight wf call sites agrees:
none of them varies the band.

Composition, not extension: `PageHeaderProps` does not extend `SectionProps`,
and there is no `v-bind="$props"` pass-through that would let a template quietly
turn the hero into a switcher.

### D-38.4 — the chip guard tests **rendered vnodes**, not `$slots.chips` (residual #162)

**This is the one behavioural change from the frozen source**, and residual
[#162](https://github.com/ccmdesign/bfna-website-migration-2/issues/162) asks
for the decision to be taken here.

`$slots.chips` is truthy whenever the parent *passed* a slot, including one whose
content is `v-if`'d away, so

```vue
<bfPageHeader …>
  <template #chips><bfChip v-if="isArchived">Archive</bfChip></template>
</bfPageHeader>
```

renders an empty `.cluster` on every non-archived page: a zero-height flex box
that is still a `.stack` child and still takes a `data-gap="s"` gap under the
breadcrumb. Probe 37 caught the identical bug in `bfHero` from its own template.

The guard therefore resolves `slots.chips?.()` and asks whether the vnodes hold
anything renderable — a comment (what `v-if="false"` leaves behind) does not
count, a fragment is recursed into, a whitespace-only text node does not count,
anything else does. Every honest call site behaves exactly as it did on the
wireframe, because a slot that renders content still renders content.

Three deliberate limits:

1. **It is component-local, not a shared helper.** #162's own option 2 warns
   that the same foot-gun exists on every `bf-*` with a conditional slot
   wrapper and "probably wants to be one shared helper". It does — after the
   shape has been judged on one component. Generalising it from a single call
   site would be inventing an API on the strength of one example.
2. **It does not close #162**, which is about `Hero.vue`'s default slot. That
   component is unchanged by this issue.
3. **The guard is a function called from the template, not a `computed`.** A
   slot's rendered content is not a reactive dependency, so a cached computed
   can hold a stale answer across a parent re-render that changed it. A template
   expression re-evaluates on every render, which is the cadence the slot itself
   is re-created on.

Probe 38's `crumbs-only` case is the control: it passes a `#chips` slot whose
only child is `v-if="false"` and asserts no `.cluster` renders.

### D-38.5 — `chips?: string[]`, narrower than the source, with the filter kept

The wf source types this `(string | null)[]` because three of its call sites
build `[…, cond ? 'Archive' : null]`. This spec types it `string[]`, and the
spec is the authoritative contract, so `string[]` it is — a component's public
type should say what a chip label is, not what one call site's array-builder
happens to emit.

The **runtime filter is kept regardless**, dropping any entry that is not a
non-empty string. So behaviour is identical to the source's for every existing
call site, and a Phase 6 template whose array is genuinely nullable filters at
the call site (`.filter((c): c is string => !!c)`) rather than handing a `null`
to a `string[]`. Probe 38's `chips-strings` case passes
`['Report', 'Democracy', '', 'Archive']` and asserts three chips, not four.

### D-38.6 — no stylesheet at all

> **Amended 2026-09-04, gh#253.** The design phase gives this band a photograph and a
> scrim, so it now ships a small `<style scoped>` block — the containing block and
> stacking context `bfHeroMedia` needs, the inverted text colour, the crumb-link colour
> and the two control inversions a dark ground forces. Every rule is conditional on
> `.bf-page-header--media`, so a header with no `image` still resolves to the empty
> stylesheet this decision describes. Sanctioned by
> `docs/plans/bf220-design-phase-wave-1-plan.md` Phase 2, which names this file and says
> "adding one means adding an `@layer components { }` wrapper by hand". The decision text
> below is kept rather than rewritten, per gh#249 §5.

The component ships no `<style>` block. Not "no new custom properties" — no
rule of any kind. Every value on the page comes from `bfSection`,
`bfBreadcrumb` and `bfChip`'s own hooks, or from `@layer composition` resolving
`.cluster` + `data-gap="xs"` and `data-measure="normal"`. The BEM class names
(`bf-page-header`, `__crumbs`, `__chips`, `__heading`, `__tagline`) are selector
hooks for a template, a probe or a future skin — the pattern
`bf-section__heading` and `bf-hero__heading` already set — and carry no
declarations here.

That makes the `@layer components` and D-20.5 questions moot for this file, and
probe 38 asserts the stronger property directly: **no rule anywhere in the
loaded CSS selects `bf-page-header`**. (The probe's own dashed outline therefore
selects `.bf-section`, not `.bf-page-header`, so that it is not found by its own
walker.)

### D-38.7 — acceptance substitutions

Four, each asserting the identical property:

1. **`npm run typecheck` → the no-new-errors gate.** `dev` carries 178
   pre-existing `error TS` (residual #71), so a green run is impossible. Gate
   applied: the total must not rise, and the count inside `src/components/bf`,
   `src/types`, `src/composables/bf` and `content.config` must be zero. Measured
   before any edit: **178 / 0**. After: **178 / 0**.
2. **`grep -c '<h1' …` counts lines, not occurrences** (D-37.5.2). Nuxt's
   prerendered HTML is a single line, so the spec's command reports `1` for a
   page holding five. Substituted with the occurrence count:
   ```bash
   [ "$(grep -o '<h1' .output/public/bf-probe/38-bf-page-header/index.html | wc -l | tr -d ' ')" = "5" ]
   ```
   All five belong to a `bfPageHeader`; the probe's title is a `<p>`, its
   sections are `<h2>`, and `layouts/bf-probe.vue` is a bare `<slot />` — all
   asserted as probe rows as well as by the grep.
3. **vitest is substituted by the probe**, per residual #86 and the gh#109
   harness decision: `npx tsx scripts/check-probes.ts --only 38` (35 rows) and
   the full suite (**31 probes, 1395 rows**), both exit 0.
4. **`npx nuxt generate`, never `npm run generate`** — the latter runs the
   Directus importer and needs secrets the runner does not have.

### D-38.8 — probe 38 carries five `<h1>`, on purpose

The inverse of probe 33's choice and the same call probe 37 made with three
(D-37.6). A probe is a measuring instrument rather than a page of the site; the
rule under test is *"`bfPageHeader` contributes exactly one `h1`"*, asserted per
component root; and five permutations of that rule is five roots. The page total
is asserted too — five, all inside a `.bf-page-header`.

Two measurement notes worth keeping, both found by the probe failing first:

- **The measure reference must be a `<p>`.** `data-measure="normal"` resolves to
  `75ch`, and `ch` is font-relative; `base/typography.css` gives `p` its own
  `font-size: var(--size-0)` and `font-weight: 100`, which a bare `<div>` does
  not inherit. Measured 750.81px against a `<div>`'s 667.38px — a wrong
  reference, not a wrong cap.
- **`'|'` sorts after the letters.** `classList` compared as a sorted join reads
  `center stack |`, not `| center stack` (U+007C > `s`). The expected value is
  built with the same `.sort()` rather than typed out.
