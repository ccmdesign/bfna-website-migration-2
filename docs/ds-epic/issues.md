# Issue index — bf-* design system + `/` site build

Ordered, dependency-aware. **Row order is execution order**; `depends-on` is the
`Blocked-by` map. No issue depends on a higher-numbered issue. Brief:
[`docs/ds-epic/BRIEF.md`](./BRIEF.md). Per-issue specs go to
`docs/ds-epic/issues/<NN>-<slug>.md` (a later wave — do not create them here).

Paths are relative to `bfna-website-nuxt/` unless prefixed with `docs/` or `_process/`.
`BF-` ids are **provenance only** — Plane epics E0–E5 are cancelled (brief §8).
Every issue additionally passes `npm run typecheck` and `npx nuxt generate`; the
`verify` column names the issue-specific check on top of that.

---

## Index

| # | slug | title | type | depends-on | builds-from | consumes | provenance | verify |
|---|---|---|---|---|---|---|---|---|
| **Phase 0 — Docs** |
| 01 | `bf-docs-amendments` | Amend app docs to the bf-* contract | docs | — | new | none | D1; digest E.1 | `grep -n 'ccm' CLAUDE.md AGENTS.md` returns no prefix/CSS-var rule |
| **Phase 1 — Composition** |
| 02 | `bf-scaffold` | `components/bf/` + auto-import prefix + contracts file | composition | 01 | new | none | v2 §2; E0 task 8 | stub `<bf-probe/>` auto-imports and renders |
| 03 | `composition-gap-api` | `data-gap` honoured on every primitive | composition | 01 | new | none | BF-176; v2 §2 L0 | probe page: 4 primitives × 3 gap values render 3 distinct gaps |
| 04 | `composition-grid-min-width` | `.grid[data-min-width]` responsive contract | composition | 03 | new | none | BF-178; v2 §2 L0 | grid reflows 3→2→1 col at 1200/800/400px, no inline columns |
| 05 | `composition-data-measure` | `data-measure` universal rule | composition | 03 | new | none | BF-177; v2 §2 L0 | `data-measure` caps line length on `p`, `div`, `li` |
| 06 | `token-hygiene` | Dead-token cleanup + icon-utility decision | composition | 01 | new | none | BF-183, BF-165; digest B | `npm run validate:tokens`; no `--colors-*` in `public/**` |
| **Phase 2 — Data** |
| 07 | `data-normaliser-core` | Normaliser: insights, projects, programs | data | 01 | `src/assets/wireframe-data/*.json` | none (writes) | D3; 01 §D/§F | `npm run data:normalise` writes 354/38/3 files under `content/bf/` |
| 08 | `data-normaliser-rest` | Normaliser: people, pages, announcements, menus | data | 07 | `src/assets/wireframe-data/*.json` | none (writes) | D3; 01 §D | writes 13/7/1 docs + `src/assets/bf-data/menus.json` |
| 09 | `data-collections` | 6 `bf*` collections + zod schemas | data | 08 | `content.config.ts` | defines all 6 | ADR-2; 01 §F | `queryCollection('bfInsights').count()` = 354 in a probe page |
| 10 | `format-utils` | `utils/format.ts` pure formatters | data | 01 | `useWfContent.ts` helpers | none | 01 §E | vitest: `formatLabel`/`kindLabel`/`monthYear`/`paragraphs` unit tests green |
| 11 | `composables-insights` | `useBfInsights` | data | 09, 10 | `useWfContent.ts` | `bfInsights` | 01 §E | probe: active + archived counts = 354; `bySlug` resolves |
| 12 | `composables-projects-programs` | `useBfProjects`, `useBfPrograms` | data | 11 | `useWfContent.ts` | `bfProjects`, `bfPrograms` | 01 §E | probe: `gridProjectsByProgram` order matches `GRID_ORDER` |
| 13 | `composables-people-pages-site` | `useBfPeople`, `useBfPages`, `useBfSite` | data | 11 | `useWfContent.ts` | `bfPeople`, `bfPages`, `bfAnnouncements` | 01 §E | probe: board/team split = 13 people; announcement gated on `published` |
| **Phase 3 — Atoms** |
| 14 | `bf-logo` | `bfLogo` | atom | 02, 06 | new (`legacy/atoms/Logo*.vue`) | none | BF-158 | both variants render; no new colour |
| 15 | `bf-button` | `bfButton` | atom | 02, 06 | `.wf-button` | none | BF-156 | variant/size matrix renders; `to`/`href`/`button` all keyboard-operable |
| 16 | `bf-chip` | `bfChip` incl. toggle variant | atom | 02, 06 | `wfChip.vue` | none | BF-157; as-built D.3 | span/link/anchor/toggle render; toggle emits `update:modelValue` |
| 17 | `bf-media` | `bfMedia` | atom | 02, 06 | `wfMedia.vue` | none | BF-159 | ratio + placeholder fallback render; `alt` required when `src` set |
| 18 | `bf-time` | `bfTime` | atom | 02, 10 | new | none | BF-160 | emits `<time datetime="ISO">`, label = `monthYear` |
| 19 | `bf-skip-link` | `bfSkipLink` + `[data-external]` marker | atom | 02 | `.wf-skip-link`, `[data-external]` | none | BF-161, BF-162 | skip link visible on focus, targets `#main`; marker documented |
| **Phase 4 — Molecules** |
| 20 | `bf-card` | `bfCard` base (+ `data-span="full"`) | molecule | 02, 03 | `wfCard.vue` | none | BF-190; D8 | 3 slots render; `span="full"` spans `1 / -1` in a `.grid` |
| 21 | `bf-card-insight` | `bfCardInsight` | molecule | 20, 16, 18 | `wfCardInsight.vue` | `bfInsights` (type) | BF-192 | renders a real 980-char insight; archive chip conditional |
| 22 | `bf-card-project` | `bfCardProject` | molecule | 20, 16, 17 | `wfCardProject.vue` | `bfProjects` (type) | BF-193 | media/chips on-off matrix; external ↗ marker present |
| 23 | `bf-card-featured` | `bfCardFeatured` | molecule | 20, 17 | `wfCardFeatured.vue` | `bfInsights` (type) | BF-195 | 16/9 media + Featured chip render |
| 24 | `bf-card-person` | `bfCardPerson` + modal decision | molecule | 20, 17 | `wfCardPerson.vue` | `bfPeople` (type) | BF-197, BF-174 | 1/1 portrait, `job_title` fallback `—`; decision written to spec |
| 25 | `bf-card-program` | `bfCardProgram` | molecule | 20 | `wfCardProgram.vue` | `bfPrograms` (type) | BF-200; as-built E | prop type is the real `Program`, not an inline shape |
| 26 | `bf-card-product` | `bfCardProduct` | molecule | 20, 17, 16 | `wfCardProduct.vue` | `bfProjects` (type) | v2 §4 E3 (no BF-id) | linked vs plain+pending branches; `span="full"` default |
| 27 | `bf-card-row` | `bfCardRow` dense list row | molecule | 20, 16, 18 | new (6th wrapper) | `bfInsights`/`bfProjects` (types) | BF-202 | renders both entity types from one prop union |
| 28 | `bf-breadcrumb` | `bfBreadcrumb` | molecule | 02 | `wfBreadcrumb.vue` | none | BF-204 | linked + plain crumbs; `aria-current="page"` on last |
| 29 | `bf-byline` | `bfByline` (+ naming-collision fix) | molecule | 02, 18 | new | none | BF-205; v2 §5 | renders author + `bfTime`; `ccmByLine` untouched |
| 30 | `bf-filter-bar` | `bfFilterBar` | molecule | 16 | raw `.wf-chip` toggles | none | BF-209; as-built D.3 | multi-select emits; arrow-key roving focus |
| 31 | `bf-accordion` | `bfAccordion` | molecule | 02 | raw `<details>` in `archive.vue` | none | BF-211 | native `<details>` semantics preserved, keyboard-operable |
| 32 | `bf-load-more` | `bfLoadMore` | molecule | 02, 15 | inline button in `insights/index.vue` | none | BF-213 | hides at `hasMore=false`; announces new count politely |
| 33 | `bf-empty-state` | `bfEmptyState` / `bfNotFound` | molecule | 02, 15 | 3× duplicated block | none | BF-214; as-built D.1 | one `h1`, back-link renders |
| 34 | `bf-form-field` | `bfFormField` + `bfFormGroup` | molecule | 02 | new | none | BF-207 | label/field association, error + required states, demoed together |
| **Phase 5 — Organisms** |
| 35 | `bf-nav` | `bfNav` (+ internal menu link, dropdown) | organism | 02, 14, 16 | `wfNav`, `wfNavDropdown`, `wfMenuLink` | `menus` prop only | BF-163; D8 | zero data access; dropdowns keyboard + Esc |
| 36 | `bf-footer` | `bfFooter` | organism | 35, 04 | `wfFooter.vue` | `menus` prop only | BF-164; D8 | zero data access; 4 columns via `data-min-width` |
| 37 | `bf-hero` | `bfHero` | organism | 02, 15 | `wfHero.vue` | none | BF-166 | heading/description props + actions slot |
| 38 | `bf-page-header` | `bfPageHeader` | organism | 28, 16 | `wfPageHeader.vue` | none | BF-167 | crumbs + chips (prop or slot) + single `h1` + tagline |
| 39 | `bf-section` | `bfSection` | organism | 02, 03, 05 | `wfSection.vue` | none | BF-168 | `fullWidth` has CSS behind it; no prop leaks to DOM |
| 40 | `bf-cta-section` | `bfCtaSection` | organism | 39, 15 | `wfCtaSection.vue` | none | BF-169; D2 | CTA-buttons only; no `form` prop exists |
| 41 | `bf-notice` | `bfNotice` | organism | 02 | `.wf-note` | none | BF-170 | variants render; `role="status"` where announced |
| 42 | `bf-grids` | `bfGridInsights` + `bfGridProjects` | organism | 04, 21, 22 | `wfGridInsights/Projects.vue` | `bfInsights`/`bfProjects` (types) | BF-171; D9 | zero inline `grid-template-columns`; reflows via `data-min-width` |
| 43 | `bf-search-shell` | `bfSearchShell` | organism | 30, 27 | inline `search.vue` | none | BF-172 | input + facets + results + relevance meter, all props/events |
| 44 | `bf-contact-section` | `bfContactSection` | organism | 39, 34, 15 | `wfContactSection.vue` | none | v2 §4 E4 (no BF-id) | form composed from `bfFormField`; keep-vs-decompose recorded |
| 45 | `bf-prose` | `bfProse` | organism | 02 | `wfProse.vue` | none | v2 §1a (Insight detail); as-built A | markdown-lite and legacy-HTML paths both render |
| **Phase 6 — Templates** (nav order) |
| 46 | `layout-bf-shell` | Site shell layout | template | 35, 36, 19, 41, 13 | `layouts/wireframe.vue` | `bfAnnouncements`, menus module | BF-194 | nav/footer receive props; skip link first in DOM |
| 47 | `page-home` | Home `/` | template | 46, 37, 25, 22, 23, 26, 42 | `pages/wireframes/index.vue` | `bfPrograms`, `bfProjects`, `bfInsights`, `bfAnnouncements` | BF-196 | `/` renders 4 bands; `pages/index.vue` deleted |
| 48 | `page-program-hub` | Program hub `/{program}` | template | 46, 38, 42, 33, 12 | `pages/wireframes/[area].vue` | `bfPrograms`, `bfProjects`, `bfInsights` | BF-198; D10 | 3 hubs prerender; Insights band conditional |
| 49 | `page-insights-index` | Insights list `/insights` | template | 46, 38, 42, 30, 32, 11 | `pages/wireframes/insights/index.vue` | `bfInsights` | BF-199 | filters narrow results; load-more paginates; archive link present |
| 50 | `page-insight-detail` | Insight detail `/insights/:slug` | template | 46, 38, 45, 42, 41, 33 | `pages/wireframes/insights/[slug].vue` | `bfInsights` | BF-201 | 354 routes prerender; archive banner conditional |
| 51 | `page-projects-index` | Projects index `/projects` | template | 46, 38, 42, 12 | `pages/wireframes/projects/index.vue` | `bfProjects`, `bfPrograms` | BF-203 | one band per program + pending-retag band |
| 52 | `page-project-detail` | Project detail `/projects/:slug` | template | 46, 38, 45, 40, 42, 16, 33 | `pages/wireframes/projects/[slug].vue` | `bfProjects`, `bfInsights` | BF-206 | external and full branches both render |
| 53 | `page-about` | About `/about` | template | 46, 38, 24, 44, 39, 04 | `pages/wireframes/about.vue` | `bfPeople`, `bfPages` | BF-208 | `#team`/`#board` anchors exist; `pages/about.vue` deleted |
| 54 | `page-search` | Search `/search` | template | 46, 38, 43, 27, 11, 12 | `pages/wireframes/search.vue` | `bfInsights`, `bfProjects`, `bfPrograms` | BF-210; D4 | query returns ranked results; `pages/search.vue` deleted |
| 55 | `page-archive` | Archive `/archive` | template | 46, 38, 31, 16, 18, 11 | `pages/wireframes/archive.vue` | `bfInsights` | BF-212 | one accordion per year, counts match `archived` |
| 56 | `error-404` | 404 / error page | template | 46, 33 | 3× duplicated block, `src/error.vue` | none | BF-214; D4 | unknown route renders `bfEmptyState`, status 404 |
| **Phase 7 — Cutover** |
| 57 | `cutover-redirects` | Redirect map + legacy route retirement | cutover | 47–56 | `server/middleware/redirects.ts` | none | 02 §D, §E | every row of 02 §E resolves 301/410 as specified |
| 58 | `cutover-legacy-retire` | Delete the legacy component + page stack | cutover | 57 | `components/legacy/**`, dead code | none | BF-215; 02 §A, §B | `src/components/legacy/` gone; build green |
| 59 | `cutover-config-verify` | Config touchpoints + epic verification | cutover | 58 | `nuxt.config.ts`, search-index script | none | 02 §D | prerender list covers §7; DoD-1…DoD-6 all pass |

