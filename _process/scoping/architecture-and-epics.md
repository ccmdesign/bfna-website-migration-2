# Component & data architecture + Plane epic structure

**Front 3 · v1 · 2026-08-07 · decisions proposed, tickets drafted — nothing created in Plane yet**

Companion to [atomic-component-inventory.md](atomic-component-inventory.md). Incorporates the ground rules set 2026-08-07: composition layer stays (bugs fixed) · `bf-*` prefix · Utopia + color token *system* stays (values may change) · Vue component-inheritance for complex components · goal state = swap `wf-*` → `bf-*` after client validation of wireframes.

> `bf-*` supersedes the "all new components ccm\*-first" rule in `design-system-approach.md` — that doc needs a one-line amendment when it lands in the main checkout.

---

## Sequencing verdict (the question asked)

**Do NOT table component work as a WIP epic.** The two adjacent decisions split cleanly:

- **Prop architecture** does block card/section design — but it is a *decision*, not a workstream. The wireframe layer already proved the pattern; ADR-1 below ratifies it. One review from you closes it.
- **Data architecture** does **not** block components at all *if* we adopt one rule: bf-\* components are presentational — props in, events out, zero data-layer access. Then the Directus→content plumbing only affects *who calls the components* (pages/layouts), and it becomes its own epic running in parallel.
- The **one true blocker** is small: the entity contracts (Insight, Project, Program, Person, MenuItem). Card props are typed on them, and the query layer must serve the same shapes. Under the SSG decision (ADR-2) these become `@nuxt/content` collection **schemas** — defined once in `content.config.ts`, types generated from them, validated at build. A half-day subtask in Epic 0, not a reason to hold the line.

So: lock ADR-1 + ADR-2 + collection schemas in Epic 0, then component epics and the data epic run in parallel. Templates (Epic 5) is the only epic that hard-depends on the data layer.

---

## ADR-1 — Component prop architecture (proposed)

**Current state**: wireframe layer proved slot-based base + prop-based typed wrappers (cards), props+slot hybrid (hero, page header), slot-based with convenience props (sections). `@directus/sdk` types exist; ds/ ccm components use runtime props with JSDoc.

**Decision:**

1. **Presentational-only.** No bf-\* component fetches data or touches the data layer (no `queryCollection`, no composable that reads content, no store). Props + slots in, events out. This is what makes the wf→bf swap mechanical, keeps components testable against fixtures forever, and lets ADR-2's data layer change underneath without touching a single component.

2. **Inheritance = composition, the Vue 3 way.** For complex components (cards are the exemplar):
   - **Slot-based base + typed wrappers**: `bfCard` (anatomy sockets: `media` / `chips` / default / `actions`) is the inheritance root. `bfCardInsight`, `bfCardProject`, `bfCardFeatured`, `bfCardPerson`, `bfCardProgram`, `bfCardRow` are thin wrappers: one entity prop (`insight: Insight`) + presentation flags, filling the base's slots. Freedom to customize per card, shared chrome in one place — exactly the wf pattern, kept.
   - **Shared prop contracts as TS interfaces**, not runtime spreads: `defineProps<CardBaseProps & { insight: Insight }>()` (Vue ≥3.3 supports imported/intersected types). One `types/component-contracts.ts` per family.
   - **Shared behavior as composables**, not mixins/`extends`: `useExcerpt(text, length)`, `useCardChips(entity)`, `useMediaRatio()`. The options-API `extends`/mixins mechanism is the *old* inheritance logic — composables are its Vue 3 replacement and the thing to standardize on.
   - **Attrs fallthrough is the composability contract**: every bf-\* component forwards `$attrs` (class, style, `data-*`) to its root; wrappers declare `inheritAttrs: false` and `v-bind="$attrs"` on the base. This is what lets composition classes (`class="bf-card | stack"`, `data-gap`) compose *onto* components from outside — components own meaning, primitives own layout, callers own placement.
   - **The base is always public.** When a typed wrapper doesn't fit, pages may use `bfCard` + slots directly. No prop grows on a wrapper until the slot version has appeared twice (rule of three, wireframes count as occurrence one).

3. **Slots-vs-props rule (ratifies the open gap):** cards + heros = prop-based typed wrappers over slot-based bases · sections + page-header = slot-based with convenience props (`label`, `heading`, `layout`) · forms = field/group molecules composed in slots.

## ADR-2 — Data architecture: SSG + @nuxt/content, composables as query layer, no Pinia (proposed)

