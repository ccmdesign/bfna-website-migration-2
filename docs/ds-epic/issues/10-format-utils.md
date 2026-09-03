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

**D10.1 — `formatLabel` carries one deliberate deviation from the source text.**
The port adds `?? ''` to the split result:
`FORMAT_LABELS[(f ?? 'article').split('|')[0] ?? ''] ?? 'Article'`. This is a
type-only guard for `noUncheckedIndexedAccess`. `String.prototype.split` always
returns at least one element, so index 0 is never `undefined` and the fallback
can never fire — behaviour is identical. Without it the port reproduces the
`TS2538` that `useWfContent.ts:274` already carries (it is one of the 178
baseline errors) and would have added a **new** typecheck error, failing the
no-new-errors gate. Everything else is transcribed verbatim.

**D10.2 — no probe page for this issue.** The Styling section above is `N/A`
(pure TypeScript utility, nothing renders) and BRIEF §"Probe pages" scopes
probes to `bf-*` component issues needing a live render. The vitest suite at
`src/tests/utils/format.spec.ts` is the acceptance surface. Nothing is added
under `src/pages/bf-probe/`, so issue 59 has nothing extra to remove.

**D10.3 — the parity check is an acceptance activity, not a committed test.**
Behavioural parity against the originals was proven by a throwaway probe:
both label tables byte-identical to `useWfContent.ts` (whitespace-normalised
textual compare) and **1122 value comparisons with 0 mismatches** over every
distinct `format` (`article|report`, `video`, `infographic`, `report`), all 12
distinct `kind` values including the unmapped `cohort`, and every
`publish_date` / `content` / `excerpt` in `insights.json` plus every
`description` in `projects.json`. It is deliberately **not** committed: a
permanent test importing `useWfContent` would couple the `bf-*` suite to a
layer that issues 57-59 retire, and would break the epic's own cleanup.

**D10.4 — no types added to `src/types/bf-contracts.ts`.** All four signatures
are primitives (`string | null` in; `string` / `string | null` / `string[]`
out). Ground rule 11 governs *shared* types, and this module declares none.

**D10.5 — the `plain()` acceptance one-liner in this spec is buggy; verified
another way.** `grep -rln ... | xargs -I{} grep -l 'plain' {} && echo FAIL ||
echo PASS` prints `FAIL` on the *passing* case: with zero matches `xargs` runs
nothing and exits 0, so the `&&` branch fires. Verified directly instead —
zero files under `src/components/bf/` import `utils/format` at all, and
`format.ts` exports no `plain`. **PASS.** The corrected check is in
`docs/plans/gh19-plan.md` §5.

**D10.6 — the vitest harness is broken on `dev`; not fixed here.** `npx vitest
run` crashes with `Unknown Error: [object Object]` before collecting a single
test, for every suite. Verified pre-existing: `src/tests/config/srcDir.spec.ts`,
committed in the initial "Add Nuxt app", fails identically on an untouched
checkout, and `vitest` / `@vue/test-utils` are undeclared in `package.json`
with no `test` script. The 25 cases here were proven green against a stock
`vitest/config`. Shared test infrastructure affecting every later issue in the
epic was judged to need its own change rather than a drive-by fix inside a
formatter port, so `vitest.config.ts` was left untouched and the defect filed
as a residual.
