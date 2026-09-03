# 18 — bf-time

New atom `bfTime`: a proper `<time datetime>` element with a human label,
closing the v1 "date display" gap.

## Context

Depends on 02 (scaffold), 10 (`format.ts`'s `monthYear`). Blocks 21
(`bfCardInsight`), 27 (`bfCardRow`), 29 (`bfByline`), 55 (Archive template).
Builds from nothing existing — no `wfTime`/date component exists in the
wireframe layer. Where dates render today it's bare inline text (e.g.
`archive.vue`'s per-year `<time>` markup, per as-built-wireframe-inventory
§F "By year" row: `wfChip + NuxtLink + time`) — this closes that gap.
Provenance: BF-160; v2 §2 Level 1 row 5 ("new").

## Scope

- New `bfna-website-nuxt/src/components/bf/Time.vue` (`<bfTime>`).
- Props: `date: string` (ISO string, required), `format?: string`
  (reserved for a future non-default formatter; only the default path is
  built here — no new formatting logic beyond `monthYear`).
- Renders `<time :datetime="isoString">{{ label }}</time>` where `label`
  defaults to `monthYear(date)` from `bfna-website-nuxt/src/utils/format.ts`
  (issue 10).
- Null/invalid-date handling: if `date` is `null`, `undefined`, empty
  string, or `new Date(date)` is `Invalid Date`, render **nothing** (no
  `<time>` element at all) rather than a `<time>` with `datetime="Invalid
  Date"` or a visible "Invalid Date" label.
- Unit tests (`src/tests/components/bf-time.spec.ts` or wherever the
  existing component-test convention lives) covering: a valid ISO date
  string, an empty string, and `null`.

## Out of scope

- Relative-time formatting ("3 days ago") — no wireframe evidence, not
  built.
- Timezone handling — dates are used as-is (date-only or already-UTC
  strings from the source data), no timezone conversion logic.
- i18n / non-`en-US` locales — `monthYear` is hardcoded `'en-US'` in
  `format.ts` per its existing port (issue 10), not extended here.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

No CSS-variable hook needed — `<time>` inherits surrounding typography, no
component-scoped style. If any spacing/inline-flow styling is added, use
`--_bf-time-*` per the naming convention, but the base build needs none.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Time.vue   # today: fails
npx vitest run src/tests/components/bf-time.spec.ts   # today: file doesn't exist, fails
```
Plus: unit tests cover a valid date, an empty string, and `null`; the
rendered `datetime` attribute is always a valid ISO value whenever the
element renders at all (per the issues.md `verify` column).

## Decisions

_Runner appends here._
