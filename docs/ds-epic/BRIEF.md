# EPIC — bf-* design system + `/` site build

**Input for `lfg-ccm` (BRIEF mode).** Issue source: [`docs/ds-epic/issues.md`](./issues.md).
Do not restate this brief in issue bodies; link it.

---

## 1. Objective

Build the final `bf-*` design system (≈46 components) and the page templates that
make `/` a complete BFNA site, on top of the already-validated `/wireframes/*`
prototype. Components are presentational-only; a build-time normaliser turns the
six wireframe data snapshots into canonical JSON, exposed as six `@nuxt/content`
`data` collections with zod schemas and read by thin data composables. The
wireframe layer is the specification and is preserved untouched. The last issues
retire the legacy stack at `/` and install the redirect map.

## 2. Definition of done (EPIC)

| # | Gate | Check |
|---|---|---|
| DoD-1 | Site prerenders | `cd bfna-website-nuxt && npx nuxt generate` exits 0 |
| DoD-2 | Types clean | `cd bfna-website-nuxt && npm run typecheck` exits 0 |
| DoD-3 | Every template reachable from nav | Each route in §7 is linked from `bfNav` or `bfFooter` (menus data), no orphans |
| DoD-4 | `wf-*` source byte-identical | The `wf-*` **source files** — `pages/wireframes/**`, `components/wireframe/**`, `layouts/wireframe.vue`, `composables/useWfContent.ts`, `public/css/wireframe.css`, `assets/wireframe-data/**` — are byte-identical to their pre-epic state: `git diff --stat $EPIC_BASE_SHA -- bfna-website-nuxt/src/pages/wireframes bfna-website-nuxt/src/components/wireframe bfna-website-nuxt/src/composables/useWfContent.ts bfna-website-nuxt/src/layouts/wireframe.vue bfna-website-nuxt/public/css/wireframe.css bfna-website-nuxt/src/assets/wireframe-data` → **empty**. The **rendered output** of `/wireframes/*` MAY change as a side-effect of composition-layer bug fixes (issues 03–05 land in the shared composition stylesheets, which `wf-*` files consume but this gate does not cover) — that is expected, not a DoD-4 failure. |
| DoD-5 | Legacy retired | No file under `bfna-website-nuxt/src/components/legacy/`; redirect map from `02-legacy-retirement-inventory.md` §E live |
| DoD-6 | No new colour | `git diff $EPIC_BASE_SHA -- '*.css' '*.vue'` introduces no new colour literal or `--color-*` token |

`$EPIC_BASE_SHA` = tip of `dev` when issue #1 starts. Record it in issue #1's journal.

## 3. Repo and run configuration

| Key | Value |
|---|---|
| Repo | `ccmdesign/bfna-website-migration-2` |
| App root | `bfna-website-nuxt/` (all `src/`, `content/`, `content.config.ts`, `package.json` paths below are relative to it) |
| `BASE_BRANCH` | **`dev`** — stated explicitly; do not run branch detection |
| `MERGE_POLICY` | **`auto`** — merge on green CI; `dev` is an integration branch |
| `WORKTREE_ROOT` | `$(dirname $MAIN_REPO)/bfna-website-migration-2-wt`, one worktree per issue at `$WORKTREE_ROOT/gh<ISSUE_NUMBER>` (the `.claude/worktrees/` paths in this repo belong to interactive sessions — do not use them) |
| `DOCS_ROOT` | `docs/` (repo root, **not** under `bfna-website-nuxt/`) |
| Per-issue spec | `docs/ds-epic/issues/<NN>-<slug>.md` — authored by the item-runner in its own issue, then committed |
| Execution model | Sequential, isolated. Issue N+1 branches from freshly-pulled `dev` with N merged. **Issue order in `issues.md` IS dependency order.** |

## 4. Decisions of record (D1–D10), in runner terms

