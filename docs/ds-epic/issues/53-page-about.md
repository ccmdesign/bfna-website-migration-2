# 53 — page-about — About `/about`

One-line objective: build `src/pages/about.vue` on `bf-default`, deleting
the legacy `pages/about.vue`, with mission/board/team/Stiftung/contact
sections using data-driven grids instead of the wireframe's pinned columns.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #24 (`bfCardPerson`),
#44 (`bfContactSection`), #39 (`bfSection`), #04
(`.grid[data-min-width]`). Descends from
`src/pages/wireframes/about.vue`. Provenance: BF-208. Retires exactly one
file: `src/pages/about.vue` (legacy, `02-legacy-retirement-inventory.md` §A
row `/about` — today a hardcoded in-component `aboutData` object, no
Directus call) — no other legacy file. `pages/team.vue` (the standalone
legacy `/team` route) is **not** deleted here; it is redirected to
`/about#team` by #57 and deleted by #58.

## Scope

- `src/pages/about.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order, from `pages/wireframes/about.vue`:
  1. `<bf-page-header label="Mission" :crumbs="[{label:'Home',to:'/'}]" :heading="about?.heading ?? 'About Us'" :tagline="paragraphs(about?.description)" />`.
  2. `<bf-section id="board" label="Board of Directors" heading="Board of Directors">` wrapping `<ul class="grid" data-min-width="16rem" data-gap="m"><bf-card-person v-for="p in boardMembers()" :person="p" /></ul>` — **replaces the wireframe's inline `style="grid-template-columns: repeat(3, 1fr)"` (`about.vue:13`) with `.grid[data-min-width]` (D9)**, not a 3-up pin.
  3. `<bf-section id="team" label="Team" heading="Team">` — same grid pattern, `teamMembers()`, replacing `about.vue:19`'s pinned 3-col grid.
  4. Bertelsmann Stiftung — `<bf-section label="Bertelsmann Stiftung" layout="switcher" gap="l">` wrapping `<bf-media>`/`<img>` + a `.stack` text block from `stiftungPage()`.
  5. `<bf-contact-section id="contact" />`.
- `#team` and `#board` are real anchor ids on the two `bf-section`
  elements, matching the wireframe exactly — this is what makes
  `/about#team`/`/about#board` work as #57's `/team` redirect target.
- Composable → prop map: `useBfPages().aboutPage` → page-header
  heading/tagline; `useBfPages().stiftungPage` → Stiftung heading/body;
  `useBfPeople().boardMembers`/`.teamMembers` → the two `bfCardPerson`
  grids.
- Consumes collections: `bfPeople`, `bfPages` (`aboutPage`, `stiftungPage`).

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- A standalone `/team` route (redirected, not rebuilt, per #57).
- Person detail pages (no such route exists in the epic's §7 route list).
- Any legacy file other than `src/pages/about.vue`.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: `.grid[data-min-width]` on both person grids (D9 — **not**
  the wireframe's pinned three columns); `.switcher` on the Stiftung
  section, matching wireframe.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
test -f bfna-website-nuxt/.output/public/about/index.html
grep -q 'id="board"' bfna-website-nuxt/.output/public/about/index.html && grep -q 'id="team"' bfna-website-nuxt/.output/public/about/index.html   # both anchors resolve
grep -c "bf-card-person\|bfCardPerson" bfna-website-nuxt/.output/public/about/index.html   # 13 people render across the two grids (board + team)
! grep -q "grid-template-columns" bfna-website-nuxt/src/pages/about.vue    # no pinned columns (D9)
test ! -f bfna-website-nuxt/src/pages/about.vue.legacy                    # legacy about content is gone
diff <(git show HEAD~1:bfna-website-nuxt/src/pages/wireframes/about.vue) bfna-website-nuxt/src/pages/wireframes/about.vue   # empty — wf source untouched (DoD-4)
```

## Decisions

_Runner appends here._