---

## Phase 0 — Docs

## 01 bf-docs-amendments

Amend `bfna-website-nuxt/CLAUDE.md` and `bfna-website-nuxt/AGENTS.md` so item-runners read the current contract: components are `bf-*` in `src/components/bf/` (not `ccm*` in `ds/`), CSS variables use `--_bf-{component}-{property}`, components are presentational-only (props in, events out — nav and footer included), and the data pipeline is snapshots → normaliser → `content/bf/**` → six `bf*` collections → composables → props. Copy `design-system-approach.md` from the `lucid-bhaskara-fc1b6c` worktree into `_process/scoping/`, amended to `bf-*` throughout. Record `$EPIC_BASE_SHA` (tip of `dev`) in the journal. **Out:** renaming or touching existing `ccm*` components. **Accept:** neither app doc states a `ccm` prefix or `--_ccm-` pattern rule.

## Phase 1 — Composition

## 02 bf-scaffold

Create `src/components/bf/` and register it in `nuxt.config.ts` `components:` with `prefix: 'bf'` and `pathPrefix: false`, so `src/components/bf/Card.vue` auto-imports as `<bfCard>`. Add `src/types/bf-contracts.ts` holding the shared prop interfaces (`CardBaseProps`, `Crumb`, `Cta`, `Filter`, `MenuItem`, `Menu`) that later issues intersect with entity types. Ship one throwaway `bfProbe` component to prove auto-import, then delete it in the same issue. **Out:** any real component; any change to the existing `ds/`, `content/`, or `wireframe/` auto-import entries. **Accept:** a `bf-` component resolves without an explicit import and `npm run typecheck` passes.

