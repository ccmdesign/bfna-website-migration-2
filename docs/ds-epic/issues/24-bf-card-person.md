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

### D-24.1 — the person card ships **non-interactive**; BF-174 is resolved, not deferred

**Status:** adopted (orchestrator ruling, gh#33) · supersedes the "open
decision" note in component-inventory-v2 §5.

`bfCardPerson` renders a name, a job title and a square portrait. **It renders
no link, no modal trigger, no detail route and no bio expander**, and it is not
a stub for one: a later issue that adds a person surface changes this component
deliberately, against this decision, rather than filling in something left
half-done.

**Rationale.**

1. **The wireframe layer is the specification** (BRIEF §1), and it is
   unambiguous here. `wfCardPerson.vue`'s own header comment states the rule —
   *"No link (people have no detail pages in the wireframe). Portrait is
   decorative — the heading names them."* — and nothing in the validated
   prototype shows a modal, an expander or a `/people/<slug>` route. Adding one
   in a **port** issue would be inventing product, not porting it.
2. **There is no content to link to.** `bfPersonSchema` carries `bio`, `email`,
   `linkedin` and `twitter`, but no page, no body and no ordering; a detail
   route would be a page whose entire content is four fields already on the
   card plus a paragraph. That is a design decision about a person surface, not
   a component decision.
3. **An affordance that goes nowhere is a lie.** Shipping the card *linked to
   itself*, or with a modal that shows the same three fields, would give every
   portrait a hover state, a focus ring and a card-sized hit area promising
   something the click does not deliver.
4. **Unlinked is the reversible direction.** Adding a link later is additive and
   touches this file plus its probe. Shipping a modal now and removing it later
   costs a route, a focus-trap, a history entry and an a11y review.

**Consequences — asserted by probe 24, not assumed.** With no anchor in the
card, three things about `bfCard` follow, and each is a row in the probe:

| Base rule | Selector | Effect here |
|---|---|---|
| the stretched hit area | `.bf-card :is(h2, h3, h4) a::after` | never generates — the card corner hit-tests to the card itself |
| hover feedback | `.bf-card:has(:is(h2, h3, h4) a):hover` | matches no person card |
| the focus indicator | `.bf-card:has(:is(h2, h3, h4) a:focus-visible)` | matches no person card; nothing in the card is a tab stop |

And **[#130]** — a stretched link with no accessible name — is *structurally
absent* rather than guarded: there is no link that could lack a name. What the
component does guard is the smaller sibling defect, an empty `<h3></h3>` when
`person.name` is the empty string (`hasName`, with a dev-time `console.warn`).

**What stays open, and where.** The *product* question — should BFNA people have
a bio surface at all, and if so a modal, a detail page or an inline expander? —
is Claudio's, not this epic's. **Plane BF-174 stays open** for the design pass;
this decision closes only the engineering question this issue could answer,
which is what `bfCardPerson` ships as today. Nothing in the epic is blocked on
BF-174: the one consumer, issue 53's `/about` Board and Team grids, needs
exactly the card described here.

[#130]: https://github.com/ccmdesign/bfna-website-migration-2/issues/130

### D-24.2 — acceptance substitutions

Three lines of this file's acceptance block were substituted, per the epic's
standing rules; the checks are equal-or-stronger and were all run.

| Spec line | Substituted with | Why |
|---|---|---|
| `npm run typecheck` (exit 0) | the **no-new-errors** gate: `error TS` count ≤ the 178 measured on `dev` before any edit, **and** zero errors matching `src/(components/bf\|types\|composables/bf)\|content.config` | orchestrator decision after gh#10 (residual #71): `dev` carries ~178 legacy errors, so "green" is unreachable. Measured: **178 → 178**, and **0** in the bf-owned surface. |
| `grep -Lq "NuxtLink" src/components/bf/CardPerson.vue` | `! grep -q "NuxtLink" src/components/bf/CardPerson.vue` | as written the spec's line is a no-op: `-L` prints filenames and `-q` suppresses output, so it exits 0 whether or not the string is present. The substitute actually fails when a link is added — which, for the issue whose whole point is D-24.1, is the one check that must not be decorative. |
| the browser-read PASS on the probe page | `npx tsx scripts/check-probes.ts --only 24` **and** the full `npx tsx scripts/check-probes.ts`, both exit 0 | the #109 harness convention (`docs/decisions/probe-harness.md`): a probe that only prints PASS to a human does not count. The vitest harness on `dev` is broken and pre-existing (residual #86); no check here depends on it. |

### D-24.3 — the `—` fallback is exercised by real data, and the placeholder is not

`ma-a-ocvirk` carries `job_title: null` in the normalised collection, so the em
dash is asserted against a **real row** rather than a synthetic one. All
thirteen rows carry an `image`, so the missing-portrait case is the one the
probe has to derive (`{ ...row, image: null }` — `image` is
`z.string().nullable()`, so `null` is the typed form of the defect, not a
hack). Same for the blank `name`: `name` is non-nullable, so the empty string is
the only blank the type permits and is what the probe passes.

`??` and not `||` for the title, deliberately: an empty-string title would be a
normaliser bug, and collapsing it into the em dash would hide it.

### D-24.4 — the probe grid is three columns, derived rather than pinned

`data-min-width="l"` (a 300px track floor) under the 1200px `.container` and the
harness's pinned 1280×1024 viewport resolves to exactly three tracks — a fourth
needs 1200px of track before a single gap is added. The probe asserts the
resolved `--_grid-min-width`, the count **derived from the measured content box**
(the arithmetic `auto-fill` itself does), and the pinned `3` separately, so a
viewport change is reported as a viewport change rather than as a broken
component. No `bf-*` file carries a hand-pinned `grid-template-columns` (D9).
