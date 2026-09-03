# 08 — data-normaliser-rest

Extend the normaliser to people, pages, announcements, and site chrome
(menus).

## Context

Depends on 07 (same script file, extended not rewritten). Blocks 09
(collections read all six outputs). Builds from
`bfna-website-nuxt/src/assets/wireframe-data/{people,pages,announcements}.json`
(read-only) and the `MENUS` constant + people/page/announcement synthesis in
`bfna-website-nuxt/src/composables/useWfContent.ts` (lines 87-94, 150-188,
255-267). Provenance: D3 (BRIEF §6); 01 §D, §E.

**Verified today** (`bfna-website-nuxt/src/assets/wireframe-data/`, field
lists read directly from the JSON):
- `people.json` top-level key is **`people`** (13 items), not `items`.
  Sample fields: `slug, name, job_title, bio, email, linkedin, twitter,
  image, status, source, legacy`. 3 of 13 resolve to board via
  `useWfContent.ts`'s predicate (`p.board || /board/i.test(p.job_title)`,
  line 259) once both halves are checked against the actual data:
  `irene-braam` (job title "Executive Director" — does **not** match the
  regex, but her raw JSON record carries `board: true` directly) plus
  `liz-mohn` ("President of the Board of Directors") and `stephen-f-szabo`
  ("Member of the Board of Directors"), both matching via the job-title
  regex with no raw `board` key. **The normaliser must OR both halves of
  the predicate**, not just the regex — dropping the raw-flag half would
  silently lose `irene-braam`.
- `pages.json.items` — 7 items (declared `count: 1` is wrong), full field
  set: `slug, heading, subheading, excerpt, description, authors, image,
  video_url, download, external_url, publish_date, bucket, format, kind,
  program, archived, evergreen, copy_source, legacy` (18 fields) — today's
  inline type only reads 3 (`slug, heading, description`).
- `announcements.json.items` is a **single object** (not an array):
  `{id, status, user_created, date_created, user_updated, date_updated, url,
  message, heading, excerpt, workstream}`.

## Scope

