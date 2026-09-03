# gh#109 — 15b Probe harness: machine-enforced probe verdicts

Promoted from residual [#106](https://github.com/ccmdesign/bfna-website-migration-2/issues/106);
[#115](https://github.com/ccmdesign/bfna-website-migration-2/issues/115) folded in.
Epic: https://app.plane.so/ccm-design/browse/BF-217/

The issue body is the spec — there is no `docs/ds-epic/issues/<NN>-*.md` file for it.

## Problem

Every `bf-*` probe runs its load-bearing assertions in `onMounted` and paints the result
into a `data-testid="probe-NN-verdict"` cell. The `npx tsx scripts/verify-bf-*.ts`
companions read the **prerendered** HTML, where that cell is `pending` by design, and exit
`0` regardless. So the half of each issue's acceptance that measures real box metrics,
resolved token colours, keyboard focusability and live CSSOM only runs when a human opens
the page. A broken component fails the eye, not the build.

## Approach

### 1. DOM convention (additive, not a rewrite)

Two attributes, both **added alongside** the existing `data-testid` / `data-state` markup so
the seven `verify-bf-*.ts` scripts that already grep for it keep working unchanged:

| Attribute | Where | Values |
|---|---|---|
| `data-probe` | probe root (`<main class="probe">`) | the two-digit probe number |
| `data-probe-verdict` | same root | `PASS` \| `FAIL` \| `PENDING` |
| `data-probe-row` | each check `<tr>` | the check's label |
| `data-ok` | same `<tr>` | `true` \| `false` |

Anchoring the verdict on the **root** rather than on a `data-testid` matters: probe 16 has a
second `.probe__verdict` cell (the keyboard lab), so a class- or testid-shaped selector is
ambiguous and a root attribute is not. `PENDING` is kept as a real third state for the same
reason probes 14–16 already keep it — the prerendered HTML has run no assertions, and baking
`FAIL` into it would read as a regression to the next issue that greps the file.

### 2. `scripts/check-probes.ts`

- Enumerate probe routes from `src/pages/bf-probe/*.vue` (not from a hard-coded list).
- Serve `.output/public` over a `node:http` static server on port `0` (a free port).
- Drive a headless Chrome over the **Chrome DevTools Protocol** using Node's built-in global
  `WebSocket` — see the driver decision below.
- Per probe: navigate, poll until `[data-probe-verdict]` leaves `PENDING` (or time out),
  then read the verdict and every `[data-probe-row]`.
- Exit non-zero naming the probe **and** each failing row; `--only <nn>` restricts to one
  probe; `--timeout <ms>` and `CHROME_PATH` are escape hatches.
- A probe still `PENDING` at timeout, or a probe with zero rows, is a FAIL, not a skip —
  the `verify-bf-*.ts` exit contract ("a skipped check exits 1 too") applied here.

### 3. Headless driver

Neither Playwright nor Puppeteer is a dependency, and `jsdom` (which is) has no layout
engine — `getComputedStyle` returns declared values, so every box-metric and resolved-colour
check in probes 14/15/16 would read `0px`. Adding Playwright means a ~130 MB browser
download in `postinstall` for one script.

Chosen instead: **raw CDP against whatever Chrome the machine already has**, with zero new
dependencies. Node 24 ships a global `WebSocket`, so the client is ~80 lines. The executable
is resolved in order from `$CHROME_PATH`, the local `ms-playwright` cache
(`chrome-headless-shell`), Google Chrome, Chromium, then Edge. Recorded in
`docs/decisions/probe-harness.md`.

### 4. #115 hardening (folded in)

1. **Hard-coded instance counts** in `verify-bf-chip.ts` §8 and `verify-bf-button.ts` §6
   become bounds plus *sum-consistency* (every rendered instance is classified into exactly
   one mode) plus the relational invariants that were already the good shape. Adding an
   instance to a probe no longer fails a correct component.
2. **`grep -c ":style=" == 0`** moves onto the comment-stripped source via the existing
   `code()` helper, so prose that merely spells the token cannot fail a correct component.
   Deliberate deviation from the spec's literal text, noted at the call site.
3. **`aria-pressed`** in `src/components/bf/Chip.vue` moves *after* `v-bind="$attrs"`, so a
   caller cannot desync it from `[data-active]` — the invariant probe 16 asserts.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/scripts/check-probes.ts` | new — the harness |
| `bfna-website-nuxt/src/pages/bf-probe/{03,09,11,12,13,14,15,16}-*.vue` | conform to the convention; 03 gains a runtime check table it never had |
| `bfna-website-nuxt/package.json` | `check:probes` script |
| `bfna-website-nuxt/scripts/verify-bf-{chip,button}.ts` | #115 items 1–2 |
| `bfna-website-nuxt/src/components/bf/Chip.vue` | #115 item 3 |
| `docs/decisions/probe-harness.md` | new — convention + driver decision |
| `docs/plans/ds-epic-plan.md` | link the decision record |

## Test strategy

1. `npx nuxt generate` → exit 0.
2. `npx tsx scripts/check-probes.ts` → exit 0, eight probes PASS.
3. `npx tsx scripts/check-probes.ts --only 16` → exit 0.
4. **Negative case:** break one row in one probe, re-generate, confirm exit 1 naming the
   probe *and* the row; restore and re-confirm exit 0.
5. `npx tsx scripts/verify-bf-chip.ts` / `verify-bf-button.ts` / `verify-bf-logo.ts` → exit 0.
6. Typecheck gate: `grep -cE 'error TS'` ≤ baseline **178**, and 0 in
   `src/(components/bf|types|composables/bf)` / `content.config`.
7. Wireframe byte-identity vs `f757a64` → empty.

## Risks

- **Probe 03 has no verdict table at all.** It is a visual/measurement probe read by external
  scripts. Its checks must be written from scratch and must be *viewport-agnostic*: the
  `data-min-width` cases were specified at 1200/800/400px, so the runtime check asserts the
  resolved track count against the count the container width implies, rather than a pinned
  number. Mitigation: also assert the far-apart gap steps and the `data-measure` caps, which
  are viewport-independent.
- **Chrome availability.** The harness fails loudly with the list of paths it tried rather
  than silently passing; `CHROME_PATH` overrides.
- **Timing.** Nuxt hydration plus `onMounted` is asynchronous; the poll (not a fixed sleep)
  and the explicit `PENDING`-at-timeout failure keep it deterministic.
- **`verify-*.ts` regressions.** The convention is additive, so the existing
  `data-state="pending"` assertions in those scripts stay true.
