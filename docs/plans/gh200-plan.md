# gh#200 — 46b Shell: hydration mismatch + console-error gate — implementation plan

Spec: the issue body of [#200](https://github.com/ccmdesign/bfna-website-migration-2/issues/200) ·
Evidence: [#199](https://github.com/ccmdesign/bfna-website-migration-2/issues/199) ·
Branch: `feature/gh200-46b-shell-hydration-mismatch` ·
Epic: <https://app.plane.so/ccm-design/browse/BF-217/>

## 1. Diagnosis (done before any edit — this is the load-bearing half of the issue)

The issue asks for a root-cause fix in the shell. **There is no root cause left.**
Three independent readings, all recorded verbatim in the issue journal:

| Reading | Method | Result |
|---|---|---|
| Dev build, detailed Vue warnings | `npx nuxt dev`, headless Chrome, CDP console channel, `/archive` `/insights` `/about` | no hydration warning of any kind, no component path named |
| Generated output | `npx nuxt generate` (exit 0) served from `.output/public`; raw-CDP reader over `Runtime.consoleAPICalled` + `Log.entryAdded` + `Runtime.exceptionThrown` | zero console output on `/`, `/insights`, `/about`, `/archive`, `/projects`, `/search`, `/insights/:slug`, `/projects/:slug`, `/democracy`; `#__nuxt.__vue_app__` present on each, so these are real hydrations |
| Same, at 390×844 | as above | also clean |

**Control experiment**, because "no output" from a reader nobody has tested is
worth nothing: patching one *dynamic* text node in the prerendered `/about`
(`© 2026` → `© 2027`, `bfFooter`'s `{{ year }}`) and re-running the same reader
produced exactly `Hydration completed but contains mismatches.` — #199's string.
Restored immediately.

A first control patched a *static-hoisted* text node (`Site by` in the footer's
legal block) and produced **nothing**: Vue hydrates a `createStaticVNode`
subtree by advancing the node pointer without comparing its content. That is a
real limit of any console-based hydration gate and is stated in the docs the
gate ships with, rather than left as a surprise for whoever trusts it next.

**Why #199 saw it.** Its own PR (#198) names and fixes the cause in `cccd30e`:
`/archive` wrapped `bfCardRow` — which renders its own `<li>` — in a second
`<li>`, so the parser repaired `<li><li>` into siblings while the client render
kept them nested, *"a hydration mismatch on all 256 rows"*. That fix is on
`dev`. Vue emits `Hydration completed but contains mismatches.` **once per
document**, and the browser-pane console reader used for that pass
**accumulates messages across in-session navigations** (reproduced in this
session). One real error on `/archive` therefore reads as site-wide once
`/insights` and `/about` are opened in the same tab.

**Consequence.** No shell component is edited, and no `<ClientOnly>` is added —
there is nothing client-only to wrap. The whole deliverable is the gate, which
is the part of #200 that has durable value: it turns this class of bug from
"something a human notices" into a build failure.

## 2. Approach — the gate

`scripts/check-probes.ts` already drives real Chrome over `.output/public` and
already listens on `Runtime.exceptionThrown`. Two additions:

1. **Console-error capture.** `Log.enable` alongside the existing
   `Runtime.enable`, and a `consoleErrors: string[]` on the `Cdp` client fed by
   `Runtime.consoleAPICalled` (`type === 'error' | 'assert'`) and
   `Log.entryAdded` (`entry.level === 'error'`). Cleared per page, exactly as
   `exceptions` already is. Any entry fails the page.

   Both channels are needed and neither duplicates the other: Chrome routes
   `console.error()` to `Runtime.consoleAPICalled` and browser-generated
   failures (a 404 on a chunk, a blocked subresource) to `Log.entryAdded`.
   Vue's hydration message is a `console.error`, so it arrives on the first;
   a missing `/_nuxt/*.js` arrives only on the second.

2. **A smoke set of real routes.** Not probe pages — the eight routes the
   issue's acceptance names, visited after the probes with no verdict
   convention to satisfy: load, wait for hydration, require an empty console.

   The two detail routes are **derived from `.output/public`**, not hard-coded:
   the first alphabetical directory under `insights/` and `projects/` that
   holds an `index.html`. A hard-coded slug is a slug that rots the first time
   content moves, and the harness's own docstring already refuses hard-coded
   lists for the probe set for the same reason.

   "Hydrated" is `document.readyState === 'complete'` **and**
   `!!document.getElementById('__nuxt').__vue_app__`. Without the second test a
   page whose bundle 404s would sit there as static HTML and pass a
   console-only check by having nothing to say.

### Flags

| Flag | Meaning |
|---|---|
| `--only <nn\|slug>` | unchanged; a probe-only run skips the smoke set, so the epic's per-issue `--only <nn>` acceptance keeps its current cost |
| `--only smoke` | the smoke set alone |
| `--ignore-console <regex>` | drop matching console text before judging |

`--ignore-console` exists because the shell links one third-party stylesheet
(`fonts.googleapis.com`) and a strict gate with no escape hatch turns a network
hiccup on someone's laptop into a merge blocker. It defaults to nothing, so the
committed behaviour is strict; it is documented in `BRIEF.md` next to the gate
so reaching for it is a visible act.

## 3. Files

| File | Change |
|---|---|
| `bfna-website-nuxt/scripts/check-probes.ts` | console-error capture + smoke route set + two flags |
| `docs/ds-epic/BRIEF.md` | §Probe pages gains the gate's description |
| `docs/plans/gh200-plan.md` | this plan, Decisions at the bottom |

No `src/` file changes. No new component, no new type, no new probe page, no
new colour — DoD-6 is untouched by construction.

`BRIEF.md` is normally frozen to item-runners (epic ground rule 8). Issue #200's
body instructs this edit explicitly and by section name; the edit is confined to
the §Probe pages section and adds no rule. Recorded in Decisions.

## 4. Test strategy

The epic's vitest harness is broken and out of scope (residual #86), so the
gate verifies itself the way the rest of this epic does — by running:

1. `npx nuxt generate` → exit 0 (already run for the diagnosis; re-run after the
   edit is not needed since no `src/` file changes, but is run anyway as the
   epic's DoD-1).
2. `npx tsx scripts/check-probes.ts --only smoke` → PASS, 8 routes.
3. `npx tsx scripts/check-probes.ts` → full run PASS, every probe **and** the
   smoke set, with the console gate live. This is the acceptance.
4. **Negative test — the gate must be able to fail.** Re-inject the `© 2026` →
   `© 2027` patch into the prerendered `/about`, run `--only smoke`, and require
   a non-zero exit naming `Hydration completed but contains mismatches.`; then
   restore and require green again. A gate that has never been observed failing
   is a gate nobody should trust.
5. Typecheck gate (residual #71): baseline on this worktree = **176**
   `error TS` lines; after must be ≤ 176 and zero in
   `src/(components/bf|types|composables/bf)|content\.config`.
6. Wireframe byte-identity vs `f757a64` — must print nothing. Nothing here goes
   near `src/`, so this is a formality.

## 5. Risks

| Risk | Mitigation |
|---|---|
| An existing probe page already logs a console error, so the full run turns red on landing | Run the full harness before opening the PR; if a probe is genuinely noisy, that is a real finding — fix it if mechanical, else a residual issue |
| The gate is blind to static-hoisted subtrees (proven above) | Stated in `BRIEF.md`; it still catches every mismatch that reaches a dynamic node, which is every mismatch #199 was about |
| Third-party stylesheet failure makes the gate flaky offline | `--ignore-console`, documented |
| Smoke routes slow the harness | Eight extra page loads at ~1–2s each; the probe set already loads 46 |

---

## Decisions

*(appended during implementation — see below)*
