# BF-142 — Nav: add Podcasts + Documentaries tabs

## Decision (Aug 4)
Podcasts and Documentaries get their own top-level nav buttons. Revision (Claudio):
**NO landing pages — both are external links** with a `↗` affordance. Plain buttons,
no dropdowns for these two (pruned-nav principle).

## Findings (existing conventions)
- `MENUS` lives in `bfna-website-nuxt/src/composables/useWfContent.ts`. Shape today is
  `{ label, items: WfMenuItem[] }[]`; rendered by both `wfNav.vue` (dropdowns) and
  `wfFooter.vue` (columns). Only these two components call `menus()`.
- External-link affordance ALREADY exists: `wireframe.css` renders `↗` via
  `.wireframe a[data-external]::after { content: " ↗"; }`. `wfMenuLink.vue` already emits
  `<a data-external>` for items without a `to`. Reuse this — no new affordance invented.
- No single confirmed "podcast platform" URL exists in the dataset. Individual show URLs
  do exist (Wisdom of the Crowd → simplecast; How to Fix Democracy → Apple/Spotify/site),
  but there is no aggregated BFNA-podcasts platform/landing URL. Per task guidance, use an
  obvious placeholder `#podcast-platform-url` and flag for Irene. `bfnadocs.org` for
  Documentaries IS confirmed.
- "Bridging the Atlantic" / "Wisdom of the Crowd" are project rows but are NOT in any
  flagship list (`NAV_SLUGS`, `FEATURED_SLUGS`) — nothing to remove there.
- `bfna-documentaries` IS currently in `NAV_SLUGS` (Projects dropdown). Since Documentaries
  becomes its own external nav button with NO landing page, keeping the on-site project link
  is contradictory → remove `bfna-documentaries` from `NAV_SLUGS`. (Sensible default,
  recorded in Plane.)

## Changes
1. `useWfContent.ts`
   - Add a `WfMenu` type allowing a top-level link entry: `{ label, items?, href?, external? }`.
   - Retype `MENUS` to `WfMenu[]`.
   - Append two plain-link entries after the dropdowns:
     - `{ label: 'Podcasts', href: '#podcast-platform-url', external: true }`
     - `{ label: 'Documentaries', href: 'https://bfnadocs.org', external: true }`
   - Remove `bfna-documentaries` from `NAV_SLUGS`.
2. `wfNav.vue` — render a plain `<a data-external>` for menu entries that have `href` and no
   `items`; keep `wf-nav-dropdown` for the rest.
3. `wfFooter.vue` — for `href`-only menus render the column header as an external link and
   skip the (absent) items list; guard the items `<ul>` with `v-if`.

## Non-goals / not touched
- Do not run `npm run generate`/`build` (overwrites local data).
- Do not touch `transponder-magazine` (separate BF-149 concern).
- Placeholder podcast URL must stay obviously placeholder — do NOT fabricate a real URL.

## Verify
- Re-read the diff: external items carry `data-external` (→ `↗`), no dropdown for the two,
  footer still renders coherently, no fabricated real podcast URL.