| ID | Rule |
|---|---|
| **D1** | Prefix is `bf-*` everywhere. `bfna-website-nuxt/CLAUDE.md` and `AGENTS.md` still say `ccm*`-first and **item-runners read them** — issue **01** amends both (prefix, CSS-var pattern `--_bf-{component}-{property}`, presentational-only rule, data pipeline) and lands `design-system-approach.md` in `_process/scoping/` amended to `bf-*`. **Nothing else may run before issue 01.** |
| **D2** | New pages live at `/`. `/wireframes/*` and every `wf-*` file (components, layout, `useWfContent.ts`, `public/css/wireframe.css`, `src/assets/wireframe-data/*.json`) are **preserved untouched** — no shared edits, no refactor that reaches into them. Legacy pages/components at `/` are retired in the final issues (57–59) with the redirect map from `02-legacy-retirement-inventory.md` §E. |
| **D3** | Data pipeline: 6 wireframe snapshots → **build-time normaliser script** → canonical per-collection JSON under `content/bf/**` → **6 `data`-type `@nuxt/content` collections with zod schemas** (`zod ^4` present; 12 collections already exist — copy that pattern) → thin data composables that only `queryCollection` → props. Every synthesis `useWfContent` does today (`heading→name` rename, `PENDING` chips, `FEATURED_SLUGS`/`NAV_SLUGS` curation, `GRID_ORDER`, board flag, hub filters, HTML strip/decode) moves **into the normaliser**. Later the Directus importer targets the same canonical shape. `people.json` keys on **`people`**, not `items`; `announcements.json` `items` is a **single object**, not an array — schemas must say so. |
| **D4** | Scope = all `bf-*` components from `component-inventory-v2.md` §2 (~46) **and** the page templates so `/` is a complete site: home, program hub, project detail, insight detail, insights list (filters + archive link), archive, about, search (semantic **pattern** as in the wireframe — simulated ranking is acceptable), 404. |
| **D5** | Base styling = existing Utopia space/type scale + existing colour tokens + CUBE composition. Every state and variant present, accessible (WCAG 2.1 AA), deliberately unbranded. **No art direction. No new colours.** |
| **D6** | `BASE_BRANCH=dev`, `MERGE_POLICY=auto` — see §3. Sequential isolated runs; order is dependency order. |
| **D7** | Plane epics **E0–E5 (BF-150…BF-215) are superseded**. Cancelling them is a human/Plane task (§8), **not an issue**. `BF-` ids appear in `issues.md` for provenance only — never create, move, or comment on those cards. |
| **D8** | Components are **presentational-only**: props in, events out. No `queryCollection`, no store, no data composable inside any `bf-*` component — **nav and footer included** (they take a `menus` prop from the layout). Cards use base + typed wrapper: `bfCard` (slots `default`/`chips`/`media`) → `bfCardInsight` / `bfCardProject` / `bfCardFeatured` / `bfCardPerson` / `bfCardProgram` / `bfCardProduct` / `bfCardRow`. `data-span="full"` is a **grid-slot modifier on `bfCard`**, not a component. |
| **D9** | Composition-layer fixes come immediately after issue 01 (issues 03–05): `data-gap` honoured on **every** primitive (`.stack`/`.cluster`/`.switcher`/`.grid`, alias `data-space`), `data-min-width` actually working on `.grid`, `data-measure` resolved. The 7 hand-pinned `grid-template-columns` sites all live in `wf-*` files, which D2 freezes — so they are **not** edited in place: their `bf-*` successors (issues 42, 47, 53, 36) are data-driven via `.grid[data-min-width]` and no `bf-*` file may ship a hand-pinned column count. Everything else lays out on this. |
| **D10** | The program-hub template renders the Insights band **conditionally per hub** (matches the as-built `[area].vue`). |

## 5. Ground rules — every issue, no exceptions

