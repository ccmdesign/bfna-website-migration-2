# Guidelines digest — component/data rules + lfg-ccm contract

**Type:** retrieval digest (verbatim quotes, sourced). Compiled for the ds-epic author.
**Do not treat this file as a decision record** — where sources disagree, section E lists both sides unresolved.

---

## A. Component rules

**Prefix — `bf-*` (current), supersedes `ccm*`-first (superseded):**

> "All final components are **`bf-*` prefixed** — this SUPERSEDES the "all new components ccm*-first" rule recorded in `design-system-approach.md`."
> — `~/.claude/projects/-Users-claudiomendonca-Documents-GitHub-ccmdesign-ccm-clients-bfna-bfna-website-migration-2/memory/bf-prefix-and-swap.md`

> "`bf-\*` supersedes the "all new components ccm\*-first" rule in `design-system-approach.md` — that doc needs a one-line amendment when it lands in the main checkout."
> — `_process/scoping/architecture-and-epics.md` (line 7)

> "8. `bf-*` scaffolding: `src/components/bf/` + auto-import prefix config"
> — `_process/scoping/architecture-and-epics.md` (line 83, E0 task list)

The still-live app-level docs have **not** been updated to `bf-*` (see Conflict E.1):

> "- `src/components/ds/`: Design system components prefixed `ccm` (ccmButton, ccmCard, etc.)"
> — `bfna-website-nuxt/CLAUDE.md` (line 34)

> "- Name components in PascalCase (`ccmButton.vue`)
> - Design system components use `ccm` prefix"
> — `bfna-website-nuxt/AGENTS.md` (lines 63–64)

**Presentational-only (props in, events out, no data-layer access):**

> "1. **Presentational-only.** No bf-\* component fetches data or touches the data layer (no `queryCollection`, no composable that reads content, no store). Props + slots in, events out. This is what makes the wf→bf swap mechanical, keeps components testable against fixtures forever, and lets ADR-2's data layer change underneath without touching a single component."
> — `_process/scoping/architecture-and-epics.md` (ADR-1, lines 29)

> "**Explicitly out**: runtime Directus fetch (`utils/directus.ts` stays commented / gets deleted); per-component fetch composables (the commented `useNews.ts` pattern); components reading the data layer at all (even nav/footer take props from the layout)."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 67)

> "Swap strategy: after client validates wireframes, `wf-*` components get swapped for `bf-*` on the same pages, same data. bf-* components are presentational-only (props in, events out, no data-layer access)."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md`

**Inheritance pattern — slot-based base + typed wrappers, composables not mixins/extends:**

> "2. **Inheritance = composition, the Vue 3 way.** For complex components (cards are the exemplar):
>    - **Slot-based base + typed wrappers**: `bfCard` (anatomy sockets: `media` / `chips` / default / `actions`) is the inheritance root. `bfCardInsight`, `bfCardProject`, `bfCardFeatured`, `bfCardPerson`, `bfCardProgram`, `bfCardRow` are thin wrappers: one entity prop (`insight: Insight`) + presentation flags, filling the base's slots. Freedom to customize per card, shared chrome in one place — exactly the wf pattern, kept.
>    - **Shared prop contracts as TS interfaces**, not runtime spreads: `defineProps<CardBaseProps & { insight: Insight }>()` (Vue ≥3.3 supports imported/intersected types). One `types/component-contracts.ts` per family.
>    - **Shared behavior as composables**, not mixins/`extends`: `useExcerpt(text, length)`, `useCardChips(entity)`, `useMediaRatio()`. The options-API `extends`/mixins mechanism is the *old* inheritance logic — composables are its Vue 3 replacement and the thing to standardize on.
>    - **Attrs fallthrough is the composability contract**: every bf-\* component forwards `$attrs` (class, style, `data-*`) to its root; wrappers declare `inheritAttrs: false` and `v-bind="$attrs"` on the base. This is what lets composition classes (`class="bf-card | stack"`, `data-gap`) compose *onto* components from outside — components own meaning, primitives own layout, callers own placement.
>    - **The base is always public.** When a typed wrapper doesn't fit, pages may use `bfCard` + slots directly. No prop grows on a wrapper until the slot version has appeared twice (rule of three, wireframes count as occurrence one)."
> — `_process/scoping/architecture-and-epics.md` (ADR-1, lines 31–36)

**$attrs — same rule restated in memory:**

> "Complex components (esp. cards) use Vue-3-style inheritance: slot-based base + prop-based typed wrappers, shared TS prop contracts, composables (not mixins), $attrs fallthrough."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md`

**Slots-vs-props rule:**

> "3. **Slots-vs-props rule (ratifies the open gap):** cards + heros = prop-based typed wrappers over slot-based bases · sections + page-header = slot-based with convenience props (`label`, `heading`, `layout`) · forms = field/group molecules composed in slots."
> — `_process/scoping/architecture-and-epics.md` (ADR-1, line 38)

**Composables-not-mixins (naming convention, app-level doc):**

> "- Name composables with `use` prefix (`useContentStream.ts`)
> - Utilities in camelCase (`formatDate.ts`)"
> — `bfna-website-nuxt/AGENTS.md` (lines 70–71)

**File layout:**

