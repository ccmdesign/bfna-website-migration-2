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

Flags: `--only <nn|slug>`, `--timeout <ms>` (default 20000), `--port <n>`, `--viewport <WxH>`
(default `1280x1024`), `--verbose`.

**The viewport is an input to the verdict, not a cosmetic detail.** Probe 16 compares the
rendered height of all five chip modes and probe 03 derives an expected grid track count from
the container width, so the harness sets the layout viewport explicitly through
`Emulation.setDeviceMetricsOverride` rather than inheriting whatever window the browser
happened to open with, and reports a zero-width viewport as its own failure instead of letting
it read as a broken component. (Found while cross-checking the probes in an embedded browser
pane whose viewport measured 0px: probe 16 reported FAIL on a build the harness passed.)

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

---

## Decision 3 — every probe runs under `layouts/bf-probe.vue` (gh#116)

**Added by** [gh#116](https://github.com/ccmdesign/bfna-website-migration-2/issues/116)
(promoted residual [#113](https://github.com/ccmdesign/bfna-website-migration-2/issues/113),
with [#103](https://github.com/ccmdesign/bfna-website-migration-2/issues/103),
[#107](https://github.com/ccmdesign/bfna-website-migration-2/issues/107) and
[#108](https://github.com/ccmdesign/bfna-website-migration-2/issues/108) folded in).

**Every probe page declares `definePageMeta({ layout: 'bf-probe' })`, and declares no
stylesheet, `lang` or `robots` head entry of its own.** `layout: false` is no longer used
for a probe.

### Why

A probe measures `bf-*` atoms, and a measurement is only worth reading if the CSS on the
page is exactly the CSS the design system declares. Under `layout: false` each of the eight
probes repeated its own `<link rel="stylesheet" href="/css/styles.css">`, its own
`htmlAttrs.lang`, its own `robots: noindex` and its own `:global(html)` ground — eight
copies of a rule with no single place to state it, enforced only by the next probe author
remembering it. Two of them additionally pulled in `/css/wireframe.css`.

`layouts/bf-probe.vue` is now the **sole stylesheet injector** for `/bf-probe/*`. That
property was verified, not assumed: `src/nuxt.config.ts`'s `css: []` array is empty (every
entry commented out, `styles.css` and the three `css-legacy/*` files alike), there is no
`src/app.vue`, and `layouts/legacy-base.vue` — which pulls `/global.css`, `/fixes.css` and
`/v2updates.css` — reaches only the routes that name it. The one exception is
`app.head.link` in `nuxt.config`, which puts the cross-origin Material Symbols icon-font
stylesheet on **every** route in the app; probe 16 asserts it by name rather than waving it
past.

### What the layout does

| | |
|---|---|
| **Order statement** | Emitted inline as `<style>@layer reset, defaults, tokens, themes, composition, components, utils, overrides;</style>` with `tagPriority: 'critical'`, **then** `/css/styles.css` is linked — whose own first line is the same statement. Restating it is idempotent. The inline copy closes #108's latent case: under `nuxt dev`, Vite injects each SFC's `<style>` into the head independently of the `<link>`, so a component's own `@layer components { … }` could be the first layer the browser sees, silently making `components` the **weakest** layer while every membership assertion stayed green. |
| **The stack** | `/css/styles.css` is linked rather than its `@import` list re-typed in the layout. A duplicated list drifts the first time that file gains a stylesheet, and drift is the failure mode this decision exists to prevent. |
| **Ground** | `:global(html) { color-scheme: light; color: var(--color-text); background-color: var(--color-surface-page) }`. `--color-surface-page` is new in `tokens/semantic-colors.css` (#107) — an alias of the `--color-white` primitive already in that file's `var()` graph, no new colour value — and it exists because the semantic layer named the *inverted* ground (`--color-surface-inverse`, gh#101) but never the normal one, so probes reached for the primitive, which BRIEF §5 rule 2 forbids. |
| **Template** | A bare `<slot />` with **no wrapper element**. Every probe roots itself in `<main class="probe">`, which is what the harness reads (`[data-probe-verdict]`); a second `<main>` from the layout would be invalid HTML and an a11y regression. |

### The defect this closed

`src/public/css/base/typography.css` closed its `@layer defaults { … }` block thirty lines
early, leaving `p, li, input, button, a { font-weight: 100 }` and five other rules
**unlayered**. Unlayered author rules outrank every cascade layer, so
`.bf-chip { font: inherit }` in `@layer components` won on the `<span>` branch (which that
selector does not match) and lost on `<a>` and `<button>`: 400 against 100, measured on
`/bf-probe/16-bf-chip`, with `bfButton` and every remaining atom identically exposed. Only
the closing brace moved — no declaration, selector or order changed — so the relative
cascade among those rules is what it was; what changed is that the declared layer order now
governs them. A scan of every file `styles.css` composes found no other unlayered region.

`wireframe.css`'s two deliberately-unlayered rules still outrank them, which is exactly what
their own comments say they rely on — verified in the browser on `/wireframes`:
`ul.grid > li` still computes `margin-bottom: 0`, and `p`, `li` and `a` still compute
`font-weight: 100`.

**One wireframe pixel did move, deliberately.** `.wireframe .wf-button { font: inherit }`
lives in `@layer overrides`, so it used to *lose* to the unlayered `button { font-weight: 100 }`
and now wins: the single `.wf-button` on the wireframes (the hero's "Explore our work")
renders at the inherited weight instead of hairline — which is what the skin declares and
was being silently overridden. Checked visually; the page is otherwise unchanged. Wireframe
**source** byte-identity, which is the epic's rule, is untouched.

### Consequence for probes that measure the wireframe

`/css/wireframe.css` is the Front-2 skin, not part of the CUBE stack, and it does not stay
inside `.wireframe`: `html:has(.wireframe), body:has(.wireframe) { background; color-scheme }`
reaches the page ground the layout sets. Probes 15 and 16 therefore render their frozen
measurement reference in an isolated same-origin `srcdoc` **iframe** that loads the stack
plus the skin, and read its computed style through the frame's own `defaultView`. `srcdoc`
is written in the template, not assigned at runtime, so `probe-15-wf-button` /
`probe-16-wf-chip` still appear in the prerendered HTML that `verify-bf-button.ts` and
`verify-bf-chip.ts` grep. The frozen file is unchanged and still read at full fidelity — in
a document of its own.

### For the real shell layout (#55)

It must reproduce all three properties — order statement first, CUBE stack only, no
unlayered author CSS — and #108 asks it to assert layer **order**, not just membership.
Probe 16 now carries those three rows (`§ 12`) as the working reference.
