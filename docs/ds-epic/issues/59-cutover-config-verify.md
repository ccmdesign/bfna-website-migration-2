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

### D-59.1 — the prerender list is generated, not written (#194, #210)

`nitro.prerender.routes` is built at config load from `content/bf/**` file
stems, not hand-listed. The stem **is** the slug — `normalise-wireframe-data.ts`
writes `<slug>.json`, and both detail templates resolve `params.slug` against the
same field — and it is the source `generate-legacy-redirects.ts` already builds
the redirect map from, which is exactly why the two used to disagree. Hand-listing
371 slugs would be wrong by the next content import.

The spec above says "354" insights; the collection holds **371**. Enumerating
from disk means the number is never restated anywhere, so the discrepancy could
not have been introduced and cannot recur.

`crawlLinks` stays **on**. Seeding replaces the crawler for §7, not for `/docs/**`
or for the redirect meta-refresh stubs, and turning it off would have silently
dropped both.

### D-59.2 — `--targets` is where #210 is asserted, and it is opt-in

`verify-legacy-redirects.ts` gained a `--targets` mode: every concrete `301`
destination must have a file behind it in `.output/public`. Splat rows and 410s
are excluded — a `/*` row's destination depends on the request, and a 410 has no
destination. Behind a flag, because it needs a build: run against a missing
`.output/public` it would report 433 failures on a perfectly good checkout.
Asked for and absent is a hard error, never a skip. `npm run redirects:targets`.

Result: **51 unresolved → 0**, on the same 415-row map.

### D-59.3 — the search stack retired, `/search` did not (#211)

02 §D said "retire together with `/search`". `/search` was **replaced**, not
retired: `pages/search.vue` is a `bf-*` page over the `bf*` collections and never
touched the index. What retired is the legacy chain behind the *old* page —
`scripts/generate-search-index.ts`, `server/api/search.get.ts`,
`src/types/search.ts`, `public/search.json`, the `generate:search-index` step in
`build`, and the script entry. gh#67 had already removed the last caller. 02 §D
is amended accordingly.

### D-59.4 — the dead stylesheet copies went with the dead links

Touchpoint 3's `useHead` links died with `legacy-base.vue` in gh#67, so nothing
under `src/layouts/` referenced `/global.css`, `/fixes.css` or `/v2updates.css`
any more. What was still being **published** were the files those links pointed
at: `public/{global,fixes,v2updates,legacy-styles}.css`, 81 KB of stylesheet with
zero referrers. Deleted, with the commented-out `css: []` entries that named
them. The canonical copies stay at `src/public/css-legacy/`, unserved.

### D-59.5 — `check-probes.ts` → `check-routes.ts`, and four verify scripts with it

