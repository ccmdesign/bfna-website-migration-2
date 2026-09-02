# As-built inventory — wireframe component layer

Audited from the main checkout, branch `wireframes` (read-only), root
`bfna-website-nuxt/src`. Scope: `components/wireframe/*.vue` (22 files),
`layouts/wireframe.vue`, `pages/wireframes/**/*.vue` (9 files),
`public/css/wireframe.css` (384 lines), `composables/useWfContent.ts` (282
lines), plus composition-utility usage (not the utility files themselves).

---

## A. Components (22 of 22)

Base + typed-wrapper pattern: **`wfCard`** is the base card shell (slots
`default`/`chips`/`media`, no props). Six typed wrappers fill its slots:
`wfCardFeatured`, `wfCardInsight`, `wfCardPerson`, `wfCardProduct`,
`wfCardProgram`, `wfCardProject`. Similarly **`wfSection`** is the base
section band (slot `default`, props for heading/gap/layout/measure/padded);
`wfCtaSection`, `wfContactSection`, `wfPageHeader` all compose it internally
(not literal slot-fill, but the same base+specialization shape).

| Component | Purpose | Props (name:type=default) | Slots | Emits | Children used | Usage (files/sites) | Variants |
|---|---|---|---|---|---|---|---|
| `wfBreadcrumb.vue` | Breadcrumb trail | `items:WfCrumb[]` (req) | — | — | `NuxtLink` | 1 file: `wfPageHeader.vue` | plain vs linked crumb per item (`c.to`) |
| `wfCard.vue` | Base card shell (`<li>`) | none | `default`, `chips`, `media` | — | — | 6 files (all `wfCard*` wrappers) | `data-span="full"` set by consumer (`wfCardProduct`) |
| `wfCardFeatured.vue` | Featured/highlight card (16/9 media + "Featured" chip) | `item:WfInsight` (req) | — | — | `wf-card`, `wf-media` | 1 file: `pages/wireframes/index.vue` (highlights strip) | none |
| `wfCardInsight.vue` | Insight card (format chip + title + excerpt + date) | `insight:WfInsight`(req), `extraChips?:string[]`, `excerpt?:boolean=true`, `excerptLength?:number=140` | — | — | `wf-card` | 1 direct call site: `wfGridInsights.vue` (reaches 5 pages transitively) | excerpt on/off, extraChips, Archive chip conditional |
| `wfCardPerson.vue` | Person card (name + role + 1/1 portrait, no link) | `person:WfPerson` (req) | — | — | `wf-card`, `wf-media` | 1 file: `pages/wireframes/about.vue` (Board + Team grids, 2 call sites) | job_title fallback `—` |
| `wfCardProduct.vue` | External-only "product" card (e.g. Transponder), full-width slot | `product:WfProject`(req), `excerptLength?:number=220` | — | — | `wf-card`, `wf-media` | 1 file: `pages/wireframes/index.vue` (Insights grid) | `data-span="full"`; linked title vs plain+pending chip when no `external_url` |
| `wfCardProgram.vue` | Program card (linked name + tagline) | `program:{slug,name,tagline?,short?}` (inline type, req) | — | — | `wf-card` | 1 file: `pages/wireframes/index.vue` (Programs switcher) | tagline optional |
| `wfCardProject.vue` | Project card (chips + linked title [+↗] + excerpt [+ media]) | `project:WfProject`(req), `media?:boolean`, `mediaRatio?:string='3/2'`, `chips?:boolean=true`, `excerptLength?:number=140` | — | — | `wf-card`, `wf-media` (conditional) | 2 files: `wfGridProjects.vue` (direct), `pages/wireframes/index.vue` (featured projects, `media chips=false`) | media on/off, mediaRatio, chips on/off, external ↗ marker |
| `wfChip.vue` | Chip: span/link/anchor | `to?:string\|object`, `href?:string`, `external?:boolean`, `active?:boolean` | `default` | — | `NuxtLink` (conditional) | 5 files: `wfPageHeader.vue`, `archive.vue`, `insights/index.vue`, `projects/[slug].vue`, `search.vue` | to→link / href→external anchor / else span; `active` = inline style only (see D) |
| `wfContactSection.vue` | Contact section (form + visit-us block) | none | — | — | `wf-section` | 1 file: `about.vue` (`#contact`) | none |
| `wfCtaSection.vue` | GGS CTA band (heading + message + CTAs, or email-capture form) | `label?:string='CTA'`, `heading?:string`, `message?:string`, `ctas?:WfCta[]=[]`, `form?:boolean` | — | — | `wf-section` | 1 file / 3 call sites: `projects/[slug].vue` (Microsite CTA, Participation path ×2) | form-mode vs CTA-buttons mode; first CTA primary unless `c.primary` overrides |
| `wfFooter.vue` | Site footer (brand + 4 menu cols + socials + legal) | none | — | — | `wf-menu-link` | 1 file: `layouts/wireframe.vue` | none |
| `wfGridInsights.vue` | Fixed 3-col insight-card grid | `insights:WfInsight[]`(req), `excerptLength?:number`, `extraChips?:(i)=>string[]\|undefined` | — | — | `wf-card-insight` | 5 files: `index.vue`, `[area].vue`, `insights/index.vue`, `insights/[slug].vue`, `projects/[slug].vue` | column count fixed via inline style (see C/D) |
| `wfGridProjects.vue` | Fixed 2-col project-card grid | `projects:WfProject[]`(req), `excerptLength?:number` | — | — | `wf-card-project` | 2 files: `[area].vue`, `projects/index.vue` | column count fixed via inline style (see C/D) |
| `wfHero.vue` | Homepage hero (prop copy + slot for CTA buttons) | `heading?:string\|null`, `description?:string\|null` | `default` (actions) | — | — | 1 file: `pages/wireframes/index.vue` | description optional, slot optional |
| `wfMedia.vue` | Image w/ wireframe-placeholder fallback | `src?:string\|null`, `alt?:string\|null`, `ratio?:string='16/9'` | — | — | — | 6 files: `wfCardFeatured`, `wfCardPerson`, `wfCardProduct`, `wfCardProject`, `insights/[slug].vue`, `projects/[slug].vue` | real `<img>` vs placeholder `<div>`; ratio inline |
| `wfMenuLink.vue` | One menu item (shared nav+footer) | `item:WfMenuItem` (req) | — | — | `NuxtLink` (conditional) | 2 files: `wfFooter.vue`, `wfNavDropdown.vue` | to/href, strong |
| `wfNav.vue` | Top bar (logo + menu dropdowns + search) | none | — | — | `wf-nav-dropdown` | 1 file: `layouts/wireframe.vue` | plain link vs dropdown per `MENUS` entry |
| `wfNavDropdown.vue` | Top-bar dropdown (`<details>`, closes siblings) | `label:string`(req), `items:WfMenuItem[]`(req) | — | — | `wf-menu-link` | 1 file: `wfNav.vue` | none |
| `wfPageHeader.vue` | Inner-page hero unit (breadcrumb + chips + h1 + tagline) | `label?:string='Page header'`, `crumbs?:WfCrumb[]`, `chips?:(string\|null)[]`, `heading?:string\|null`, `tagline?:string\|string[]\|null` | `default`, `chips` | — | `wf-section`, `wf-breadcrumb`, `wf-chip` | 8 files: `[area].vue`, `about.vue`, `archive.vue`, `insights/[slug].vue`, `insights/index.vue`, `projects/[slug].vue`, `projects/index.vue`, `search.vue` | chips as strings or slot; tagline string or array |
| `wfProse.vue` | Renders Directus body field (markdown-lite or legacy HTML) as blocks | `content?:string\|null` | — | — | — | 2 files: `insights/[slug].vue`, `projects/[slug].vue` | markdown-lite parse (h2/h3/p/ul) vs legacy-HTML strip path |
| `wfSection.vue` | Base full-bleed band | `label?:string`, `heading?:string`, `gap?:string='m'`, `layout?:'stack'\|'switcher'\|'cluster'\|'plain'='stack'`, `measure?:string`, `padded?:boolean` | `default` | — | — | 12 files: 3 components (`wfCtaSection`, `wfContactSection`, `wfPageHeader`) + 9 pages (all pages except none — every page uses it at least once) | layout variant, padded, measure |

