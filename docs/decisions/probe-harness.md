# Decision — the probe harness and its DOM convention

**Status:** adopted · **Issue:** [gh#109](https://github.com/ccmdesign/bfna-website-migration-2/issues/109)
(promoted residual [#106](https://github.com/ccmdesign/bfna-website-migration-2/issues/106);
[#115](https://github.com/ccmdesign/bfna-website-migration-2/issues/115) folded in) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

## Context

Every `bf-*` probe page under `bfna-website-nuxt/src/pages/bf-probe/` runs its load-bearing
assertions in `onMounted` — measured box metrics, resolved token colours, keyboard
focusability, live-CSSOM cascade-layer membership, `$attrs` merge order — and paints the
result into a PASS/FAIL cell. The `npx tsx scripts/verify-bf-*.ts` companions read the
**prerendered** HTML, where that cell is `pending` by design, and exit `0` regardless.

So half of every issue's acceptance ran only when a human opened the page. A broken
component failed the eye, not the build. That is the gap this decision closes, and it is
what the epic-closing verification issue (#68) needs as a tool.

## Decision 1 — the DOM convention

Every probe page carries, **in addition to** the `data-testid="probe-NN-verdict"` /
`data-state` markup the `verify-bf-*.ts` scripts already grep for:

| Attribute | Element | Values |
|---|---|---|
| `data-probe` | the probe's root element (`<main class="probe …">`) | the two-digit probe number, e.g. `"16"` |
| `data-probe-verdict` | the same root | `PASS` · `FAIL` · `PENDING` |
| `data-probe-row` | every check row (`<tr>` in the probe's results table) | the check's label |
| `data-ok` | the same row | `"true"` · `"false"` |

Three points of design, each load-bearing:

1. **The verdict is anchored on the root, not on a class or a `data-testid`.** Probe 16
   renders a *second* `.probe__verdict` cell for its keyboard lab, so a class-shaped
   selector is ambiguous and a testid-shaped one needs the harness to know the probe number
   before it can read the page. A root attribute needs neither.
2. **`PENDING` is a real third state.** The prerendered HTML has run no assertions. Baking
   `FAIL` into static output for a page that is fine would read as a regression to the next
   issue that greps the file — the reasoning probes 14–16 already adopted, generalised. The
   harness treats a probe still `PENDING` at timeout as a **failure**, never a skip.
3. **The convention is additive.** Nothing was removed. `verify-bf-button.ts`,
   `verify-bf-chip.ts` and `verify-bf-logo.ts` continue to assert
   `data-state="pending"` in the prerendered HTML, unchanged and still true.

**Every new probe must follow it.** A probe with no `[data-probe-verdict]` root, or with a
verdict but no `[data-probe-row]` rows, fails the harness by name.

## Decision 2 — the headless driver: raw CDP, no new dependency

`bfna-website-nuxt/scripts/check-probes.ts` serves `.output/public` from a `node:http`
server on a free port and drives a headless Chrome over the **Chrome DevTools Protocol**,
using Node's built-in global `WebSocket`. No new package.

Rejected alternatives:

| Option | Why not |
|---|---|
| **Playwright** | Not a dependency. Adding it means a ~130 MB browser download in `postinstall` for one script, in a repo whose lockfile is gitignored and where `npm ci` already cannot run (residual #70). |
| **Puppeteer** | Same cost, same objection. |
| **`jsdom`** (already a dependency) | No layout engine. `getComputedStyle` returns declared values, so every box-metric, track-count and resolved-colour assertion in probes 03 and 14–16 would read `0px` — it would confidently pass a broken component. |
| **The `/browse` skill's runtime** | Machine-local tooling under `~/.claude/`. A committed repo script must not depend on one developer's agent install. |

The executable is resolved in order from `$CHROME_PATH`, the local `ms-playwright` cache
(`chrome-headless-shell`, newest first), Google Chrome, Chromium, then Edge. When none is
found the script exits non-zero **listing every path it tried** — it never degrades to a
pass.

## Usage

```bash
cd bfna-website-nuxt
npx nuxt generate                     # never `npm run generate` — that needs Directus secrets
npx tsx scripts/check-probes.ts       # every probe
npx tsx scripts/check-probes.ts --only 16
npm run check:probes                  # the same thing
```

Flags: `--only <nn|slug>`, `--timeout <ms>` (default 20000), `--port <n>`, `--verbose`.

Exit `0` only when every probe reported `PASS` with zero failing rows. On failure the script
names the probe **and** each failing row with its expected/actual values.

## Consequences

- Issue acceptance can now say "`npx tsx scripts/check-probes.ts` exits 0" and mean it.
- Probe 03 gained a runtime check table it never had — it was a purely visual probe read by
  hand. Its assertions are written **viewport-agnostically**: the `data-min-width` contract
  was specified at 1200/800/400px, but a headless run has one viewport, so the expected
  track count is derived from the measured container width and the resolved floor (the same
  arithmetic `auto-fill` does) rather than pinned, with ±1px of tolerance so a sub-pixel
  container width cannot decide a verdict.
- Probes are enumerated from the pages directory, not from a list in the script, so a probe
  added by a later issue is picked up with no edit here.
- Issue #68 (final cutover) still deletes `src/pages/bf-probe/`; `check-probes.ts` goes with
  it, or stays as the guard for whatever replaces it. Until then, later issues can
  regression-check every earlier probe in one command.

## Related: #115 hardening of the `verify-bf-*.ts` scripts

Folded into the same change, because it is the same complaint at a different altitude — a
check that breaks on a correct component is not a check:

1. **Pinned instance totals** in `verify-bf-chip.ts` §8 and `verify-bf-button.ts` §6 became
   bounds plus *sum-consistency* (every rendered instance classified into exactly one mode —
   an unclassified one means the element resolver fell through, which a total caught only by
   accident) plus set equalities (`aria-pressed="true"` is exactly the set of toggles that
   are `[data-active]`; `[data-external]` appears only on `<a href>`). Adding an instance to
   a probe no longer fails a correct component.
2. **`grep -c ":style=" == 0`** now runs over the comment-stripped source like every other
   check in that file. A deliberate deviation from the spec's literal text, noted at the
   call site: run over the whole file it is a check on the comments, not on the code.
3. **`aria-pressed` in `src/components/bf/Chip.vue`** moved *after* `v-bind="$attrs"`. Unlike
   `type`, which a caller may legitimately want to change, there is no honest reason to set
   `aria-pressed` from outside, and a caller who did would desync it from `[data-active]` —
   the invariant probe 16 asserts.