BRIEF §5 deletes `src/pages/bf-probe/` here (38 pages + `layouts/bf-probe.vue`).
The harness keeps everything gh#200 added — static server, raw-CDP driver,
hydration assertion, two-channel console gate, `/_ipx/` existence gate — because
none of it was ever about probes: #199 was a mismatch on the shared shell that
**no probe could have caught**. It loses the probe verdict convention, the
`data-probe-keys` dispatch and `--only <nn>`, and gains three checks: one `<h1>`
per route, DoD-3 nav reachability, and the cascade-layer gate. Route set is
BRIEF §7, with one representative per detail template (their *existence* is the
prerender gate's job; their *rendering* is one template, exercised once).

`scripts/verify-bf-{button,card-insight,chip,logo}.ts` are deleted too. Each
reads a probe page at module scope and would throw on its first line after the
deletion — a script that crashes on startup is worse than a deleted one. Their
one assertion with a life beyond the probes, `verify-bf-logo.ts` §7's guard on
`postcss-preset-env`'s `cascade-layers: false`, moved into `check-routes.ts` and
widened from `.bf-logo` to every `bf-*` rule. `nuxt.config.ts` and the two
component comments that cited them now cite the new home.

**That widening found a real defect on its first run**: `.bf-project-episodes`
in `pages/projects/[slug].vue` was the one `.bf-*` rule in the entire build
shipping **unlayered**, because the page's `<style scoped>` had no
`@layer components` wrapper — and unlayered author CSS outranks every layer.
Fixed in the same PR.

Placeholder `href="#…"` anchors are **listed, not failed** (#160, #82 wait on the
client), and a fragment naming a real element on the page is not listed at all —
so `/about#board` and a hub's `#projects` are silent and
`#podcast-platform-url`, `#transponder-magazine-url`, `#bluesky-profile-url` are
reported on every run.

### D-59.6 — `scripts/**` is type-checked (#104)

`tsconfig.scripts.json`, a separate Node-lib project rather than a widened app
`include`: these are Node programs, and `check-routes.ts` — which evaluates DOM
expressions *as strings* inside a headless browser — must not be told `document`
exists locally. `npm run typecheck:scripts`, chained into `npm run typecheck`;
`npx nuxt typecheck` stays the app-only gate the epic measures.

It found three errors on the first run, one of them a genuine bug:
`verify-bf-logo.ts:272` referenced `legacyGeometry`, an identifier that exists
nowhere in the file, inside a branch that ran only when a prerendered probe page
was present. Precisely the failure mode #104 predicted. The other two are fixed
in place (`verify-bf-people-pages-site-parity.ts`'s weak-type constraint,
`verify-contentful-deps.ts`'s implicit `any`).

### D-59.7 — `npm ci` → `npm install` (#70)

**The BRIEF §9 and "Acceptance" blocks above say `npm ci`. It cannot work here**
and never could: `bfna-website-nuxt/.gitignore:28` ignores `package-lock.json`,
so no lockfile is committed. Setup for every issue in this epic has been
`npm install --no-audit --no-fund`, and this issue is where that is written
down. The lockfile is deliberately **not** tracked here — committing a 923 KB
dependency snapshot in the epic-closing PR is a change nobody would review, and
#70 stays open for that decision. The cost is real and is #70's to state: two
runs can resolve different versions, so DoD-1 and DoD-2 are reproducible only
within a checkout, not across them.

### D-59.8 — #114 was already fixed by #67

The `[500]` prerender warnings on `/` and `/podcasts` were legacy pages. The
baseline generate on `dev` @ `e119d34`, run before any edit here, has **zero**
`[500]` lines; so does the generate after. Nothing to fix; closed with that
evidence. The related suggestion in #114 — that DoD-1 should assert "no [500] in
the log" rather than only an exit code — is recorded here rather than
implemented: `nuxt generate` is run by hand in this epic and the log is read
each time, and adding a wrapper script for a condition that is currently zero
would be scaffolding without a failure to catch.

### D-59.9 — #212's dead code, minus one

Deleted: `layouts/{article-layout,docs2,enhanced-hybrid}.vue`,
`composables/{useContentItem,useContentStream,useEnhancedDocumentation}.ts`,
`scripts/verify-css-classes.ts` (it referenced a deleted directory *and* a
sibling repo that is not in this checkout). `ccmTopbar.vue`'s `/blog` link is
repointed at `/insights`. `composables/useExternalImage.ts` **stays** — #212
excludes it, because its only importer is a vitest spec and residual #86 puts
the suite out of bounds.

Worth noting for DoD-2: `useEnhancedDocumentation.ts` and `enhanced-hybrid.vue`
carried **45 of the 119** baseline typecheck errors between them.

## Epic-closing verification (BRIEF §9)

`$EPIC_BASE_SHA` = `f757a649361993275a43282456f4746d247be37b`.
Branch `feature/gh68-config-touchpoints-epic-verification`, off `dev` @ `e119d34`
(#67 / PR #209 merged).

| Gate | Check | Result |
|---|---|---|
| **DoD-1** | `npx nuxt generate` exits 0 | **PASS** — exit 0, **1607 routes**, **0 `[500]`** lines. `content/bf/insights` 371 ⇄ `.output/public/insights` **371**; `content/bf/projects` 38 ⇄ **38**. Exact, both directions. |
| **DoD-2** | types clean | **PASS by the epic's gate** (orchestrator decision after #10, residual #71: no *new* errors). `npx nuxt typecheck` **119 → 73**, −46. **0** in `src/components/bf`, `src/types`, `src/composables/bf*`, `content.config.ts`, before and after. Plus `tsc -p tsconfig.scripts.json` → **0** (new coverage, #104). The 73 are pre-existing `ccm*`/docs-layer errors, 57 of them in one file. |
| **DoD-3** | every §7 route linked from `bfNav`/`bfFooter` | **PASS** — asserted in `check-routes.ts` against the rendered `/`: 9/9 rows (`/`, 3 hubs, `/insights`, `/projects`, `/about`, `/search`, `/archive`). Detail routes reach from their list page, and both list pages are opened in the same run. |
| **DoD-4** | `wf-*` source byte-identical | **PASS** — `git diff --stat f757a649… HEAD` over all six frozen paths prints **nothing**; so does the same diff against `dev`. |
| **DoD-5** | legacy retired | **PASS** — no `src/components/legacy/`; redirect map live: `redirects:check` 415 slugs, `verify-legacy-redirects --static-only --targets` **437 assertions, 0 failures**. |
| **DoD-6** | no new colour | **PASS, with one recorded deviation.** The diff since `f757a649…` introduces **no colour literal**. It does add five `--color-*` tokens in `src/public/css/tokens/semantic-colors.css` — `--color-black`, `--color-text-inverse`, `--color-surface-inverse`, `--color-surface-page`, `--color-error` — all from gh#101 / gh#116 (residual #107), and every one an alias over a primitive that already existed at the epic base (`--black-hsl`, `--color-white`, `--color-black`, `--color-fail`). No new colour *value* enters the system. This PR itself changes no `.css` file at all. |

Residuals closed by this issue, with evidence:

| Issue | Evidence |
|---|---|
| #194 | `/projects/cepi-2011` and `/projects/wisdom-of-the-crowd` are in `.output/public`; content ⇄ output is exact in both directions |
| #210 | **51 → 0** unresolved 301 targets, now asserted by `npm run redirects:targets` |
| #211 | four files and one `build` step gone; `/search` unchanged and passing `check-routes` |
| #212 | seven files deleted, `/blog` link repointed; `useExternalImage.ts` deliberately kept |
| #100 | probe verdicts were the thing nobody machine-checked; the probes are gone and `check-routes.ts` machine-checks the real routes instead |
| #104 | `tsconfig.scripts.json` + `typecheck:scripts`; found 3 errors including one genuine bug |
| #129 | probe-crawled thin pages (`/projects/the-transponder` + 5 insight fixture slugs) no longer exist in the output |
| #114 | zero `[500]` lines before and after; fixed by #67 |