1. **Never touch `/wireframes` or any `wf-*` file.** Not to refactor, not to share code, not to fix a bug you notice there. If a fix seems to require it, the fix is wrong — solve it in the `bf-*` layer. DoD-4 is checked at the end and a violation fails the epic.
2. **Never add a colour.** No new hex/hsl literal, no new `--color-*` token. Use the existing semantic tokens (`--color-primary`, `--color-text`, `--color-surface`, …); never a primitive directly. hsl format, not oklch.
3. **Presentational-only** (D8). A `bf-*` component that imports a composable reading content, or calls `queryCollection`, is a defect.
4. **CSS-variable pattern** `--_bf-{component}-{property}`, style binding via a computed `cssVars`, semantic tokens over primitives, `@layer` order `reset, defaults, tokens, themes, components, utils, overrides`. `$attrs` fallthrough on every component; wrappers use `inheritAttrs: false` + `v-bind="$attrs"` on the base.
5. **One component (or one template) per issue.** The only permitted bundles are the ones this brief names, because the parts are internal to one component and must be demoed together: `bfNav` + its menu-link and dropdown children (35), `bfFormField` + `bfFormGroup` (34), `bfGridInsights` + `bfGridProjects` (42), `bfSkipLink` + the `[data-external]` marker (19).
6. **Both gates must pass before the PR opens**: `cd bfna-website-nuxt && npm run typecheck` and `cd bfna-website-nuxt && npx nuxt generate`. Use `npx nuxt generate`, **not** `npm run generate` — the latter runs `contentImporter.js`, which needs Directus secrets that are not in the checkout.
7. **Route collisions.** A template issue that takes a route currently served by a legacy page file deletes **only that one page file** in the same issue (a route can have one page). All other legacy retirement is phase 7. The affected files are named in each template issue's paragraph.
8. **Specs live at `docs/ds-epic/issues/<NN>-<slug>.md`.** The runner writes its spec/decisions there and links them from the journal. **Never edit this brief and never edit `issues.md`.**
9. **A11y**: WCAG 2.1 AA. One `h1` per page, sequential heading levels, visible focus, keyboard-operable nav and disclosure widgets, `alt` required on content images.
10. **Real content, not lorem.** Components must tolerate real excerpt lengths (100–980 chars). Acceptance for every component: it renders the same data its `wf-*` counterpart renders in the matching `/wireframes/*` slot.
11. **Shared types.** All shared TS types live in `src/types/bf-contracts.ts` (issue 02 creates it; issue 09 adds the zod-inferred entity types Insight, Project, Program, Person, Page, Announcement). Every bf-* component imports types from there and nowhere else. No component declares a shared type inline.

## Probe pages

Each `bf-*` component issue that needs a live render adds one route at
`src/pages/bf-probe/<nn>-<slug>.vue`, rendering the component with
representative sample data; that issue's acceptance check runs against it.
Probes are dev-only and never linked from nav; the final cutover issue (59)
deletes `src/pages/bf-probe/` before the epic closes.

### The console gate and the smoke set (gh#200, from residual #199)

`npx tsx scripts/check-probes.ts` fails on **any console message at `error`
level** on any page it opens, probes included, and a full run also opens eight
**real routes** — `/`, `/insights`, `/about`, `/archive`, `/projects`,
`/search`, one `/insights/:slug` and one `/projects/:slug` (both slugs derived
from `.output/public`, never hard-coded). Those eight assert nothing about
layout: the contract is *"this page hydrates and says nothing"*.

Why both halves exist: #199 was a hydration mismatch in the shared shell
(`Hydration completed but contains mismatches.`), which fails no build, breaks
no assertion, and leaves a page that still looks right while Vue throws away
the server markup and re-renders it. Probe pages could never have caught it —
a probe composes `bf-probe`, not `bf-default`. Both channels are read
(`Runtime.consoleAPICalled` for what the page says, `Log.entryAdded` for what
the browser says, e.g. a 404 on a `/_nuxt/*.js` chunk), and a smoke route must
also prove it actually hydrated (`#__nuxt.__vue_app__`), so a page whose entry
chunk 404s cannot pass by having nothing to say.

Two limits, stated so nobody has to rediscover them:

- The gate is **blind to compiler-hoisted static subtrees** — Vue hydrates a
  `createStaticVNode` by advancing the node pointer without comparing content,
  so a mismatch confined to static markup emits nothing on any channel. It
  catches every mismatch that reaches a dynamic node, which is every mismatch
  #199 was about.
- `--ignore-console <regex>` drops matching text before judging. It exists
  because the shell links one third-party stylesheet and a gate with no escape
  hatch turns a network hiccup into a merge blocker. It defaults to nothing, so
  the committed behaviour is strict and using it is a visible act on a command
  line — not a way to make a real failure go away.

`--only <nn>` still runs one probe and skips the smoke set, so the per-issue
acceptance keeps its current cost; `--only smoke` runs the eight routes alone.

## 6. Data contract (fixed names — do not invent variants)

