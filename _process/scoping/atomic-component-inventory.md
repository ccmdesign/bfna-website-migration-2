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