## 03 composition-gap-api

Make `data-gap` work on `.stack`, `.cluster`, `.switcher` and `.grid` (today it is honoured only on `.grid`, so ~50 wireframe call sites are silent no-ops), with `data-space` accepted as an alias. Values map to the existing Utopia space scale (`3xs`…`xl`); no new spacing values. `.box`, `.frame`, `.cover`, `.reel`, `.imposter`, `.container` are explicitly unchanged. **Out:** editing any `wf-*` file or `public/css/wireframe.css` to consume the fix (D2 freezes them); the fix is additive in the composition stylesheet only. **Accept:** a probe page renders three visibly distinct gaps on all four primitives, and `/wireframes/*` output is unchanged.

## 04 composition-grid-min-width

Make `.grid[data-min-width]` deliver a real responsive contract — `repeat(auto-fill, minmax(min(<value>, 100%), 1fr))` — so column counts derive from available width instead of being pinned. Document the supported values and the interaction with `data-gap` from issue 03. The seven existing hand-pinned `grid-template-columns` sites all live in `wf-*` files and are **not** edited (D2/D9); their `bf-*` successors in issues 36, 42, 47 and 53 consume this instead. **Out:** any inline column count in new code; any `wf-*` edit. **Accept:** a probe grid reflows 3→2→1 columns at 1200/800/400px with no inline style.

## 05 composition-data-measure

Resolve `data-measure`: today it only applies through `.center`, leaving eight stray `<p data-measure>` call sites inert. Make it a universal rule (`[data-measure] { max-width: <value>; }` with the existing measure tokens) in the composition layer. **Out:** changing `.center`'s own behaviour; editing the eight `wf-*` call sites (D2). **Accept:** `data-measure` caps line length on a bare `<p>`, a `<div>` and an `<li>` in a probe page, `/wireframes/*` renders unchanged, and `npm run typecheck` plus `npx nuxt generate` pass.

## 06 token-hygiene

Clean the token layer without adding a colour: delete the dead `--colors-*` block (unresolved SCSS placeholders shipping as literals), fix the `--color-black` comma bug, untangle `semantic-colors.css` (duplicate `--color-neutral`, `error→fail` ordering), and resolve the two conflicting `.icon` utilities — record the Material Symbols vs Material Icons decision (BF-165) in the issue spec and implement only the de-duplication. **Out:** new colours, new tokens, palette changes, any icon-component build. **Accept:** `npm run validate:tokens` passes, no `--colors-*` remains under `public/`, and both light and dark modes render unchanged on `/wireframes/index` and `/docs`.

## Phase 2 — Data

## 07 data-normaliser-core

Write `scripts/normalise-wireframe-data.ts` (npm script `data:normalise`) reading `src/assets/wireframe-data/*.json` **read-only** and emitting one canonical JSON document per item under `content/bf/{insights,projects,programs}/`. It performs the synthesis that `useWfContent` does today: HTML strip/entity-decode, excerpt derivation, `programs.heading → name` (dropping `legacy_workstreams`), the `PENDING` chip map, `FEATURED_SLUGS`/`NAV_SLUGS` curation flags, `GRID_ORDER`, and `featured`/`retired_news`/`archived` as item fields. **Out:** people, pages, announcements, menus (issue 08); any collection registration; Directus. **Accept:** the script writes 354 insight, 38 project and 3 program files and is idempotent across two runs.

## 08 data-normaliser-rest

Extend the normaliser to the remaining three snapshots and site chrome. `people.json` keys on **`people`**, not `items` (13 docs, `board` flag materialised from the flag or a "board" job title). `pages.json` yields 7 docs with the full field set, not the 3 fields the inline wireframe type reads. `announcements.json.items` is a **single object**, emitted as one document. The hardcoded `MENUS` structure is emitted as `src/assets/bf-data/menus.json` plus an exported type. **Out:** collection registration; any composable. **Accept:** 13/7/1 documents written, the menus module type-checks, and re-running the script is a no-op in `git status`.

