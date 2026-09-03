# 29 — `bfByline` — article byline (new, resolves naming collision)

One-line objective: build a new `bfByline` molecule for article
author/date bylines, and formally resolve the `ccmByLine` naming collision
by documenting that the two components are unrelated.

## Context

Depends on 02 (`bf-scaffold`), 18 (`bfTime`, for the optional date). Builds
from **new** markup — no `wf-*` file exists for this; `insights/[slug].vue`
hand-rolls `<span>By {{ insight.authors.join(', ') }}</span>` next to a bare
`<time>`. Provenance: BF-205; v2 §5 open decision ("`ccmByLine` naming
collision: rename the existing footer-credit component and build a
genuinely new article-byline component, or repurpose one — resolve before
BF-205 starts"). Consumed by: no template in Phase 4/5 wires it in yet
(the insight-detail template, issue 50, does not list a byline in its
section order per `issues.md` — record in Decisions whether issue 50 should
pick this component up, since insight data does carry `authors`).

## Scope

- File: `src/components/bf/Byline.vue` → `<bfByline>`.
- Props:
  ```ts
  interface Props {
    author: string     // pre-joined string, e.g. authors.join(', ') — the component does not accept an array
    date?: string       // ISO date string, passed straight to bfTime
  }
  ```
- Renders `<p class="bf-byline | cluster" data-gap="xs">By {{ author
  }}<bfTime v-if="date" :date="date" /></p>` — author-only when `date` is
  omitted, author + `bfTime` when present. No slot — this is a
  props-only molecule per the ADR-1 "cards + heros = props" rule extended
  here since it has no compound anatomy.
- **Naming-collision resolution (record verbatim in Decisions)**: leave
  `src/components/ds/organisms/ccmByLine.vue` (the existing footer-credit
  component, unrelated purpose) **completely untouched** — no rename, no
  edit. `bfByline` is a net-new article byline with no relationship to
  `ccmByLine` beyond the coincidental name similarity. State this plainly
  in the spec so no later issue conflates the two.

## Out of scope

- Renaming or editing `components/ds/organisms/ccmByLine.vue` in any way.
- Avatars or author photos (no wireframe evidence).
- Multi-author lists beyond a simple joined string — the caller
  (`insight.authors.join(', ')`) does the joining, not this component.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-byline-gap` (Utopia `xs` token). No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Byline.vue
grep -Lq "ccmByLine" src/components/bf/Byline.vue
git diff --stat -- src/components/ds/organisms/ccmByLine.vue   # must be empty
```
Probe page `src/pages/bf-probe/29-bf-byline.vue` renders an author-only form
and an author+date form:
```bash
grep -q "By " .output/public/bf-probe/29-bf-byline/index.html
```
Fails today (no `bf/Byline.vue`), passes once done, and the naming
resolution is written into this file's Decisions section (not just implied
by the diff check).

## Decisions

_Runner appends here._