- Extend `scripts/normalise-wireframe-data.ts` (issue 07's file):
  - `people.json.people` → `content/bf/people/<slug>.json` (13 files).
    Materialise `board: boolean` per item using the exact predicate ported
    from `useWfContent.ts:259` (`p.board || /board/i.test(p.job_title ?? '')`)
    — read the source's own `board` field first, OR-ed with the job-title
    regex test, so `liz-mohn`/`stephen-f-szabo` (regex match) and any item
    whose raw JSON already carries `board: true` both resolve `true`.
  - `pages.json.items` → `content/bf/pages/<slug>.json` (7 files), full
    18-field passthrough (no field dropped) — this is the "needs a real
    schema, 17 fields available" gap the audit flagged (01 §D/§F).
  - `announcements.json.items` (the single object) →
    `content/bf/announcements/announcement.json` — **one document**, not an
    array-derived file-per-item. Fixed filename since there is exactly one.
  - `MENUS` (currently a hardcoded TS constant, `useWfContent.ts:153-181`)
    → emit as data to `src/assets/bf-data/menus.json`, typed against the
    existing `Menu`/`MenuItem` types from `src/types/bf-contracts.ts`
    (issue 02) — reused directly, not redeclared — in
    `src/assets/bf-data/menus.ts` (or a `.d.ts` alongside the `.json` —
    runner's call, record which in Decisions). Route paths inside `MENUS`
    today point at `/wireframes/…`
    (e.g. `/wireframes/about#board`) — the normaliser emits the `/`-rooted
    equivalent (`/about#board`) since menus.json serves the final `bf-*`
    site, not the wireframe.
- npm script stays `data:normalise` (issue 07's), now covering all 6
  snapshots + menus in one run.

## Out of scope

- Registering any `@nuxt/content` collection (issue 09).
- Any composable reading this output (issues 11-13).
- Insights/projects/programs — already done in 07, not re-touched here
  except by the shared script file's imports/exports.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

N/A — data/script issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
npm run data:normalise
find content/bf/people -name '*.json' | wc -l          # today: fails (no dir); after: 13
find content/bf/pages -name '*.json' | wc -l            # after: 7
find content/bf/announcements -name '*.json' | wc -l    # after: 1
test -f src/assets/bf-data/menus.json
node -e "const m=require('./src/assets/bf-data/menus.json'); if(!Array.isArray(m)) process.exit(1)"
git status --porcelain content/bf/ src/assets/bf-data/ > /tmp/rest-1.txt
npm run data:normalise
git status --porcelain content/bf/ src/assets/bf-data/ > /tmp/rest-2.txt
diff /tmp/rest-1.txt /tmp/rest-2.txt   # empty: no-op on re-run
```

## Decisions

_Runner appends here._


### Appended by the item-runner (gh#17)

- **The board predicate resolves 4 people, not the 3 this spec's prose states.** The
  spec named `irene-braam` (raw `board: true`, non-matching job title), `liz-mohn` and
  `stephen-f-szabo` (regex only). Running `useWfContent.ts:263`'s predicate
  (`p.board || /board/i.test(p.job_title ?? '')`) against `people.json` also matches
  **`wilhelm-friedrich-uhr`** — "Executive **Board** and Chief Operating Officer".
  The ported predicate is authoritative because it is what `/wireframes/about#board`
  renders today (BRIEF ground rule 10: `bf-*` renders the same data as its `wf-*`
  counterpart), so `board: true` is emitted for 4 documents. Both halves of the OR are
  load-bearing: the raw-flag half alone loses 3 people, the regex half alone loses
  `irene-braam`. **Issue 13's `bfBoardMembers()` should expect 4.**

  Note the asymmetry is in the source composable, not introduced here: `teamMembers()`
  filters on the regex half only, so `irene-braam` correctly appears in **both** Team
  and Board, and `wilhelm-friedrich-uhr` appears only in Board. `board` is a stored
  flag; the Team list stays a composable-side filter (issue 13), it is not inverted
  from `board`.

- **Two issue-09 schema field types contradict the source data.** Both surfaced by 08's
  full/faithful passthrough and left for #18 to correct in `content.config.ts` — the
  normaliser emits the real shape rather than lying to match a draft schema (same
  precedent as #16's "actual data beats the declared count"):
  - `bfPages.legacy` is declared `z.string().nullable()`, but every `pages.json` item
    carries an **object** — `{ source, type, workstream, id }`. Emitted as that object.
    Issue 09 must declare `z.object({ source: z.string().nullable(), type:
    z.string().nullable(), workstream: z.string().nullable(), id: z.number().nullable()
    }).nullable()`.
  - `bfAnnouncements.workstream` is declared `z.string().nullable()`, but the singleton
    carries the **number** `12` (a Directus M2O id). Emitted as `number | null`; issue
    09 must declare `z.number().nullable()`.

- **`pages.json` has 19 fields, not the 18 this spec counts.** The spec's own list names
  19 (`slug … legacy`); all 19 are emitted for all 7 documents, `copy_source` and
  `legacy` included, closing the audit's "needs a real schema, 17 fields available" gap
  (01 §D/§F). `plain()` is applied to `heading`/`subheading`/`excerpt` only —
  `description` is body copy and passes through byte-identical, per #16's rule.

- **Announcement document drops the Directus audit columns.** `id`, `user_created`,
  `date_created`, `user_updated`, `date_updated` are not emitted: issue 09's
  `bfAnnouncements` schema declares none of them, `@nuxt/content` mints its own
  document id, and all five are `null`/`1` in the snapshot. Emitted fields are
  `status, url, message, heading, excerpt, workstream`. Fixed filename
  `content/bf/announcements/announcement.json` — one document, since `items` is a
  singleton object and not an array. The `status === 'published'` gate stays in the
  composable (issue 13), per BRIEF §6.

- **People documents drop `status`, `source` and `legacy`** — issue 09's `bfPeople`
  schema declares neither, following #16's rule that emitted field lists mirror 09's
  zod schemas. Emitted: `slug, name, job_title, bio, email, linkedin, twitter, image,
  board`.

- **Menus ship as `menus.json` + a hand-authored `menus.ts`** (the spec left the
  `.ts`-vs-`.d.ts` choice to the runner). `scripts/normalise-wireframe-data.ts` writes
  only the generated `src/assets/bf-data/menus.json` — a **bare array**, per the spec's
  `Array.isArray` acceptance check. `src/assets/bf-data/menus.ts` is committed source,
  not generated, so re-running `data:normalise` can never dirty it; it is five lines:

  ```ts
  import type { Menu } from '~/types/bf-contracts'
  import menusJson from './menus.json'
  export const menus: Menu[] = menusJson
  ```

  The annotation is a real assignability check (not an `as` cast), so generated JSON
  that drifts from the contract fails `nuxt typecheck` instead of reaching a component.
  `Menu` / `MenuItem` come from `src/types/bf-contracts.ts` (issue 02) and are **reused
  directly** in both the script and the module — no `BfMenu` or any other variant was
  introduced (BRIEF §5 rule 11).

- **The `MENUS` port is verbatim, with one auditable re-rooting pass.** The tree is
  transcribed from `useWfContent.ts:153-181` with its `/wireframes/…` paths intact, then
  `deWireframe()` strips the prefix from every internal `to` in a single pass
  (`/wireframes` → `/`, `/wireframes/about#board` → `/about#board`,
  `/wireframes/insights?format=article` → `/insights?format=article`). `href` targets are
  external and pass through untouched, placeholders included (`#podcast-platform-url`,
  and `#transponder-magazine-url` — `transponder-magazine.external_url` is still `null`
  in the snapshot, so the composable's `??` fallback fires here too, pending Q6).
  Verified: the set of literal link targets in the emitted JSON equals the set parsed out
  of the composable's `MENUS` block after the same prefix strip, and no `/wireframes`
  path survives. Program and project labels are derived from the snapshots exactly as the
  composable derives them (`heading → name`; `NAV_SLUGS` filtered through
  `inProjectGrid`, all 5 surviving).

- **Verification.** 13 people / 7 pages / 1 announcement written; `menus.json` is an
  array of 6 top-level menus. Idempotent across two runs (434 files, identical sha256
  sweep) and the second run leaves `git status --porcelain` unchanged. The 412 documents
  #16 wrote are **byte-identical** after this run — the extension disturbs none of them.
  Typecheck 178/178 (baseline, no new errors; 0 in the scoped paths, 0 mentioning any new
  file); `npx nuxt generate` exits 0 (1421 routes prerendered — the 16 `no such column:
  "path"` warnings are pre-existing noise from the unrelated legacy `docs` collection).
  All three wireframe byte-identity diffs — including `useWfContent.ts` and
  `assets/wireframe-data/**` against the pre-epic base — print nothing. `useWfContent.ts`
  is not modified.
