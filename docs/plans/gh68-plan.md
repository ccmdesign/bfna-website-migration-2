# Plan — gh#68, issue 59: config touchpoints + epic-closing verification

**Spec:** [`docs/ds-epic/issues/59-cutover-config-verify.md`](../ds-epic/issues/59-cutover-config-verify.md) ·
**Brief:** [`docs/ds-epic/BRIEF.md`](../ds-epic/BRIEF.md) ·
**Branch:** `feature/gh68-config-touchpoints-epic-verification` off `dev` @ `e119d34` (includes #67 / PR #209)

## Baselines measured before any edit

| Measure | Value on `dev` @ `e119d34` |
|---|---|
| `npx nuxt typecheck` errors | **119** (`grep -cE 'error TS'`); 0 of them in `src/components/bf`, `src/types`, `src/composables/bf*`, `content.config.ts` |
| `npx nuxt generate` | exits **0**, 1598 routes, **zero `[500]` lines** |
| `_redirects` 301 targets with no file in `.output/public` | **51** of 433 rows |
| `content/bf/insights` vs `.output/public/insights` | 371 documents, 330 directories |
| `content/bf/projects` vs `.output/public/projects` | 38 documents, 39 directories (`the-transponder` is a probe-crawl artefact; `cepi-2011` + `wisdom-of-the-crowd` missing — #194) |

## Approach, by work item

### 1. Prerender seeding (spec §1, closes #194 and #210)

`src/nuxt.config.ts` seeds `nitro.prerender.routes` with `['/wireframes', ...probeRoutes]`
only; everything else depends on `crawlLinks` finding a card. A document in no grid, no
featured band and no related list is never linked and therefore never written, which is
both #194 (2 project detail pages) and #210 (51 legacy redirects that 301 into a 404).

Seed the list **at config time from `content/bf/**` file stems** — the stem is the `slug`
field, verified — rather than hand-listing:

* `/`, `/insights`, `/projects`, `/about`, `/search`, `/archive`
* `/<stem>` for each `content/bf/programs/*.json` (3)
* `/insights/<stem>` for each `content/bf/insights/*.json` (371)
* `/projects/<stem>` for each `content/bf/projects/*.json` (38)
* `/wireframes` **kept** (D2) plus its six static pages

`crawlLinks` stays on, so `/docs/**` and the redirect meta-refresh stubs keep generating.
`probeRoutes` is removed with the probe directory.

Assertion: a `--targets` mode on `scripts/verify-legacy-redirects.ts` that fails when any
`_redirects` 301 target has no file in `.output/public`. Target: 0 unresolved.

### 2. Retire the legacy search stack (spec §2, closes #211)

Delete `scripts/generate-search-index.ts`, `server/api/search.get.ts`, `src/types/search.ts`,
`public/search.json`; drop `generate:search-index` from `build` and from `scripts`.
`/search` is `src/pages/search.vue` reading the `bf*` collections and must keep working —
asserted by check-routes.

### 3. Dead legacy stylesheet links (spec §3)

The `useHead` links died with `layouts/legacy-base.vue` in #67; nothing under `src/layouts/`
references `/global.css`, `/fixes.css` or `/v2updates.css` any more. Remaining dead weight:
the commented-out `css: []` entries in `nuxt.config.ts` and the four unreferenced copies at
`public/{global,fixes,v2updates,legacy-styles}.css` (the canonical files live at
`src/public/css-legacy/`). Remove both.

### 4. Dead code from #212

Delete `src/layouts/{article-layout,docs2,enhanced-hybrid}.vue`,
`src/composables/{useContentItem,useContentStream,useEnhancedDocumentation}.ts` and
`scripts/verify-css-classes.ts` (all verified zero-consumer); repoint
`src/components/ds/molecules/ccmTopbar.vue`'s `/blog` link at `/insights`.
`src/composables/useExternalImage.ts` stays — #212 excludes it (residual #86).

### 5. Probe retirement + `check-routes.ts` (BRIEF §5, closes #100, #104, #129)

Delete `src/pages/bf-probe/` (38 pages) and `src/layouts/bf-probe.vue`. Convert
`scripts/check-probes.ts` → `scripts/check-routes.ts`, keeping the #200 half that survives
the probes (static server, CDP driver, hydration gate, two-channel console gate, `/_ipx/`
existence gate) and dropping the probe half (verdict DOM convention, `data-probe-keys`
dispatch, `--only <nn>`). New checks:

* exactly one `<h1>` per route;
* every §7 route reachable from the `bfNav` / `bfFooter` menus rendered on `/` (**DoD-3**);
* placeholder `href="#…"` anchors are **listed, not failed** — #160/#82 wait on Irene.

Route set = §7: `/`, 3 program hubs, `/insights`, `/projects`, `/about`, `/search`,
`/archive`, one `/insights/:slug` and one `/projects/:slug` derived from `.output/public`.

`#129` (probe links crawling thin pages into the output) closes by construction —
`the-transponder` and five insight fixture slugs disappear with the probes.

`#104`: add a `tsconfig.scripts.json` covering `scripts/**` and a `typecheck:scripts` step,
chained into `npm run typecheck`. `npx nuxt typecheck` stays the gate command.

Append a **Retirement** section to `docs/decisions/probe-harness.md`.

### 6. `#114`

Already resolved by #67 — the baseline generate above has zero `[500]` lines because the
two offending routes were legacy pages. Re-verify after the change and close with evidence.

### 7. `npm ci` → `npm install` (#70)

Record in the spec's Decisions that the lockfile is gitignored, so setup is
`npm install --no-audit --no-fund`. Do **not** track the lockfile in this issue.

### 8. Epic verification (BRIEF §9)

Run DoD-1…DoD-6, DoD-4 against `f757a649361993275a43282456f4746d247be37b`, DoD-2 as
"no new errors vs the 119 baseline". Write the results table into the spec and the journal.

## Test strategy

The vitest harness is broken and out of bounds (residual #86). Every gate is a script or a
command:

| Gate | Command |
|---|---|
| DoD-1 | `npx nuxt generate` exits 0, no `[500]` |
| DoD-2 | `npx nuxt typecheck` error count ≤ 119, 0 in the bf-scoped set |
| DoD-3 | `npx tsx scripts/check-routes.ts` — nav reachability rows |
| DoD-4 | `git diff --stat f757a64 HEAD -- <frozen paths>` empty |
| DoD-5 | `test ! -d src/components/legacy` + `redirects:verify` |
| DoD-6 | colour-diff read of `git diff f757a64 HEAD -- '*.css' '*.vue'` |
| #194/#210 | `npx tsx scripts/verify-legacy-redirects.ts --static-only --targets` → 0 unresolved |

## Risks

* **Prerender batching.** Nitro hands seeded routes to the crawler ten at a time; the
  `probeRoutes` comment records that a batch spliced during a failing render is dropped.
  With ~420 seeded routes this is worth asserting rather than assuming — the `--targets`
  run and a count of `.output/public/insights` are the assertion.
* **Build time.** +80 real pages to prerender. Acceptable.
* **`scripts/**` typecheck.** Unknown error count until measured; if it is large, fall back
  to a narrower `include` and record why.
* **`verify-bf-*.ts`** read probe pages that this issue deletes. Left in place: not in the
  enumerated scope, and `nuxt.config.ts` cites `verify-bf-logo.ts` as the guard on the
  `cascade-layers: false` decision. Recorded as a noticed-not-touched item.
