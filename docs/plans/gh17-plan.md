# gh#17 — 08 Normaliser: people, pages, announcements, menus

Plan for GitHub issue #17. Spec: `docs/ds-epic/issues/08-data-normaliser-rest.md`.
Extends issue #16's `bfna-website-nuxt/scripts/normalise-wireframe-data.ts` — same file,
same conventions, extended not rewritten.

## Approach

Four new sections in the existing script, each following #16's established shape
(`Raw*` input interface → `*Doc` output interface → `normalise*()` returning a count,
called from `main()` and reported in the console summary):

1. **people** — `people.json.people` (13) → `content/bf/people/<slug>.json`.
   The `board` predicate from `useWfContent.ts:263` is ported **verbatim**
   (`p.board || /board/i.test(p.job_title ?? '')`) and materialised as a single
   resolved `board: boolean`. Both halves matter: `irene-braam` carries a raw
   `board: true` with a non-matching job title; `liz-mohn`, `stephen-f-szabo` and
   `wilhelm-friedrich-uhr` match only via the job-title regex.
2. **pages** — `pages.json.items` (7) → `content/bf/pages/<slug>.json`.
   Full 19-field passthrough, `copy_source` and `legacy` included (the audit's
   "needs a real schema" gap). `plain()` on the short display strings only, per #16.
3. **announcements** — `announcements.json.items` (a single object, not an array) →
   `content/bf/announcements/announcement.json`. Exactly one document, fixed stem.
   Directus audit columns (`id`, `user_created`, `date_created`, `user_updated`,
   `date_updated`) are dropped — issue 09's `bfAnnouncements` schema does not declare
   them, and #16 set the precedent that emitted field lists follow 09's schemas.
4. **menus** — the hardcoded `MENUS` constant (`useWfContent.ts:153-181`) is rebuilt
   from the same inputs and emitted as `src/assets/bf-data/menus.json`, a bare array
   (the spec's acceptance command asserts `Array.isArray`). Route paths are re-rooted
   from `/wireframes/…` to `/…` because menus.json serves the final `bf-*` site.
   A small hand-authored `src/assets/bf-data/menus.ts` re-exports the JSON typed as
   `Menu[]` using the **existing** `Menu` / `MenuItem` types from
   `src/types/bf-contracts.ts` — reused directly, never redeclared, no `BfMenu`.

`useWfContent.ts` is **not modified**. Nothing under `pages/wireframes/`,
`components/wireframe/`, `layouts/wireframe.vue` or `public/css/wireframe.css` is
touched.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/scripts/normalise-wireframe-data.ts` | extend — 4 new sections, `main()` updated |
| `bfna-website-nuxt/content/bf/people/*.json` | new — 13 generated documents |
| `bfna-website-nuxt/content/bf/pages/*.json` | new — 7 generated documents |
| `bfna-website-nuxt/content/bf/announcements/announcement.json` | new — 1 generated document |
| `bfna-website-nuxt/src/assets/bf-data/menus.json` | new — generated menu array |
| `bfna-website-nuxt/src/assets/bf-data/menus.ts` | new — hand-authored typed accessor |
| `docs/ds-epic/issues/08-data-normaliser-rest.md` | append to Decisions |

`package.json` is unchanged: `data:normalise` already exists from #16 and now covers
all six snapshots plus menus in one run.

## Test strategy

Run in `bfna-website-nuxt/`:

- **Typecheck gate** (no new errors): baseline `npx nuxt typecheck 2>&1 | grep -cE 'error TS'`
  recorded as **178** before any edit; after implementation the count must be ≤ 178 and the
  scoped filter (`src/(components/bf|types|composables/bf)|content\.config`) must be 0.
- `npx nuxt generate` exits 0 (never `npm run generate`).
- Spec acceptance: 13 / 7 / 1 documents; `menus.json` exists and is an array;
  `npm run data:normalise` twice produces an empty `git status --porcelain` diff
  (idempotent, byte-identical).
- Parity assertions against `useWfContent`: the `board` set equals
  `boardMembers()`; the emitted menu tree is structurally equal to `menus()` after
  the `/wireframes` prefix is stripped.
- Wireframe byte-identity: `git diff --stat` over the four frozen paths (and the
  cumulative check against the pre-epic base SHA) prints nothing.
- Browser: serve `.output/public` and confirm `/wireframes/about` and the existing
  probe `/bf-probe/03-composition-gap-api` still render (this issue writes data only,
  no UI).

## Risks

- **Spec says 3 board members; the data says 4.** `wilhelm-friedrich-uhr`
  ("Executive Board and Chief Operating Officer") matches `/board/i`. The ported
  predicate is authoritative — it is what the wireframe renders today — so 4 is
  emitted and the discrepancy is recorded in Decisions for issue 13.
- **Issue 09's declared types for two fields do not match the source.**
  `bfPages.legacy` is declared `z.string().nullable()` but is an object in
  `pages.json`; `bfAnnouncements.workstream` is declared `z.string().nullable()` but
  is a number. Truthful passthrough wins here (#16's precedent: actual data beats a
  declared value); both are flagged in Decisions so issue 09 fixes its schema.
- **`src/assets/bf-data/` must not be gitignored.** Verified: `git check-ignore`
  returns non-zero for `src/assets/bf-data/menus.json`, and #16 already opened
  `/content/bf/` in `.gitignore`, so the generated output is committed.
- **`menus.ts` idempotency.** It is hand-authored, not generated, so re-running
  `data:normalise` cannot dirty it.
