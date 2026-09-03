# 43 — `bfSearchShell` — search UI shell (new)

One-line objective: new organism `bfSearchShell`, extracting the page-inline
search UI (input, facets, results, relevance meter) into a props-in/
events-out shell.

## Context

Depends on 30 (`bfFilterBar`, the facet row), 27 (`bfCardRow`, the results
list). Also composes 33 (`bfEmptyState`). Builds from
`src/pages/wireframes/search.vue` (inline, un-componentized: the query
input at L6-13, the facet row at L20-40, the results list at L42-65,
including the bespoke relevance-meter bar at L57-62). Consumed by 54
(`/search` template — ranking implemented in the page, this shell renders
what the page computes). Provenance: BF-172.

## Scope

- File: `src/components/bf/SearchShell.vue` → `<bfSearchShell>`.
- Props/emits:
  ```ts
  import type { Filter, SearchResultRow } from '~/types/bf-contracts'   // issue 02 — not declared inline
  interface Props {
    query: string
    filters: Filter[]        // from bf-contracts.ts, forwarded to bfFilterBar
    selectedFilters: string[]
    results: SearchResultRow[]
    resultCount: number
  }
  // emits
  (e: 'update:query', value: string): void   // debounced
  (e: 'update:selectedFilters', value: string[]): void
  ```
- Renders: a labelled `<input type="search">` bound to `query`, debounced
  before emitting `update:query` (matches the wf source's live-typing
  `v-model="q"` but adds debounce, since this shell now owns the emit
  boundary rather than a page-local ref); the facet row via `<bfFilterBar
  :filters="filters" :model-value="selectedFilters" @update:modelValue=
  "$emit('update:selectedFilters', $event)" />`; the result count line
  (`<strong>{{ resultCount }}</strong> results for …`); the results list as
  one `<bfCardRow>` per `results` entry inside an `<ol>` (matches the wf
  source's `<ol class="stack">`); the empty state via `<bfEmptyState
  v-if="!results.length" heading="No results" message="No records matched —
  try fewer or different words." />` (message text ported from the wf
  source's own copy); a small internal relevance-meter bar per result,
  driven by each row's `score` (0–1) — width computed as `Math.max(6,
  score * 100 * 1.6)` or equivalent, ported from the wf source's inline bar,
  moved from a raw `:style` width hack into a CSS custom property
  (`--_bf-search-shell-meter-width`) set via `:style="{ '--_bf-search-shell-
  meter-width': \`${pct}%\` }"` so the actual bar rule lives in CSS, not an
  inline `width:` declaration.

## Out of scope

- Ranking, indexing, embeddings — entirely the page's job (issue 54); this
  shell only renders whatever `results`/`score` values it's handed.
- The `/search` route itself (issue 54 builds the page around this shell).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-search-shell-meter-width`, `--_bf-search-shell-
  meter-color` (existing semantic token, no new colour).

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/SearchShell.vue
grep -Lq "queryCollection" src/components/bf/SearchShell.vue
grep -q "score" src/components/bf/SearchShell.vue
```
Probe page `src/pages/bf-probe/43-bf-search-shell.vue` renders a fixture
result set with scores, emits `update:query`/`update:selectedFilters` on
interaction, and shows the empty state at zero results:
```bash
grep -q "No results" .output/public/bf-probe/43-bf-search-shell/index.html
```
Performs no data access (grep-clean for `queryCollection`/`useWfContent`).
Fails today (no `bf/SearchShell.vue`), passes once done.

## Decisions

### D-43.1 — the results list is `bfCard.bf-card-row`, not `bfCardRow`

The spec's § Scope says the results list is "one `<bfCardRow>` per `results`
entry". It is not, and it cannot be, because two already-merged contracts
disagree about what a *result* is:

| | shape | source |
|---|---|---|
| `SearchResultRow` | a **projection**: `{ slug, heading, to, chip, archived?, date?, score }` | issue 02, pinned at `bf-contracts.ts:634` |
| `CardRowProps.item` | the **entity** union `Insight \| Project` | issue 27 / gh#36, `bf-contracts.ts:735` |

A `SearchResultRow` is not assignable to `CardRowItem`, and the two are not
merely narrower and wider versions of one thing. `bfCardRow` *derives* `to`,
the chip and the date from the entity by a `'publish_date' in item` guard,
while a `SearchResultRow` carries a `to` the page already computed — and issue
54's ranking pool mixes insights, projects **and people**, three route
prefixes, only two of which that guard knows. Handing it a projection cast as
an entity would send every person row to `/projects/<slug>`: a 404 that
typechecks, which is exactly the failure D-27.2 was written to avoid.

Three options were considered and two rejected:

1. **Redefine `SearchResultRow` around the entity.** Rejected — issue 02 pins
   the field list, the type is merged, and issue 54's § Scope says the page
   builds the projection, not the entity.
2. **Widen `CardRowItem` to include the projection.** Rejected — it changes a
   merged component's contract and adds a third branch to a type guard whose
   whole design (D-27.2) is that each branch is narrowed by a field it also
   reads. Out of scope for this issue, in any case.
