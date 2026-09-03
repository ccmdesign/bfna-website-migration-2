# 54 — page-search — Search `/search`

One-line objective: build `src/pages/search.vue` on `bf-default`, deleting
the legacy `pages/search.vue`, using a simulated-relevance ranking pattern
over `bfInsights`/`bfProjects`/`bfPrograms`.

## Context

Depends on #46 (`bf-default`), #38 (`bfPageHeader`), #43 (`bfSearchShell`),
#27 (`bfCardRow`), #11/#12/#13 (`useBfInsights`, `useBfProjects`,
`useBfPrograms`, `useBfPeople`). Descends from `src/pages/wireframes/search.vue`.
Provenance: BF-210; **D4** (semantic search PATTERN, simulated relevance
score acceptable — not real vector search). Retires exactly one file:
`src/pages/search.vue` (legacy, `02-legacy-retirement-inventory.md` §A row
`/search` — today backed by `useSearch()` → `server/api/search.get.ts` →
`public/search.json`, built by `scripts/generate-search-index.ts`) — no
other legacy file. That script/API/index file itself is retired by #59, not
this issue (D per §D touchpoints).

## Scope

- `src/pages/search.vue`, `definePageMeta({ layout: 'bf-default' })`.
- Section order: `<bf-page-header label="Search" heading="Search" tagline="Ask in your own words — results are ranked by meaning, not keyword matches.">` with the query `<input>` in its default slot, then `<bf-search-shell :results="ranked" :facets="{program, format}" @update:query="…" />`. `bfSearchShell` (built in #43) internally composes the input/facets/results/relevance-meter — this page owns ranking + URL state only.
- Ranking logic ported verbatim from `pages/wireframes/search.vue`'s
  `score()`/`ranked`/`results` computeds: token-overlap + field-weighting
  (heading match > body match, phrase > individual terms), feeding a
  0–100% relevance meter via `topScore` normalization. **Implemented in
  this page**, not in `bfSearchShell` (D8: the shell renders `results`/
  `score`, it does not compute them).
- Cross-type result pool: `useBfInsights().items` + `useBfProjects().projects()`
  + `useBfPeople().people()`, each mapped to a common `{slug, heading,
  haystack, chip, archived, program, format, to, date}` shape — same shape
  the wireframe builds inline, ported here.
- Query (`q`) and facets (`program`, `format`) live in `route.query`, not
  local-only refs (closes the wireframe's non-linkable-query gap; template
  contract §7 requires `/search?q=…` to prerender/deep-link).
- Composable → prop map: `useBfInsights().items`/`useBfProjects().projects`/`useBfPeople().people`
  → the ranking pool; `ranked` (page-local) → `bfSearchShell.results`;
  each result row → `bfCardRow.item` (via `bfSearchShell`'s internal use of
  `bfCardRow`, per v2 §2 "uses `bfCardRow`").
- Consumes collections: `bfInsights`, `bfProjects`, `bfPrograms`, `bfPeople`.

## Out of scope

- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.
- Embeddings, a vector index, a server route, `@nuxt/content` full-text
  search — the simulated pattern is explicitly acceptable per D4.
- Any legacy file other than `src/pages/search.vue`.

## Styling

- Tokens: existing semantic tokens, no new colour.
- Primitives: relevance meter bar stays bespoke/inline per as-built D
  finding #5 (single-use, no extraction proposed) — same call here.

## Acceptance / verification

```bash
cd bfna-website-nuxt && npm run typecheck
cd bfna-website-nuxt && npx nuxt generate   # NEVER `npm run generate`
```

Issue-specific:
```bash
grep -n "prerender" bfna-website-nuxt/src/nuxt.config.ts | grep -q "/search"   # /search seeded for prerender (or verified reachable) — see #59 for the authoritative list
grep -q "route.query" bfna-website-nuxt/src/pages/search.vue                  # query/facets read from the URL, not local-only state
test ! -f bfna-website-nuxt/src/pages/search.vue.legacy                       # legacy search page is gone
diff <(git show HEAD~1:bfna-website-nuxt/src/pages/wireframes/search.vue) bfna-website-nuxt/src/pages/wireframes/search.vue   # empty — wf source untouched (DoD-4)
```

## Decisions

_Runner appends here._