**Component count check:** 22 files in `components/wireframe/*.vue` == 22 entries above.

---

## B. CSS primitives — `public/css/wireframe.css` (16 of 16 `.wf-*` selectors)

Selector list per spec's exact command
(`grep -oE '\.wf-[a-zA-Z0-9_-]+' public/css/wireframe.css | sort -u`):

| Selector | Purpose (source line) | Relied on by |
|---|---|---|
| `.wf-button` | Lo-fi button, `[data-variant="primary"]` filled variant (L262-276) | `wfCtaSection`, `wfContactSection` (components); `index.vue`, `[area].vue`, `insights/[slug].vue`, `insights/index.vue`, `search.vue` (pages) |
| `.wf-card` | Card shell: relative/border/padding/flex column (L301-308); `[data-span="full"]` full-width variant (L315-318) | `wfCard.vue` and, transitively, all 6 `wfCard*` wrappers |
| `.wf-card__chips` | `order:-1` — pulls chips slot above body visually (L321) | `wfCard.vue` |
| `.wf-card__media` | `order:-2` — pulls media slot to the top (L320) | `wfCard.vue` |
| `.wf-chip` | Pill chip styling (L348-358) | `wfChip.vue`; literal class in `wfCardFeatured`, `wfCardInsight`, `wfCardProduct`, `wfCardProject`, `wfPageHeader`; raw `<button class="wf-chip">` in `search.vue`, `archive.vue`, `insights/index.vue`, `projects/[slug].vue` |
| `.wf-footer` | Footer border/spacing (L239-243) | `wfFooter.vue` |
| `.wf-header` | Sticky top-bar chrome (L161-168) | `wfNav.vue` |
| `.wf-hero` | Taller `min-height:60svh` grid-centered hero (L90-94) | `wfHero.vue` |
| `.wf-media` | Crosshatch placeholder box, `--wf-ratio` (L100-109) | `wfMedia.vue` |
| `.wf-nav` | Nav container padding/border (via `.wf-nav a` etc., L217-225) | `wfNav.vue` |
| `.wf-nav__group` | Dropdown `<details>` positioning + `[open]` state (L177-200) | `wfNavDropdown.vue` |
| `.wf-nav__link` | Plain top-level nav button padding (L189-191) | `wfNav.vue` (pruned-nav plain buttons: Podcasts, Documentaries) |
| `.wf-nav__logo` | Logo sizing/margin (L170-175) | `wfNav.vue` |
| `.wf-note` | Monospace reviewer/system-note box (L114-121) | raw `<p class="wf-note">` in `search.vue` (2×), `insights/[slug].vue` (archive banner) |
| `.wf-skip-link` | Visually-hidden-until-focus skip link (L148-159) | `layouts/wireframe.vue` |
| `.wf-slot` | Region/band chrome: dashed border, `[data-label]` corner tag, `[data-compact]` variant (L46-82) | `wfSection.vue` (all `.wf-slot` bands); `wfHero.vue` (`wf-slot wf-hero`); `wfCtaSection.vue` (via `wf-section`); raw `<section class="wf-slot" data-compact data-label="Announcement">` in `index.vue:5` |

