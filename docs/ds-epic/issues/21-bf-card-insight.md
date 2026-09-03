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

_Runner appends here._
