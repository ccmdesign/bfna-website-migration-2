# Recovered v1 inventory — verbatim

**Retrieval note (not part of the source documents):** both files below were added to git in a single commit — `dc62056` "checkpoint: pre-supabase-backcompat", 2026-08-31, author Claudio Mendonca <claudioccm@gmail.com> — as full new-file adds (142 and 128 lines respectively, matching each file's current length exactly). Git has no earlier commit for either path (`git log --follow` returns only `dc62056`; no rename/copy detected). This means git's first-commit and last-commit dates are identical (2026-08-31) even though both documents self-date their content to **2026-08-07** ("Front 3 · v1 · 2026-08-07") in their own headers below — i.e. the content was authored roughly 3.5 weeks before it was committed to this checkout. Neither file exists on `origin/feature/front3-wf-components` (verified via `git ls-tree`) or on any other ref in this repo's history.

Everything from the horizontal rule below to the end of each document section is the source file's content, reproduced verbatim (byte-for-byte, including its own internal Markdown syntax) — nothing has been paraphrased, corrected, or reflowed.

---

## Document 1 of 2 — source metadata

**Source path:** `_process/scoping/atomic-component-inventory.md`
**Git first-commit date:** 2026-08-31 (commit `dc62056`)
**Git last-commit date:** 2026-08-31 (commit `dc62056`, same commit — no revisions since)
**Author:** Claudio Mendonca <claudioccm@gmail.com>

<!-- ============ VERBATIM CONTENT BEGINS ============ -->

# Atomic component inventory — wireframe UI ↔ existing code

**Front 3 · v1 · 2026-08-07 · inventory only, no build decisions changed**

Maps every component the wireframe interface (`/wireframes/*`) needs onto what already exists as code — whether properly componentized or not — organized by atomic design level. Companion to [component-inventory.md](component-inventory.md) (Front 2's build list, which this doc refines and extends) and `design-system-approach.md` (migration tiers; currently lives only in the Front 3 session worktree).

**Sources**: full read of `src/pages/wireframes/**`, `src/components/wireframe/**`, `src/components/{ds,legacy,templates,custom,content,docs}/**`, both CSS systems (`public/global.css` + `src/public/css/**`), the Eleventy ancestor repo (`../bfna-website`), and the abandoned Nuxt-RC rewrite (`../bfna-website-v2`).

## The lay of the land

The migration repo contains **two disjoint UI stacks**:

1. **Legacy BFNA production stack** — `src/components/legacy/**` (22 components, 1:1 Vue ports of the Eleventy site's Nunjucks partials) + `public/global.css` (3,676 lines of compiled SCSS, ~190 BEM classes). Powers all 13 production pages. 21 of 22 components carry no `<style>` block — all visuals live in the three legacy stylesheets.
2. **ccm design-system stack** — `src/components/ds/**` (13 `ccm*` components, vendored in-tree; no Nuxt layer, no npm package) + `src/public/css/styles.css` (@layer cascade: reset → tokens → themes → composition → components → utils). Used only by docs/blog layouts and the wireframes.

The wireframe layer (21 `wf*` components) is the **third, throwaway** stack — but it is the only place both the ccm token system and the composition primitives are actually exercised, so it is the working prototype of the target architecture: **composition primitives do layout, components do meaning, skin classes do paint.**

Verdicts below reuse Front 2's vocabulary: **evolve** (ccm\* base exists, extend it) · **rebuild** (exists only in legacy, rebuild on ccm\*) · **new** (nothing usable exists).

---

## Level 0 — Composition layer (the substrate)

Already built at `src/public/css/composition/*.css` (Every Layout style). This is not a component tier — it's what every tier composes with, and why the system stays robust: components own no layout that a primitive can own.

| Primitive | Attribute API | Wireframe use | Legacy equivalent (retire) |
|---|---|---|---|
| `.stack` | `data-space` | heavy | `.stack-l`, `.spacer` |
| `.cluster` | `data-space` | heavy (chips, actions, meta rows) | ad-hoc flex rows |
| `.center` | `data-measure`, `data-padding` | heavy | `.wrapper`, `.max-width`, `.center-l` |
| `.grid` | `data-gap`, `data-min-width` | heavy (card grids) | `.cards-section` grids, `.grid__1-4`, `.product-list` |
| `.switcher` | `data-space`, `data-threshold`, `data-limit` | 2× (media-beside-text) | `.split-section` layout |
| `.box` | `data-padding`, `data-border`, `data-invert` | docs only | — |
| `.frame` | `data-ratio` | unused | `--n`/`--d` aspect hack, `.frame-l` |
| `.cover`, `.reel`, `.imposter`, `.container` | various | unused | `.frame*` rail, modals, carousels |

**Contract bugs found (fix before building on top):**
- `data-gap` is implemented **only on `.grid`**; `.stack`/`.cluster`/`.switcher` listen to `data-space`. The wireframe layer writes `data-gap` on all four in ~50 places — silent no-ops falling back to the default. Decide one attribute name (recommend: honor `data-gap` everywhere, alias `data-space`) and enforce it.
- `data-measure` is implemented only on `.center` but applied to bare `<p>` in 8 places. Either add a `[data-measure]` universal rule or fix the call sites.
- Wireframe pages also bypass `.grid` with raw `style="grid-template-columns: repeat(N, 1fr)"` in 7 places — contradicts the fluid `data-min-width` contract; these should become grid-organism or primitive usages during migration.

---## Level 1 — Atoms

| Target (ccm\*) | Wireframe today | Old code today | Verdict | Notes |
|---|---|---|---|---|
| `ccmLogo` | text placeholder in `wfNav`/`wfFooter` | `legacy/atoms/Logo.vue` + `LogoWhite.vue` (inline SVG, both used) | **rebuild** | Tier-1 pipeline-proving PR: one component, `variant` prop. |
| `ccmButton` | raw `.wf-button` — 11 inline uses across 5 pages + 5 in wf components; `data-variant="primary"` | `ds/molecules/ccmButton.vue` (polymorphic, variant/color/size — solid base); legacy `.button` + `--{navy,green,red,yellow,small,large,…}` | **evolve** | Highest-leverage atom: 16 raw call sites in wireframes alone. Map legacy color modifiers → semantic variants, not literal colors. |
| `ccmChip` | `wfChip` (span / link / active-filter link, 7×) | `ds/molecules/ccmChip.vue` (dismissible, interactive, sizes); legacy chips only inside `SimpleFilters` | **evolve** | ccmChip lacks link + active-filter modes that `wfChip` proved out; port those in. |
| `ccmMedia` | `wfMedia` (img or crosshatch placeholder, ratio-driven `--wf-ratio`, 6×) | nothing componentized — `<picture>` inside `legacy/Hero.vue`, `.card__product` imgs, `--n`/`--d` aspect vars | **new** | Ratio prop (16/9, 3/2, 21/9, 1/1). Consider building on the unused `.frame` primitive instead of bespoke CSS. |
| external-link marker | `data-external` attr (CSS ↗) + inline `<span aria-hidden>↗</span>` in card titles | nothing | **new** | Utility/attribute, not a component. Pick ONE mechanism (attribute) — the wireframe currently has both. |
| date display | bare `<time>` in 4 pages — **none carry `datetime`** | `.card__date` markup | **new** | Formatter util + `<time datetime>` element. The missing machine-readable attr is an a11y/SEO fix to bake in. |
| skip link | `.wf-skip-link` in wireframe layout | absent from legacy | **new** | Trivial; a11y baseline item. |
| icon | Material Icons via legacy layout; `.icon` utility | two conflicting `.icon` utilities (`utils.css` Material Symbols vs `typography-utils.css` Material Icons — later import wins) | **cleanup** | Resolve the double definition when tokenizing; pick one icon font. |

## Level 2 — Molecules

| Target (ccm\*) | Wireframe today | Old code today | Verdict | Notes |
|---|---|---|---|---|
| `ccmBreadcrumb` | `wfBreadcrumb` (used only via `wfPageHeader`) | `ds/ccmBreadcrumb` (rich: separators, JSON-LD — but demo-only/dead); `legacy/Breadcrumb.vue` (used) | **evolve** | The ds version is over-built vs need; keep JSON-LD, adopt wf's simple items API. |
| `ccmByLine` | inline byline/meta row on insight detail (1×) | `ds/ccmByLine` is a **misnomer** — it renders a hardcoded "© CCM Design" footer attribution, not an article byline | **evolve + rename decision** | Naming collision to resolve at kickoff: article byline vs footer credit are different components. |
| `ccmCard` (base) | `wfCard` — slot-based shell (media / chips / default sockets), stretched-link heading, equal-height in grids | `ds/ccmCard` (whole-card NuxtLink, image+text+CTA) | **evolve** | Architecture decision already made this front: slot-based base + 5 typed prop-based wrappers. Note ccmCard's whole-card link conflicts with wf's stretched-heading-link (better for a11y + nested links) — adopt the wf pattern. |
| — card: Insight | `wfCardInsight` (format/program/Archive chips, linked title, excerpt, date) | `legacy/Card.vue`, `DocCard`, `HighlightCard` | **evolve** | Absorbs 3 legacy cards. |
| — card: Project | `wfCardProject` (kind/external/pending chips, optional media, CTA) | `legacy/ProductCard`, `ProductCardWebsite`; dead `custom/projectCard.vue` (288-line ccmCard wrapper — delete) | **evolve** | Absorbs 2 legacy cards + the dead custom one. |
| — card: Featured | `wfCardFeatured` (16/9 media, Featured chip) | `legacy/HighlightCard.vue` | **evolve** | |
| — card: Person | `wfCardPerson` (1/1 portrait, name, role) | `legacy/PeopleSection.vue` person-item markup (grid + modal, not a card component) | **evolve** | Open gap: legacy pairs person tile with a **modal** bio; wireframe has no modal anywhere. Decide modal vs detail page. |
| — card: Program | `wfCardProgram` (name + tagline + CTA) | no equivalent (programs are a new IA concept) | **new** | |
| — card: list row | inline chip+link+time rows on 2 pages (search results, archive rows) | `legacy/ProductCardThin.vue` (`product-card--item` ancestor) — the dense-list ancestor | **new** (`ccmCardRow` or 6th variant) | Missing from Front 2's 5-variant table; the repetition is real (2 pages + archive accordion). |
| `ccmFormField` / `ccmFormGroup` | **three divergent form idioms**: subscribe input cluster (2 impls), contact form label-wraps-input | `ds/ccmFormField` + `ccmFormGroup` (solid, validation states — demo-only/dead); legacy `.textfield`/`.field-group`/`.form` | **evolve** | Wireframe proves the need; ds components exist unused. Consolidate the 3 idioms onto them. |
| filter chip row | inline in 4 places across 2 pages, **two divergent impls** (link-chips vs button-chips) + active-state via inline style ×3 + clear-button ×2 | `legacy/SimpleFilters.vue` (emits `filterChange`) | **rebuild** (`ccmFilterBar`) | Compose from ccmChip (active/link modes) — this is the composability test case for chip. |
| `ccmAccordion` | raw `<details>/<summary>` on archive page; `wfNavDropdown` is a second details-based impl | v2 repo's `bfnaCollapseGroup` (concept only) | **new** | Thin skin over native `<details>` — keep native semantics. |
| load more | 1 inline button on insights feed | legacy had none (skeleton `loading.njk` dropped in port) | **new** | Or pagination — Front 4 call, per Front 2. |
| menu link | `wfMenuLink` (shared nav + footer) | inline nav markup | **new** (likely internal to nav organism) | |
| nav dropdown | `wfNavDropdown` (details-based, closes siblings) | `legacy/OffCanvas` drawer pattern | **new** (internal to nav) | |
| empty state / result count | result-count line ×2, one explicit empty state, 2 silent | search page inline | **pattern, maybe not component** | Standardize copy + markup; component only if it grows props. |

## Level 3 — Organisms

| Target (ccm\*) | Wireframe today | Old code today | Verdict | Notes |
|---|---|---|---|---|
| `ccmNav` (site header) | `wfNav` + `wfNavDropdown` + `wfMenuLink`, menus from `useWfContent` | `legacy/Frame.vue` (left rail!) + `MainNav` + `OffCanvas` + `PlatformNav` + dead `Header.vue`; `ds/ccmTopbar` is a hardcoded placeholder | **rebuild** | The IA changed shape: legacy = left-rail frame, new = top bar. Data-driven from one nav registry (Directus) replaces nav hardcoded across 4 legacy components. `ccmTopbar` is a name, not a base. |
| `ccmFooter` | `wfFooter` (brand/search + 4 menu cols + social + legal — 4 inline sub-blocks) | `legacy/Footer.vue` (wraps MainNav); `ds/ccmFooter` renders literal `<h1>Footer</h1>` | **evolve** | Feed from the same nav registry as ccmNav. |
| `ccmHero` | `wfHero` (homepage: h1 + description + actions slot) | `legacy/Hero.vue` (182 ln: `<picture>`, per-workstream image map, theme modifiers, embeds AnnouncementCard + PlatformNav) + `ProductHero`; `ds/ccmHero` (3-band slot structure — good base) | **evolve** | Props + actions slot (decided this front). Needs tall variant. Legacy hero's workstream theming becomes program theming via tokens. |
| `ccmPageHeader` | `wfPageHeader` (breadcrumb + chips + h1 + taglines + slot, 9× — most-used organism) | `legacy/ProductHero` + `Breadcrumb` + `.prose__intro` | **new composition** | Composes ccmBreadcrumb + ccmChip + heading. **Slots-vs-props mechanism is the recorded gap** — wf version is props + one slot and works; ratify that. |
| `ccmSection` | `wfSection` (label + optional h2 + stack/switcher/cluster/plain inner, **26×** — most-used component overall) | `.cards-section` bands, `legacy/SplitSection` (media-beside-text — also 2 divergent inline impls in wireframes), `VideoSection`, `.highlight-section`; `ds/ccmSection` (buggy: `fullWidth` no-op, props leak to DOM) | **evolve after fixes** | Slot-based + convenience props (decided). Absorbs SplitSection (note ds already has `imageLeft`/`imageRight` props) and VideoSection as variants. |
| `ccmCtaSection` / subscribe | `wfCtaSection` (4×: heading + message + buttons, or email-capture variant); plus inline announcement bar (1×) and global subscribe band in layout | `.floating-message` newsletter toast, `subscribe.njk` ancestry, `.bfna-subscribe`; dead MDC `ctaSignup.vue` | **evolve** | One CTA-band organism, email-form variant composes ccmFormField. Announcement bar likely a variant, or absorbed by legacy `AnnouncementCard`'s successor. |
| `ccmNotice` (banner) | archive-banner note band (inline, 1×) | dead MDC `callout.vue` | **evolve** | Generic notice/banner per Front 2. |
| search shell | inline: search input block, results list, relevance meter | `pages/search.vue` inline card markup; `.frame-search` in rail | **new** | Input + result list (uses card-row molecule). Relevance meter is wireframe-only (see below). |
| card grids | `wfGridInsights` (6×), `wfGridProjects` (3×) | `.cards-section` + `.product-list` bands | **keep as thin organisms** | They encode column policy + equal-height; keep as data-in/cards-out wrappers over `.grid`, replacing the 7 raw inline grids. |
| contact section | `wfContactSection` (hardcoded copy, 1×) | about-page markup | **decompose** | Not a DS organism — recompose from ccmSection + ccmFormField when real copy exists. |
| cross-links row | "Also explore" cross-nav (1×) + "All X →" trailing links (2×) | none | **new (trivial)** | |
| tabs | none in wireframes | hand-rolled `.tabs` in team/updates pages, `HomepageUpdates`, `UpdatesPageTab`; `ds/ccmTabs` (solid, ARIA) | **keep, no wireframe work** | New UX dropped tabs; ccmTabs stays for docs/blog. |
| table | none | `ds/ccmTable` | **keep, no work** | |
| modal | **none** | `legacy/PeopleSection` person modal, `modal.njk`/`modal--video.njk` (dropped in port — only `.modal*` CSS survives) | **open gap** | Person-bio and video flows had modals; new UX must decide modal vs page. Flag for GGS/Q14. |

## Level 4 — Templates

| Template | Wireframe today | Old code today | Verdict |
|---|---|---|---|
| Site shell | `layouts/wireframe.vue` (skip link → nav → hero slot → body → subscribe → footer) | `layouts/legacy-base.vue` (429 ln: Frame rail + theme background map + 3rd-party scripts) | **new** — shell shape changed (rail → top bar); port the integrations, not the layout |
| Home | `wireframes/index.vue` | `pages/index.vue` + `HomepageUpdates.vue` | rebuild on new UX |
| Program hub | `wireframes/[area].vue` | 4 workstream pages + `archives/index.vue` (shared `.cards-section` shape) | rebuild |
| Insights index / feed | `wireframes/insights/index.vue` | `pages/updates.vue` + `UpdatesPageTab.vue` | rebuild |
| Insight detail | `wireframes/insights/[slug].vue` | `pages/[...slug].vue` (201 ln polymorphic: prose system, video, secondary sections, people) | rebuild — the `.prose*` system maps to `wfProse`/`.prose` component work |
| Projects index / detail | `wireframes/projects/*` | product pages + `podcasts/[slug].vue` (podcast folded into project template) | rebuild |
| About | `wireframes/about.vue` | `pages/about.vue` + `pages/team.vue` + `PeopleSection` | rebuild |
| Search | `wireframes/search.vue` | `pages/search.vue` | rebuild |
| Archive | `wireframes/archive.vue` | archives workstream page | rebuild |
| Error/404 | "Unknown page" fallback — **identical inline markup in 3 dynamic pages** | `src/error.vue` | **new** — one shared not-found block; the 3× duplication is the proof |

## Wireframe-only artifacts (not design-system components)

`.wf-slot` label bands, `.wf-note`, crosshatch media placeholder, relevance meter (Front 4 will replace with real search), `data-pending` (defined in CSS, never used — delete). These die with the wireframe skin.

---

## Findings & risks (inventory by-catch — nothing touched)

1. **Token system is orphaned outside wireframes.** `src/public/css/styles.css` is loaded by exactly one layout — `wireframe.vue`. The docs/blog/default layouts render `ccm*` components with **no token stylesheet at all**; `nuxt.config` `css: []` is fully commented out. Wiring this is step 0 of any real migration.
2. **Composition contract bugs** (`data-gap` no-op outside `.grid` in ~50 wireframe call sites; `data-measure` no-op outside `.center` in 8) — see Level 0.
3. **Unused code identified — but "unused" and "delete" are not the same verdict.** Three distinct buckets, do not collapse them:
   - *Delete outright (zero references, nothing depends on them):* `legacy/Header.vue`, `custom/projectCard.vue`, `layouts/{default,docs2,enhanced-hybrid}.vue`, the `css-legacy/legacy-styles.css` barrel, and the byte-identical duplicate of the 3,676-line `global.css` (`public/` vs `src/public/css-legacy/`).
   - *Demo-only today but slated to be evolved, NOT deleted:* `ccmBreadcrumb`, `ccmFormField`, `ccmFormGroup` — these are well-built and become `bfBreadcrumb` / `bfFormField` / `bfFormGroup`. Only `ccmTopbar` and `ccmByLine` are genuinely superseded (a hardcoded placeholder and a misnamed footer credit respectively).
   - *Keep as-is, out of scope:* `ccmTabs` and `ccmTable` serve blog/docs. They are unused by the new UX but are **not** retirement candidates.
   The 5 MDC content components are dead only because `src/content/docs/` is empty in the checked-in tree (populated by `npm run docs:generate`) — verify before touching.
   Separately, known token debt: broken `--colors-*` block (7 of 8 declarations invalid), `--color-black` missing a comma, `semantic-spacing.css` empty stub, `themes/theme.css` 100% commented out.
4. **`ccmByLine` naming collision** — current ds component is a footer copyright, the UX needs an article byline. Rename one at kickoff.
5. **Card-link pattern conflict** — ds `ccmCard` wraps the whole card in one link; wf `wfCard` uses a stretched heading link (allows nested chip/CTA links, better a11y). Adopt the wf pattern when evolving.
6. **Additions to Front 2's build list surfaced by this pass**: list-row card (6th variant), announcement bar, shared not-found block, empty-state/result-count pattern, modal decision, date/`<time datetime>` util, icon-utility conflict cleanup.
7. **Ancestry note**: `components/legacy/**` is a 1:1 port of the Eleventy site (`../bfna-website`) — every njk partial has a Vue twin except `loading`, `modal`, `modal--video`, `tweet-card` (dropped). The other sibling, `../bfna-website-v2` (abandoned Nuxt-RC rewrite), used the npm `@ccmdesign/ccm-ds` package and a different design direction — treat as reference only, not ancestry.
8. **Doc housekeeping**: `component-inventory.md` and `fronts/03-design-system.md` reference `design-system-approach.md`, which currently exists only in a session worktree — needs to land in the main checkout.

## Counts

| Level | Evolve | Rebuild | New | Keep (no work) | Cleanup/decide |
|---|---|---|---|---|---|
| 0 Composition | — | — | — | 11 primitives | 2 contract bugs |
| 1 Atoms | 2 | 1 | 5 | — | 1 (icon) |
| 2 Molecules | 8 | 1 | 5 | — | 2 (byline, empty-state) |
| 3 Organisms | 5 | 1 | 4 | 2 (tabs, table) | 2 (contact, modal) |
| 4 Templates | — | 9 | 2 | — | — |

Legacy components retired by this plan: all 23 in `components/legacy/**` + 2 dead app components, absorbed per the tables above (consistent with Front 2's retire mapping, now with the list-row and not-found additions).

<!-- ============ VERBATIM CONTENT ENDS ============ -->

---

## Document 2 of 2 — source metadata

**Source path:** `_process/scoping/architecture-and-epics.md`
**Git first-commit date:** 2026-08-31 (commit `dc62056`)
**Git last-commit date:** 2026-08-31 (commit `dc62056`, same commit — no revisions since)
**Author:** Claudio Mendonca <claudioccm@gmail.com>

<!-- ============ VERBATIM CONTENT BEGINS ============ -->

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

<!-- ============ VERBATIM CONTENT ENDS ============ -->
