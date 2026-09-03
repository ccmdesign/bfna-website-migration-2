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

### Appended by the item-runner (gh#22)

- **`boardMembers()` resolves 4, not the 3 this spec's Acceptance section names,
  and `teamMembers()` is NOT `board !== true`.** Both corrections were already
  written down by issue 08's runner (gh#17) when the flag was materialised, and
  this issue implements that, not the prose above. The wireframe is the
  specification (BRIEF §1/§5.10), and it runs two *different* predicates:

  | list | `useWfContent` | ported as |
  |---|---|---|
  | Board (l.263) | `p.board \|\| /board/i.test(p.job_title ?? '')` | the stored `board` flag — the normaliser stored the whole OR |
  | Team (l.264) | `!/board/i.test(p.job_title ?? '')` | the same regex, still a composable-side filter |

  So Board is `irene-braam`, `liz-mohn`, `stephen-f-szabo` **and
  `wilhelm-friedrich-uhr`** ("Executive **Board** and Chief Operating Officer"
  matches the regex). Team is 10. Inverting the stored flag for Team — what the
  Scope paragraph drafted — would drop `irene-braam`, who joins the Board while
  staying Executive Director in Team (Irene, Aug 5 widget feedback;
  `useWfContent.ts:261-262`). She is therefore in **both** lists by design, and
  `wilhelm-friedrich-uhr` is Board-only.

- **"Board + team summing to 13" is asserted as the union.** 4 + 10 = 14
  *entries* over 13 *people*; the lists are not a partition. The probe asserts
  `board ∪ team === 13` and that the union is every person, which is what the
  acceptance was reaching for. Anything else would contradict the rendered
  `/wireframes/about`.

- **`useBfPages` exposes four members and no list member.** `pageBySlug`,
  `aboutPage`, `stiftungPage`, `homePage` — exactly what `useWfContent` exposes.
  It has no "all pages" member and nothing renders one, so none was invented
  (the probe reaches all 7 documents through `pageBySlug` instead).

- **The publish gate is exported as a pure function,
  `publishedAnnouncement(doc)`.** `announcement()` is a one-line call to it. The
  shipped singleton is `status: 'published'`, so the *negative* branch of the
  gate is unreachable from real content and the acceptance ("announcement
  returns `undefined` when unpublished") would otherwise have nothing to assert
  against. Extracting it lets both the probe and the parity script exercise
  `'draft'`, `null`, `'Published'` (exact match, not case-folded), `undefined`
  and `null` documents. The gate stays in the composable per BRIEF §6.

- **Menus are imported from `src/assets/bf-data/menus.ts`**, the hand-authored
  typed accessor over the generated `menus.json` (issue 08) — a static import,
  never a 7th `@nuxt/content` collection (BRIEF §6). D8 holds: nothing under
  `src/components/bf/` imports `useBfSite`/`useBfPeople`/`useBfPages`, and the
  spec's own grep asserts it.

- **Vitest substitution (residual #86).** The `npm run typecheck` line in the
  Acceptance block is also not runnable as written — `dev` carries ~178 legacy
  `error TS` and green is impossible; the epic gate is *no new errors*
  (baseline 178 before, 178 after, 0 in `src/types` / `src/components/bf` /
  `src/composables/data/useBf*`). In place of a vitest test the acceptance is:
  1. the probe at `src/pages/bf-probe/13-composables-people-pages-site.vue`,
     rendered by `npx nuxt generate` against the real content database —
     **PASS 35/35**; and
  2. `npx tsx scripts/verify-bf-people-pages-site-parity.ts` — **PASS, 36
     checks** — which runs `useWfContent`'s own predicates over
     `src/assets/wireframe-data/*.json` and the `bf-*` derivations over
     `content/bf/**`, then asserts identical slug sequences. It proves parity
     with the wireframe rather than agreement with the implementation.
  Probes 09, 11 and 12 were re-rendered in the same build and still pass
  (18/18, 21/21, 36/36).

- **The parity script is committed with `git add -f`.** `.gitignore:48` ignores
  `bfna-website-nuxt/scripts/`, yet every script in it — `normalise-wireframe-data.ts`
  (issue 08), `verify-visual-parity.ts`, `verify-css-classes.ts` — is tracked. The
  ignore rule is stale relative to how the directory is actually used, so this
  script follows the established precedent rather than moving the file somewhere
  its siblings are not. Fixing the rule is not this issue's scope; handed off as
  a residual.
