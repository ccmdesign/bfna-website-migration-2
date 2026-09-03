# 59 — cutover-config-verify — Config touchpoints + epic verification

One-line objective: close the four config touchpoints named in
`02-legacy-retirement-inventory.md` §D, then run the full DoD-1…DoD-6 epic
verification from `docs/ds-epic/BRIEF.md` §9 and record results.

## Context

Depends on #58 (nothing left to reference once legacy files exist that this
issue would otherwise still need to route around). Builds from
`src/nuxt.config.ts`, `scripts/generate-search-index.ts`,
`src/layouts/legacy-base.vue` (deleted in #58 — this issue's stylesheet
cleanup targets the head-link references, not the file itself, which is
already gone). Provenance: 02 §D.

## Scope

1. **`src/nuxt.config.ts:108-112`** — today: `nitro.prerender.routes:
   ['/wireframes']` (only seeds the wireframe crawl). Extend to cover
   every route in `BRIEF.md` §7: `/`, `/{program}` ×3 (`democracy`,
   `transatlantic-relations-global-challenges`, `future-leadership`), `/insights`,
   every `/insights/:slug` (354 — enumerate from `useBfInsights` at build
   time, not hand-listed), `/projects`, every `/projects/:slug` (38),
   `/about`, `/search`, `/archive` — **while keeping `/wireframes`** (D2:
   the wireframe prototype must still crawl and prerender).
2. **`scripts/generate-search-index.ts:152-161,232`** — retire together
   with `server/api/search.get.ts` and `public/search.json`: delete all
   three files. The script already reads a dead path
   (`src/content/data/{publications,videos,infographics}.json` — doesn't
   exist; real content is at repo-root `content/{publications,videos,
   infographics}/*.json`), confirmed stale before this issue. Also drop
   its invocation from `package.json`'s `build` script (currently `"build":
   "npm run docs:generate && npm run generate:search-index && nuxt build"`
   — remove the `npm run generate:search-index &&` segment).
3. **`src/layouts/legacy-base.vue:133-138`** — file itself is gone (#58);
   this touchpoint is about its dead `useHead` stylesheet hrefs
   (`/global.css`, `/fixes.css`, `/v2updates.css`, which never resolved —
   real files live at `public/css-legacy/{global,fixes,v2updates}.css`).
   Confirm no other layout references these three broken paths; if any do,
   drop the dead `<link>` entries there too.
4. **`src/server/middleware/redirects.ts`** re-point already done in #57 —
   this issue only re-verifies it's still correct after #58's deletions
   (no code change expected here unless #58 revealed a gap).
- No `routeRules` exist anywhere in `nuxt.config.ts` — nothing to update
  there (02 §D, confirmed).
- No sitemap module/config exists — nothing to update there (02 §D,
  confirmed).
5. **Delete `src/pages/bf-probe/`** — every dev-only probe route used for
   component/template acceptance across the epic (BRIEF §Probe pages) is
   removed before the epic closes; probes are not part of the shipped site.

## Out of scope

- New features, sitemap or `routeRules` work (02 §D explicitly excludes).
- No edits under `pages/wireframes/**` or `components/wireframe/**` — fails the epic.

## Styling

N/A — config-only issue.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm ci
npm run typecheck                 # DoD-2
npx nuxt generate                 # DoD-1 — NEVER `npm run generate`
cd ..
git diff --stat $EPIC_BASE_SHA -- \
  bfna-website-nuxt/src/pages/wireframes \
  bfna-website-nuxt/src/components/wireframe \
  bfna-website-nuxt/src/composables/useWfContent.ts \
  bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/public/css/wireframe.css \
  bfna-website-nuxt/src/assets/wireframe-data      # DoD-4: must print nothing
test ! -d bfna-website-nuxt/src/components/legacy  # DoD-5
```

Issue-specific — full DoD gate + touchpoint checks:
```bash
grep -n "'/wireframes'" bfna-website-nuxt/src/nuxt.config.ts   # still present (kept)
grep -c "'/'" bfna-website-nuxt/src/nuxt.config.ts             # home route seeded
test ! -f bfna-website-nuxt/scripts/generate-search-index.ts
test ! -f bfna-website-nuxt/src/server/api/search.get.ts
test ! -f bfna-website-nuxt/public/search.json
! grep -q "generate:search-index" bfna-website-nuxt/package.json
! grep -rn "global.css\|fixes.css\|v2updates.css" bfna-website-nuxt/src/layouts/
test ! -d bfna-website-nuxt/src/pages/bf-probe
find bfna-website-nuxt/.output/public -maxdepth 1 -type d              # DoD-3 proxy: every §7 route present
```
Manual, recorded in the journal: DoD-3 (crawl every §7 route from nav —
no orphans) and DoD-6 (colour-diff read of all `.css`/`.vue` changes since
`$EPIC_BASE_SHA` — no new hex/hsl literal or `--color-*` token).

## Decisions

_Runner appends here._
