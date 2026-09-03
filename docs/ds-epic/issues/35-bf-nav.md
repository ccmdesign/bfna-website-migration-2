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