## 09 data-collections

Register six `type: 'data'` collections in `content.config.ts` — `bfInsights`, `bfProjects`, `bfPrograms`, `bfPeople`, `bfPages`, `bfAnnouncements` — each sourced from `content/bf/<name>/*.json` with a full zod schema, following the pattern of the twelve existing collections (zod ^4 is already a dependency). Schemas are the entity contracts: export the inferred types for card props. **Out:** touching the twelve existing collections; any new dependency; a seventh collection for menus (they are a typed module, brief §6). **Accept:** a probe page's `queryCollection('bfInsights')` returns 354 items, all six collections type-check, and `npx nuxt generate` passes.

## 10 format-utils

Create `src/utils/format.ts` with the pure formatters ported from `useWfContent`: `formatLabel(format)` (defaults to `'Article'`), `kindLabel(kind)`, `monthYear(date)`, `paragraphs(text)`. Same names, same signatures, no Vue imports, unit-tested with vitest. `plain()` is deliberately **not** ported — HTML strip/decode belongs to the normaliser (issue 07), and no component may re-derive it. **Out:** any composable; any component; date-library dependencies. **Accept:** vitest covers each function including the empty/null input path, and no file under `src/components/bf/` imports `plain`.

## 11 composables-insights

Port the insight surface to `src/composables/data/useBfInsights.ts`, wrapping `queryCollection('bfInsights')` only: `items`, `active` (non-archived, `publish_date` desc), `archived`, `bySlug`, `activeByProgram`, `archivedCountByProgram`, `highlights` (the curated featured set), `insightsForProject`. Same names and signatures as the wireframe composable so page code is a one-line swap. No synthesis: every rename, flag and curated order already exists in the data from issue 07. **Out:** projects, programs, people, pages, announcements, menus; any component importing this. **Accept:** a probe page reports `active.length + archived.length === 354`, `bySlug` resolves a known slug, and typecheck passes.

## 12 composables-projects-programs

Port the project and program surface to `useBfProjects` / `useBfPrograms`: `projects` (top-level only), `projectsByProgram`, `gridProjectsByProgram` (active, on-site, grid-eligible, in the curated `GRID_ORDER`), `productsByProgram`, `allProducts`, `projectsPendingRetag`, `projectBySlug` (children included), `projectChildren`, `navProjects`, `featuredProjects`, `programs`, `programBySlug`. Thin `queryCollection` wrappers plus filter/sort — the curation flags come from the normaliser. **Out:** re-deriving any curated order in the composable; component usage. **Accept:** a probe page shows `gridProjectsByProgram` returning the client-ordered set for each of the 3 programs and `projectChildren` sorted desc.

## 13 composables-people-pages-site

Port the remaining surface: `useBfPeople` (`people`, `boardMembers`, `teamMembers` alphabetical by last name), `useBfPages` (`pageBySlug`, `aboutPage`, `stiftungPage`, `homePage`), and `useBfSite` (`announcement`, gated on `status === 'published'`, plus `menus` read from the typed module of issue 08). The layout — not any component — calls `useBfSite` (D8). **Out:** any `bf-*` component consuming these; a menus content collection. **Accept:** a probe page shows board + team summing to 13, `aboutPage()` resolving, and the announcement returning `undefined` when unpublished. This issue is **review checkpoint 1** (brief §8).

## Phase 3 — Atoms

## 14 bf-logo

Build `bfLogo` in `src/components/bf/`, consolidating `legacy/atoms/Logo.vue` and `LogoWhite.vue` into one component with `variant: 'default' | 'white'`. Inline SVG, `currentColor`-driven where possible, sized by a `--_bf-logo-size` variable, accessible name via `role="img"` + `<title>`, `$attrs` forwarded to the root. The wireframe layer has no logo component, so the legacy markup is the visual source — evolve, do not rebrand. **Out:** deleting the legacy files (issue 58); new colours. **Accept:** both variants render at three sizes on a probe page and the component contains no colour literal.

## 15 bf-button

Componentise `.wf-button` as `bfButton`: renders `NuxtLink` for `to`, `<a>` for `href` (with the `[data-external]` marker when external), `<button>` otherwise. Props `variant` (primary and the unstyled default), `size`, `disabled`; default slot for the label. Styling from existing semantic tokens through `--_bf-button-*`; visible focus ring; disabled state non-focusable. **Out:** icon-only or loading variants (no wireframe evidence); new colours. **Accept:** the full variant × size × element matrix renders on a probe page, every instance is keyboard-reachable with a visible focus state, and no `.wf-button` file is modified.

## 16 bf-chip

Evolve `wfChip` into `bfChip` with four modes: span (default), `to` → `NuxtLink`, `href` → anchor (with `external` marker), and the **new** `toggle` mode — a `<button>` with `aria-pressed`, `modelValue`/`update:modelValue`, and a real `active` style class replacing the inline-style hack duplicated twice in `search.vue`. Active state is CSS, never an inline `style` binding. **Out:** filter-row layout or multi-select logic (issue 30); editing `wfChip.vue`. **Accept:** all four modes render on a probe page, the toggle emits on click and Space/Enter, and `aria-pressed` tracks state.

## 17 bf-media

Evolve `wfMedia` into `bfMedia`: `src`, `alt`, `ratio` (default `16/9`), rendering a real `<img>` when `src` is present and the placeholder box otherwise, with the ratio applied through `--_bf-media-ratio` rather than an inline style. Use `@nuxt/image` (`NuxtImg`) since the module is installed, with `loading="lazy"` and explicit dimensions to avoid layout shift. `alt` is required whenever `src` is set. **Out:** art direction, `<picture>` source sets, lightbox. **Accept:** a probe page renders 1/1, 3/2 and 16/9 in both real and placeholder states with no cumulative layout shift.

## 18 bf-time

New atom `bfTime`: takes `date` (ISO string) and optional `format`, renders `<time :datetime="iso">` with the human label from `utils/format.ts` `monthYear` by default. Handles null/invalid dates by rendering nothing rather than `Invalid Date`. This closes the v1 "date display" gap — the wireframes emitted bare `<time>` markup inline. **Out:** relative-time ("3 days ago"), timezone handling, i18n. **Accept:** unit tests cover a valid date, an empty string and `null`; the rendered `datetime` attribute is always a valid ISO value when the element renders.

## 19 bf-skip-link

