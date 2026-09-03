# 46 — layout-bf-shell — Site shell layout

One-line objective: build `src/layouts/bf-default.vue`, the single layout every
`/` route mounts, wrapping `bfSkipLink` + `bfNav` + `bfFooter` + a conditional
`bfNotice` announcement band around `<main id="main">`.

## Context

Depends on #35 (`bfNav`), #36 (`bfFooter`), #19 (`bfSkipLink`), #41
(`bfNotice`), #13 (`useBfSite` — announcement + menus). Every template issue
(#47–#56) depends on this one. Descends from `src/layouts/wireframe.vue`
(top-bar → hero slot → `<main class="stack" data-gap="xl">` → default slot →
footer) — same skeleton, `bf-*` components, real routes instead of
`/wireframes/*`. Provenance: BF-194; v2 §2 Level 4 "Site shell layout".

## Scope

- New file `src/layouts/bf-default.vue` only.
- Structure, in DOM order (skip link must be the first focusable element —
  matches `layouts/wireframe.vue`'s `<a href="#wf-main" class="wf-skip-link">`
  placement before `<wf-nav />`):
  1. `<bf-skip-link target="#main" />`
  2. `<bf-nav :menus="menus" />`
  3. conditional announcement band: `<bf-notice v-if="announcement" variant="…">` wrapping `announcement.message` linked to `announcement.url` — sourced from `useBfSite().announcement` (single doc, gated on `status === 'published'` inside the composable per BRIEF §6/D3, not re-checked here)
  4. `<main id="main" class="stack" data-gap="xl"><slot /></main>`
  5. `<bf-footer :menus="menus" />`
- Data: `const { menus, announcement } = useBfSite()` — **this layout is the
  only data reader in the view tree (D8)**. `menus` is
  `src/assets/bf-data/menus.json` (typed, from #08/#13), passed as the
  `menus` prop to both `bfNav` and `bfFooter` — neither component calls a
  composable itself.
- `useHead` for `htmlAttrs.lang`, base `<title>` template, no `noindex`
  (wireframe layout sets `noindex`; production layout must not).
- No hero slot — templates (#47–#56) each own their full section list,
  including any `wf-page-header`/`wf-hero`-equivalent as their first section;
  the shell provides no named slot for it (simpler contract than
  `layouts/wireframe.vue`'s `#hero` slot, since every `bf-*` page composes its
  own header component inline).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — any
  such edit fails the epic (DoD-4).
- Any page content — pages fill `<slot />`, this issue ships no page.
- The subscribe band — removed per D2, never re-added here.
- Route registration for any `/` page (#47–#56's job).
- `src/layouts/wireframe.vue` is not touched or shared.

## Styling

- Tokens: existing Utopia space scale (`--space-xl` for the `<main>` stack
  gap, matching `layouts/wireframe.vue`). No new colour.
- Composition primitives: `.stack` on `<main>`, `data-gap="xl"`.
- This layout owns no component-level CSS variables (`--_bf-*`) itself — it
  only arranges `bf-*` components, each of which owns its own tokens.
- `@layer` order unaffected — no new layer content here.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate` (runs contentImporter.js — needs Directus secrets not in this checkout)
```

Issue-specific:
```bash
# A probe page at src/pages/bf-probe/46-layout-bf-shell.vue (using `layout: 'bf-default'`)
# renders nav, footer, and a skip link targeting #main; delete the probe once
# the first real template (#47) exists and covers this route.
grep -n "queryCollection\|useBf" bfna-website-nuxt/src/components/bf/**/*.vue   # must return nothing — no bf-* component reads data (D8)
grep -rn "wireframe" bfna-website-nuxt/src/layouts/bf-default.vue              # must return nothing — confirms no accidental wf-* import
```

## Decisions

_Runner appends here._
