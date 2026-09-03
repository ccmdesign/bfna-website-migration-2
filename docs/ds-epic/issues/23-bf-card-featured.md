# 23 — `bfCardFeatured` — featured/highlight insight card

One-line objective: port `wfCardFeatured.vue` to a thin typed `bfCard`
wrapper for the homepage highlights strip.

## Context

Depends on 20 (`bfCard`), 17 (`bfMedia`). Builds from
`src/components/wireframe/wfCardFeatured.vue`. Consumed by 47 (home
"Insights" band, alongside `bfCardProduct`). Provenance: BF-195. Thin by
design (BRIEF §5's "rule of three" — no prop grows until it appears twice
outside the wireframe occurrence).

## Scope

- File: `src/components/bf/CardFeatured.vue` → `<bfCardFeatured>`.
- Props:
  ```ts
  interface Props {
    item: Insight   // zod-inferred type from issue 09 (bfInsights schema)
  }
  ```
  No defaults, no optional props — matches `wfCardFeatured.vue` exactly
  (single required prop).
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Renders: `<h3><NuxtLink :to="\`/insights/${item.slug}\`">{{
  item.heading }}</NuxtLink></h3>`, conditional excerpt `<p>` (already-plain
  text, no truncation in the wf source — port as-is), `#chips` slot with one
  `<bfChip>Featured</bfChip>`, `#media` slot with `<bfMedia :src="item.image"
  alt="" ratio="16/9" />`.
