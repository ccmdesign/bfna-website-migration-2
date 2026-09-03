# 10 — format-utils

Port the pure formatter functions out of `useWfContent.ts` into a
Vue-free, unit-tested `utils/format.ts`.

## Context

Depends on 01. Blocks 18 (`bfTime` uses `monthYear`), 21 (`bfCardInsight`
uses `formatLabel`), and any later molecule/organism/template that needs a
label/date string. Builds from
`bfna-website-nuxt/src/composables/useWfContent.ts` (lines 190-208,
269-280: `formatLabel`, `kindLabel`, the `plain`/`paragraphs`/`monthYear`
block). Provenance: 01 §E.

## Scope

- New `bfna-website-nuxt/src/utils/format.ts`, no Vue imports, four named
  exports with the **same names and signatures** as the composable today:
  - `formatLabel(f: string | null): string` — ports `FORMAT_LABELS`
    (`useWfContent.ts:190-195`: `article→Article, report→Report,
    video→Video, infographic→Infographic`) and the lookup logic
    (`useWfContent.ts:269`: `FORMAT_LABELS[(f ?? 'article').split('|')[0]] ??
    'Article'`) — defaults to `'Article'` on null/empty/unmapped input.
  - `kindLabel(k: string | null): string | null` — ports `KIND_LABELS`
    (`useWfContent.ts:197-208`, 10 entries: `research-initiative`,
    `research-documentary-project`, `research-multimedia-initiative`,
    `data-visualization-project`, `data-analysis-platform`,
    `interactive-multimedia-platform`, `geopolitical-forecasting-platform`,
    `podcast-series`, `podcast`, `fellowship`) — returns `null` for `null`
    input, the raw string back for an unmapped `k` (`useWfContent.ts:270`:
    `k ? KIND_LABELS[k] ?? k : null`).
  - `monthYear(d: string | null): string` — ports `useWfContent.ts:279-280`
    (`d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year:
    'numeric' }) : ''`) — empty string on null/falsy input.
  - `paragraphs(text: string | null | undefined): string[]` — ports
    `useWfContent.ts:278` (`(s ?? '').split('\n\n').filter(Boolean)`).
- `bfna-website-nuxt/src/tests/utils/format.spec.ts` (or wherever the
  existing `tests/` vitest suites live — match the directory convention of
  `src/tests/config/` / `src/tests/tokens/` already in the repo), covering
  each function's mapped-value path, unmapped/default path, and
  null/empty-string input path.

## Out of scope

- `plain()` — **deliberately not ported**. HTML strip/entity-decode moves
  into the normaliser (issue 07), and no `bf-*` file re-derives it. This is
  a hard rule, not an oversight.
- Any composable (`useBf*`, issues 11-13) — those consume this file, not
  vice versa.
- Any date-library dependency (`date-fns`, `dayjs`, etc.) — `monthYear` stays
  on native `Date`/`toLocaleDateString`, matching today's implementation.
- Any component (`bf-*`) importing this directly for anything beyond what
  it already needs — components take formatted strings as props where
  possible per D8, but `bfTime` (issue 18) is allowed to call `monthYear`
  internally since it IS the date-formatting atom.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — pure TypeScript utility, no CSS or component.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/utils/format.ts
npx vitest run src/tests/utils/format.spec.ts   # today: file doesn't exist, fails
grep -rln "from '~/utils/format'" src/components/bf/ 2>/dev/null | xargs -I{} grep -l 'plain' {} \
  && echo FAIL || echo PASS   # no src/components/bf/ file imports plain()
```

## Decisions

_Runner appends here._
