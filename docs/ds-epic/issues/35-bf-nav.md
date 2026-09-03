# 35 — `bfNav` — top bar (absorbs menu-link + dropdown, build together)

One-line objective: rebuild the top bar as `bfNav`, absorbing the menu-link
and dropdown as internal children, **fixing** the D8 violation where the
wf-* version reads menus directly instead of taking them as a prop.

## Context

Depends on 02 (`bf-scaffold`), 14 (`bfLogo`), 16 (`bfChip`, if used for the
search entry point — otherwise `bfButton`/plain link; record the choice in
Decisions). Builds from `src/components/wireframe/wfNav.vue`,
`wfNavDropdown.vue`, `wfMenuLink.vue` (all three, per BRIEF §5's named
bundle exception — interdependent, demo together). Consumed by 46 (layout
shell, passes `menus` from `useBfSite()`). Provenance: BF-163; D8.
**Hard anti-pattern being fixed**: `wfNav.vue` calls `const { menus } =
useWfContent()` directly inside the component (as-built §E confirms) — this
is exactly the violation D8/ADR-1 exists to remove. `bfNav` takes `menus` as
a **prop only**.

## Scope

- Files (internal children live under `src/components/bf/nav/`, per
  issue's own file convention — `bf/nav/MenuLink.vue`, `bf/nav/Dropdown.vue`
  — both **not** separately auto-imported as top-level `bf*` components if
  `pathPrefix: false` would collide; register them with an explicit
  sub-path import inside `bfNav` rather than relying on auto-import naming
  if the two conflict — record the exact registration choice in
  Decisions): `src/components/bf/Nav.vue` → `<bfNav>`.
- Props:
  ```ts
  interface Props {
    menus: Menu[]   // from src/types/bf-contracts.ts (issue 02)
  }
  ```
  **Zero** other data sources — no `useWfContent`, no composable, no
  `queryCollection` anywhere in `bfNav` or its two children.
- Renders: `<bfLogo>` linking home, then one entry per `menus` item —
  a plain external/internal link (`m.href`/`m.to`, no `items`) or a
  dropdown (`m.items` present) using the internal `Dropdown` child, which
  itself renders one `MenuLink` per item — same three-tier structure as
  `wfNav`+`wfNavDropdown`+`wfMenuLink`.
- Dropdowns: native `<details>` (per `wfNavDropdown.vue`'s own approach —
  keep it, do not reinvent with `aria-expanded`/JS state), with sibling-
  closing behaviour (only one open at a time — port the `closeSiblings`
  `@toggle` handler verbatim in spirit), **plus** Esc-to-close and focus
  return to the trigger `<summary>` — both are **new** relative to the wf
  source (native `<details>` has no Esc-close by default; add a
  `keydown.esc` handler on the `<details>` that closes it and refocuses
  `summary`).
- Includes the search entry point (a link/button to `/search`, matching
  `wfNav`'s `<NuxtLink to="/wireframes/search">Search</NuxtLink>`, retargeted
  to `/search`). No Subscribe button (already removed per D2/the wf source's
  own comment).

## Out of scope

- The layout wiring and the menus data source (issue 46 — `bfNav` only
  declares the prop, it never sources it).
- An off-canvas mobile drawer beyond a responsive disclosure (no wireframe
  evidence of a full drawer pattern — a simple responsive collapse of the
  existing dropdown mechanism is sufficient; do not build a new mobile nav
  paradigm).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variables `--_bf-nav-height`, `--_bf-nav-bg`, `--_bf-nav-link-color`
  sourced from semantic tokens. `.wf-header`/`.wf-nav__group` equivalents
  become `.bf-nav`/`.bf-nav__group` in `@layer components`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Nav.vue