> "- `src/components/ds/`: Design system components prefixed `ccm` (ccmButton, ccmCard, etc.)
> - `src/components/content/`: Content primitives (ctaSignup, proseSection, Callout, etc.)
> - `src/composables/`: Composition utilities (`useContentItem`, `useContentStream`, `useSlugify`)"
> — `bfna-website-nuxt/CLAUDE.md` (lines 34–36) — *directory names are the pre-`bf-*` layout; see Conflict E.1*

> "src/
> ├── pages/          # File-based routing (keep lean, delegate to components)
> ├── layouts/        # Frame-level templates
> ├── components/
> │   ├── ds/         # Design system components (ccm-prefixed)
> │   └── content/    # Content-specific components
> ├── composables/    # Reusable Vue composition functions
> ├── content/        # Markdown collections (blog, docs)
> ├── public/         # Static assets and layered CSS
> ├── server/         # Nitro API endpoints
> ├── utils/          # TypeScript utilities
> └── tests/          # Vitest test suites"
> — `bfna-website-nuxt/AGENTS.md` (lines 14–26)

**Component Development Standards — 10 non-negotiable standards, referenced not restated in the read scope:**

> "1. **ALWAYS review** [Component Standards](src/content/docs/guidelines/component-standards.md) before starting
> 2. **ALWAYS validate** against all 10 standards before completing
> 3. Reference [Component Design Decisions](src/content/docs/guidelines/component-design-decisions.md) for context
> 4. For systematic migrations, consult `_process/spec-drafts/component-migration-checklist.md`
>
> **Non-negotiable requirements:**
> - All 10 standards MUST be met (CSS variable naming, style binding, design token integration, slot naming, etc.)
> - No exceptions without documented justification
> - Review checklist at end of standards doc must pass
>
> **Key standard highlights:**
> - Use `--_ccm-{component}-{property}` pattern for CSS variables
> - Style binding via computed `cssVars` for props
> - Reference design tokens (semantic > primitive)
> - Provide `size`, `variant`, and `customColor` props where appropriate"
> — `bfna-website-nuxt/CLAUDE.md` (lines 106–120) — CSS variable pattern still says `--_ccm-*`; not reconciled with `bf-*` (see Conflict E.1). The full 10-standard doc (`src/content/docs/guidelines/component-standards.md`) was out of the read scope for this digest.

**A11y baselines:**

> "Accessibility baked in: heading hierarchy (current duplicate-h1 bug), keyboard nav, contrast, alt text. A11y linting in CI so it stays fixed."
> — `_process/scoping/fronts/03-design-system.md` (line 10)

> "3. **A11y baseline: WCAG 2.1 AA now.** Don't wait for the GGS audit report. Fix the duplicate-h1 bug, wire axe linting into CI. If the full GGS report surfaces, diff it against this baseline."
> — `_process/scoping/design-system-approach.md` (line 11)

> "## Workstream 4 — Accessibility
>
> - Baseline: **WCAG 2.1 AA**.
> - Fix duplicate-h1 bug; enforce one h1 per page and sequential heading levels in templates.
> - Keyboard nav (esp. new data-driven nav + OffCanvas replacement), visible focus states, contrast checked against the hsl tokens in both modes, alt text required on content images.
> - CI: axe-based linting (e.g. vitest-axe or @nuxtjs/html-validator + axe run against built pages) so regressions fail the build.
> - If the full GGS a11y report ever arrives, diff its findings against this baseline; otherwise this baseline IS the source of truth."
> — `_process/scoping/design-system-approach.md` (lines 47–53)

**Interdependent components (build + demo together):**

> "**⚠️ IMPORTANT**: When creating components that require multiple interdependent parts (parent + children), the demo page MUST show all components working together: ... **Requirements:**
> 1. Create ALL child components together with parent
> 2. Build demo page showing them working together
> 3. Visually verify styling and interactions in browser
> 4. Fix integration issues before finalizing documentation
> 5. Demo page must include complete, realistic examples (not isolated components)"
> — `bfna-website-nuxt/CLAUDE.md` (lines 124–137)

---

## B. Styling rules

**CUBE CSS stack + layer order:**

> "`styles.css` declares layer ordering: `@layer reset, defaults, tokens, themes, components, utils, overrides;`
> - Each imported file wraps contents in appropriate `@layer` block to maintain cascade ordering"
> — `bfna-website-nuxt/CLAUDE.md` (lines 56–57)

> "**CSS Architecture (CUBE CSS):**
> - Layer order: reset → defaults → tokens → themes → components → utils → overrides
> - Component variables: `--_ccm-{component}-{property}`
> - Reference semantic tokens over primitives"
> — `bfna-website-nuxt/AGENTS.md` (lines 73–76)

