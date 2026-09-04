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

### D-54.1 — the query `<input>` is **not** in the page-header slot

§ Scope says `<bf-page-header …>` carries "the query `<input>` in its default
slot". It cannot, and should not: `bfSearchShell` as built (#43 / gh#52)
renders its own labelled `bfFormField[type="search"]`, owns the debounce and
owns the `update:query` emit boundary. An input in the header slot would be a
second control for one query — two places to type, one of them not wired to the
ranking — and the shell's own control is the accessible one (a real
`<label for>` rather than the frozen source's `aria-label` on a bare input).

The header therefore renders `label` / `heading` / `tagline` only, with the
frozen source's tagline verbatim, and its default slot is empty. Spec text
predates the component; the component wins.

### D-54.2 — one flat facet vocabulary with prefixed keys, two query params

`SearchShellProps` takes **one** `filters: Filter[]` and **one**
`selectedFilters: string[]`, and its contract note states that grouping is a
page decision. So the page builds one list — `program:<slug>` for each of the
three programs, `format:<key>` for each of the four formats — and maps the
selection back onto two separate query parameters, `?program=` and `?format=`.

Single-select per family, which is how the frozen source behaves (each of its
two rows toggles one value). `bfFilterBar` emits the whole new selection, so
the key that is not the current one is the one just switched on and an empty
family is the current one switched off — the same `onFacet` shape `/insights`
already uses.

Programs are keyed by **slug** and labelled by **name**: the URL stays readable
(`?program=democracy`) while the pool is filtered on `Program.name`, which is
what an insight and a project actually store. `programBySlug` is the single
translation point; an unknown slug filters nothing out, matching `/insights`.

### D-54.3 — the empty-query state is a prompt, and the shell's count line and
empty state are hidden while idle

An unqueried `/search` must not open on "0 results" and a `<h2>No results</h2>`
— that reads as a failed search reported before one was made. But
`bfSearchShell`'s count line is a **persistently rendered** live region by
design (residual #169: a region inserted into the DOM already holding its
message is not reliably announced), and the shell has no "not asked yet" state
to be passed.

Resolved at the page level, without editing the component or changing a
contract:

- the shell is mounted in **every** state, so the search control, its focus and
  its debounce survive the first keystroke;
- `:filters` is `[]` until there is a query, so the shell's own
  `v-if="filters.length"` hides the facet row — this reproduces the frozen
  source's `v-if="q.length > 1"` on its Refine band with no rule of ours;
- a page-scoped rule in `@layer overrides` hides
  `[data-bf-search-shell="count"]` and `[data-bf-search-shell="empty"]` while
  the shell carries `data-bf-search="idle"`, using the selector hooks the
  component publishes for exactly this kind of addressing;
- the page renders its own prompt paragraph instead.

Trade-off, stated rather than hidden: while idle the live region is out of the
accessibility tree, so the **first** query's count may not be announced; every
count after it is, which is the guarantee #169 is actually about. The
alternative — announcing "0 results" on arrival — is worse.

The threshold is the frozen source's `> 1`, not `> 0`: one character is a
keystroke on the way to a search, and ranking 385 documents against `"d"`
returns most of them in an order nobody asked for.

### D-54.4 — `/search` is not seeded into `nitro.prerender.routes`

§ Acceptance greps the `prerender` line of `nuxt.config.ts` for `/search`. That
grep is a proxy for "the route prerenders", and seeding is only needed for
routes the crawler cannot reach — which is why `/wireframes` and the probes are
seeded. `/search` is linked from `bfNav` (`Nav.vue:146`) **and** `bfFooter`
(`Footer.vue:142`), so the crawler reaches it from every page it already
renders. Verified rather than assumed: `npx nuxt generate` emits
`.output/public/search/index.html` (36 KB, 1180 routes prerendered) with no
config change. The grep is therefore substituted by

```bash
test -f bfna-website-nuxt/.output/public/search/index.html
```

Adding the route to the seed list would also perturb the batching hazard
`nuxt.config.ts` documents at length (a spliced batch lost with a 500 can drop
an unrelated route), for no gain.

### D-54.5 — result rows are the `SearchResultRow` projection, not entities

Residual #172 asked why. Concretely: `to` is arbitrary across the three pooled
types — an insight routes to `/insights/<slug>`, a project to
`/projects/<slug>` **or** to its `external_url` when it is external-only, and a
person to `/about#team`, an anchor into a different page entirely. An
entity-typed row would recompute `to` from the entity by a type guard and send
every person row to a 404 that typechecks. The page therefore projects down to
exactly `SearchResultRow` at the prop boundary; the three page-only fields
(`haystack`, `program`, `format`) never cross it.

Two departures from the frozen source's pool, both forced by components that
did not exist when it was written:

- `date` is the raw `publish_date`, not `monthYear(publish_date)` — the shell
  renders it through `bfTime`, which needs a parseable value to write
  `datetime` and formats it itself.
- an external-only project routes to its `external_url` when it has one.
  `transponder-magazine`, the single such row in the snapshot, carries a null
  one, so the fallback is the internal route rather than `href="null"`.

### D-54.6 — no vitest; acceptance runs on the generated output

Per the epic's test-harness decision (residual #86) the vitest harness on `dev`
is broken and pre-existing. This issue's acceptance is the typecheck gate (no
new errors against the 176-error `dev` baseline, zero in `src/components/bf` /
`src/types` / `content.config`), `npx nuxt generate` exiting 0, the greps above
run against the generated `search/index.html`, the full probe harness
(`npx tsx scripts/check-probes.ts` — 38 probes, 1642 rows, 0 failures), and a
headless browser pass over the served build.

### D-54.7 — the query is written to the URL untrimmed (review finding P1-1)

`bfSearchShell` resynchronises its draft against the `query` prop whenever the
incoming value is **not** the one it last emitted — that is how an externally
cleared or restored query wins over a half-typed draft. A page that trimmed
before writing the URL turns every echo into an "external change": the shell
emits `"how "`, the page stores `"how"`, the shell sees a value that is not its
own echo and rewrites the input, deleting the space the reader had just typed.
Multi-word queries would lose a space at every debounce boundary.

So `onQuery` writes the value verbatim (dropping only an empty one) and the
trimming happens where it always did: `hasQuery` and the scorer.

### D-54.8 — `bfSearchShell` now passes `:heading-level="2"` to its empty state (browser finding)

Found by the STEP 6 browser pass, not by any static check: at zero results
`/search` rendered **two `<h1>`s** — `bfPageHeader`'s "Search" and
`bfEmptyState`'s "No results" — because `EmptyStateProps.headingLevel` defaults
to `1` and `bfSearchShell` (gh#52) never lowered it. BRIEF §5 rule 9 is one
`h1` per page, and this issue's acceptance names the empty state as an `h2`.

It cannot be fixed from the page: `SearchShellProps.headingLevel` is the
*rows'* rank and is not forwarded to the empty state. So the fix is one
attribute inside the shell — which is exactly what that prop's own contract
note prescribes: *"only a caller that knows its page already has an `h1` — an
empty results band under a `bfPageHeader`, `bfSearchShell`'s no-matches branch
— may lower it"* (residual #173). A literal `2` rather than `headingLevel`: the
rows' rank is the caller's choice, but this heading is the band's own, one
level under the page title, whatever the rows are.

Probe 43 § 6 asserted the text through a `querySelector('h1')`, so it moves to
the published `.bf-empty-state__heading` class and gains one row asserting the
element is an `H2`. Two files, three lines, no contract change, and the probe
now checks the property rather than a selector that happened to match.