Componentise the visually-hidden-until-focus skip link as `bfSkipLink` (props: `target` defaulting to `#main`, default slot for the label), and formalise the `[data-external]` attribute marker as a documented style hook plus a small `isExternal(href)` helper in `utils/format.ts`-adjacent code so `bfButton`/`bfChip`/`bfCard*` all mark external links identically. **Out:** an external-link *component* (it is an attribute, per the inventory); the layout wiring (issue 46). **Accept:** the skip link is the first focusable element on a probe page, becomes visible on focus, moves focus to the target, and the marker renders on an external anchor.

## Phase 4 — Molecules

## 20 bf-card

Evolve `wfCard` into the `bfCard` base: an `<li>` shell with slots `media`, `chips` and `default`, no entity props, `$attrs` fully forwarded, and the `data-span="full"` grid-slot modifier (`grid-column: 1 / -1`) exposed as a `span?: 'full'` prop that sets the attribute. Media and chips keep their visual ordering via CSS `order`, not markup order. This is the inheritance root for all seven typed wrappers and stays public for direct slot use. **Out:** any entity-specific markup; any wrapper. **Accept:** a probe page renders the base with all three slots filled, and `span="full"` spans every column inside a `.grid[data-min-width]`.

## 21 bf-card-insight

Typed wrapper `bfCardInsight` over `bfCard`: props `insight: Insight` (the zod-inferred type from issue 09), `extraChips?`, `excerpt = true`, `excerptLength = 140`. Renders the format chip via `formatLabel`, a conditional Archive chip, the linked heading, the excerpt, and the date through `bfTime`. `inheritAttrs: false` with `v-bind="$attrs"` on the base. **Out:** grid or column concerns (issue 42); fetching anything. **Accept:** it renders a real 980-character insight without overflow, the archive chip appears only for archived items, and the component imports no composable and calls no `queryCollection`.

## 22 bf-card-project

Typed wrapper `bfCardProject`: props `project: Project`, `media = false`, `mediaRatio = '3/2'`, `chips = true`, `excerptLength = 140`. Renders kind and pending chips, the linked heading with the external ↗ marker when `external_url` is set, the excerpt (falling back to `description`), and optional `bfMedia`. Pending projects render unlinked with the pending chip, exactly as the wireframe does. **Out:** the full-width product variant (issue 26); grid layout. **Accept:** the media × chips matrix renders, an external project shows the marker and opens the external URL, and a pending project renders no link.

## 23 bf-card-featured

Typed wrapper `bfCardFeatured`: prop `item: Insight`, renders a 16/9 `bfMedia`, a "Featured" chip and the linked heading with a short excerpt, matching the homepage highlights strip. Thin by design — no extra props until the rule of three is met. **Out:** carousel or strip layout (that belongs to the home template, issue 47); a featured variant of `bfCardInsight` (they are separate wrappers, per the inventory). **Accept:** it renders the eight curated `featured` insights from `bfInsights` on a probe page with no data access inside the component, and the heading links to `/insights/:slug`.

## 24 bf-card-person

Typed wrapper `bfCardPerson`: prop `person: Person`, renders a 1/1 `bfMedia` portrait, the name and `job_title` with the `—` fallback. Also **resolve the open modal-vs-detail-page decision (BF-174)** in `docs/ds-epic/issues/24-bf-card-person.md`: the card ships unlinked (matching the wireframe) and the decision is recorded with its rationale; escalate to the human task list if the answer needs Claudio. **Out:** building a modal, a person detail route, or a bio expander in this issue. **Accept:** board and team members both render, missing portraits fall back to the placeholder, and the decision file exists and is linked from the journal.

## 25 bf-card-program

Typed wrapper `bfCardProgram`: prop `program: Program` — the real zod-inferred entity type, **fixing** the as-built defect where `wfCardProgram` declared an ad-hoc inline `{slug,name,tagline?,short?}` shape and the caller constructed a matching object. Renders the linked program name plus optional tagline/short text. **Out:** the programs row layout (issue 47); adding fields to the program schema. **Accept:** the component's props type is imported from the collection types, `npm run typecheck` fails if a caller passes the old inline shape, and all 3 programs render.

## 26 bf-card-product

New seventh wrapper `bfCardProduct` (D4; no Plane id — proposed in v2 §4 E3): the external-only product/magazine card, e.g. Transponder. Props `product: Project`, `excerptLength = 220`. Sets `span="full"` on `bfCard` by default, renders `bfMedia`, chips, and a title linked to `external_url` — or unlinked with a pending chip when there is no URL. **Out:** changing `bfCard`'s span mechanism (issue 20 owns it); a products index route. **Accept:** it renders full-width inside a multi-column `.grid`, both the linked and pending branches render, and the external marker is present on the link.

## 27 bf-card-row

New wrapper `bfCardRow`: the dense list row used by search results and the archive accordion, which the wireframes left as un-componentised inline chip + link + `<time>` markup. Props: `item: Insight | Project` plus an optional `variant`; renders a chip, the linked heading and `bfTime` on one line, wrapping gracefully at narrow widths. Built on `bfCard` with a compact preset so the family stays consistent. **Out:** the results list or accordion containers (issues 43, 55); relevance meters. **Accept:** both entity types render from the single prop union, and a 980-character heading wraps without breaking the row.

## 28 bf-breadcrumb

Evolve `wfBreadcrumb` into `bfBreadcrumb`: prop `items: Crumb[]` (from `types/bf-contracts.ts`), rendering `<nav aria-label="Breadcrumb">` with an ordered list, linked crumbs via `NuxtLink` and the final crumb plain with `aria-current="page"`. Separators are CSS, not text nodes. **Out:** deriving crumbs from the route (pages pass them in); truncation logic. **Accept:** a 1-item and a 4-item trail both render, screen-reader output names the landmark, the last crumb is not a link, and the component contains no data access.

## 29 bf-byline

New molecule `bfByline` for article bylines — author plus optional date via `bfTime` — and resolve the long-standing `ccmByLine` naming collision by leaving the existing footer-credit component untouched and documenting in the issue spec that `bfByline` is the article byline and has no relationship to it. **Out:** renaming or editing `components/ds/organisms/ccmByLine.vue`; avatars; multi-author lists beyond a simple joined string. **Accept:** the component renders author-only and author+date forms, `npm run typecheck` passes, and the spec file records the naming resolution.

## 30 bf-filter-bar

