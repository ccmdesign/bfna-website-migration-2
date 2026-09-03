# Plan — gh#52 / issue 43 — `bfSearchShell`

**Spec:** [`docs/ds-epic/issues/43-bf-search-shell.md`](../ds-epic/issues/43-bf-search-shell.md) ·
**Issue:** [gh#52](https://github.com/ccmdesign/bfna-website-migration-2/issues/52) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Approach

A new props-in/events-out organism at `src/components/bf/SearchShell.vue`
(`<bfSearchShell>`), composed entirely of atoms and molecules that already
exist. It renders four things and computes none of them:

1. **The query control** — `bfFormField` with `type="search"`.
   `FormFieldProps.type` is a deliberately open `string` handed straight to
   `<input :type="type">`, so `'search'` needs no widening; the component
   already emits a `<label for>`/`id` pair and already declares its own
   `:focus-visible` ring in `@layer components` (residual #157 is covered at
   source, so no local ring rule is needed here — recorded in Decisions).
2. **The facet row** — `bfFilterBar`, whose real contract is
   `:filters` + `:model-value` + `@update:modelValue` (read from
   `components/bf/FilterBar.vue`, not from the spec's sketch).
3. **The count line and the results** — a persistently-rendered live region
   for the count, then an `<ol>` of rows, each with the bespoke relevance
   meter driven by a CSS custom property.
4. **The empty state** — `bfEmptyState` when `results` is empty.

Ranking, indexing, `topScore` normalisation, `queryCollection`,
`useWfContent` and the `/search` route are all out; issue 54 owns them.

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | **Add** `SearchShellProps`. `SearchResultRow` and `Filter` already exist (pinned by issue 02) and are **not** modified. |
| `src/components/bf/SearchShell.vue` | New. |
| `src/pages/bf-probe/43-bf-search-shell.vue` | New probe, `layout: 'bf-probe'`, harness DOM convention. |
| `docs/ds-epic/issues/43-bf-search-shell.md` | Decisions appended. |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css` is touched (D2).

## The one real design decision

`SearchResultRow` is pinned by issue 02 as a **projection** —
`{ slug, heading, to, chip, archived?, date?, score }` — while `bfCardRow`
(#27/#36) types its `item` prop as the **entity** union `Insight | Project`
and derives `to`/`chip`/`date` from it. The two contracts cannot meet: a
`SearchResultRow` is not assignable to `CardRowItem`, and fabricating an
`Insight` from a projection would be a cast, not a component.

The shell therefore composes **`bfCard` with the `.bf-card-row` modifier** —
which is exactly what `bfCardRow` itself composes, and which is defined in
`Card.vue`'s `@layer components` block as a public modifier — rather than
`bfCardRow`. Identical presentation, honest types, no edit to a merged
component, no change to a pinned contract. Written up as D-43.1 and handed
to #54 as a residual so the mismatch is reconciled once, in the open.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 headless harness, per the #20–#51
precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck            # gate is NO NEW ERRORS vs. the 178 on dev
npx nuxt generate             # never `npm run generate`
npx tsx scripts/check-probes.ts --only 43
npx tsx scripts/check-probes.ts            # full suite, no regressions
grep -q "No results" .output/public/bf-probe/43-bf-search-shell/index.html
```

Probe `43-bf-search-shell` asserts, at minimum:

1. A fixture result set with scores renders one row per result, with the
   chip, the linked heading and the rank/percentage label.
2. Meter widths **differ between two different scores**, read from the
   computed `inline-size` of the bar, and the width comes from
   `--_bf-search-shell-meter-width` — no `width:` in a `style` attribute.
3. Typing into the search input emits `update:query` **once**, only **after**
   the debounce window, with the final value — never per keystroke.
4. Toggling a facet chip emits `update:selectedFilters` with the new array.
5. The empty state ("No results") renders at zero results and not otherwise,
   using `checkVisibility()` (D-31.6), and the count line's live region is
   present in **both** states (residual #169).
6. No data access: the component source is grep-clean for `queryCollection`
   and `useWfContent`, asserted by a build-time grep in the acceptance run
   and mirrored as a probe row over the rendered DOM.

## Risks

- **Debounce timing in a headless run.** `@vueuse/nuxt` is installed but not
  registered in `nuxt.config.ts`'s modules (there is no `modules` array), so
  `useDebounceFn` is not auto-imported. The debounce is hand-rolled with
  `setTimeout` + cleanup on unmount, and the probe drives it with real key
  input plus an explicit wait longer than the window, so the assertion is
  about behaviour rather than about a mocked clock.
- **`bfEmptyState` renders an `<h1>`.** One per page (BRIEF §5 rule 9), so a
  `/search` page that already has a `bfPageHeader` `<h1>` will have two when
  the results are empty. Flagged to #54 as a residual rather than solved here
  by inventing a `headingLevel` prop on a merged component.
- **`SearchResultRow.date` is handed to `bfTime`,** which parses it. The
  frozen wireframe puts a *pre-formatted* `monthYear()` string in that field;
  #54 must pass the raw parseable date instead, or `bfTime` renders nothing.
  Recorded in Decisions.
- **`:not()` with a complex selector is banned** (D-20.5). No stylesheet in
  this change uses `:not()` at all.
