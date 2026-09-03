# gh#57 / issue 48 — Program hub `/{program}` — plan

Spec: `docs/ds-epic/issues/48-page-program-hub.md` (authoritative).
Branch: `feature/gh57-program-hub-program` off `dev`.

## Approach

One dynamic page, `src/pages/[program].vue`, on `bf-default`, gated by a
**load-bearing** `definePageMeta({ validate })`. Four bands, ported element for
element from the frozen `src/pages/wireframes/[area].vue` (read, never edited):
page header → Projects → conditional Insights (D10) → `bfEmptyState` fallback.
Deletes exactly the four legacy workstream index pages the route absorbs.

## Files

| File | Action |
|---|---|
| `bfna-website-nuxt/src/pages/[program].vue` | **new** — the hub template |
| `bfna-website-nuxt/src/utils/bf-programs.ts` | **new** — `PROGRAM_SLUGS` / `isProgramSlug`, derived at build time from the `bfPrograms` collection source |
| `bfna-website-nuxt/src/pages/democracy/index.vue` | **delete** (+ empty dir) |
| `bfna-website-nuxt/src/pages/digital-world/index.vue` | **delete** (+ empty dir) |
| `bfna-website-nuxt/src/pages/future-leadership/index.vue` | **delete** (+ empty dir) |
| `bfna-website-nuxt/src/pages/politics-society/index.vue` | **delete** (+ empty dir) |
| `docs/ds-epic/issues/48-page-program-hub.md` | append Decisions |

Nothing else. No `bf-*` component changes, no composable changes, no probe page
(this issue's acceptance runs against the generated output, not a probe).

## Where the slug list comes from

The spec forbids hand-typing the three slugs twice. `src/utils/bf-programs.ts`
reads them with `import.meta.glob('../../content/bf/programs/*.json',
{ eager: true, import: 'slug' })` — the **collection's own source files**,
resolved by Vite at build time, zero runtime cost, and no second copy to drift.

It lives in its own module rather than inline in the page because Nuxt's
`nuxt:pages-macros-transform` re-emits `pages/*.vue?macro=true` containing only
the `definePageMeta` object plus the top-level declarations and imports it
references; an *import* is the shape that transform handles most simply, and it
keeps the glob in a module Vite processes normally.

## Test strategy

Gates, all run in `bfna-website-nuxt/`:

1. **Typecheck gate** — no new errors. Baseline on `dev` = **176** `error TS`
   lines; after ≤ 176, and 0 in `src/(components/bf|types|composables/bf)` /
   `content.config`.
2. `npx nuxt generate` exits 0 (never `npm run generate`).
3. All three hubs prerender: `.output/public/{democracy,
   transatlantic-relations-global-challenges,future-leadership}/index.html`.
4. `future-leadership` renders **no** Insights band; `democracy` and
   `transatlantic-relations-global-challenges` do. Asserted on the band's
   `data-label="Recent insights"` hook, **not** the spec's
   `grep -L "Insights"` — the site nav prints the word "Insights" on every
   page, so the spec's grep can never match. Recorded as a Decision.
5. `/not-a-program` is not the hub — checked against the served build.
6. `npx tsx scripts/check-probes.ts` (full suite) exits 0.
7. Wireframe byte-identity diff prints nothing, from the pre-epic base SHA.

## Risks

- **`validate` does not fall through.** `nuxt/dist/pages/runtime/validate.js`
  turns a `false` result into `createError({ status: 404 })`; vue-router does
  not resume matching, so the legacy catch-all never sees the request. The
  spec's stated *mechanism* is wrong; its stated *effect* (a non-program
  one-segment path does not render the hub) is what `validate` actually
  delivers, and the acceptance check is written against the effect. The
  one-segment paths this converts from a hollow legacy 200 to a 404
  (`/insights`, `/projects`, `/archive`, `/people`, `/careers`,
  `/bertelsmann-stiftung`) all currently render the catch-all's empty
  "Content" shell — verified against a baseline `nuxt generate` — and three of
  the six are routes later epic issues build for real. Recorded as a Decision.
- **`import.meta.glob` + the page-meta macro.** Mitigated by the separate
  module (above) and proved by gate 2 + gate 5.
- **Deleting four legacy pages** may orphan legacy components. Out of scope by
  the spec and BRIEF §5 rule 7 — phase 7 retires the rest.
