# Plan — gh#47 / issue 38 · `bfPageHeader`

**Issue:** [gh#47](https://github.com/ccmdesign/bfna-website-migration-2/issues/47) ·
**Spec:** [`docs/ds-epic/issues/38-bf-page-header.md`](../ds-epic/issues/38-bf-page-header.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Base:** `dev` · **Branch:** `feature/gh47-bfpageheader`

Authored in-turn (ce-plan pipeline mode, no subagents dispatched).

## Objective

Evolve the frozen `components/wireframe/wfPageHeader.vue` into
`src/components/bf/PageHeader.vue` → `<bfPageHeader>`: the inner-page hero
composing `bfSection` (base), `bfBreadcrumb` and `bfChip`, and the owner of the
page's single `<h1>`. Consumed by Phase 6 issues 48–55 (eight templates).

## Source of truth (read, never edited — D2)

```vue
<wf-section :label="label" gap="s" padded>
  <wf-breadcrumb v-if="crumbs?.length" :items="crumbs" />
  <div v-if="chipList.length || $slots.chips" class="cluster" data-gap="xs">
    <wf-chip v-for="c in chipList" :key="c">{{ c }}</wf-chip>
    <slot name="chips" />
  </div>
  <h1>{{ heading }}</h1>
  <p v-for="p in taglines" :key="p.slice(0, 20)" data-measure="normal">{{ p }}</p>
  <slot />
</wf-section>
```

Eight call sites, all in `src/pages/wireframes/`: `about`, `archive`,
`search`, `[area]`, `insights/index`, `insights/[slug]`, `projects/index`,
`projects/[slug]`.

## Approach

1. **Contract** — a **local, unexported `interface Props`** in the component,
   importing `Crumb` from `src/types/bf-contracts.ts`: `label?`,
   `crumbs?: Crumb[]`, `chips?: string[]`, `heading?: string | null`,
   `tagline?: string | string[] | null`. This follows D-28.3 (`bfBreadcrumb`)
   rather than the `XProps`-in-contracts shape of the atoms — BRIEF §5 rule 11
   forbids declaring a **shared** type inline, and the shared type here is
   `Crumb`, which is imported; `Props` is shared with nobody. It is also what
   the spec designs and what its `grep -q "crumbs?: Crumb\[\]"
   src/components/bf/PageHeader.vue` acceptance reads. `bf-contracts.ts` is not
   edited by this issue.
2. **Component** — `src/components/bf/PageHeader.vue`, `defineOptions({ name:
   'BfPageHeader' })`, `withDefaults(..., { label: 'Page header' })`. Composes
   `<bfSection :label="label" gap="s" padded>` — the prop names verified against
   the as-built `src/components/bf/Section.vue` (`label` → `data-label`, `gap`
   → inner `data-gap`, `padded` → the `.bf-section--padded` modifier class, not
   an inline style).
3. **Render order**, element for element with the source: breadcrumb → chip
   cluster → `<h1>` → taglines → default slot.
4. **`chipList` / `taglines`** — the source's two computeds, kept. `chipList`
   filters falsy entries (three wf call sites build `[… , cond ? 'x' : null]`);
   `taglines` normalises `string | string[] | null` to an array.
5. **Chip-cluster guard** — the source's `chipList.length || $slots.chips`
   has the residual [#162](https://github.com/ccmdesign/bfna-website-migration-2/issues/162)
   foot-gun: `$slots.x` is truthy whenever the parent *passed* a slot, even one
   whose content is `v-if`'d away, so a conditional caller gets an empty
   `.cluster` that still takes a `.stack` gap. Guard on **rendered vnodes**
   instead — resolve `slots.chips?.()` and test for a node that is not a
   comment, not an empty fragment and not whitespace-only text. Same behaviour
   for every honest call site, no empty cluster for a conditional one.
   Component-local (option 2 of #162, scoped to this component); it does not
   close #162, which is about `Hero.vue`.
6. **`label`** — kept as a prop and forwarded to `bfSection`, where it lands as
   `data-label` on the root `<section>`. Invisible in `bf-*` chrome (the corner
   tag is `.wireframe .wf-slot` skin, not band geometry), so it is a stable
   selector hook rather than rendered text. Recorded in the spec's Decisions.
7. **Styling** — nothing. No new CSS variable, no new colour, no rule of this
   component's own beyond what `bfSection`/`bfBreadcrumb`/`bfChip` already
   declare; the `.cluster` + `data-gap="xs"` pair is resolved entirely by
   `@layer composition`. If a `<style scoped>` block proves necessary it is
   `@layer components` and uses no `:not()` (D-20.5).
8. **Probe** — `src/pages/bf-probe/38-bf-page-header.vue` under
   `layouts/bf-probe.vue`, following `docs/decisions/probe-harness.md`
   (`data-probe`, `data-probe-verdict` on `<main class="probe">`;
   `data-probe-row` + `data-ok` per row). **Five** permutations, therefore
   **five** `<h1>` on the page and none of the probe's own chrome — the page's
   title is a `<p class="h1">`-style lede, its report headed by `<h2>`, exactly
   as probe 37 handles its three heroes (D-37.6).

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/PageHeader.vue` | new (local `interface Props`; `bf-contracts.ts` untouched) |
| `bfna-website-nuxt/src/pages/bf-probe/38-bf-page-header.vue` | new |
| `docs/ds-epic/issues/38-bf-page-header.md` | append Decisions |
| `docs/plans/gh47-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` is touched.

## Test strategy

Acceptance, with the substitutions this epic already records:

- **Typecheck gate** (residual #71, D-37.5.3): baseline measured **178 total /
  0 in `src/components/bf|src/types|src/composables/bf|content.config`**. After:
  total ≤ 178 and scoped count 0. `npm run typecheck` green is impossible on
  `dev` and is not the gate.
- **`npx nuxt generate`** exits 0 (never `npm run generate` — Directus secrets).
- **`<h1>` count** — the spec's `grep -c '<h1' …` counts *lines*, and Nuxt's
  prerendered HTML is one line (D-37.5.2). Substituted with the occurrence
  count, same assertion:
  `[ "$(grep -o '<h1' .output/public/bf-probe/38-bf-page-header/index.html | wc -l | tr -d ' ')" = "5" ]`
- `test -f src/components/bf/PageHeader.vue` and
  `grep -q "crumbs?: Crumb\[\]" src/components/bf/PageHeader.vue` — as written.
- **vitest** is substituted by the probe (residual #86, decision #109):
  `npx tsx scripts/check-probes.ts --only 38` **and** the full
  `npx tsx scripts/check-probes.ts` both exit 0.
- **Wireframe byte-identity**, cumulative from the pre-epic base
  `f757a649…`: `git diff --stat` over the four frozen paths prints nothing.
- **Browser pass** on `/bf-probe/38-bf-page-header` from the generated output.

Probe rows, at minimum: exactly one `<h1>` per component root and five on the
page; the breadcrumb `<nav>` present only in the crumbs case; the chip cluster
present in the chips-as-strings and chips-via-slot cases and **absent** in the
other three, including the conditional-empty-slot control (#162); one `<p
data-measure="normal">` for the string tagline and two for the array; render
order breadcrumb → chips → h1 → taglines → default slot; the root is a
`.bf-section` carrying `data-label`, `--padded` and an inner `data-gap="s"`;
no inline `style` on the root; `.bf-page-header` rules (if any) inside `@layer
components`; no `:not()` with a complex selector anywhere in `bf-*`.

## Risks

| Risk | Mitigation |
|---|---|
| `chips?: string[]` narrows the wf source's `(string \| null)[]`, and three wf call sites build nullable arrays | Follow the spec's type (it is the authoritative contract) but keep the runtime filter; record in Decisions that a Phase 6 template with nullable entries filters at the call site. Probe row: a `''` in the array is dropped. |
| Guarding on vnodes diverges from the frozen source's `$slots.chips` | Deliberate, narrow, documented in Decisions, and directly what residual #162 recommends deciding here; a probe row proves both directions. |
| The probe must carry exactly five `<h1>` | The probe declares no `<h1>` of its own; `layouts/bf-probe.vue` is a bare `<slot />`, verified. Asserted twice — a probe row and a grep on the emitted HTML. |
| `bfSection` sets `inheritAttrs: false` and filters `$attrs` | `bfPageHeader` passes only declared props plus `data-probe-case`, which is on the allowed `data-` prefix. Verified in `Section.vue`. |
| Prerender needs the new probe route | `nuxt.config.ts` enumerates `src/pages/bf-probe/` from disk (gh#28) — no edit needed; confirmed by reading the config. |
