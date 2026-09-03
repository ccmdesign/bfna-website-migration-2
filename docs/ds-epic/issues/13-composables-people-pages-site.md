# 13 — composables-people-pages-site

Port the people, page, and site-chrome (announcement + menus) surface of
`useWfContent` to `useBfPeople`, `useBfPages`, `useBfSite`. Review
checkpoint 1.

## Context

Depends on 11 (established composable pattern). Blocks every organism/
template issue reading these surfaces: 35 (`bfNav`), 36 (`bfFooter`), 44
(`bfContactSection`), 46 (site-shell layout), 53 (About). Builds from
`useWfContent.ts` (people/page/announcement/menus members, lines 255-267)
and `src/assets/bf-data/menus.json` (issue 08's output). Provenance: 01 §E.
This issue **is review checkpoint 1** (BRIEF §8) — after it merges, Claudio
reviews that schemas match the canonical shape, counts are right, and no
synthesis is left in components.

## Scope

- New `bfna-website-nuxt/src/composables/data/useBfPeople.ts` — wraps
  `queryCollection('bfPeople')`. Members: `people()` (all 13),
  `boardMembers()` (filter `board === true` — the normaliser's materialised
  flag from issue 08, replacing the runtime `p.board ||
  /board/i.test(job_title)` check), `teamMembers()` (filter `board !==
  true`, sorted alphabetically by last name — `name.split(' ').at(-1)`,
  same as `useWfContent.ts:262`).
- New `bfna-website-nuxt/src/composables/data/useBfPages.ts` — wraps
  `queryCollection('bfPages')`. Members: `pageBySlug(slug)`,
  `aboutPage()` (slug `'about'`), `stiftungPage()` (slug `'stiftung'`),
  `homePage()` (slug `'home'`).
- New `bfna-website-nuxt/src/composables/data/useBfSite.ts` — the one
  composable that is **not** a pure `queryCollection` wrapper:
  - `announcement()` — wraps `queryCollection('bfAnnouncements')`, returns
    the single document only when `status === 'published'`, else
    `undefined` (same gate as `useWfContent.ts:267`).
  - `menus()` — reads the typed module from
    `src/assets/bf-data/menus.json` (issue 08) directly (a static import,
    not `queryCollection` — menus are a JSON module per BRIEF §6, not a
    7th collection).
  - **This is the composable the layout calls, not any `bf-*` component**
    (D8) — `bfNav`/`bfFooter` receive `menus` as a prop from the layout
    (wired in issue 46), never call `useBfSite` themselves.

## Out of scope

- `insights`, `projects`, `programs` — done in 11-12.
- Any `bf-*` component calling `useBfSite`, `useBfPeople`, or `useBfPages`
  directly — D8 forbids it; only `layouts/wireframe.vue`'s `bf-*` successor
  (issue 46) and page-level components call these.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — composable/data issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/composables/data/useBfPeople.ts
test -f src/composables/data/useBfPages.ts
test -f src/composables/data/useBfSite.ts
grep -c "queryCollection('bfPeople')" src/composables/data/useBfPeople.ts     # after: >=1
grep -c "queryCollection('bfPages')" src/composables/data/useBfPages.ts       # after: >=1
grep -c "menus.json" src/composables/data/useBfSite.ts                       # after: >=1
grep -rln "useBfSite\|useBfPeople\|useBfPages" src/components/bf/ 2>/dev/null && echo FAIL || echo PASS
```
Plus a probe page showing board (3: `irene-braam`, `liz-mohn`,
`stephen-f-szabo`) + team (10) summing to 13, `aboutPage()` resolving, and
`announcement()` returning `undefined` when the source record's `status`
is not `'published'` (per the issues.md `verify` column — manual/rendered
check).

## Decisions

_Runner appends here._ (Review checkpoint 1 — brief §8 — happens after this
issue merges; not part of this issue's own work.)
