# Plan — gh#63 / issue 54 — Search `/search`

Spec: [`docs/ds-epic/issues/54-page-search.md`](../ds-epic/issues/54-page-search.md).
Branch: `feature/gh63-search-search` off `dev`.

## Approach

`src/pages/search.vue` is **rewritten in place** (the legacy body is replaced
entirely — that is the "delete the legacy page" of the spec, since a route can
own only one page file and `/search` keeps its route). The page owns three
things and nothing else:

1. **The pool** — `useBfInsights().items` + `useBfProjects().projects()` +
   `useBfPeople().people()`, each mapped to the `SearchResultRow` projection
   pinned in `bf-contracts.ts` plus the two facet fields the page filters on
   (`program`, `format`) and the `haystack` the scorer reads. Route prefixes
   are per-type: insights → `/insights/<slug>`, projects → `/projects/<slug>`
   (external-only projects → their `external_url`), people → `/about#team`
   (residual #172 — a row is a projection, not an entity, precisely because
   `to` is arbitrary across the three types).
2. **The ranking** — `score()` / `ranked` / `results` / `topScore` ported
   verbatim from the frozen `pages/wireframes/search.vue`: phrase-in-heading 8,
   phrase-in-body 4, term-in-heading 3, term-in-body 1, `score > 0`, sort
   descending, then facet-filter, then normalise against the top score. It
   lives **here**, never in `bfSearchShell` (D8 — the shell renders `score`, it
   does not compute it).
3. **The URL** — `q`, `program`, `format` are read from `route.query` and
   written back through `navigateTo`, so `/search?q=democracy&program=democracy`
   deep-links and prerenders. Nothing is held in a page-local `ref`.

Everything drawn is `bfPageHeader` + `bfSearchShell` (gh#52), which already
composes the query control, the facet bar, the count line, the result rows with
the relevance meter, and the empty state.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/pages/search.vue` | rewritten: `bf-default` layout, `bfPageHeader` + `bfSearchShell`, ranking + URL state |
| `docs/ds-epic/issues/54-page-search.md` | Decisions appended |
| `docs/plans/gh63-plan.md` | this file |

Nothing else. No component is edited, no contract is changed, no new type is
declared (`SearchResultRow` / `Filter` already exist in `bf-contracts.ts`), no
new colour, no `pages/wireframes/**` or `components/wireframe/**` file touched.

## Deviations from the spec text (recorded in the spec's Decisions)

- **No `<input>` in the page-header slot.** The spec's §Scope predates the
  as-built shell: `bfSearchShell` renders its own `bfFormField` search control.
  A second input in the header slot would be two controls for one query.
- **One flat facet vocabulary, prefixed keys.** `SearchShellProps.filters` is
  one `Filter[]` and one `selectedFilters: string[]`; the two families are
  distinguished by a `program:` / `format:` key prefix and mapped back onto two
  separate query params. Single-select per family, as the wireframe behaves.
- **Empty query renders a prompt, not "0 results".** See Decisions.
- **`/search` is not added to `nitro.prerender.routes`.** It is linked from
  `bfNav` and `bfFooter`, so the crawler reaches it; the spec's `grep` on the
  config line is replaced by an assertion on the generated
  `.output/public/search/index.html`.

## Verification

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'          # ≤ 176 (baseline on dev)
npx nuxt typecheck 2>&1 | grep -E 'error TS' | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l   # 0
npx nuxt generate                                       # exits 0
test -f .output/public/search/index.html                # /search prerendered
grep -q "route.query" src/pages/search.vue              # URL-owned state
grep -c "useSearch\|search.json" src/pages/search.vue   # 0
npx tsx scripts/check-probes.ts                         # full suite, exit 0
```

Wireframe byte-identity (cumulative, from the pre-epic base) must print nothing:

```bash
git diff --stat f757a649361993275a43282456f4746d247be37b HEAD -- \
  bfna-website-nuxt/src/pages/wireframes bfna-website-nuxt/src/components/wireframe \
  bfna-website-nuxt/src/layouts/wireframe.vue bfna-website-nuxt/src/public/css/wireframe.css
```

Browser (STEP 6): serve `.output/public`, load `/search?q=democracy`, assert
ranked rows + relevance meter render, typing updates the URL, a nonsense query
shows the shell's empty state.

## Risks

- **Legacy `useSearch()` left orphaned.** Intentional: `composables/legacy/
  useSearch.ts`, `server/api/search.get.ts`, `public/search.json` and
  `scripts/generate-search-index.ts` are retired by #68, not here. This page
  must simply stop referencing them, which the acceptance greps for.
- **Prerender pool size.** ~420 pool rows are built at module scope per render;
  the ranking is O(pool) per query and only runs when a query exists.
- **Facet round-trip.** A facet key not present in `filters` must survive the
  round trip (`FilterBarProps.modelValue` contract); prefixed keys are derived
  from the URL, so an unknown program slug renders no chip and is still applied
  to the filter — matching `/insights`.
