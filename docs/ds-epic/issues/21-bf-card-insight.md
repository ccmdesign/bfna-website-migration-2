# 21 — `bfCardInsight` — typed insight card wrapper

One-line objective: port `wfCardInsight.vue` to a typed `bfCard` wrapper
consuming the `Insight` entity type from the data layer.

## Context

Depends on 20 (`bfCard` base), 16 (`bfChip` for the format/extra/Archive
chips), 18 (`bfTime` for the date). Builds from
`src/components/wireframe/wfCardInsight.vue`. Consumed by 42
(`bfGridInsights`) and templates 47/49/50/51/52 (as `bfInsights` grids).
Provenance: BF-192. Reused by all pages that today call `wfGridInsights`
(as-built A: 5 files transitively).

## Scope

- File: `src/components/bf/CardInsight.vue` → `<bfCardInsight>`.
- Props (real wf-* names, unchanged):
  ```ts
  interface Props {
    insight: Insight          // zod-inferred type from issue 09 (content.config.ts bfInsights schema)
    extraChips?: string[]
    excerpt?: boolean          // default true
    excerptLength?: number     // default 140
  }
  ```
  `Insight` import: `from '~/types/bf-contracts'` (issue 09 exports the
  zod-inferred entity type there).
- `inheritAttrs: false`; root is `<bfCard v-bind="$attrs">` so callers'
  `class`/`data-*` land on the base `<li>`.