Rebuild the filter chip row as `bfFilterBar`, composing `bfChip[toggle]`: props `filters: Filter[]` and `modelValue` (array), emitting `update:modelValue`; roving-tabindex keyboard navigation and an accessible group label. This replaces four hand-rolled call sites (two divergent implementations in `search.vue` plus raw chip buttons in `archive.vue`, `insights/index.vue` and `projects/[slug].vue`). **Out:** applying filters to data (pages own that); editing the wireframe call sites (D2). **Accept:** multi-select toggling emits the expected array, arrow keys move focus within the group, and no inline `style` binding drives the active state.

## 31 bf-accordion

New molecule `bfAccordion`: a styled skin over native `<details>`/`<summary>` with props `label` and optional `open`, plus a default slot. Keeps native semantics and keyboard behaviour — no custom ARIA disclosure re-implementation. Styling via `--_bf-accordion-*` from existing tokens; the marker is CSS. **Out:** exclusive/single-open accordion-group behaviour, animation of `height`, and editing the hand-rolled `<details>` blocks in `archive.vue` (D2). **Accept:** it opens and closes by mouse and keyboard, content inside is reachable in the tab order only when open, and it nests inside `bfSection` without layout breakage.

## 32 bf-load-more

New molecule `bfLoadMore`, replacing the inline load-more button in the insights feed: props `hasMore: boolean`, `loading?`, `label?`, emits `load`. Renders `bfButton`, hides itself entirely when `hasMore` is false, and exposes a polite live-region count so keyboard and screen-reader users learn how many items were added. **Out:** owning pagination state or slicing arrays (the template owns that); infinite scroll. **Accept:** clicking emits `load` once per click, the component disappears at `hasMore=false`, and the announced count updates when the caller changes it.

## 33 bf-empty-state

New molecule `bfEmptyState` (aliased `bfNotFound`), replacing the block duplicated verbatim at three wireframe call sites: props `heading`, `message?`, `backLabel?`, `backTo?`, default slot for custom content. Renders one `h1` (so a not-found page has exactly one), the message and the back link. Centred through the composition layer, not bespoke CSS. **Out:** the 404 route itself (issue 56); the three wireframe call sites (D2). **Accept:** heading-only, heading+link and slot forms all render; a probe page using it as the sole content has exactly one `h1`.

## 34 bf-form-field

New molecules `bfFormField` and `bfFormGroup`, built and demoed together per the interdependent-components rule. `bfFormField`: `label`, `modelValue`, `type`, `required`, `hint`, `error`, with a generated id linking label, control, hint (`aria-describedby`) and error (`aria-invalid`). `bfFormGroup`: `<fieldset>`/`<legend>` wrapper with stacked spacing from `data-gap`. Consolidates the three hardcoded form idioms in the wireframe contact section. **Out:** validation logic, submission, a form organism (issue 44). **Accept:** a demo page shows text/email/textarea fields in default, required, hint and error states, all label-associated, and axe reports no violations.

## Phase 5 — Organisms

## 35 bf-nav

Rebuild the top bar as `bfNav`, absorbing the menu-link and dropdown as internal children (`src/components/bf/nav/`), built and demoed together. **Prop `menus: Menu[]` — no `useWfContent`, no composable, no `queryCollection` (D8; this is the exact anti-pattern the as-built `wfNav` has).** Dropdowns use native `<details>` with sibling-closing behaviour, Esc-to-close and focus return; includes the logo (`bfLogo`) and the search entry point. **Out:** the layout wiring and the menus data source (issue 46); an off-canvas mobile drawer beyond a responsive disclosure. **Accept:** the component renders entirely from a fixture `menus` array, is fully keyboard-operable, and greps clean for data access.

## 36 bf-footer

Evolve `wfFooter` into `bfFooter`: brand block, four menu columns rendered from the **`menus: Menu[]` prop** (same D8 fix as `bfNav` — the as-built version calls `useWfContent().menus()` directly), social links and the legal row. The four-column layout uses `.grid[data-min-width]` from issue 04 — no hand-pinned `grid-template-columns` anywhere in the file. Reuses the internal menu-link child from issue 35. **Out:** the search form (search lives in nav), a subscribe band (killed by D2), the layout wiring. **Accept:** it renders from a fixture array, reflows to fewer columns at narrow widths, and contains no inline column style and no data access.

## 37 bf-hero

Evolve `wfHero` into `bfHero`: the homepage hero with optional `heading` and `description` props and a default slot for action buttons, rendered as a full-bleed band with the taller minimum height the wireframe uses. Heading level is the page `h1` and is not configurable away. Composition classes and `data-gap` drive spacing; sizing comes from the Utopia type scale. **Out:** background imagery or art direction (D5), carousels, inner-page headers (issue 38). **Accept:** heading-only, heading+description and heading+description+actions all render; the hero contributes exactly one `h1`; no new colour appears in the stylesheet.

## 38 bf-page-header

Evolve `wfPageHeader` into `bfPageHeader` — the inner-page hero used by eight templates: props `label?`, `crumbs?: Crumb[]`, `chips?: string[]`, `heading?`, `tagline?: string | string[]`, plus `default` and `chips` slots. Composes `bfBreadcrumb` and `bfChip`, and renders the page's single `h1` with taglines as one or several paragraphs. **Out:** page-specific content such as the search input or filters (the templates add those into the default slot); deriving crumbs from the route. **Accept:** all five prop permutations render, chips work as strings and as slot content, and a page using it has exactly one `h1`.

## 39 bf-section

Evolve `wfSection` into `bfSection`, the base band every template composes: props `label?`, `heading?`, `gap? = 'm'`, `layout?: 'stack' | 'switcher' | 'cluster' | 'plain'`, `measure?`, `padded?`, `fullWidth?`, default slot. Two known defects are fixed here: `fullWidth` gets real CSS behind it instead of being a no-op, and props stop leaking onto the DOM as junk attributes. Absorbs the split and video section variants as `layout` options rather than separate components. **Out:** CTA, contact and page-header specialisations (issues 40, 44, 38); the `data-compact` band chrome. **Accept:** every layout value renders correctly, `fullWidth` visibly breaks out, and the rendered `<section>` carries no stray prop attributes.

## 40 bf-cta-section

Evolve `wfCtaSection` into `bfCtaSection`, composing `bfSection`: props `label?`, `heading?`, `message?`, `ctas?: Cta[]`, rendering `bfButton`s with the first CTA primary unless a `primary` flag overrides. **Scope-narrowed by D2: the email-capture/subscribe variant is dead — the `form` prop does not exist in `bfCtaSection`, and no subscribe band is built anywhere in this epic.** **Out:** any form, any email capture, the global subscribe band, the nav subscribe button. **Accept:** the three wireframe call sites (Microsite CTA and the two Participation-path bands) render from props alone, and the component source contains no `form` element and no `form` prop.

