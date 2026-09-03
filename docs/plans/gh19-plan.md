# gh#19 — `src/utils/format.ts` pure formatters

**Issue:** [#19](https://github.com/ccmdesign/bfna-website-migration-2/issues/19)
**Spec (authoritative):** [`docs/ds-epic/issues/10-format-utils.md`](../ds-epic/issues/10-format-utils.md)
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) · **Brief:** [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md)
**Branch:** `feature/gh19-utils-format-ts-pure` off `dev` @ `12b9e1a`
**Phase:** 2 — Data · **Type:** data · **Blocked-by:** #10 (merged)

---

## 1. Objective

Lift the four **pure** formatter closures out of `src/composables/useWfContent.ts`
into a Vue-free, unit-tested `src/utils/format.ts` with **identical names,
signatures and behaviour**, so later issues (18 `bfTime`, 21 `bfCardInsight`,
and every subsequent molecule/organism/template) import one shared
implementation instead of re-deriving label tables.

`useWfContent.ts` is **not modified** — it is a frozen `wf-*` file under D2/DoD-4.
The port is a copy, not a move; the duplication is intentional and temporary
(the wireframe layer retires in issues 57–59).

## 2. Approach

Straight transcription. Both label tables and all four lookups are copied
character-for-character from the source so that no behavioural drift is
possible, then exported as module-level `const` tables plus four named
function exports.

Source provenance (all in `bfna-website-nuxt/src/composables/useWfContent.ts`):

| Export | Source lines | Behaviour |
|---|---|---|
| `FORMAT_LABELS` | 195–200 | 4 entries: `article/report/video/infographic` |
| `KIND_LABELS` | 202–213 | 10 entries, `fellowship → 'Fellowship Program'` |
| `formatLabel(f)` | 274 | `FORMAT_LABELS[(f ?? 'article').split('|')[0]] ?? 'Article'` |
| `kindLabel(k)` | 275 | `k ? KIND_LABELS[k] ?? k : null` |
| `paragraphs(s)` | 283 | `(s ?? '').split('\n\n').filter(Boolean)` |
| `monthYear(d)` | 284–285 | `d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''` |

Three behavioural details that must survive verbatim and are easy to lose:

1. **`formatLabel` splits on `|` first.** Snapshot `format` values are
   pipe-delimited multi-values (e.g. `"article|report"`); only the first
   segment is looked up. An empty string `''` therefore yields `''.split('|')[0]
   === ''`, misses the table, and falls through to `'Article'` — the same as
   `null`. `??` (not `||`) means `null`/`undefined` default to `'article'` but
   `''` does **not**.
2. **`kindLabel` returns the raw key back** for an unmapped non-empty `k`, and
   `null` for `null` — but `''` is falsy, so `kindLabel('')` is `null`, not `''`.
3. **`monthYear` is timezone-sensitive** by construction: `new Date('2024-01-31')`
   parses as UTC midnight and `toLocaleDateString` renders in the *runner's*
   local zone. Tests must not assert on a date whose month can flip (avoid
   1st/last-of-month fixtures, or use mid-month dates).

## 3. Files

| File | Action |
|---|---|
| `bfna-website-nuxt/src/utils/format.ts` | **new** — 4 named exports + 2 exported label tables, zero imports |
| `bfna-website-nuxt/src/tests/utils/format.spec.ts` | **new** — vitest suite, matches `src/tests/<area>/<name>.spec.ts` convention already used by `src/tests/config/`, `src/tests/tokens/`, `src/tests/composables/` |
| `docs/ds-epic/issues/10-format-utils.md` | append to the **Decisions** section only |
| `docs/plans/gh19-plan.md` | this file |

**Not touched:** `useWfContent.ts`, anything under `pages/wireframes/`,
`components/wireframe/`, `layouts/wireframe.vue`, `public/css/wireframe.css`,
`src/assets/wireframe-data/`.

