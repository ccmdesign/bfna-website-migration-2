# 24 — `bfCardPerson` — typed person card + modal decision

One-line objective: port `wfCardPerson.vue` to a typed `bfCard` wrapper and
resolve the open modal-vs-detail-page decision (BF-174).

## Context

Depends on 20 (`bfCard`), 17 (`bfMedia`). Builds from
`src/components/wireframe/wfCardPerson.vue`. Consumed by 53 (`/about`
Board + Team grids). Provenance: BF-197, BF-174. As-built: the person card
has **no link** — people have no detail pages in the wireframe layer; the
open decision (component-inventory-v2 §5) is whether bf-* adds one.

## Scope

- File: `src/components/bf/CardPerson.vue` → `<bfCardPerson>`.
- Props:
  ```ts
  interface Props {
    person: Person   // zod-inferred type from issue 09 (bfPeople schema)
  }
  ```
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Renders: `<h3>{{ person.name }}</h3>` (**not** a link — no `NuxtLink`,
  matching the wf source's own comment "no link"), `<p>{{ person.job_title
  ?? '—' }}</p>`, `#media` slot with `<bfMedia :src="person.image" alt=""
  ratio="1/1" />` (decorative portrait — the heading already names them).
- **Decision to resolve and record in this file's Decisions section**:
  ship `bfCardPerson` unlinked, matching the wireframe exactly. Do not
  build a modal, a person detail route, or a bio expander in this issue —
  BRIEF §8 names this an "escalate to Claudio if the answer needs him" item.
  Write the rationale (why "ship unlinked" is the safe default given no
  wireframe evidence of a modal/detail pattern) into the Decisions section
  below and link it from the journal, per issue 24's own acceptance line in
  `issues.md`.

## Out of scope

- Building a modal, a person detail route, or a bio expander (explicitly
  deferred — a future issue if Claudio resolves BF-174 toward one).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables; reuses `bfCard`/`bfMedia` hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardPerson.vue
grep -Lq "NuxtLink" src/components/bf/CardPerson.vue
grep -q "'—'" src/components/bf/CardPerson.vue
```
Probe page `src/pages/bf-probe/24-bf-card-person.vue` renders both a board
member and a team member, plus one person with no `image` (placeholder
fallback) and one with no `job_title` (the `—` fallback):
```bash
grep -q "—" .output/public/bf-probe/24-bf-card-person/index.html
```
Fails today (no `bf/CardPerson.vue`), passes once done, including the
Decisions section being non-empty.

## Decisions

_Runner appends here._
