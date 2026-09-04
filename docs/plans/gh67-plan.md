# gh#67 (issue 58) — delete the legacy component + page stack

Spec: `docs/ds-epic/issues/58-cutover-legacy-retire.md`
Inventory: `docs/ds-epic/02-legacy-retirement-inventory.md` §A, §B, §C, §D, §E
Folded residuals: #206 (splat targets 404), #207 (`src/server/**` dead), #208 (`/blog/*` unruled)

Written by the runner rather than `ce-plan`: the dependency analysis this plan
rests on was done in-turn (usage grep of every legacy component, layout, page,
composable and server handler), and re-deriving it in a planning skill would
have produced the same list at the cost of a second full pass. Fallback is the
runner file's documented alternative.

## Approach

Deletion only, plus the three folded residual fixes and the config edits the
deletions force. Nothing is rewritten; no new component surface.

### 1. Components (02 §B, spec §Scope)

- `src/components/legacy/**` — all 23 files (atoms 2, molecules 14, organisms 5,
  templates 2).
- `src/components/templates/UpdatesPageTab.vue` → directory becomes empty, removed.
- `src/components/custom/projectCard.vue` → directory becomes empty, removed.
- `src/components/docs/DocsTabs.vue` (0 usages; `components/docs/demos/**` stays).

Kept, untouched: `components/ds/**`, `components/docs/demos/**`,
`components/content/**` (spec puts it out of scope), `components/bf/**`,
`components/wireframe/**`.

### 2. Layouts

- `src/layouts/legacy-base.vue` (spec).
- `src/layouts/base.vue` — **forced addition to the spec's list**: it
  `import`s `~/components/legacy/organisms/{Frame,Footer}.vue` at module scope,
  so it cannot survive step 1, and its only consumer is `pages/test-base-layout.vue`,
  which this issue deletes. Recorded as a Decision on the spec.

Left alone (orphaned but compiling, out of the spec's enumerated set):
`article-layout.vue`, `docs2.vue`, `enhanced-hybrid.vue` → residual issue.

### 3. Pages

`updates.vue`, `archives/index.vue`, `team.vue`, `podcasts/index.vue`,
`podcasts/[slug].vue`, `[...slug].vue`, `blog/index.vue`, `blog/[...slug].vue`,
`test.vue`, `test-base-layout.vue`. The four workstream directories named in the
spec are already gone (deleted by #48). `pages/bf-probe/**` stays (removed by #68).

### 4. Composables

- `src/composables/legacy/**` — all 7. Each verified: every consumer is a file
  deleted above, or none at all.
- `src/composables/data/*` **except** the six `useBf*.ts` — 25 files. Each
  verified by grep: consumers are only the deleted pages, or the other doomed
  composables (`useWorkstream` ← `useWorkstreamNavigation`/`useHeroImage`), or
  nothing. `useHighlights` appears in `useBfInsights.ts` only inside a prose
  comment, not an import.
- Left alone: `src/composables/use*.ts` at the top level. `useSlugify` is used by
  the kept `ccmCard`; `useExternalImage` keeps a vitest spec; the other three are
  pre-existing orphans unrelated to this deletion.

### 5. Dead server tree — residual #207

Delete `src/server/**` (five handlers plus `tsconfig.json`). Nuxt 4 resolves
`serverDir` to `<rootDir>/server`, so nothing under `src/server` has ever run.
Diffed against the live pair first: both live copies are different, older
implementations, and `/api/search` is now consumed by nothing (`/search` is the
`bf-*` page). `component-docs/index.get.ts` has no live counterpart and is not
ported — it is a `catch` fallback behind `import('~/public/component-docs/index.json')`
in `pages/docs/index.vue`, has never been reachable, and `/docs` renders from the
static JSON. Recorded in the spec.

### 6. Config forced by the deletions

- `src/nuxt.config.ts` `components:` — drop the `components/legacy` and
  `components/templates` entries (both directories cease to exist).
- `bfna-website-nuxt/CLAUDE.md` — the "Nitro API routes" line points at
  `src/server/`; re-point it at `server/`.
- `scripts/verify-bf-logo.ts` — sections 2, 3 and 6 read the two deleted legacy
  logo files. Made to `skip()` when they are absent rather than hard-fail, so the
  script's remaining checks stay runnable.

### 7. Redirect fixes — residuals #206 and #208

`server/utils/legacy-redirect-rules.ts` grows a third family table,
`LEGACY_REDIRECT_COLLAPSE_PREFIXES` — `<from>/<rest>` → `<to>`, splat **dropped**:

| from | to | why |
|---|---|---|
| `/digital-economy/*` | `/transatlantic-relations-global-challenges` | #206 |
| `/future-of-work/*` | `/future-leadership` | #206 |
| `/blog/*` | `/insights` | #208 |

`/podcasts/*` → `/projects/:splat` stays splat-preserving in
`LEGACY_REDIRECT_PREFIXES`: `/projects/[slug].vue` is a real two-segment route.
The program hubs are served by `pages/[program].vue`, which compiles to
`/:program()` — one segment — so a preserved splat can only 404, which is what
#206 measured. Consumers updated in lockstep: the middleware, the `_redirects`
generator (emission **and** `reservedSegments()`), and `verify-legacy-redirects.ts`
(both halves, including the "no extra rules" count).

## Test strategy

Gates, in the app dir:

1. `npx nuxt typecheck` — count `error TS` lines, must be ≤ 176 (recorded
   baseline), and 0 in `src/(components/bf|types|composables/bf)|content.config`.
2. `npx nuxt generate` — exit 0.
3. `npx tsx scripts/check-probes.ts` — exit 0 (full run: 38 probes + 8 smoke routes).
4. `npm run redirects:check` then `npx tsx scripts/verify-legacy-redirects.ts --static-only`,
   and the live half against `nuxt dev`.
5. Wireframe byte-identity: `git diff --stat f757a649... HEAD -- <the five wf paths>`
   prints nothing.

Issue-specific:

6. Every `test !` / `test -d` line in the spec's acceptance block.
7. A repo-wide grep proving no surviving reference to any deleted module.
8. 404 behaviour: with the catch-all gone, `curl` an unknown one-segment path on
   `nuxt dev` → 404 rendering `src/error.vue`; and `.output/public/404.html`
   exists and carries the `bf-default` shell.
9. `_redirects` present in `.output/public`, and every §E target that is a
   generated route has a file behind it there.
10. `/docs` and `/wireframes` render (browser step 6).

## Risks

- **Auto-import fallout.** Legacy molecules were auto-imported by bare tag
  (`AnnouncementCard`, `ProductCardThin`). Mitigated by the post-deletion grep
  (7) plus `nuxt generate`, which fails to resolve an unknown component.
- **Slug-map drift.** `reservedSegments()` reads the top level of `src/pages`, and
  seven of those names disappear. All seven are also named in the rule table, so
  the reserved set is unchanged — asserted by `npm run redirects:check` reporting
  the artefacts unchanged after regeneration.
- **Prerender crawl.** Links to `/blog` survive in `ccmTopbar`/`article-layout`
  (kept DS files). `failOnError: false` and the rules 301 them; no gate depends on
  them.
- **Scope creep.** The three orphaned layouts and `scripts/verify-css-classes.ts`
  (which points at a sibling repo that does not exist here) are left alone and
  handed off as residuals rather than folded in.