**Verification check 2:** all 16 selectors from the grep command appear in the table above — pass.

Non-`.wf-*` but wireframe-scoped hooks also present in the file: `[data-compact]`,
`[data-external]`, `[data-label]`, `[data-pending]`, `[data-span]`,
`[data-variant]` — each documented against its owning selector row above.

---

## C. Composition-layer usage (concise)

Every-Layout primitives referenced under wireframe scope, by class:
`cluster` (21 sites), `stack` (17), `grid` (7 — all `ul.grid`), `center`
(via `wfSection`'s `center | ${layout}` pattern + `wfHero`, `wfNav`,
`wfFooter`, and 3 not-found blocks), `switcher` (3: `wfContactSection`
`layout="switcher"`, `about.vue` Bertelsmann Stiftung `layout="switcher"`,
`index.vue` Programs `<ul class="switcher">`).

`data-gap` value distribution: `xs`×17, `s`×16, `m`×9, `2xs`×5, `l`×2,
`xl`×1, `3xs`×1, plus 1 dynamic (`wfSection`'s bound `:data-gap`).

**Finding — `data-min-width` (the switcher/grid auto-responsive mechanism)
is never used anywhere in scope.** All 7 `ul.grid` column counts are pinned
with hand-written inline `style="grid-template-columns: repeat(N, 1fr)"`
instead: `wfFooter.vue:15` (4-col), `wfGridInsights.vue:16` (3-col),
`wfGridProjects.vue:15` (2-col), `index.vue:29` (2-col, featured projects),
`index.vue:39` (2-col, product+featured band), `about.vue:13` and `:19`
(3-col ×2, Board/Team). None reflow via the composition utility's own
responsive contract — see D for the componentization angle on this.

---

## D. Inline / ad-hoc UI candidates (concise, file:line)

1. **Identical "not found" block, 3×, verbatim structure** — `<div class="center | stack" style="padding-block: var(--space-xl);"><h1>…</h1><p><NuxtLink>…</NuxtLink></p></div>` at `pages/wireframes/[area].vue:40`, `pages/wireframes/insights/[slug].vue:35`, `pages/wireframes/projects/[slug].vue:86`. Proposed: `wfNotFound`/`wfEmptyState` (props: `heading`, `backLabel`, `backTo`).
2. **Hand-rolled fixed-column grids** (7 sites, listed in C) — none uses the switcher/grid utility's `data-min-width` responsive mechanism; column counts are all inline-styled. Proposed: add a `columns` prop to `wfGridInsights`/`wfGridProjects`, or a shared `wfGrid` wrapper, and use it at the two raw `<ul class="grid">` page sites (`index.vue:29`, `index.vue:39`).
3. **Duplicated toggle-chip "active" styling** — `pages/wireframes/search.vue:23-27` (program facet) and `:31-35` (format facet) each hand-roll `<button class="wf-chip" :style="… ? 'background:#222;color:#fff;cursor:pointer' : …">`, re-implementing (twice, in the same file) exactly the inline active-style `wfChip.vue:12` already encodes for its `NuxtLink` variant. `wfChip` has no click/button variant, forcing the duplication. Proposed: add a button/click variant (or `modelValue`) to `wfChip.vue`.
4. **One-off raw `.wf-slot` band** — `pages/wireframes/index.vue:5`, the Announcement banner (`<section class="wf-slot" data-compact data-label="Announcement">`), duplicates `wfSection`'s band chrome by hand instead of exposing `compact` as a `wfSection` prop. Single use today — flag only, not urgent.
5. Relevance-meter bar in `search.vue:57-62` is bespoke/inline but single-use — no extraction proposed.

---

## E. Data contracts

`useWfContent.ts` exports types `WfInsight`, `WfProject`, `WfProgram`,
`WfMenuItem`, `WfMenu`, `WfPerson` (plus locally-defined `WfCrumb` in
`wfBreadcrumb.vue` and `WfCta` in `wfCtaSection.vue`, not exported from the
composable).

| Component | Type consumed | Fields read |
|---|---|---|
| `wfCardFeatured` | `WfInsight` | `slug`, `heading`, `excerpt` (via `plain()`), `image` |
| `wfCardInsight` | `WfInsight` | `slug`, `heading`, `excerpt`, `publish_date`, `format`, `archived` |
| `wfGridInsights` | `WfInsight[]` | `slug` (key), passes item through |
| `wfCardPerson` | `WfPerson` | `name`, `job_title`, `image` |
| `wfCardProduct` | `WfProject` | `external_url`, `heading`, `excerpt`, `description`, `pending`, `image` |
| `wfCardProject` | `WfProject` | `slug`, `heading`, `external_url`, `excerpt`, `description`, `kind`, `pending`, `image` |
| `wfGridProjects` | `WfProject[]` | `slug` (key), passes item through |
| `wfCardProgram` | **inline `{slug,name,tagline?,short?}`, NOT `WfProgram`** | `slug`, `name`, `tagline` |
| `wfMenuLink` | `WfMenuItem` | `to`, `href`, `label`, `strong` |
| `wfNavDropdown` | `WfMenuItem[]` | `label` (key), passes item through |
| `wfBreadcrumb` | local `WfCrumb` | `label`, `to` |
| `wfPageHeader` | local `WfCrumb[]` (via prop), plain strings for chips/heading/tagline | — (pages pre-derive fields before passing) |
| `wfCtaSection` | local `WfCta` (not from composable) | `label`, `to`, `href`, `external`, `primary` |
| `wfProse` | plain string | consumes `WfInsight.content` / `WfProject.description` (pages pass it in) |
| `wfMedia` | plain strings | consumes `.image` field of whichever type the caller holds |
| `wfFooter`, `wfNav` | `WfMenu[]` via `useWfContent().menus()` (called directly, not via props) | `label`, `items`, `to`, `href`, `external` |
| `wfChip`, `wfSection`, `wfCard`, `wfHero`, `wfContactSection` | none — generic/presentational or plain strings | — |

**Data-contract mismatch found:** `WfProgram` is exported from
`useWfContent.ts` (`slug, name, intro, image`) but `wfCardProgram.vue`
declares its own inline prop type instead of importing it, and the caller
(`index.vue:61-66`) constructs an ad-hoc `{slug,name,short,tagline}` object
rather than passing a `WfProgram` — the typed-wrapper pattern used by every
other `wfCard*` component (`import type { WfX } ... defineProps<{x:WfX}>()`)
is not followed here.

---

## F. Page → section map (concise)

- **`index.vue`** (home): Announcement (raw `.wf-slot`, conditional) → Hero (`wfHero`) → "Programs" (`wfSection`, switcher, `wfCardProgram`×N) → "Featured projects" (`wfSection`, grid 2-col, `wfCardProject`) → "Insights" (`wfSection`, grid 2-col `wfCardProduct`+`wfCardFeatured`, then `wfGridInsights` 3-col).
- **`archive.vue`**: "Archive index" (`wfPageHeader` hero) → "By year" (`wfSection`, `<details>` per year, `wfChip`+`NuxtLink`+`time`).
- **`search.vue`**: "Search" (`wfPageHeader` hero, input) → "Refine" (`wfSection`, conditional, raw chip buttons) → "Results" (`wfSection`, conditional, `wfChip`, relevance bar).
- **`[area].vue`** (program hub): "Hub intro" (`wfPageHeader` hero) → "Projects in this area" (`wfSection`, `wfGridProjects`) → "Recent insights" (`wfSection`, conditional, `wfGridInsights`) → not-found fallback.
- **`about.vue`**: "Mission" (`wfPageHeader` hero) → "Board of Directors" (`wfSection`, grid 3-col `wfCardPerson`) → "Team" (`wfSection`, grid 3-col `wfCardPerson`) → "Bertelsmann Stiftung" (`wfSection`, switcher, img+text) → "Contact" (`wfContactSection`).
- **`insights/index.vue`**: "Insights feed" (`wfPageHeader` hero) → "Filters" (`wfSection`, `wfChip` toggles) → "Results" (`wfSection`, `wfGridInsights`, load-more).
- **`insights/[slug].vue`**: "Insight header" (`wfPageHeader` hero, conditional) → "Archive banner" (`wfSection` plain, conditional) → "Body" (`wfSection` narrow, `wfMedia`+`wfProse`) → "Related insights" (`wfSection`, `wfGridInsights`) → not-found fallback.
- **`projects/index.vue`**: "Projects index" (`wfPageHeader` hero) → one `wfSection` per program (v-for, `wfGridProjects`) → "Pending re-tag (Q3)" (`wfSection`, conditional, `wfGridProjects`).
- **`projects/[slug].vue`**: "Project overview (external)" or "Project overview" (`wfPageHeader` hero, branches on `external_url`) → **external branch**: "Microsite CTA" (`wfCtaSection`) → "Participation path" (`wfCtaSection`) → "Related insights" (`wfSection`, `wfGridInsights`) — **full branch**: "Project body" (`wfSection` narrow, `wfProse`) → "Participation path" (`wfCtaSection`) → "Episodes" (`wfSection`, conditional podcast) → "Outcomes / alumni" (`wfSection`, conditional cohorts, `wfChip`) → "Related insights" (`wfSection`, `wfGridInsights`) → not-found fallback.

---

## Notes on inheritance (base + typed-wrapper pattern)

- **Card family**: `wfCard` (base, slots-only) ← `wfCardFeatured` /
  `wfCardInsight` / `wfCardPerson` / `wfCardProduct` / `wfCardProgram` /
  `wfCardProject` (typed wrappers, each importing its `Wf*` type from the
  composable — except `wfCardProgram`, see E).
- **Section family**: `wfSection` (base band) ← `wfPageHeader` (adds
  breadcrumb/chips/h1 ahead of its own content), `wfCtaSection` (adds
  CTA/form rendering), `wfContactSection` (adds a fixed form+address body).
  These compose `wfSection` internally rather than filling a literal slot
  from outside, but follow the same base+specialization shape.
- **Grid family**: `wfGridInsights`/`wfGridProjects` are thin wrappers that
  fix column count + wrap `wfCardInsight`/`wfCardProject` in a `<ul>` — no
  shared base between the two (could be unified per D.2).
- **Nav/footer**: `wfMenuLink` is a shared leaf consumed by both `wfNav`
  (via `wfNavDropdown`) and `wfFooter` — sibling reuse, not inheritance,
  both driven by the same `useWfContent().menus()` source.