## 41 bf-notice

Componentise the raw `.wf-note` box as `bfNotice`: prop `variant?` (note/info/warning drawn only from existing semantic tokens) and a default slot, rendering with `role="status"` where the message is announced dynamically and as a plain block otherwise. Replaces three raw `<p class="wf-note">` usages (two in search, one as the insight archive banner). **Out:** new colours for the variants, dismissal behaviour, toasts, the site announcement band's layout (issue 46). **Accept:** each variant renders distinguishably using existing tokens only, contrast passes AA in light and dark modes, and the component adds no colour literal.

## 42 bf-grids

Evolve both grid wrappers together — `bfGridInsights` (props `insights: Insight[]`, `excerptLength?`, `extraChips?`) and `bfGridProjects` (props `projects: Project[]`, `excerptLength?`) — as thin data-in/cards-out `<ul class="grid">` organisms wrapping `bfCardInsight` and `bfCardProject`. **They consume `.grid[data-min-width]` from issue 04; hand-pinned `grid-template-columns` is forbidden (D9), and column policy is expressed as a `minWidth` prop.** **Out:** fetching data, a unified shared grid base (not enough evidence yet), the two raw page-level grids (their templates own those). **Accept:** both reflow responsively at 1200/800/400px, and `grep -n 'grid-template-columns' src/components/bf` returns nothing.

## 43 bf-search-shell

New organism `bfSearchShell`, extracting the page-inline search UI: the query input (with a debounced `update:query` event), the facet row via `bfFilterBar`, the results list via `bfCardRow`, the result count, the empty state via `bfEmptyState`, and the bespoke relevance meter as a small internal bar driven by a 0–1 `score` on each result. Entirely props-in/events-out; ranking happens in the page. **Out:** ranking, indexing, embeddings, the `/search` route (issue 54). **Accept:** it renders a fixture result set with scores, emits query and facet changes, shows the empty state at zero results, and performs no data access.

## 44 bf-contact-section

Evolve `wfContactSection` into `bfContactSection`, composing `bfSection` with `layout="switcher"`: the contact form built from `bfFormField`/`bfFormGroup` (replacing the hardcoded markup) beside the visit-us block, with copy supplied by props rather than hardcoded. **Resolve the open keep-vs-decompose decision** in the issue spec: keep it as one component (matching the as-built reality) with the form composed from field molecules, and record why. **Out:** form submission, an endpoint, spam protection, real contact copy (props take placeholders until content lands). **Accept:** the section renders from props, every field is label-associated and axe-clean, and the decision is written to `docs/ds-epic/issues/44-bf-contact-section.md`.

## 45 bf-prose

Port `wfProse` to `bfProse`: renders a body string as block-level content, handling both the markdown-lite path (h2/h3/p/ul) and the legacy-HTML strip path, with heading levels starting at `h2` so the template keeps a single `h1`. Typography comes from the existing type scale and `data-measure` from issue 05 — not from the retired legacy `.prose` system. Not present in inventory §2; traceable to §1a's Insight-detail row and as-built §A. **Out:** MDC/`ContentRenderer` integration (bodies arrive as strings from `data` collections), sanitising untrusted input, custom prose components. **Accept:** both source formats render correctly, no `h1` is emitted, and line length is capped.

## Phase 6 — Templates

## 46 layout-bf-shell

Build `src/layouts/bf-default.vue`, the site shell for every `/` route: `bfSkipLink`, `bfNav` and `bfFooter` receiving `menus` as props from `useBfSite()`, the conditional announcement band using `bfNotice`, and the `<main id="main">` landmark. **The layout is the only data reader in the view tree (D8).** `layouts/wireframe.vue` is not touched or shared (D2). **Out:** any page content; the subscribe band (D2); route registration. **Accept:** a probe route using the layout renders nav, footer and skip link, the announcement band appears only when the announcement is published, and no `bf-*` component references a composable.

## 47 page-home