grep -Lq "useWfContent\|queryCollection" src/components/bf/Nav.vue src/components/bf/nav/*.vue
grep -q "menus: Menu\[\]" src/components/bf/Nav.vue
```
Probe page `src/pages/bf-probe/35-bf-nav.vue` renders `<bfNav :menus=
"fixtureMenus" />` from a hand-written fixture array (no data layer touched):
```bash
grep -q "bf-nav" .output/public/bf-probe/35-bf-nav/index.html
```
Fully keyboard-operable (dropdown open/close/Esc/focus-return) verified as
a manual interactive check. Greps clean for data access (`useWfContent`,
`queryCollection`) across all three files. Fails today (no `bf/Nav.vue`),
passes once done.

## Decisions

_Runner appends here._

### D-35.1 — the two children are registered by explicit relative import, not by auto-import name

`nuxt.config.ts` registers `components/bf` with `pathPrefix: false` and
`prefix: 'bf'`, which flattens the directory away — so `bf/nav/MenuLink.vue`
auto-imports as **`<bfMenuLink>`** and `bf/nav/Dropdown.vue` as
**`<bfDropdown>`**: top-level-looking names in the `bf` namespace for two things
that are internal to one component, and `bfDropdown` in particular is a name a
real future component would want.

The spec anticipated this and asked for the choice to be recorded. It is:
`Nav.vue` imports both by **explicit relative path** (`./nav/MenuLink.vue`,
`./nav/Dropdown.vue`), and `Dropdown.vue` imports `./MenuLink.vue` the same way.
Three properties follow — the dependency is visible in the file, it does not
depend on how the `components` array happens to be configured, and `bfFooter`
(#45) can import `./nav/MenuLink.vue` identically, which is the reason
`MenuLink` is a component at all rather than inlined markup.

**`nuxt.config.ts` was not edited.** The auto-import registration still exists
as a side effect; nothing relies on it, and `issues.md` plans no top-level
`bfMenuLink` or `bfDropdown` that would collide. Suppressing it would mean
either an `ignore` glob in the components config or moving the pair outside
`components/`, and both are a larger blast radius than the latent collision they
would prevent.

### D-35.2 — the responsive collapse is a `@container` query, not `@media`

The frozen skin flows the dropdown panels statically below `768px` via
`@media (max-width: 768px)` (`wireframe.css:227-235`). `nav/Dropdown.vue`
restates the same rule at the same width as `@container bf-nav (max-width: 768px)`,
against a named size container declared on `.bf-nav` in `Nav.vue`.

For a full-bleed header the two are behaviourally identical, so this is not a
change to what ships. Three reasons for the form:

1. What the rule actually depends on is the **nav's own width**. Saying so makes
   the component correct inside a narrow column as well as a narrow window.
2. It is the only form a probe can assert. `check-probes.ts` runs at one fixed
   `1280x1024` viewport (`docs/decisions/probe-harness.md` Decision 2), so a
   `@media` version could be checked only by reading the rule text back out of
   the CSSOM and taking its word for it. Probe 35 instead renders a second real
   `bfNav` inside a 375px container and **measures** `getComputedStyle(panel).position`
   — `absolute` at full width, `static` at 375px.
3. `container-type: inline-size` computes to `contain: layout style inline-size`
   — **not** paint, so nothing is clipped, and the panels' containing block
   remains `.bf-nav__group` (`position: relative`), not the header. `position: sticky`
   on the same element is unaffected. All three are asserted in the probe rather
   than assumed: one row reads back `position|container-type|container-name`, and
   another checks that an open panel's box extends past the header's bottom edge.

This is a **responsive disclosure**, not an off-canvas drawer — the spec's
"Out of scope" is honoured: the same `<details>` mechanism, reflowed.

### D-35.3 — the search entry point is a plain link

The spec offers `bfChip`, `bfButton` or a plain link and asks for the choice to
be recorded. It is a plain `<NuxtLink to="/search">`, matching `wfNav`'s own
`<NuxtLink to="/wireframes/search">Search</NuxtLink>` retargeted to the real
route (BRIEF §7). This is navigation to a page, not an action; a control that
looks like a button and navigates is the more common of the two mistakes. No
Subscribe button (D2).

### D-35.4 — no `:focus-visible` rule in any of the three files

`base/focus.css` (#146) declares the bare `:focus-visible` in `@layer defaults`,
which reaches links and `<summary>` alike and is outranked by anything in
`@layer components`. That file exists precisely so the six atoms that each
shipped a private copy of those three declarations stop doing it, so `bfNav`
adds none. Probe 35 asserts **both** halves: the `@layer defaults` rule is
present in the live CSSOM, and no `.bf-nav*` selector anywhere carries
`:focus-visible`.

### D-35.5 — the acceptance grep's literal reading, and what it forced

The spec's acceptance is
`grep -Lq "useWfContent\|queryCollection" src/components/bf/Nav.vue src/components/bf/nav/*.vue`.
Read literally — which is how it runs — a docblock that *quotes the anti-pattern
it refuses* fails it on a file whose code is perfectly correct. `Nav.vue`'s
comment originally did exactly that, and the first run of the grep listed only
two of the three files.

The two names are therefore not written anywhere in any of the three sources,
nor in the probe. The prohibition is described instead ("the wireframe's content
composable", "no collection query"). Same call `bfLogo` recorded for colour
literals under gh#23, for the same reason.

### D-35.6 — probe substitutions and two probe bugs worth naming

The vitest harness on `dev` is broken and pre-existing (residual #86), so the
spec's "fully keyboard-operable … verified as a manual interactive check" is
substituted by `src/pages/bf-probe/35-bf-nav.vue` under
`npx tsx scripts/check-probes.ts --only 35`, which presses **trusted** CDP keys
(`data-probe-keys="Escape,Enter,Space"`). 50 rows, and the full suite is
27 probes / 1251 rows / 0 failures.

Two probe defects were found and fixed during the run. Both would have reported
a failure on a correct component, and both are general enough that the next
probe to drive a `<details>` will meet them:

1. **`toggle` is fired from a queued task, not synchronously.** Clicking summary
   1 then summary 2 and reading immediately sees *both* open, because
   `closeSiblings` has not run yet. Every step of the experiment is now
   separated by one task boundary. The sibling-closing contract is unchanged
   from the wireframe; only the way it was being read was wrong.
2. **A bubbling `keydown` listener on `document` runs *after* the component's.**
   By the time it read `document.activeElement`, the Esc handler had already
   closed the menu and moved focus to the `<summary>` — so the "Esc was pressed
   from inside the panel" row could never be true. It is now registered with
   `{ capture: true }`, which runs on the way down.

### D-35.7 — the dropdown marker's alternative text

`nav/Dropdown.vue` keeps the frozen skin's `" ▾"` affordance rather than
redesigning it, at the skin's own `0.7em` — the same `em`-not-a-Utopia-step call
`components/external-link.css` recorded for `" ↗"`, for the same reason (the
scale's steps are steps of the *page's* scale, and no token means "slightly
smaller than whatever this sits in").

It is written `content: "▾" / ""` — the standardised alternative-text syntax —
so the glyph is decoration and the `<summary>`'s accessible name is the label
alone. Generated content is concatenated into the accessible name computation
otherwise, which is the `bfBreadcrumb` separator lesson (gh#37) at a different
pseudo-element. The probe asserts both halves in one row: the marker renders
(`::after` content contains the glyph) **and** `summary.textContent` is exactly
`Programs`.