**Current state**: This is a mostly read-only marketing site — blog, projects, people, program hubs. No cart, auth, cross-route mutable state, or heavy interaction flows. `@nuxt/content` v3.7.1 is installed. A **build-time Directus importer already exists and works**: `contentImporter.js` + `src/directus/*.js` (`npm run directus:pull`) fetch each collection and write **one JSON file per item** to `content/<collection>/<slug>.json`, flattening junction/relation fields at pull time. Separately, `@pinia/nuxt`/`pinia`/`@directus/sdk` are installed and `src/utils/directus.ts` (a *runtime* SDK client — the live-fetch path) + `src/composables/data/*` are **fully commented out**. Wireframes currently run on a hand-curated 6-file aggregate snapshot (`assets/wireframe-data/*.json`) through `useWfContent` (6 types + 33 query/format helpers).

**Decision — static generation, content is a build-time artifact, no store:**

```
Directus  →  contentImporter.js   →  content/*.json      →  queryCollection()  →  data composables  →  pages  →  bf-* components
(CMS)        (build-time, exists)     (nuxt-content coll.)    (@nuxt/content)      (ported wf surface)   (readers)   (props only)
```

1. **SSG, not runtime fetch.** Directus is a *build-time* source; the site deploys as static files to Netlify (already the deploy target). No server, no runtime CMS dependency, no client-side hydration of a data store. Content refresh = re-run the importer + rebuild (webhook-triggerable later).

2. **`@nuxt/content` collections are the data layer.** Already installed; the importer already targets `content/`. Define collections + **zod schemas** in `content.config.ts`. Wins that pay for the config: markdown/HTML **bodies render natively** (replaces hand-rolled `wfProse` + the legacy `.prose` system), a real `queryCollection` API, and **build-time full-text search** (interim before Front 4 vector search). Rejected lighter alt: plain JSON-import composables (what `useWfContent` does today) — simpler, zero-config, but you re-hand-roll prose rendering and lose the query/search DX. Not worth it when content is already installed.

3. **Composables are the query/format layer — not stores.** `useWfContent`'s 33-helper surface ports to data composables wrapping `queryCollection` (`useInsights`, `insightsForProject`, `projectsByProgram`, `archived`, `featured`, …) + a pure `utils/format.ts` (`formatLabel`, `kindLabel`, `monthYear`, `paragraphs`, `plain`). Same names, same signatures. Pages change one line (`useWfContent()` → the ported composables), components change zero — this is what keeps the wf→bf swap cheap.

