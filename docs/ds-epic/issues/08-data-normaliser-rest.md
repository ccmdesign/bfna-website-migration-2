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