Build `src/pages/index.vue` on `bf-default`, replacing the legacy home page (delete `pages/index.vue`'s legacy content in this issue — it is the only file this issue retires). Bands, in wireframe order: announcement (layout-owned) → `bfHero` → Programs (`bfSection` switcher, `bfCardProgram`) → Featured projects (`bfSection`, grid, `bfCardProject` with media, chips off) → Insights (`bfCardProduct` + `bfCardFeatured` band, then `bfGridInsights`). Consumes `bfPrograms`, `bfProjects`, `bfInsights`, `bfAnnouncements` via composables in the page. **Out:** any other legacy page; new sections. **Accept:** `/` renders all bands with real data, no inline column styles remain, and both gates pass. **Review checkpoint 2** (brief §8).

## 48 page-program-hub

Build `src/pages/[program].vue` on `bf-default` with `definePageMeta({ validate })` against the known program slugs, so unmatched single-segment URLs still fall through to the legacy catch-all until issue 58. Sections: `bfPageHeader` hub intro → "Projects in this area" (`bfGridProjects`) → **Insights band rendered conditionally per hub (D10)** → `bfEmptyState` fallback for an unknown slug. Deletes the four legacy workstream index pages it replaces (`pages/{democracy,digital-world,future-leadership,politics-society}/index.vue`). **Out:** the removed "Other programs" cross-links row (killed, BF-173); tabs. **Accept:** all 3 program routes prerender, at least one hub renders without an Insights band, and the fallback renders for `/not-a-program`.

## 49 page-insights-index

Build `src/pages/insights/index.vue`: `bfPageHeader` → filters band (`bfFilterBar` over format and program facets, state in the page) → results (`bfGridInsights`) → `bfLoadMore` → a link to `/archive` for archived items. Uses `useBfInsights().active` and filters client-side, exactly as the wireframe does. Filter state lives in the URL query so results are linkable. **Out:** server-side filtering, saved filters, a store (Pinia stays rejected), the archive page itself (issue 55). **Accept:** `/insights` prerenders, selecting a facet narrows the grid, load-more appends a page of results, and the empty result set renders `bfEmptyState`.

## 50 page-insight-detail

Build `src/pages/insights/[slug].vue`: `bfPageHeader` (chips, date, format) → conditional archive banner (`bfNotice`) → body (`bfSection` narrow, `bfMedia` + `bfProse`) → related insights (`bfGridInsights`) → `bfEmptyState` for an unknown slug. Route params come from `useBfInsights().bySlug`; related items reuse the active-by-program helper. **Out:** comments, sharing widgets, prev/next navigation, a byline unless the data carries an author. **Accept:** all 354 slugs prerender under `npx nuxt generate`, an archived insight shows the banner, a non-existent slug renders the empty state with one `h1`, and `plain()` appears nowhere in the page.

## 51 page-projects-index

Build `src/pages/projects/index.vue`: `bfPageHeader` → one `bfSection` per program (v-for over `useBfPrograms().programs`, each rendering `bfGridProjects` from `gridProjectsByProgram`) → a conditional "Pending re-tag" band from `projectsPendingRetag`. Ordering comes from the normaliser's curated `GRID_ORDER`, never re-derived here. **Out:** filters or search on this page, the project detail route (issue 52), product-only listings. **Accept:** `/projects` prerenders with one band per program in curated order, the pending band appears only when that set is non-empty, and pending projects render unlinked with their chip.

## 52 page-project-detail

Build `src/pages/projects/[slug].vue` with both wireframe branches. External branch: `bfPageHeader` → Microsite CTA (`bfCtaSection`) → Participation path (`bfCtaSection`) → related insights. Full branch: `bfPageHeader` → body (`bfProse`) → Participation path → conditional Episodes band (podcast data) → conditional Outcomes/alumni band (cohort children, `bfChip`) → related insights. Unknown slug renders `bfEmptyState`. Consumes `bfProjects` (incl. `projectChildren`) and `bfInsights` (`insightsForProject`). **Out:** an audio player, a podcasts index route (410 per 02 §E). **Accept:** one external and one full project both prerender with their correct band sets; conditional bands are absent when their data is empty.

## 53 page-about

Build `src/pages/about.vue` on `bf-default`, deleting the legacy `pages/about.vue` (the only file this issue retires). Sections: `bfPageHeader` mission → "Board of Directors" (`bfCardPerson` grid, `id="board"`) → "Team" (`bfCardPerson` grid, `id="team"`) → Bertelsmann Stiftung (`bfSection` switcher, `bfMedia` + text) → `bfContactSection`. Grids use `.grid[data-min-width]`, not the wireframe's pinned three columns (D9). Copy comes from `bfPages` (`aboutPage`, `stiftungPage`); people from `bfPeople`. **Out:** a standalone `/team` route (redirected in issue 57); person detail pages. **Accept:** `/about` prerenders, both anchors resolve, and 13 people render across the two grids.

## 54 page-search

Build `src/pages/search.vue`, deleting the legacy `pages/search.vue` (the only file this issue retires; its `/api/search` + `public/search.json` backend is retired in issue 59). Renders `bfPageHeader` + `bfSearchShell`, with ranking implemented in the page over `bfInsights`, `bfProjects` and `bfPrograms`: **the semantic search PATTERN as the wireframe shows it — a simulated relevance score is acceptable (D4)** — token overlap plus field weighting, with the score feeding the relevance meter. Query and facets live in the URL. **Out:** embeddings, a vector index, a server route, `@nuxt/content` full-text search. **Accept:** `/search?q=…` prerenders and returns ranked, facet-filterable results; an empty query renders the empty state.

## 55 page-archive

Build `src/pages/archive.vue`: `bfPageHeader` → a `bfAccordion` per year (descending) listing archived insights as `bfCardRow` with `bfChip` and `bfTime`, plus optional program facets via `bfFilterBar`. Data from `useBfInsights().archived`; year grouping happens in the page. Note the route is singular `/archive`, while the legacy route is `/archives` — the redirect is issue 57's job. **Out:** the legacy `/archives` page (retired in 58), pagination, restoring archived items. **Accept:** `/archive` prerenders, per-year counts sum to `archived.length`, every accordion is keyboard-operable, and the newest year is open by default.

## 56 error-404

Rewrite `src/error.vue` to use `bf-default` chrome plus `bfEmptyState`, distinguishing 404 from 500 by message while keeping one `h1` and a back link to `/`. This closes the "3× duplicated not-found block" finding at the page level; the component-level fix already shipped in issue 33. **Out:** error logging or reporting, a custom offline page, changing the wireframe area's inline fallbacks (D2). **Accept:** an unknown route renders the 404 with the correct status code under `npx nuxt generate` + preview, the page renders with nav and footer, and axe reports no violations.

## Phase 7 — Cutover

## 57 cutover-redirects

Implement the redirect map from `02-legacy-retirement-inventory.md` §E in `src/server/middleware/redirects.ts`: `/team → /about#team`, `/updates → /insights`, `/archives → /archive`, `/blog → /insights`, `/podcasts → 410`, `/podcasts/:slug → /projects/:slug`, product and publication catch-all branches to `/projects/:slug` and `/insights/:slug`, `/test` and `/test-base-layout` to 410. Re-point the two existing 301 families (`/digital-economy/*`, `/future-of-work/*`) at the new program slugs. `/docs` and `/docs/*` are explicitly unchanged. **Out:** deleting any page or component (issue 58). **Accept:** every row of 02 §E returns its specified status and target against the generated site.

## 58 cutover-legacy-retire

Delete the legacy stack per `02-legacy-retirement-inventory.md` §A and §B: all of `src/components/legacy/**`, `components/templates/UpdatesPageTab.vue`, `components/custom/projectCard.vue`, `components/docs/DocsTabs.vue`, `layouts/legacy-base.vue`, and the remaining legacy routes (`updates`, `archives`, `team`, `podcasts/**`, `[...slug].vue`, `blog/**`, `test`, `test-base-layout`, the four workstream dirs). **Explicitly kept:** `components/ds/**` (including `ccmTabs`/`ccmTable` — no `bf` work), `components/docs/**` and its demos, `server/api/component-docs/*`, the Directus → `@nuxt/content` pipeline and its 12 collections, and everything under `pages/wireframes/**` (D2). **Out:** `content/**` data; `components/content/**` prose components. **Accept:** `src/components/legacy/` is gone, both gates pass, and `/docs` and `/wireframes/*` still render.

## 59 cutover-config-verify

Close the config touchpoints from `02` §D and run the epic verification: extend `nuxt.config.ts` `nitro.prerender.routes` to cover every route in brief §7 (keeping `/wireframes`), retire `scripts/generate-search-index.ts` with `server/api/search.get.ts` and `public/search.json` (already stale — it reads a path that no longer exists) and drop them from the `build` script, and remove the broken `/global.css`, `/fixes.css`, `/v2updates.css` head links that died with `legacy-base.vue`. Then run DoD-1…DoD-6 from brief §9 and record the results in the journal. **Out:** new features, sitemap or `routeRules` work. **Accept:** all six DoD gates pass, with the `/wireframes` diff empty.