4. **Normalization happens at import time**, in `contentImporter.js` — HTML-entity decode, excerpt derivation, relation resolution (Front 2's rule: "strip/decode at the data layer, not in components"; the `plain()`-in-component usage in wf cards moves into the importer/schema transform). Relationships are **denormalized on pull** — each insight carries its resolved program/project refs, so no relational joins at query time.

5. **Schemas ARE the entity contracts.** The zod collection schemas replace a separate `types/content.ts` — content generates the types, validated at build. Card props consume the generated types; `types/directus.ts` maps into the schema shape inside the importer. **This is the only artifact both the data epic and the component epics depend on.**

6. **Site chrome (nav/footer/CTA copy) as data.** The data-driven-nav requirement is a menus data file (or a singleton `content/site/*` doc), read by the layout and passed as props to `bfNav`/`bfFooter`. No store.

7. **Reconcile the two snapshots.** The importer's per-item `content/*` output is the real source; the 6-file wireframe aggregate was a stand-in. Aligning their shapes (and pointing the ported composables at `content/`) is a data-epic subtask.

**Pinia: rejected for now, not deleted.** No data-layer role. Reconsider *only* if a genuinely stateful client island appears — a filter/compare tray that persists across routes, saved/bookmarked items, a multi-step form. For a marketing site that's unlikely; don't install the ceremony for a hypothetical. If it happens, a single scoped store for that island — never the content pipeline. **Tripwire noted so this isn't re-litigated silently.**

**Explicitly out**: runtime Directus fetch (`utils/directus.ts` stays commented / gets deleted); per-component fetch composables (the commented `useNews.ts` pattern); components reading the data layer at all (even nav/footer take props from the layout).

---

## Plane epic structure (draft — create on your go)

Dependency shape: `E0 → everything`; `E1 ∥ E2 ∥ E3`; `E4 needs E2+E3 (+E1 for nav registry)`; `E5 needs all`.

### E0 — Foundations: composition fixes, tokens, contracts *(the "define before build" epic)*
1. Ratify ADR-1 + ADR-2 (this doc) and amend design-system-approach.md (`bf-*` supersedes `ccm*`-first)
2. Composition: unify gap API — honor `data-gap` on stack/cluster/switcher/grid (alias `data-space`), fix ~50 silent no-ops
3. Composition: `data-measure` — universal rule or fix the 8 stray `<p>` call sites
4. Replace 7 raw `grid-template-columns: repeat(N,1fr)` inline styles with primitive usage
5. Wire the token stylesheet globally (`styles.css` via `nuxt.config` `css[]`, not per-layout) — keep legacy pages on `global.css` until retired
6. Token cleanup: delete dead `--colors-*` block, fix `--color-black` comma, untangle `semantic-colors.css` (dup `--color-neutral`, `error→fail` order), resolve `.icon` utility conflict
7. Define `@nuxt/content` collections + zod schemas in `content.config.ts` (schemas = entity contracts; types generated)
8. `bf-*` scaffolding: `src/components/bf/` + auto-import prefix config
9. Tint/shade vs numeric primitives — decide and prune (carry-over kickoff issue)

### E1 — Data architecture: Directus → content → composables (SSG)
1. Verify/refresh the build-time importer (`contentImporter.js` + `src/directus/*.js`); move all normalization (entity-decode, excerpt derivation, relation denormalization) into the pull
2. Wire collections to the importer output in `content/`; confirm `queryCollection` reads them under SSG build
3. `utils/format.ts` — port pure formatters from useWfContent (`formatLabel`, `kindLabel`, `monthYear`, `plain`, `paragraphs`)
4. Port the useWfContent query surface → data composables over `queryCollection` (`useInsights`, `insightsForProject`, `projectsByProgram`, `archived`, `featured`, people queries) — same names/signatures
5. Site chrome as data: menus file / singleton doc → layout → props for **bfNav/bfFooter** (data-driven nav requirement, no store)
6. Reconcile the 6-file wireframe snapshot shape with the per-item `content/*` importer output; repoint composables
7. Parity test: ported composables vs useWfContent against the same data (the swap safety net); confirm `nuxi generate` produces the static site

### E2 — Atoms (bf-*)
1. bfButton (absorbs 16 raw `.wf-button` sites; legacy `.button` modifiers → semantic variants)
2. bfChip (link + active-filter modes from wfChip; dismissible from ccmChip)
3. bfLogo (Logo + LogoWhite → variant prop)
4. bfMedia (ratio prop; consider `.frame` primitive)
5. bfTime (`<time datetime>` + formatter — fixes 4 pages missing machine-readable dates)
6. bfSkipLink · 7. external-link marker (one mechanism: attribute) · 8. icon decision (one font, one utility)

### E3 — Molecules (bf-*)
1. bfCard base (slot sockets, stretched-link pattern, equal-height contract)
2. bfCardInsight · 3. bfCardProject · 4. bfCardFeatured · 5. bfCardPerson · 6. bfCardProgram
7. bfCardRow (6th variant — search/archive/thin-list rows, ProductCardThin successor)
8. bfBreadcrumb (wf API + ccm JSON-LD)
9. bfByline (resolve ccmByLine naming collision)
10. bfFormField + bfFormGroup (consolidate the 3 wireframe form idioms)
11. bfFilterBar (rebuild SimpleFilters; composes bfChip active/link modes — chip's composability test)
12. bfAccordion (native `<details>` skin) · 13. load-more (or pagination — Front 4 call)

### E4 — Organisms (bf-*)
1. bfNav (data-driven from nav registry; replaces Frame/MainNav/OffCanvas/PlatformNav; top-bar IA)
2. bfFooter (same registry)
3. bfHero (props + actions slot; tall variant; program theming via tokens)
4. bfPageHeader (breadcrumb + chips + heading; the 9× workhorse)
5. bfSection (fix `fullWidth` no-op + prop leak; absorb SplitSection/VideoSection as variants)
6. bfCtaSection (+ email-capture variant, announcement variant) · 7. bfNotice (archive banner / callout)
8. bfGridInsights + bfGridProjects (thin data-in/cards-out wrappers over `.grid`)
9. Search shell (input + results using bfCardRow) · 10. Cross-links row · 11. Modal decision (person bio / video — flag to GGS)

### E5 — Templates & the swap
1. Site shell layout (port legacy-base's 3rd-party integrations, not its rail)
2–10. Per-page wf→bf swap: home, program hub, insights index, insight detail, projects index, project detail, about, search, archive — acceptance: bf page renders the same snapshot data as its wf twin
11. Shared not-found block (kills the 3× duplicated fallback) · 12. Retire `components/legacy/**` + dead ds/layouts + `css-legacy/` duplicate

*(Not in scope as epics: ccmTabs/ccmTable — keep for docs/blog, no wireframe-driven work.)*