**Composition layer + known bugs (fix, don't replace):**

> "Composition: unify gap API — honor `data-gap` on stack/cluster/switcher/grid (alias `data-space`), fix ~50 silent no-ops
> Composition: `data-measure` — universal rule or fix the 8 stray `<p>` call sites
> Replace 7 raw `grid-template-columns: repeat(N,1fr)` inline styles with primitive usage"
> — `_process/scoping/architecture-and-epics.md` (E0 tasks 2–4, lines 77–79)

> "Composition layer (Every Layout primitives) stays; its bugs get fixed (data-gap only worked on `.grid`; data-measure only on `.center`)."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md`

> "| `.stack`/`.cluster`/`.switcher` | honor `data-gap` (currently `.grid`-only; wireframe writes `data-gap` on all four as a no-op) | BF-176 | keep, fix |
> | `.grid` | same gap-API unification + confirm `data-min-width` responsive contract | BF-176, BF-178 | keep, fix |
> | `data-measure` | universal rule or fix 8 stray `<p>` call sites | BF-177 | keep, fix |
> | raw `grid-template-columns` (7 sites) | replace with `.grid[data-min-width]` primitive usage | BF-178 | keep, fix |
> | `.box`, `.frame`, `.cover`, `.reel`, `.imposter`, `.container` | no change | — | keep, no work |"
> — `_process/scoping/component-inventory-v2/component-inventory-v2.md` (Level 0 — Composition, lines 117–123)

**Tokens — Utopia space/type + color system stays, values may change:**

> "Utopia + color token *system* stays (values may change)"
> — `_process/scoping/architecture-and-epics.md` (line 5)

> "Utopia space/type + color token *system* from the wireframes stays for the final interface (values/attr wiring may change)."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md`

> "Token cleanup: delete dead `--colors-*` block, fix `--color-black` comma, untangle `semantic-colors.css` (dup `--color-neutral`, `error→fail` order), resolve `.icon` utility conflict"
> — `_process/scoping/architecture-and-epics.md` (E0 task 6, line 81)

**"Evolve, don't rebrand":**

> "Read `00-shared-context.md` first. **Phase: discuss + specify.** Brownfield — evolve the existing BFNA visual identity, NO rebrand. New components must look like a natural evolution of the old site while serving the new UX from Front 2."
> — `_process/scoping/fronts/03-design-system.md` (line 3)

> "How we build the design system: decisions, workstreams, sequencing. Brownfield: evolve existing BFNA visual identity under the `ccm*` design system, no rebrand."
> — `_process/scoping/design-system-approach.md` (line 3) — note: still says `ccm*`, superseded per Conflict E.1

> "3. **UI/Branding — brownfield.** New Design System allowed, but must stay under the same overall branding. Evolve the UI, don't radically change it. This is a website overhaul, NOT a rebranding."
> — `~/.claude/projects/.../memory/three-fronts.md`

**hsl vs oklch:**

> "- Nuxt/ccmdesign repo rules apply: check CSS variable format before writing values (hsl vs oklch), test light AND dark modes after theme changes, commit checkpoints before risky theme refactors, "inline styles" = Tailwind class soup."
> — `_process/scoping/fronts/03-design-system.md` (line 14)

> "**Tokens** live in `public/global.css`, **hsl** format (`--*-hsl` triplets composed via `hsla()`). Fonts: `trade-gothic-next` for both heading and primary."
> — `_process/scoping/design-system-approach.md` (line 16)

> "hsl not oklch; test light + dark after theme changes; `checkpoint: pre-<thing>` commit before risky refactors; revert to checkpoint, never fix forward through broken theme state; "inline styles" = Tailwind class soup."
> — `_process/scoping/design-system-approach.md` (line 69, Conventions restated)

**Inline-style meaning ("Tailwind class soup", not HTML style attributes):**

> ""inline styles" = Tailwind class soup"
> — `_process/scoping/fronts/03-design-system.md` (line 14) and `_process/scoping/design-system-approach.md` (line 69)

**Semantic-only token rule + known token debt:**

> "**Enforce semantic-only rule.** Components must use semantic tokens (`--color-primary`, `--color-text`, `--color-surface`…) only — never primitives. Current violations: `--color-base-tint-05` et al. used directly in components. This rule makes the primitive-naming decision above a swappable implementation detail."
> — `_process/scoping/fronts/03-design-system.md` (line 26)

> "**Token debt found:** unresolved SCSS placeholders shipped as literals — `--colors-default: $black;`, `--colors-orange: $orange;`, `--colors-red: $red;`, `--colors-teal: $teal;`, `--colors-yellow: $yellow;`. These resolve to nothing in CSS. Two parallel naming schemes coexist (`--color-*` hsl-based vs broken `--colors-*`). Cleanup is step 0 of tokenization."
> — `_process/scoping/design-system-approach.md` (line 17)

**`ccmSection` known bugs (fix targets, not new pattern):**

> "**`ccmSection` fixes**: `fullWidth` prop has no CSS behind it (no-op); props leak onto the DOM as junk attributes (`image-left`, etc. rendered on `<section>`)."
> — `_process/scoping/fronts/03-design-system.md` (line 28)

> "`bfSection` (fix `fullWidth` no-op + prop leak; absorb SplitSection/VideoSection as variants)"
> — `_process/scoping/architecture-and-epics.md` (E4 task 5, line 118)

---

## C. Data rules

**SSG, not runtime fetch:**

> "1. **SSG, not runtime fetch.** Directus is a *build-time* source; the site deploys as static files to Netlify (already the deploy target). No server, no runtime CMS dependency, no client-side hydration of a data store. Content refresh = re-run the importer + rebuild (webhook-triggerable later)."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 51)

**@nuxt/content as the data layer:**