**No probe page.** The spec's Styling section is `N/A — pure TypeScript utility,
no CSS or component`, and BRIEF §"Probe pages" scopes probes to `bf-*` component
issues that need a live render. There is nothing to render; the vitest suite is
the acceptance surface. (Recorded as a Decision on the spec.)

**No types imported from `src/types/bf-contracts.ts`** — all four signatures are
primitives (`string | null` in, `string` / `string | null` / `string[]` out).
Nothing shared needs declaring, so per ground-rule 11 there is nothing to add
there. Verified: `bf-contracts.ts` has no format-related type today.

## 4. Test strategy

`src/tests/utils/format.spec.ts`, plain `vitest` (`describe/it/expect`), no
`@vue/test-utils`, no Nuxt runtime env needed.

Per function, three paths as the spec requires — mapped, unmapped/default, and
null/empty:

- **`formatLabel`** — each of the 4 mapped keys; pipe-delimited `'article|report'`
  → `'Article'`; unmapped `'podcast'` → `'Article'`; `null` → `'Article'`;
  `''` → `'Article'`.
- **`kindLabel`** — a spot-check of all 10 mapped keys (table-driven, incl. the
  `fellowship → 'Fellowship Program'` non-obvious one); unmapped `'something-new'`
  → `'something-new'`; `null` → `null`; `''` → `null`.
- **`monthYear`** — a real snapshot date → `'<Mon> <YYYY>'`; `null` → `''`;
  `''` → `''`. Asserted against a locally-computed expectation for the
  timezone-safe cases, plus a `/^[A-Z][a-z]{2} \d{4}$/` shape assertion.
- **`paragraphs`** — multi-paragraph text → N entries; single paragraph → 1
  entry; `null`/`undefined`/`''` → `[]`. Assert the *actual* split semantics,
  not the intuitive one: an even run of newlines yields an empty segment that
  `filter(Boolean)` drops (`'a\n\n\n\nb'` → `['a', 'b']`), while an odd run
  leaves a whitespace-only segment that survives (`'a\n\n\nb'` → `['a', '\nb']`).

**Behavioural parity check (acceptance activity, not committed).** A throwaway
script imports the live `useWfContent()` closures and the new module side by
side and asserts equal output over real values pulled from
`src/assets/wireframe-data/{insights,projects}.json` — every distinct `format`,
every distinct `kind`, and a sample of `date` and `content` values. It is run
once at acceptance and the result journalled. It is **not** committed, because a
permanent test importing `useWfContent` would couple the `bf-*` test suite to a
layer scheduled for retirement in issues 57–59 and would fail the epic's own
cleanup. (Recorded as a Decision on the spec.)

## 5. Verification

```bash
cd bfna-website-nuxt
test -f src/utils/format.ts
npx vitest run src/tests/utils/format.spec.ts     # green
npx nuxt typecheck 2>&1 | grep -cE 'error TS'      # <= 178 (dev baseline)
npx nuxt typecheck 2>&1 | grep -E 'error TS' \
  | grep -cE 'src/(components/bf|types|composables/bf)|content\.config'   # == 0
npx nuxt generate                                   # exit 0
# NB: the spec's own one-liner for this check is buggy — with zero matches
# xargs runs nothing and exits 0, so `&& echo FAIL` fires on the PASS case.
# Check it directly instead; both must be empty:
grep -rln 'utils/format' src/components/bf/ 2>/dev/null
grep -nE 'export (const|function) plain' src/utils/format.ts
```

Plus the wireframe byte-identity gate from the repo root (must print nothing):

```bash
git diff --stat f757a649361993275a43282456f4746d247be37b HEAD -- \
  bfna-website-nuxt/src/pages/wireframes \
  bfna-website-nuxt/src/components/wireframe \
  bfna-website-nuxt/src/composables/useWfContent.ts \
  bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/src/public/css/wireframe.css
```

Typecheck gate is **no new errors**, not zero — `dev` carries 178 legacy
errors (orchestrator decision after #10, residual #71). Baseline for this
branch measured at 178 total / 0 scoped before any edit.

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Silent behavioural drift while retyping the label tables | med | Copy verbatim; parity script diffs both implementations over every distinct real snapshot value |
| `monthYear` test flakes across CI timezones | med | Mid-month fixtures only; shape-regex assertion alongside exact-value assertions computed the same way the implementation does |
| `''` vs `null` conflated in tests (`??` vs `||`) | med | Explicit empty-string cases for all four functions, asserting the *as-implemented* result |
| Someone later re-derives `plain()` in a `bf-*` component | low | Out-of-scope note kept in the module header comment; the grep in §5 is a standing acceptance check |
| `src/utils/` is Nuxt-auto-imported, causing a name clash with `formatDate.ts` | low | Different export names (`formatDate` vs `formatLabel`); typecheck + `nuxt generate` would surface a duplicate-auto-import warning |

## 7. Out of scope

`plain()` (issue 07's normaliser owns HTML strip/decode — hard rule, not an
oversight) · any `useBf*` composable (issues 11–13 consume this) · any date
library · any `bf-*` component · any edit to `useWfContent.ts` or the wireframe
layer.