Collections registered in `bfna-website-nuxt/content.config.ts`, all `type: 'data'`, source `content/bf/<name>/*.json`:

| Collection | Source snapshot | Shape note |
|---|---|---|
| `bfInsights` | `insights.json.items` (354) | `featured` (8) and `retired_news` (9) become boolean/bucket fields on the item, not separate collections |
| `bfProjects` | `projects.json.items` (38 — declared count 37 is wrong) | normaliser materialises `pending`, `exclude_from_grid`, `external_only`, `microsite_cta`, `podcast`, grid order |
| `bfPrograms` | `programs.json.items` (3) | `heading → name`; `legacy_workstreams` dropped |
| `bfPeople` | `people.json.**people**` (13) | top-level key is `people`; `board` flag materialised |
| `bfPages` | `pages.json.items` (7 — declared count 1 is wrong) | needs a real schema; 17 fields available |
| `bfAnnouncements` | `announcements.json.items` — **a single object** | emitted as one document; `status === 'published'` gate stays in the composable |

Site chrome (the hardcoded `MENUS` structure) is not a snapshot: the same normaliser emits it as `src/assets/bf-data/menus.json` with an exported type, read by the layout and passed as props to `bfNav`/`bfFooter` (D8). This keeps the collection count at six.

Composables (`src/composables/data/bf*.ts`) only `queryCollection` + filter/sort. Pure formatters (`formatLabel`, `kindLabel`, `monthYear`, `paragraphs`) live in `src/utils/format.ts`. `plain()` does **not** survive as a component-side helper — HTML strip/decode happens in the normaliser.

## 7. Routes the epic must serve at `/`

`/` · `/{program}` (3 program hubs, via `pages/[program].vue` with `definePageMeta({ validate })` against known program slugs so unmatched single segments still fall through to the legacy catch-all until issue 58) · `/insights` · `/insights/:slug` · `/projects` · `/projects/:slug` · `/about` (absorbs `/team` as `#team` / `#board`) · `/search` · `/archive` · 404 via `src/error.vue`.

## 8. Human / Plane tasks (NOT issues — the orchestrator creates these on the epic)

| Task | Owner | When |
|---|---|---|
| Cancel Plane epics E0–E5 (BF-150, BF-151, BF-152, BF-153, BF-154, BF-155) and their children, each with a comment linking this epic | Claudio | at STRUCTURE time |
| **Review checkpoint 1 — data + composable layer** (after issue 13): schemas match the canonical shape, counts are right, no synthesis left in components | Claudio | after issue 13 merges |
| **Review checkpoint 2 — first template** (after issue 47, Home): visual parity with `/wireframes`, no new colour, a11y pass | Aline + Claudio | after issue 47 merges |
| Resolve `bfContactSection` keep-vs-decompose and the person-modal open decision if the runner escalates them | Claudio | issues 44 / 24 |
| ~~Confirm program-slug parity with GGS taxonomy~~ — final, decided: `democracy`, `transatlantic-relations-global-challenges`, `future-leadership` | Claudio | resolved |

## 9. Epic-closing verification

```bash
cd bfna-website-nuxt
npm ci
npm run typecheck                 # DoD-2
npx nuxt generate                 # DoD-1
cd ..
git diff --stat $EPIC_BASE_SHA -- \
  bfna-website-nuxt/src/pages/wireframes \
  bfna-website-nuxt/src/components/wireframe \
  bfna-website-nuxt/src/composables/useWfContent.ts \
  bfna-website-nuxt/src/layouts/wireframe.vue \
  bfna-website-nuxt/public/css/wireframe.css \
  bfna-website-nuxt/src/assets/wireframe-data      # DoD-4: must print nothing
test ! -d bfna-website-nuxt/src/components/legacy                # DoD-5
```

Plus a manual crawl of every route in §7 from the nav (DoD-3) and a colour-diff read of the CSS changes (DoD-6).

## 10. Issue source

The ordered, dependency-aware issue index is **[`docs/ds-epic/issues.md`](./issues.md)** — 59 issues in eight phases. Use it verbatim as the unit decomposition: `#` order is execution order, the `depends-on` column is the `Blocked-by` mapping, and no issue depends on a higher-numbered issue.