- Renders, in this order (heading first, per `wfCard`'s a11y comment):
  `<h3><NuxtLink :to="\`/insights/${insight.slug}\`">{{ insight.heading }}</NuxtLink></h3>`,
  conditional excerpt `<p>` (truncated to `excerptLength`, ellipsis appended
  — same truncation logic as `wfCardInsight.vue`, but the source text is
  **already plain** from the issue-07 normaliser; the component does not
  call `plain()` — that helper is retired per issue 10), `<bfTime :date=
  "insight.publish_date" />` in place of the bare `<time>`.
- `#chips` slot content: `<bfChip>{{ formatLabel(insight.format) }}</bfChip>`
  (from `utils/format.ts`, issue 10) + one `<bfChip>` per `extraChips` entry
  + a conditional `<bfChip>Archive</bfChip>` when `insight.archived`.
- No `#media` slot filled (insight cards carry no image in the wireframe).
- The route target changes from `/wireframes/insights/:slug` (wf-*) to
  `/insights/:slug` (the bf-* site) — this is the one deliberate content
  delta from the wf-* source.

## Out of scope

- No edits under `pages/wireframes/` or `components/wireframe/` — fails the
  epic (D2).
- Grid/column layout (issue 42 owns the grid wrapper).
- Fetching anything — this component receives `insight` as a prop only, no
  `queryCollection`.
- Re-deriving `formatLabel`/`monthYear` logic inline — import from
  `utils/format.ts` (issue 10).

## Styling

- No component-level CSS variables beyond what `bfCard` already exposes —
  this wrapper is presentation-thin (chip + heading + time), styled through
  the base's tokens.
- `bfTime`/`bfChip` bring their own `--_bf-time-*`/`--_bf-chip-*` hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardInsight.vue
grep -q "insight: Insight" src/components/bf/CardInsight.vue
grep -Lq "plain(" src/components/bf/CardInsight.vue
```
Probe page `src/pages/bf-probe/21-bf-card-insight.vue` renders one
`bfCardInsight` fed a real insight with a 980-character excerpt (from
`content/bf/insights/` once issue 07/09 land) and one archived insight:
```bash
grep -q "Archive" .output/public/bf-probe/21-bf-card-insight/index.html
```
Both commands fail today (no `bf/CardInsight.vue`) and pass once done.

## Decisions

**D-21.1 — the wrapper contract, written once here for #31–#36.** This is the
first typed wrapper over the `bfCard` base (#29), so the shape the remaining
five wrappers and the row variant copy is settled here rather than five more
times:

1. `inheritAttrs: false`, and the root is `<bfCard v-bind="$attrs">`. **Both
   halves, or neither.** Left at the default, `inheritAttrs` would apply a
   caller's attributes twice — once automatically, once through the explicit
   `v-bind` — merging duplicate classes and double-binding listeners; without
   the `v-bind`, they would not reach the base at all. `verify-bf-card-insight.ts`
   asserts the pair.
2. **The prop is the entity, not its fields.** `insight: Insight`, imported
   from `~/types/bf-contracts`, never redeclared and never narrowed to a
   hand-written subset — a card spelling out `{ slug, heading, excerpt,
   publish_date, format, archived }` keeps compiling after the schema renames
   one of them. Everything else is a presentation switch.
3. **The wrapper owns no DOM and ships no stylesheet.** Its rendered root *is*
   `bfCard`'s `<li class="bf-card">`; it adds no element and no class of its
   own, so every pixel comes from the base's `@layer components` block and the
   atoms' `--_bf-time-*` / `--_bf-chip-*` hooks. A wrapper stylesheet would
   have to re-answer the layer question and D-20.5's `:not()` ban for no new
   pixels; with no `<style>` block at all, both are satisfied vacuously and
   asserted as such.
4. **Presentational-only (BRIEF D8) is asserted on the comment-stripped
   source.** The component's documentation names `queryCollection`,
   `useAsyncData` and `plain()` precisely in the course of saying it calls
   none of them, so a whole-file `grep` — including the spec's own
   `grep -Lq "plain("` — is a check on the prose, not on the code. Run against
   `code(source)` instead, the same deviation residual #115 already resolved
   for `verify-bf-chip.ts`'s `:style=` check. The complementary assertion is
   that the **probe** does query the collection: without it, "renders a real
   row" could be met by a literal in a page.

**D-21.2 — `span` reaches the base as a prop, through `$attrs`, without being
redeclared.** `span` is undeclared on the wrapper, so it falls into `$attrs`;
`v-bind`ing `$attrs` onto a *component* matches keys against that component's
declared props, and `bfCard` declares `span` (D-20.6). It therefore arrives as
the prop rather than as a stray `span=""` attribute on the `<li>`. Redeclaring
it on every wrapper was the alternative and was rejected: six copies of a
one-member union, each able to drift. The probe asserts both halves — the
rendered `data-span="full"` with `grid-column: 1 / -1`, and the *absence* of a
literal `span` attribute on the element.

**D-21.3 — the "980-character insight" acceptance, substituted honestly.** The
issue's acceptance reads *"renders a real 980-character insight without
overflow"*. **No such `excerpt` exists.** 980 is BRIEF §5 rule 10's upper bound
on the *pre-normalisation* range; after the issue-07 normaliser the longest
real `excerpt` in all 371 rows is **500** characters
(`dual-vocational-training`), and the collection's mean is far below that.

Three options were on the table: shrink the acceptance to 500 and say nothing;
pad a real excerpt with lorem to reach 980; or find 980 characters of real
prose. The third was taken. The probe's `long` card renders **980 characters of
the same real document's own `content` field** — `dual-vocational-training`,
whose body opens with 980 characters of clean prose and no markdown — with
`excerptLength` raised past it so nothing truncates. It is real content from
`bfInsights`, at the length the acceptance names, and the probe asserts the
rendered text is genuinely a prefix of that document's `content` so the
substitution cannot silently decay into a literal.

"Without overflow" is measured, not eyeballed: `scrollWidth ≤ clientWidth` and
`scrollHeight ≤ clientHeight` on the card *and* on the paragraph, the card's
box contained in the grid's content box, and the paragraph measurably taller
than the truncated card's — the last one taken on the **paragraphs** rather
than the cards, because grid items stretch to their row height and two cards in
one row have identical heights however much text one of them holds.

**D-21.4 — the route delta is asserted to be the only content delta.** The
heading links to `/insights/<slug>` where `wfCardInsight.vue:22` links to
`/wireframes/insights/<slug>`. Everything else is parity, and parity is checked
*relationally* rather than by eye: `verify-bf-card-insight.ts` parses the prop
names, the two `withDefaults` values and the truncation arithmetic back out of
the frozen file and compares them, so a silently renamed prop or a changed
`excerptLength` fails the build rather than a call site in issue 42.

**D-21.5 — acceptance substitution (residual #86).** The vitest harness on `dev`
is broken and pre-existing, so the spec's acceptance is met by two things,
both exiting 0:

- `npx tsx scripts/check-probes.ts --only 21` — the probe at
  `src/pages/bf-probe/21-bf-card-insight.vue` under the #109 harness and the
  gh#116 `bf-probe` layout, **42 rows**, fed three real `bfInsights` documents;
  and the full `npx tsx scripts/check-probes.ts` — **13 probes, 484 rows**, so
  every earlier probe is regression-checked too.
- `npx tsx scripts/verify-bf-card-insight.ts` — **new**, following the
  `verify-bf-chip.ts` / `verify-bf-button.ts` convention and exit contract (a
  *skipped* check exits 1 as INCOMPLETE): 0 failed, 0 skipped.

The spec's own shell greps were run as written, except `npm run typecheck`,
which is replaced by the epic's no-new-errors gate: baseline **178** `error TS`
on `dev`, **178** after, **0** in `src/components/bf`, `src/types`,
`src/composables/bf` or `content.config`. `npx nuxt generate` exits 0 (836
routes) and the frozen wireframe sources are byte-identical to the pre-epic
base `f757a64`.
