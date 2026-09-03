# Plan — gh#22 / issue 13: `useBfPeople`, `useBfPages`, `useBfSite`

Spec: [`docs/ds-epic/issues/13-composables-people-pages-site.md`](../ds-epic/issues/13-composables-people-pages-site.md)
Pattern to match: `bfna-website-nuxt/src/composables/data/useBfInsights.ts` (gh#20)
and `useBfProjects.ts` / `useBfPrograms.ts` (gh#21), both merged.

This issue **is review checkpoint 1** (BRIEF §8): it closes the composable layer,
so the plan optimises for *provable parity with `useWfContent`*, not for new
capability.

## Approach

Three thin wrappers in the shape issues 11–12 established: one `useAsyncData`
call, unwrap to plain values, expose members whose names and signatures match
`useWfContent` exactly so a page port is a one-line swap.

No synthesis. `useBfPeople` and `useBfPages` are pure `queryCollection`
wrappers. `useBfSite` is the one composable that is deliberately *not* pure —
BRIEF §6 puts the `status === 'published'` gate in the composable, and menus in
a typed JSON module rather than a seventh collection.

### `useBfPeople.ts` — `queryCollection('bfPeople')`

| Member | Derivation |
|---|---|
| `people()` | all 13 documents, collection order |
| `boardMembers()` | `all.filter(p => p.board)` — the **stored** flag |
| `teamMembers()` | `all.filter(p => !/board/i.test(p.job_title ?? ''))`, sorted by `name.split(' ').at(-1)` |

### `useBfPages.ts` — `queryCollection('bfPages')`

`pageBySlug(slug)` over all 7 documents, plus the three named accessors
`aboutPage()` / `stiftungPage()` / `homePage()` that call it with `'about'`,
`'stiftung'`, `'home'`. Exactly the four members `useWfContent` exposes — no
`pages()` list member, because `useWfContent` has none.

### `useBfSite.ts` — announcement gate + menus module

- `announcement()` — `queryCollection('bfAnnouncements').first()`, returned only
  when `status === 'published'`, else `undefined` (`useWfContent.ts:267`).
- `menus()` — returns the typed `Menu[]` from `src/assets/bf-data/menus.ts`, the
  hand-authored accessor over the generated `src/assets/bf-data/menus.json`
  (issue 08 / gh#17). A static import, **not** a collection: BRIEF §6 fixes the
  collection count at six.
- D8: the *layout* calls this (issue 46). No `bf-*` component may — `bfNav` /
  `bfFooter` take `menus` as a prop.

## The one judgement call: board is 4, and Irene is in both lists

The spec's prose says `boardMembers()` is "3 (`irene-braam`, `liz-mohn`,
`stephen-f-szabo`)". **That count is wrong and this plan does not implement it.**
Issue 08's Decisions (gh#17), written when the flag was materialised, say so
explicitly:

> Running `useWfContent.ts:263`'s predicate (`p.board || /board/i.test(p.job_title ?? '')`)
> against `people.json` also matches **`wilhelm-friedrich-uhr`** — "Executive **Board**
> and Chief Operating Officer". … **Issue 13's `bfBoardMembers()` should expect 4.**

The spec is also wrong on the other half: it says `teamMembers()` filters
`board !== true`. Inverting the stored flag would drop `irene-braam` from Team,
but `useWfContent.ts:264` filters on the **regex half only**, so she is
Executive Director in Team *and* flagged onto the Board (Irene, Aug 5 widget
feedback — the comment is in `useWfContent.ts:261-262`). The ported filter keeps
the asymmetry.

So the real shape is:

| List | Predicate | Members |
|---|---|---|
| `people()` | — | 13 |
| `boardMembers()` | stored `board` | 4 — `irene-braam`, `liz-mohn`, `stephen-f-szabo`, `wilhelm-friedrich-uhr` |
| `teamMembers()` | `!/board/i` on `job_title` | 10 — the 13 minus the 3 whose *title* says Board |

4 + 10 = 14 **entries** over 13 **people**: `irene-braam` is counted twice by
design, `wilhelm-friedrich-uhr` is Board-only. The acceptance's "summing to 13"
is therefore asserted as the **union** of the two lists = all 13 people, which
is what it was reaching for. Recorded in the spec's Decisions.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is two things, per gh#20/gh#21 precedent:

1. **Probe page** `src/pages/bf-probe/13-composables-people-pages-site.vue` —
   renders under `npx nuxt generate` against the real content database and
   asserts the composables: the 13/4/10 split, the union of 13, Irene in both
   lists, the alphabetical-by-last-name sequence as a **full slug sequence**,
   all 7 page slugs resolving, `aboutPage()` carrying real copy, `menus()`
   shape, the live announcement, and both branches of the published gate.
   Kept in place (only the cutover issue removes `bf-probe/`).
2. **Parity script** `scripts/verify-bf-people-pages-site-parity.ts`, run with
   `npx tsx` — the vitest substitution. It runs `useWfContent`'s *own*
   predicates over `src/assets/wireframe-data/*.json` and the `bf-*`
   derivations over `content/bf/**/*.json`, then asserts the two produce
   identical slug sequences. A passing run is parity with the wireframe, not
   agreement with the implementation. It also asserts the announcement gate
   over a synthetic unpublished record, which the real (published) singleton
   cannot demonstrate.

Both are plain data reads — no alias imports — so the script runs standalone.

Gates: TYPECHECK no-new-errors (baseline 178 on `dev`, 0 in
`src/(components/bf|types|composables/bf)`), `npx nuxt generate` exits 0, and
the wireframe-source diff prints nothing.

## Risks

- **`.first()` vs `.all()[0]`** on `bfAnnouncements` — one document either way;
  `.first()` is used, and the probe asserts the returned document's fields.
- **`useAsyncData` key collisions** — keys are `bf-people`, `bf-pages`,
  `bf-announcement`, distinct from `bf-insights` / `bf-projects` / `bf-programs`.
- **Sort mutation** — `.filter()` returns a fresh array, so the in-place `.sort()`
  in `teamMembers()` cannot reach the shared `all` (the gh#21 precedent comment).
- **`localeCompare` on last names** — same comparator the wireframe uses, applied
  to the same strings, so ties break identically.

## Files

- `bfna-website-nuxt/src/composables/data/useBfPeople.ts` (new)
- `bfna-website-nuxt/src/composables/data/useBfPages.ts` (new)
- `bfna-website-nuxt/src/composables/data/useBfSite.ts` (new)
- `bfna-website-nuxt/src/pages/bf-probe/13-composables-people-pages-site.vue` (new)
- `bfna-website-nuxt/scripts/verify-bf-people-pages-site-parity.ts` (new)
- `docs/ds-epic/issues/13-composables-people-pages-site.md` (Decisions appended)

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched. No CSS colour is introduced; the probe
reuses the gh#21 probe's scoped styles and the existing `--color-error` token.
