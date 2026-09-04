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

**D-200.1 — No shell component is edited, and no `<ClientOnly>` is added.**
The issue's first ask is a root-cause fix in `bf-default` / `bfNav` / `bfFooter`
/ `bfNotice`. The diagnosis in §1 shows there is no cause left to fix on `dev`
tip: three independent readings (dev build with detailed Vue warnings, generated
output, generated output at 390×840) are clean across nine routes, and a
control injection proves the reader is not silently blind. #199's own PR names
and fixes the real defect in `cccd30e`. Editing a shell component to "fix" a
mismatch that does not occur would be a change with no test that can fail
without it. The issue's second ask — the gate — is the whole of the change, and
it is the half with durable value.

**D-200.2 — The gate reads two CDP channels, not one.**
`Runtime.consoleAPICalled` carries what the page says, which is where Vue's
`Hydration completed but contains mismatches.` lands. `Log.entryAdded` carries
what the browser says, which is where a 404 on a `/_nuxt/*.js` chunk lands — the
page never hears about that one. A gate on either channel alone reports a class
of broken build as perfectly quiet. Verified: the harness's own run shows the
Vue message on the first channel (negative test) and a 404 on the second (an
early diagnostic run hit `/insights/100-questions`, a projects slug, and the
gate reported `Failed to load resource: the server responded with a status of
404`).

**D-200.3 — Smoke routes are real routes, and their slugs are derived.**
A probe page composes `bf-probe`, not `bf-default`; 46 green probes said
nothing about #199 and never could. The eight routes are the ones the issue's
acceptance names. The two detail slugs are read from `.output/public` (first
alphabetical child holding an `index.html`), for the reason the harness's
docstring already refuses a hard-coded probe list: a pinned slug rots the first
time content moves, and it rots as a 404 that this gate would then report as a
console error on a build that is fine.

**D-200.4 — A smoke route must prove it hydrated, not merely load.**
`document.readyState === 'complete'` **and**
`document.getElementById('__nuxt').__vue_app__`. A prerendered page whose entry
chunk 404s stays as static HTML, looks perfect, and passes a console-only check
by having nothing to say. That is the exact shape of a false green this epic
cannot afford at cutover.

**D-200.5 — `SMOKE_SETTLE_MS = 1500`, and probes get no equivalent.**
Vue logs the mismatch from `logMismatchError()` when the mismatching node is
hydrated. This app's root is an async `<Suspense>` (the `bf-default` layout
`await`s `useBfSite()`), so `hydrate()` returns and `__vue_app__` is assigned
*before* the layout's subtree hydrates — breaking out of the poll the instant
`__vue_app__` appears would stop listening one tick before the message. Probes
need no settle: their verdict is painted in `onMounted`, which runs after their
subtree has hydrated, so a probe that has reported a verdict has already said
whatever it was going to say. The value is deliberately generous — too small is
a silent false green, too large costs seconds.

**D-200.6 — `--ignore-console` exists, defaults to nothing.**
The shell links one third-party stylesheet (`fonts.googleapis.com`). A gate
with no way to say "not that one" turns a network hiccup on someone's laptop
into a merge blocker, and the predictable response to that is deleting the
gate. The flag is empty by default, so the committed behaviour is strict, and
using it is a visible act on a command line rather than a quiet default.
Compiled without the `g` flag on purpose: a `/g/` regex carries `lastIndex`
between calls and would match every *other* line.

**D-200.7 — The gate cannot see compiler-hoisted static subtrees.**
Established by control, not by reading source: patching a static text node
(`Site by` in `bfFooter`'s legal block) in a prerendered page produced silence,
while patching the adjacent dynamic one (`{{ year }}`) produced the message.
Vue hydrates a `createStaticVNode` by advancing the node pointer without
comparing content. Recorded in the harness docstring and in `BRIEF.md` so the
next person to trust this gate knows its edge. It still catches every mismatch
that reaches a dynamic node, which is every mismatch #199 was about.

**D-200.8 — `BRIEF.md` is edited, once, in the section the issue names.**
Epic ground rule 8 freezes `BRIEF.md` to item-runners. Issue #200's body
instructs this edit explicitly and by section (*"Document the new gate in
`docs/ds-epic/BRIEF.md` §Probe pages"*), and it is the only place the gate can
be documented where the next item-runner will read it — every runner reads
`BRIEF.md` once by contract. The edit is confined to §Probe pages, adds no rule
and changes no DoD. `issues.md` is untouched.

**D-200.9 — Vitest substitution (residual #86).**
No vitest test is added. The equivalent-strength check is the harness itself,
run in both directions: `npx tsx scripts/check-probes.ts` PASS (46 pages, 1659
rows, 0 failures) **and** a negative run in which the `© 2026` → `© 2027` patch
is re-injected into the prerendered `/about`, producing exit 1 with
`console error — Hydration completed but contains mismatches.` on `smoke /about`
and green everywhere else. Both transcripts are in the issue journal.

**D-200.10 — The harness outlives `src/pages/bf-probe/` (review P2-1).**
Issue #68 deletes that directory at cutover, and `check-probes` used to
`process.exit(1)` the moment it was gone. #200 is sequenced *before* the
cutover issues so the shell has a console gate while they land; a gate that
stops existing at the commit that most needs it is not a gate. The empty-dir
guard now fires only when nothing else would run (`--only <nn>` with no probes),
and the probe list degrades to `[]`. Verified by moving the directory aside:
`check-probes — 0 probes + 8 smoke routes` … `PASS — 8 pages, 16 rows`, exit 0,
while `--only 46` still reports `No probe pages … Nothing to check.`

**D-200.11 — Console events are attributed to a session (review P3-1).**
The CDP client tracks the page it is reading (`watching`) and ignores events
from any other session, cleared *after* `Target.closeTarget` so a dying target's
last flush still counts against the page that produced it. Currently
unreachable — pages are sequential and both buffers are cleared per page — but
a gate whose entire value is quoting the right page's console should not have
the other shape. The negative test was re-run after this change and still
fails correctly.

## Verification evidence

| Gate | Command | Result |
|---|---|---|
| Console gate, smoke alone | `npx tsx scripts/check-probes.ts --only smoke` | PASS — 8 pages, 16 rows, 0 failures |
| Console gate, negative | same, with `© 2027` injected into `.output/public/about/index.html` | **exit 1**, `smoke /about` FAIL, `console error — Hydration completed but contains mismatches.` |
| `--ignore-console` | same injection, `--ignore-console "Hydration completed"` | exit 0 — the escape hatch works and is narrow |
| Probe-only `--only` still skips smoke | `npx tsx scripts/check-probes.ts --only 46` | `check-probes — 1 probe`, PASS — 1 page, 28 rows |
| Full harness | `npx tsx scripts/check-probes.ts` | **exit 0** — PASS, 46 pages, 1659 rows, 0 failures (38 probes + 8 smoke) |
| DoD-1 | `npx nuxt generate` | exit 0 |
| Typecheck gate (residual #71) | `npx nuxt typecheck` | 176 `error TS` = baseline 176; 0 scoped; 0 in `check-probes.ts` |
| DoD-4 wireframe byte-identity | `git diff --stat f757a64 HEAD -- <wf paths>` | empty |