3. **Compose `bfCard` with its `.bf-card-row` modifier.** Adopted. That is
   what `bfCardRow` itself composes, and `Card.vue`'s own block comment
   declares the class public for this issue *by name*: "It also gives #43 and
   #55 a name to hang their container rules on (`.bf-search__results
   .bf-card-row`) without either of them learning an attribute private to this
   file."

Identical presentation, honest types, no merged component edited, no pinned
contract changed. The mismatch itself is handed to issue 54 as a residual
rather than silently absorbed here.

### D-43.2 — `bfFormField` renders the query control, and residual #157 needs no local rule

The spec says "a labelled `<input type="search">`". `FormFieldProps.type` is a
deliberately open `string` handed straight to `<input :type="type">`, so
`'search'` needs no widening, and the component already renders a real
`<label for>`/`id` pair — so the accessible name is *visible text* rather than
the frozen source's `aria-label` on a bare input.

It also already declares `.bf-form-field__control:focus-visible` in
`@layer components`, which is residual #157's ring: `base/forms.css` writes
`outline: none` in `@layer defaults` and paints with `box-shadow` alone, which
forced-colors mode drops. **No local `:focus-visible` rule is written in
`SearchShell.vue`** — a second one would be a duplicate that drifts. Probe 43
§ 1 asserts the ring on the *rendered* control (trusted `Tab` from the harness,
then a non-zero computed `outline-width`) rather than trusting this note.

### D-43.3 — the meter's hooks are declared on the meter, not on the bar

`:style` sets `--_bf-search-shell-meter-width` on the meter `<p>`; the bar
inherits it. The first implementation declared the hook's default *on the bar*
as well — and a custom property declared in a rule on an element **beats the
value inherited into it**, whatever the layer, so every bar drew at the 6px
floor with the per-row value sitting one node up, unused. Probe 43 § 2 caught
it on the first run. The defaults now live on the element the inline property
lands on, and the bar only consumes them.

### D-43.4 — `resultCount` is a prop, not `results.length`

The frozen `search.vue:49` renders **twenty** rows (`results.slice(0, 20)`)
under a count line reporting the length of the whole ranked set. A shell that
derived the count from the array it was given would report "20 results" for a
query that matched four hundred, with no way for a call site to correct it.

### D-43.5 — the debounce is hand-rolled, and `debounceMs` is a prop

`@vueuse/nuxt` is a dependency but is **not** registered in `nuxt.config.ts`
(there is no `modules` array at all), so `useDebounceFn` is not auto-imported
and reaching for `@vueuse/core` directly would be the first such import in
`src/`. Twelve lines of `setTimeout` with an `onBeforeUnmount` guard is the
smaller commitment. `debounceMs` is a prop rather than a constant — `0`
disables the timer and emits synchronously — because the emit boundary moved
from a page-local `ref` (where per-keystroke filtering of an in-memory array
was free) to a component boundary in front of a page that re-ranks ~400
documents and writes `route.query`.

### D-43.6 — the count line is the live region, and it is never `v-if`-ed

Residual #169: a live region inserted into the DOM *already containing* its
message is not reliably announced. The `<p role="status">` therefore renders in
**every** state, including zero results, and only its text changes — which
makes "0 results for …" the announcement and lets `bfEmptyState` stay outside
the region as ordinary page content rather than being announced twice.
`role="status"` alone, not `role="status" aria-live="polite"`: the role carries
the implicit `aria-live`/`aria-atomic`, and writing both invites drift.

### D-43.7 — `SearchResultRow.date` is handed to `bfTime`, so issue 54 must pass a parseable date

The frozen source puts a **pre-formatted** `monthYear()` display string in that
field and renders it inside a bare `<time>` with no `datetime` attribute —
which is, to every machine reading the page, a `<span>` spelled differently.
This shell renders `<bfTime>`, which parses the value, emits the `datetime` and
does the formatting itself, and renders **no element** for an unparseable one.
Issue 54 must therefore hand over the raw `publish_date`, not the formatted
string.

### D-43.8 — acceptance is the probe, not vitest; and the data-access grep is comment-stripped

The vitest harness on `dev` is broken and pre-existing (residual #86), so the
spec's acceptance is met by `npx tsx scripts/check-probes.ts --only 43` plus
the full suite, per the #109 harness decision and the gh#20–#51 precedent.

The spec's `grep -Lq "queryCollection" src/components/bf/SearchShell.vue` is
read as a check on the **comment-stripped** source, which is the #115 rule
("run over the whole file it is a check on the comments, not on the code") and
the state of all ten merged `bf-*` components that name the API in a comment
explaining that they do not call it. Verified comment-stripped:
`queryCollection`, `useWfContent`, `useAsyncData`, `useFetch` and `$fetch` are
all absent from the code.

### Known consequence for issue 54 — `bfEmptyState` renders an `<h1>`

`bfEmptyState` renders the page's one `<h1>` by design (issue 33; BRIEF §5
rule 9). A `/search` page that also renders `bfPageHeader` will therefore have
**two** `<h1>`s whenever the results are empty. Not solved here by inventing a
`headingLevel` prop on a merged component; raised as a residual against issue
54.