- The eight curated `featured` insights come from `bfInsights().highlights`
  (issue 11) — this component itself never calls it; the **caller** (issue
  47's home page) passes each one in as `item`.

## Out of scope

- The homepage strip/carousel layout — that belongs to the home template
  (issue 47), not this component.
- A "featured" variant flag on `bfCardInsight` — per the inventory these are
  separate wrappers, not a shared component with a mode prop.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables; reuses `bfCard`/`bfChip`/`bfMedia` hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardFeatured.vue
grep -q "item: Insight" src/components/bf/CardFeatured.vue
```
Probe page `src/pages/bf-probe/23-bf-card-featured.vue` renders all eight
curated `featured` insights from `bfInsights` with zero data access inside
the component itself (the probe page calls `useBfInsights().highlights` and
passes each `item` in):
```bash
grep -c "Featured" .output/public/bf-probe/23-bf-card-featured/index.html
```
(expect 8). Fails today (no `bf/CardFeatured.vue`), passes once done.

## Decisions

### D-23.1 — the props are `item` and `headingLevel`, and nothing else

The spec's Scope says "no defaults, no optional props — matches
`wfCardFeatured.vue` exactly (single required prop)", and that is kept
literally, with the one addition the epic settled after this spec was written:
`headingLevel` from the shared `CardWrapperProps` (#128, retrofitted onto every
wrapper in gh#31). So the surface is `item: Insight` plus the inherited
optional level, default `3` — the no-change value.

No `media`, `chips`, `excerpt` or `excerptLength` switch. `bfCardProject`
carries four such switches because four call sites asked for them; this card
has exactly one call site (the home "Insights" band, issue 47) and BRIEF §5's
rule of three is not met by a single wireframe occurrence. A caller who wants a
different ratio or no chip composes `bfCard` directly, which is what the base
is for.

### D-23.2 — the probe queries `bfInsights` directly, not `useBfInsights()`

The spec's acceptance says the probe "calls `useBfInsights().highlights`". It
does the equivalent by hand — `queryCollection('bfInsights').where('featured',
'=', true).all()` — which is `highlights()`'s exact body
(`useBfInsights.ts:122`, `all.filter(i => i.featured)`).

Two reasons. Routing through the composable would prove the *composable*
works, which is probe 11's job and already covered there; and it would add a
second data path this probe has to keep in step for no assertion it could not
otherwise make. The probe still checks the two derivations against each other:
it asserts the set is exactly 8, that every row it received really carries
`featured`, and that none is a `retired_news` record.

(Two incidental corrections to the spec's prose, recorded rather than silently
absorbed: `highlights` is a **function**, not a property, and `useBfInsights`
is `async`, so the call site is `(await useBfInsights()).highlights()`.)

### D-23.3 — the excerpt is rendered whole; no truncation

`wfCardFeatured.vue:18` renders `plain(item.excerpt)` untruncated, and the port
keeps that, diverging from `bfCardInsight` and `bfCardProject`, which both cut
at 140 characters. The eight curated rows run 132–386 characters and are
hand-written strip copy rather than the lead paragraph of an article; cutting
them at 140 would take the point off the end of six of the eight. Truncation is
a decision for the day a second call site needs it.

`plain()` itself is **not** called — HTML stripping moved into the build-time
normaliser (issue 07) and the helper is retired (issue 10), so `item.excerpt`
already arrives as plain text. Re-deriving the strip here would be a second,
drifting copy of it.

The probe makes this checkable rather than merely stated: each rendered
paragraph is compared **text-identically** to the stored field (not by length —
a truncation landing on the same character count would pass a length check),
and no excerpt on the page carries an ellipsis.

### D-23.4 — the chip is the literal `Featured`, and there is no `<time>`

Not `formatLabel(item.format)`: all eight curated rows carry `format: null`, so
a format chip would render nothing at all. The word this card exists to say is
the *curation* — "we picked this" — which is not a field on the row. The probe
asserts both halves: the chip reads `Featured` on all eight, and zero rows
carry a `format` from which it could have been derived.

For the same reason there is no `bfTime`: all eight carry `publish_date: null`,
and `wfCardFeatured.vue` renders no date either.

### D-23.5 — the acceptance `grep -c "Featured"` is replaced by the probe's chip count

The spec's smoke check `grep -c "Featured" …/index.html` expecting `8` cannot
pass as written: `grep -c` counts **matching lines**, and the prerendered HTML
is a single line, so it returns `1` on a correct build and `1` on a broken one.
Corrected to an occurrence count, `grep -o … | wc -l` returns **14** on this
page — 11 `Featured` chips (the 8 strip cards plus the 3 contract cards that
render one) and 3 prose occurrences of the component's own name. Neither number
is a good acceptance gate.

The load-bearing check is therefore the probe's: `every card renders exactly
one chip` and `it reads "Featured" on all of them`, counted as `.bf-chip`
elements inside `bfCard`'s own `.bf-card__chips` wrapper. Substituted under the
TEST HARNESS rule (residual #86 — the vitest harness on `dev` is broken and
pre-existing; this issue named no vitest test, so nothing else was
substituted).

### D-23.6 — the strip is a real two-column `.grid`, asserted rather than assumed

`data-min-width="2xl"` writes `--_grid-min-width: 500px`
(`composition/grid.css:77`), which under the 1200px `.container` and the
harness's pinned 1280×1024 viewport resolves to exactly two tracks. The probe
asserts the resolved custom property **and** the resolved track count, so a
viewport or token change fails with its cause named rather than as a mystery.
No `grid-template-columns` is hand-pinned anywhere — D9 forbids that in any
`bf-*` file, and the probe checks the strip carries no inline one.

The strip and the contract cards (heading levels, the #130 blank heading,
`$attrs`) live in **two** lists, so the strip's "exactly eight" and
two-column assertions stay exact.

### D-23.7 — inherited without re-deciding

Three rules arrive from the earlier wrappers and are applied here unchanged, so
they are listed rather than re-argued:

- **D-21.1** — `inheritAttrs: false` with a root of `<bfCard v-bind="$attrs">`;
  `span` stays undeclared so it reaches the base as a *prop* through `$attrs`;
  no `<style>` block at all, which satisfies BRIEF §5 rule 2 and D-20.5
  vacuously.
- **#128** — `headingLevel` renders `<component :is="`h${headingLevel}`">`; the
  probe hit-tests that `bfCard`'s stretched link still covers the card at h2,
  h3 and h4.
- **#130** — a blank heading (`null` or `''`) renders **no** heading element
  and **no** anchor, with a dev-only `console.warn`. Never a slug, never
  `'Untitled'` — each invents user-visible content the data does not carry
  (BRIEF §5 rule 10) and hides the defect behind a plausible-looking card.

### Verification run (gh#32)

| Gate | Result |
|---|---|
| Typecheck (no-new-errors gate) | baseline **178** `error TS` on the branch point, **178** after — 0 in `src/(components/bf\|types\|composables/bf)` / `content.config` |
| `npx nuxt generate` | exit 0, 877 routes prerendered |
| `npx tsx scripts/check-probes.ts --only 23` | **PASS — 52/52 rows** |
| `npx tsx scripts/check-probes.ts` | **PASS — 15 probes, 613 rows, 0 failures** |
| `test -f src/components/bf/CardFeatured.vue` | OK |
| `grep -q "item: Insight" …` | OK |
| Wireframe byte-identity (per-issue and cumulative from `f757a64`) | both print nothing |