> "2. **`@nuxt/content` collections are the data layer.** Already installed; the importer already targets `content/`. Define collections + **zod schemas** in `content.config.ts`. Wins that pay for the config: markdown/HTML **bodies render natively** (replaces hand-rolled `wfProse` + the legacy `.prose` system), a real `queryCollection` API, and **build-time full-text search** (interim before Front 4 vector search). Rejected lighter alt: plain JSON-import composables (what `useWfContent` does today) — simpler, zero-config, but you re-hand-roll prose rendering and lose the query/search DX. Not worth it when content is already installed."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 53)

**No Pinia:**

> "**Pinia: rejected for now, not deleted.** No data-layer role. Reconsider *only* if a genuinely stateful client island appears — a filter/compare tray that persists across routes, saved/bookmarked items, a multi-step form. For a marketing site that's unlikely; don't install the ceremony for a hypothetical. If it happens, a single scoped store for that island — never the content pipeline. **Tripwire noted so this isn't re-litigated silently.**"
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 65)

> "Data architecture (decided 2026-08-07): **SSG + @nuxt/content, NO Pinia.** It's a read-only marketing site — Pinia was judged overkill."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md`

**Importer → content/ → collections → zod → composables → props pipeline:**

> "```
> Directus  →  contentImporter.js   →  content/*.json      →  queryCollection()  →  data composables  →  pages  →  bf-* components
> (CMS)        (build-time, exists)     (nuxt-content coll.)    (@nuxt/content)      (ported wf surface)   (readers)   (props only)
> ```"
> — `_process/scoping/architecture-and-epics.md` (ADR-2, lines 46–49)

> "3. **Composables are the query/format layer — not stores.** `useWfContent`'s 33-helper surface ports to data composables wrapping `queryCollection` (`useInsights`, `insightsForProject`, `projectsByProgram`, `archived`, `featured`, …) + a pure `utils/format.ts` (`formatLabel`, `kindLabel`, `monthYear`, `paragraphs`, `plain`). Same names, same signatures. Pages change one line (`useWfContent()` → the ported composables), components change zero — this is what keeps the wf→bf swap cheap."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 55)

> "4. **Normalization happens at import time**, in `contentImporter.js` — HTML-entity decode, excerpt derivation, relation resolution (Front 2's rule: "strip/decode at the data layer, not in components"; the `plain()`-in-component usage in wf cards moves into the importer/schema transform). Relationships are **denormalized on pull** — each insight carries its resolved program/project refs, so no relational joins at query time."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 57)

> "5. **Schemas ARE the entity contracts.** The zod collection schemas replace a separate `types/content.ts` — content generates the types, validated at build. Card props consume the generated types; `types/directus.ts` maps into the schema shape inside the importer. **This is the only artifact both the data epic and the component epics depend on.**"
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 59)

**Site chrome as data (no store):**

> "6. **Site chrome (nav/footer/CTA copy) as data.** The data-driven-nav requirement is a menus data file (or a singleton `content/site/*` doc), read by the layout and passed as props to `bfNav`/`bfFooter`. No store."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 61)

**App-level content workflow docs (still describe the current/interim state):**

> "## Content Workflow
> - Active collections: `blog` and `docs` (implicitly via file structure)
> - Configured collections in `content.config.ts`: blog, casestudies, services, uilibrary
> - Markdown files in `src/content/<collection>/` with frontmatter for metadata
> - Schemas enforced via Zod in `content.config.ts`
> - Query content using `queryCollection('<name>')` in pages/composables"
> — `bfna-website-nuxt/CLAUDE.md` (lines 64–69)

> "## Known Gaps
> - Content collections defined in `content.config.ts` (casestudies, services, uilibrary) have no corresponding directories in `src/content/`
> - Limited test coverage - only config and tokens suites exist currently"
> — `bfna-website-nuxt/CLAUDE.md` (lines 209–211)

---

## D. lfg-ccm contract (verbatim)

**Three-layer model:**

> "Plane-anchored, GitHub-executed autonomous engineering. Three layers, one home per fact
> (fact-homes rule, ccm-ops/decisions/dec-2026-08-29-fact-homes.md):
>
> - **Plane = human layer.** The EPIC card (umbrella, progress roll-up) plus any review / human-action
>   tasks. Humans watch Plane; they should never need to open a GitHub Issue.
> - **GitHub Issues = agent layer.** One issue per subtask, in the target repo. Each issue links the
>   epic URL (paper trail — traceable when something goes wrong). Agents create, journal on, and
>   close them; issue→branch→PR→close is native.
> - **Repo docs = knowledge layer.** Non-status information — plans, specs, decisions made during the
>   work — is committed `.md` under the repo's docs root (`docs/` — `docs/plans/`, `docs/specs/`,
>   `docs/decisions/`; the CE docs_root convention already in use). Epic and issues link to these
>   files; they never restate them.
> - **The orchestrator is the bridge.** It alone talks to Plane; the item-runner touches GitHub only.
> - **Input modes**, auto-detected:
>   - **Epic (primary):** one Plane ID/URL → its subtask GitHub Issues become the units (created in
>     the STRUCTURE phase if missing).
>   - **Brief:** no Plane ref — the arguments are a text brief (or a path to a brief/plan `.md`) →
>     the Plane epic is created first, then structured the same way.
>   - **List (legacy):** several Plane IDs → each is ported to one GitHub Issue and run; no epic.
> - **Sequential, isolated.** One Task subagent per issue, fresh discarded context, merged before the
>   next starts. Item N+1 branches off the already-updated integration branch.
> - **API only.** `plane-api` skill (raw REST via curl) for Plane; `gh` for GitHub. No MCP."
> — `~/.claude/commands/lfg-ccm.md` (lines 11–32)

**Brief format required if a text/file brief is passed (Brief mode input detection):**

> "Otherwise: **Brief mode** — the whole argument string is the brief; if it is a single path to an
> existing `.md`, that file's content is the brief."
> — `~/.claude/commands/lfg-ccm.md` (line 63)

**Repo-convention detection (base branch + docs root + worktree convention):**

> "## 4. Detect repo conventions (from CLAUDE.md)
>
> **Allowed repo set.** Work may target any repo whose root is a session project folder — the cwd
> repo plus `/add-dir` directories. Brief mode always targets the cwd repo. A unit resolving to a
> repo outside `$ALLOWED_ROOTS` is never run: record `escalated — target repo not a session project
> folder` and continue.
>
> Per allowed repo (lazily), read **both** layers — `~/.claude/CLAUDE.md` (global branch model:
> feature work off `dev`; `main`/`dev`/`staging` protected) and the project `CLAUDE.md`/`AGENTS.md`
> (worktree convention, repo category, documented base branch) — then derive:
>
> ```bash
> MAIN_REPO=$(git rev-parse --show-toplevel)
> REPO_NAME=$(basename "$MAIN_REPO")
> git -C "$MAIN_REPO" fetch --quiet origin
>
> if git -C "$MAIN_REPO" show-ref --verify --quiet refs/remotes/origin/dev; then
>   BASE_BRANCH=dev
> else
>   BASE_BRANCH=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name 2>/dev/null)
>   [ -z "$BASE_BRANCH" ] && BASE_BRANCH=$(git -C "$MAIN_REPO" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
>   [ -z "$BASE_BRANCH" ] && BASE_BRANCH=main
> fi
>
> WORKTREE_ROOT="$(dirname "$MAIN_REPO")/${REPO_NAME}-wt"   # override if CLAUDE.md documents one
> DOCS_ROOT=docs   # override if .compound-engineering/config.yaml sets docs_root
> ```
>
> **Merge policy:** `BASE_BRANCH` ∈ {`dev`,`develop`,`staging`} → **auto-merge** on green CI.
> `main`/`master` → **stop at PR** and escalate (global rule). Store `$BASE_BRANCH`,
> `$MERGE_POLICY` (`auto`|`stop`), `$WORKTREE_ROOT`, `$MAIN_REPO`, `$DOCS_ROOT`."
> — `~/.claude/commands/lfg-ccm.md` (lines 104–134)

*For this repo:* `bfna-website-migration-2` has no `origin/dev` ref detected in this read pass and no documented `WORKTREE_ROOT` override in `bfna-website-nuxt/CLAUDE.md` or `AGENTS.md` — those two files are silent on lfg-ccm/worktree conventions entirely (confirmed by reading both in full, section A/B/C above). Per the algorithm above this falls through to `gh repo view --json defaultBranchRef` / `origin/HEAD` / `main` as the default base branch, which triggers **stop-at-PR, escalate** merge policy, not auto-merge. The current worktree in use for this session (`relaxed-feynman-57e7e4`) sits under `.claude/worktrees/`, not the `${REPO_NAME}-wt` sibling-directory convention the command falls back to.

**STRUCTURE phase — epic, plan, issues, cross-linking (idempotent):**

> "## 5. STRUCTURE (Epic + Brief modes; List mode skips to the port note below)
>
> Goal state, idempotent on re-run: one Plane epic · one committed plan `.md` · one GitHub Issue per
> subtask, all cross-linked.
>
> a. **Ensure the epic.** Brief mode: create the Plane work item now (title distilled from the
>    brief; description = brief, via `md2plane.sh`) in the Plane project matching the repo (ask the
>    `plane-api` project list; if ambiguous, use the repo's documented Plane project or stop with a
>    one-liner). Epic mode: the resolved ref is the epic. Record `$EPIC_*` coordinates + URL.
>
> b. **Ensure the plan.** If `$DOCS_ROOT/plans/<epic-slug>-plan.md` is not already committed on
>    `$BASE_BRANCH`: invoke `ce-plan` in pipeline mode on the epic title+description (elevation via
>    the repo's `.compound-engineering/config.local.yaml`, or pass `plan_model:fable`). Commit the
>    plan file directly to `$BASE_BRANCH` (docs-only commit) and push. Record `$PLAN_FILE` and its
>    GitHub URL. The plan must end with a **unit decomposition**: 2–10 subtasks, each with title,
>    description, acceptance criteria, and optional `Blocked-by` references.
>
> c. **Ensure the issues.** List existing candidates first — reuse, never duplicate:
>
>    ```bash
>    gh -R <owner/repo> issue list --label lfg --state open --json number,title,body \
>      | jq '[.[] | select(.body | contains("$EPIC_URL"))]'
>    ```
>
>    For each planned unit without an issue:
>
>    ```bash
>    gh -R <owner/repo> issue create --label lfg --title "<unit title>" --body "<unit description +
>    acceptance criteria>
>
>    Epic: $EPIC_URL
>    Plan: <GitHub URL of $PLAN_FILE>
>    Blocked-by: #<n>   # only if the plan says so"
>    ```
>
>    (Create the `lfg` label once if absent.) If the epic has **Plane sub-items**, port each one the
>    same way (title/description copied, epic-linked) and post a one-line comment on the Plane
>    sub-item: "→ ported to <issue URL> (agent queue)". Leave its Plane state to the humans.
>
> d. **Cross-link on the epic.** PATCH the epic description to append a `## Subtasks` section listing
>    the issue URLs + the plan link (through `md2plane.sh`), move the epic to **In Progress**, and
>    post an epic comment: "Structured: N subtasks → <issue links>. Plan: <plan URL>."
>
> **List mode port:** each resolved Plane item becomes its own `lfg` issue (body = its title/
> description + `Plane: <item URL>` line), with a "→ ported to <issue URL>" comment on the card.
> No epic; the orchestrator moves each card itself in §8/§9."
> — `~/.claude/commands/lfg-ccm.md` (lines 136–181)

**docs/ layout it writes to:**

> "- **Docs folder = `docs/`** (the CE docs_root convention already used by these repos), not a new
>   `_docs/`. Durable **cross-project** decisions still belong in ccm-ops per fact-homes; the runner
>   writes only project-scoped docs into the product repo."
> — `~/.claude/commands/lfg-ccm.md` (Notes, line 478)

> "Knowledge goes to files, status goes to the journal: any non-status information produced during
> this item — a decision taken, a spec pinned down — is written as .md under {{DOCS_ROOT}}/decisions/
> or {{DOCS_ROOT}}/specs/, committed, and LINKED from the journal entry; never inlined into comments."
> — `~/.claude/commands/lfg-ccm.md` (line 328)

> "Stage only generated doc artifacts (app code is committed where it is produced):
>   for p in {{DOCS_ROOT}}/plans/ {{DOCS_ROOT}}/specs/ {{DOCS_ROOT}}/decisions/ {{DOCS_ROOT}}/solutions/ {{DOCS_ROOT}}/residual-review-findings/; do
>     [ -e "{{WORKTREE_PATH}}/$p" ] && git -C "{{WORKTREE_PATH}}" add "$p"
>   done"
> — `~/.claude/commands/lfg-ccm.md` (lines 316–319)

**Per-issue spec/plan fields the runner expects:**

> "STEP 1 — PLAN (ce-plan, pipeline mode)
>   Invoke `ce-plan` in pipeline mode on the issue body (add the `plan_model:fable` carrier if the
>   repo lacks `.compound-engineering/config.local.yaml`). It returns the plan in-turn and writes it
>   under {{DOCS_ROOT}}/plans/. Record the path as $PLAN_FILE. Fallback if ce-plan is unavailable or
>   returns blocked: write a short plan yourself (approach, files to touch, test strategy, risks) to
>   {{DOCS_ROOT}}/plans/gh{{ISSUE_NUMBER}}-plan.md. Commit & link. journal "Planning" with 3–5
>   bullets + plan file URL."
> — `~/.claude/commands/lfg-ccm.md` (lines 356–362)

Each GitHub issue body must carry, per the STRUCTURE-phase issue-create template:

> "gh -R <owner/repo> issue create --label lfg --title "<unit title>" --body "<unit description +
> acceptance criteria>
>
> Epic: $EPIC_URL
> Plan: <GitHub URL of $PLAN_FILE>
> Blocked-by: #<n>   # only if the plan says so""
> — `~/.claude/commands/lfg-ccm.md` (lines 163–168)

**Sequencing / dependency ordering:**

> "`$NODES` = the open `lfg` issues for this run (epic-linked, or the ported list), ascending by issue
> number. Parse `Blocked-by: #N` lines from issue bodies → topological order; on a cycle, keep
> numeric order and note it in the batch summary. Remember the map for cascade-skip."
> — `~/.claude/commands/lfg-ccm.md` (§6, lines 185–187)

> "**No parallelism by design.** Sequential + branch-off-fresh-base gives dependent items their
> dependency's merged code with zero merge-train machinery."
> — `~/.claude/commands/lfg-ccm.md` (Notes, line 482)

**Merge policy (base-branch derived) — restated at dispatch time:**

> "STEP 9 — MERGE PER POLICY
>   If {{MERGE_POLICY}} == 'stop' (base is main/master):
>      Do NOT merge. Leave the PR open. journal "CI green — base is {{BASE_BRANCH}} (protected);
>      merge needs explicit human approval. PR: $PR_URL". Set status return = "ci-green-await-merge".
>      Skip the rest of STEP 9.
>   If {{MERGE_POLICY}} == 'auto' (integration branch) and CI is green:
>      gh pr merge <PR_NUMBER> --merge --delete-branch     # --merge preserves feature history
>      Verify ground truth: `gh -R {{OWNER_REPO}} issue view {{ISSUE_NUMBER}} --json state` shows
>      CLOSED (the "Closes #" link does this; if still open, `gh issue close {{ISSUE_NUMBER}}
>      --comment "closed by $PR_URL"`).
>      Clean up:
>        git -C "{{MAIN_REPO}}" pull origin "{{BASE_BRANCH}}"
>        git -C "{{MAIN_REPO}}" worktree remove "{{WORKTREE_PATH}}" --force
>        git -C "{{MAIN_REPO}}" branch -D "{{BRANCH}}"
>      journal "✅ merged into {{BASE_BRANCH}} — $PR_URL"."
> — `~/.claude/commands/lfg-ccm.md` (lines 431–445)

**Worktree convention:**

> "WORKTREE_PATH="${WORKTREE_ROOT}/gh${ISSUE_NUMBER}""
> — `~/.claude/commands/lfg-ccm.md` (line 224)

> "SETUP
> 1. Create the worktree off the latest base branch:
>      git -C "{{MAIN_REPO}}" pull origin "{{BASE_BRANCH}}"
>      git -C "{{MAIN_REPO}}" worktree add "{{WORKTREE_PATH}}" -b "{{BRANCH}}" "{{BASE_BRANCH}}"
>    (Branching off freshly-pulled {{BASE_BRANCH}} means any earlier item already merged is included.)
> 2. journal "Starting #{{ISSUE_NUMBER}} — {{ISSUE_TITLE}}. Branch {{BRANCH}} off {{BASE_BRANCH}}."
>
> Work EXCLUSIVELY inside {{WORKTREE_PATH}} for every step below. Do not create or switch branches."
> — `~/.claude/commands/lfg-ccm.md` (lines 336–342)

**What it refuses / hard-stops on:**

> "Stop with a one-line message if either is missing — no silent degrade."
> — `~/.claude/commands/lfg-ccm.md` (§1, line 54 — missing `PLANE_API_KEY`/`PLANE_WORKSPACE_SLUG`/`gh` auth)

> "Empty: stop — "No Plane ref or brief in arguments.""
> — `~/.claude/commands/lfg-ccm.md` (§2, line 65)

> "A unit resolving to a
> repo outside `$ALLOWED_ROOTS` is never run: record `escalated — target repo not a session project
> folder` and continue."
> — `~/.claude/commands/lfg-ccm.md` (§4, line 108–109)

> "HARD RULES (why past runs stranded work — see memory `lfg-ccm-runner-reliability`):
>   - Never invoke any OTHER ce-* skill or mode: no bare ce-work, no ce-commit-push-pr, no lfg, no
>     ce-test-browser, no ce-babysit-pr. The shipping tail (steps 4–9 below) is YOURS, run inline.
>   - If any skill invocation would detach work past your turn, abort it and do that step inline
>     instead (plan by hand, implement with Edit/Write, review your own `git diff`). A degraded
>     inline step beats a stranded item.
>   - Tracker state is out-of-repo: git signals say nothing about it. After you believe an item is
>     done, VERIFY GROUND TRUTH directly (PR merged? issue closed? clean `npm ci` + typecheck +
>     test + build? worktree/branch removed?) — do not trust your own summary or a skill's."
> — `~/.claude/commands/lfg-ccm.md` (lines 286–294)

> "EXIT-POINT CONTRACT (read carefully — past runs have failed here)
> - The ONLY exit from this item is the RETURN block at the end of STEP 9 (or the ERROR/ESCALATE block).
> - "Ready to merge", "verdict: complete", "0 findings", or any other clean result from STEP 3
>   (review) is a STEP-INTERNAL result — NOT a signal to return. After STEP 3 you MUST proceed to
>   STEPS 4 → 5 → 6 → 7 → 8 → 9 in order."
> — `~/.claude/commands/lfg-ccm.md` (lines 344–348)

> "ERROR / ESCALATE (any step)
>   Run the commit & link helper to preserve partial output. Leave the branch/PR UNMERGED and the
>   issue OPEN. Label it:  gh -R {{OWNER_REPO}} issue edit {{ISSUE_NUMBER}} --add-label needs-human
>   journal "⚠️ halted — needs a human. Step: <step>. Reason: <one line>. Branch left unmerged.
>   PR: $PR_URL". Then stop this item and return the summary (the orchestrator creates the Plane
>   review task — do not touch Plane yourself)."
> — `~/.claude/commands/lfg-ccm.md` (lines 447–452)

> "Stop. Do not prompt for retries — the user triages from Plane."
> — `~/.claude/commands/lfg-ccm.md` (§9, line 260)

**Return contract (what the orchestrator reads back per issue):**

> "RETURN (final message — this is the ONLY thing the orchestrator reads; keep it tiny):
>   status: one of  done | ci-green-await-merge | escalated:<step> | failed:<reason>
>   issue: {{ISSUE_NUMBER}}
>   pr_url: <url or null>
>   branch: {{BRANCH}}
>   residual_count: <int>
>   ci_attempts: <int>
>   notes: <≤2 sentences — defaults taken, deviations, or escalation reason>"
> — `~/.claude/commands/lfg-ccm.md` (lines 454–461)

**Version gate on ce-* modes:**

> "**ce-* modes re-enabled 2026-09-01** (CE ≥3.24.0). The old blanket ban existed because ce-*
> skills detached background agents and stranded items; 3.24.0's `mode:return-to-caller` /
> `mode:agent` / pipeline modes complete synchronously in-turn and forbid detached hand-offs.
> The ban still applies to every other ce-* skill/mode. If the installed plugin is older than
> 3.24.0, fall back to fully-inline steps."
> — `~/.claude/commands/lfg-ccm.md` (Notes, lines 473–477)

---

## E. Conflicts (unresolved — listed, not resolved)

**E.1 — Component prefix: `bf-*` vs `ccm*`.**

> "All final components are **`bf-*` prefixed** — this SUPERSEDES the "all new components ccm*-first" rule recorded in `design-system-approach.md`."
> — `~/.claude/projects/.../memory/bf-prefix-and-swap.md` (2026-08-07, dated)

> "All built `ccm*`-first — no new legacy components, ever."
> — `_process/scoping/design-system-approach.md` (line 43, Workstream 3, dated 2026-07-31)

> "- `src/components/ds/`: Design system components prefixed `ccm` (ccmButton, ccmCard, etc.)"
> — `bfna-website-nuxt/CLAUDE.md` (line 34, last revised per its own footer 2025-10-22)

> "- Design system components use `ccm` prefix"
> — `bfna-website-nuxt/AGENTS.md` (line 64, undated)

> "Component variables: `--_ccm-{component}-{property}`"
> — `bfna-website-nuxt/AGENTS.md` (line 75) and `bfna-website-nuxt/CLAUDE.md` (line 117, "`--_ccm-{component}-{property}` pattern")

**Which is later/authoritative:** `bf-prefix-and-swap.md` (memory, 2026-08-07) and `architecture-and-epics.md` (`_process/scoping/`, 2026-08-07, which explicitly states it supersedes `design-system-approach.md` and flags that doc as needing "a one-line amendment when it lands in the main checkout") are the later, decision-of-record sources. `bfna-website-nuxt/CLAUDE.md`, `AGENTS.md`, and `_process/scoping/design-system-approach.md` still describe the pre-`bf-*` (`ccm*`) world and have not been updated to reflect the 2026-08-07 ground rules. Not resolved here.

**E.2 — `design-system-approach.md` location.**

The spec asked to find "any file named like design-system-approach*.md anywhere in the repo." It exists only at `_process/scoping/design-system-approach.md` inside a *different* worktree (`.claude/worktrees/lucid-bhaskara-fc1b6c/`), not in the main repo checkout (`.../bfna-website-migration-2/_process/scoping/`) nor in the `relaxed-feynman-57e7e4` worktree this digest was written from. `architecture-and-epics.md` itself anticipates this: "that doc needs a one-line amendment when it lands in the main checkout" (line 7) — implying it was not yet merged to the main checkout as of that writing. Flagging as a state/location conflict, not resolving which worktree is canonical.

**E.3 — Data layer described inconsistently across app-level docs vs architecture decision.**

> "Query content using `queryCollection('<name>')` in pages/composables" / "Active collections: `blog` and `docs` (implicitly via file structure)"
> — `bfna-website-nuxt/CLAUDE.md` (lines 65, 69) — describes today's narrower collection set (blog, docs; casestudies/services/uilibrary configured but empty, per its own "Known Gaps" section)

> "Reconcile the two snapshots. The importer's per-item `content/*` output is the real source; the 6-file wireframe aggregate was a stand-in."
> — `_process/scoping/architecture-and-epics.md` (ADR-2, line 63) — treats the full Directus-fed pipeline (Insight, Project, Program, Person, MenuItem entities) as the target state, not yet reconciled

Not a direct contradiction (one is current-state, one is target-state), but the app-level CLAUDE.md/AGENTS.md have not been updated to describe the ADR-2 target pipeline or its collection schemas — an epic author relying only on `bfna-website-nuxt/CLAUDE.md` would under-scope the data layer.

**E.4 — No conflict found on: CUBE layer order, hsl-not-oklch, "inline styles = Tailwind class soup", WCAG 2.1 AA baseline, no-Pinia, SSG decision.** All sources read agree verbatim or near-verbatim on these; not listed as conflicts.

---

## Sources read (full list)

- `bfna-website-nuxt/CLAUDE.md`
- `bfna-website-nuxt/AGENTS.md`
- (repo-root `CLAUDE.md`/`AGENTS.md`/`.claude/*.md` — none exist; confirmed via directory search)
- `_process/scoping/architecture-and-epics.md`
- `_process/scoping/fronts/03-design-system.md` (only `03-*.md` file under `fronts/`)
- `.claude/worktrees/lucid-bhaskara-fc1b6c/_process/scoping/design-system-approach.md` (not present in the main checkout or in this session's own worktree — see Conflict E.2)
- `_process/scoping/component-inventory-v2/component-inventory-v2.md` (section 2 headings + Level 0/1/2 base-pattern rows only, per spec scope)
- `~/.claude/commands/lfg-ccm.md`
- `~/.claude/projects/-Users-claudiomendonca-Documents-GitHub-ccmdesign-ccm-clients-bfna-bfna-website-migration-2/memory/bf-prefix-and-swap.md`
- `~/.claude/projects/-Users-claudiomendonca-Documents-GitHub-ccmdesign-ccm-clients-bfna-bfna-website-migration-2/memory/three-fronts.md`
