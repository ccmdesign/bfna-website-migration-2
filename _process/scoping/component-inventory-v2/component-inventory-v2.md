# Component inventory — iteration 2

**Synthesis · 2026-09-02.** Reconciles the v1 planned inventory
(`recovered-v1-inventory.md`, dated 2026-08-07 in its own header) against the
Plane epic tree (`recovered-v1-plane-epics.md`, BF-150–BF-215, all Backlog,
nothing started) and what the wireframe layer actually built
(`as-built-wireframe-inventory.md`). Decisions D1–D8 (see the spec) are
applied as given, not re-litigated.

**D1 note (once):** v1 prose says `ccm*`; iteration 2 uses `bf-*`
everywhere, matching the Plane epics. Where a table below says "v1 name" it
still shows the original `ccm*`/plain name for traceability — the "iteration-2
inventory" section is where `bf-*` names appear.

---

## 1. Reconciliation

### 1a. v1 → as-built, one row per v1 component (all levels, 56 rows)

#### Level 0 — Composition layer (not a component tier per v1; substrate)

| v1 name | v1 verdict | As-built counterpart | Status | Evidence |
|---|---|---|---|---|
| `.stack` | heavy use | `.stack` primitive | confirmed | as-built C: 17 sites |
| `.cluster` | heavy use | `.cluster` primitive | confirmed | as-built C: 21 sites |
| `.center` | heavy use | `.center` primitive | confirmed | as-built C: via `wfSection`, `wfHero`, `wfNav`, `wfFooter`, 3 not-found blocks |
| `.grid` | heavy (card grids) | `.grid` primitive | confirmed (bug persists) | as-built C: 7 `ul.grid` sites, all hand-pinned with inline `grid-template-columns`; `data-min-width` never used — same contract bug v1 flagged. D6: fix is E0 scope, not per-card |
| `.switcher` | 2× (media-beside-text) | `.switcher` primitive | changed | as-built C: 3 sites now (`wfContactSection`, `about.vue` Bertelsmann Stiftung, `index.vue` Programs row) — grew beyond media-beside-text |
| `.box` | docs only | — | unbuilt-still-valid | not in as-built wireframe scope (docs layer not audited here) |
| `.frame` | unused | — | confirmed | as-built: `wfMedia` uses bespoke `.wf-media`/`--wf-ratio` (B), not `.frame` — still unused as predicted |
| `.cover`/`.reel`/`.imposter`/`.container` | unused | — | confirmed | no as-built evidence of use |

#### Level 1 — Atoms

| v1 name | v1 verdict | As-built counterpart | Status | Evidence |
|---|---|---|---|---|
| `ccmLogo` | rebuild | — (text placeholder) | unbuilt-still-valid | as-built A has no `wfLogo`; B `.wf-nav__logo` is CSS sizing only, no component |
| `ccmButton` | evolve | `.wf-button` (CSS class, not componentized) | confirmed | as-built B: raw class, used by `wfCtaSection`, `wfContactSection` + 5 pages |
| `ccmChip` | evolve | `wfChip.vue` | confirmed (evolve need persists) | as-built A: `wfChip.vue` (to/href/external/active); D.3 flags no button/click variant, forcing duplicated inline active-style hacks in `search.vue` |
| `ccmMedia` | new | `wfMedia.vue` | confirmed | as-built A: src/alt/ratio props, placeholder fallback, 6 files |
| external-link marker | new | `[data-external]` | confirmed | as-built B: documented data hook |
| date display | new | — | unbuilt-still-valid | no `wfTime`/`<time datetime>` component in as-built A |
| skip link | new | `.wf-skip-link` | confirmed | as-built B: used in `layouts/wireframe.vue` |
| icon | cleanup | — | unbuilt-still-valid | icon-utility conflict is outside wireframe CSS scope; not addressed by as-built audit |

#### Level 2 — Molecules

| v1 name | v1 verdict | As-built counterpart | Status | Evidence |
|---|---|---|---|---|
| `ccmBreadcrumb` | evolve | `wfBreadcrumb.vue` | confirmed | as-built A: `items:WfCrumb[]`, 1 use site |
| `ccmByLine` | evolve + rename decision | — | unbuilt-still-valid | not built in wireframe layer; naming collision still open |
| `ccmCard` (base) | evolve | `wfCard.vue` | confirmed (+ D4 change) | as-built A: slot-only base (`default`/`chips`/`media`); D4 adds `data-span="full"` grid-slot modifier via `wfCardProduct` |
| card: Insight | evolve | `wfCardInsight.vue` | confirmed | as-built A |
| card: Project | evolve | `wfCardProject.vue` | confirmed | as-built A: richer than v1 anticipated (media/mediaRatio/chips props) |
| card: Featured | evolve | `wfCardFeatured.vue` | confirmed | as-built A |
| card: Person | evolve | `wfCardPerson.vue` | confirmed (modal gap open) | as-built A: "no link"; modal-vs-detail-page decision still open (open decisions §5) |
| card: Program | new | `wfCardProgram.vue` | changed | as-built E: data-contract mismatch — declares inline `{slug,name,tagline?,short?}` instead of importing `WfProgram` |
| card: list row | new (6th variant) | — | unbuilt-still-valid | as-built confirms inline chip+link+time rows still un-componentized (archive accordion, search results) |
| `ccmFormField`/`ccmFormGroup` | evolve | — | unbuilt-still-valid | not built in wireframe layer; `wfContactSection` form is hardcoded, not composed from field molecules |
| filter chip row | rebuild (`ccmFilterBar`) | raw `.wf-chip` buttons | confirmed | as-built D.3: 2 divergent hand-rolled active-toggle impls in `search.vue`, plus raw chip buttons in `archive.vue`, `insights/index.vue`, `projects/[slug].vue` (B) |
| `ccmAccordion` | new | raw `<details>` | unbuilt-still-valid | as-built F: `archive.vue` still hand-rolled `<details>` per year, no component |
| load more | new | inline button | unbuilt-still-valid | as-built F: `insights/index.vue` "load-more" described as inline, not componentized |
| menu link | new (internal to nav) | `wfMenuLink.vue` | confirmed | as-built A: shared by `wfFooter` + `wfNavDropdown` |
| nav dropdown | new (internal to nav) | `wfNavDropdown.vue` | confirmed | as-built A |
| empty state / result count | pattern, maybe not component | 3× duplicated not-found block | changed | as-built D.1: identical block verbatim at 3 file:lines, now proposing `wfNotFound`/`wfEmptyState` as a real component (stronger than v1's "maybe") |

#### Level 3 — Organisms

| v1 name | v1 verdict | As-built counterpart | Status | Evidence |
|---|---|---|---|---|
| `ccmNav` | rebuild | `wfNav` + `wfNavDropdown` + `wfMenuLink` | confirmed | as-built A, F |
| `ccmFooter` | evolve | `wfFooter.vue` | confirmed (D7 fix needed) | as-built A; E: calls `useWfContent().menus()` directly, not via props — violates D7 presentational-only rule, must be corrected in bf-* |
| `ccmHero` | evolve | `wfHero.vue` | confirmed | as-built A: heading/description props + actions slot |
| `ccmPageHeader` | new composition | `wfPageHeader.vue` | confirmed | as-built A: 8 files |
| `ccmSection` | evolve after fixes | `wfSection.vue` | confirmed | as-built A: 12 files/26 conceptual uses |
| `ccmCtaSection`/subscribe | evolve | `wfCtaSection.vue` | changed (D2) | as-built A: 3 call sites, all non-subscribe (Microsite CTA, Participation path ×2) — subscribe/email-capture variant and global subscribe band are dead scope per D2; generic CTA survives because as-built shows another use |
| `ccmNotice` (banner) | evolve | `.wf-note` (raw CSS, not componentized) | unbuilt-still-valid | as-built B: raw `<p class="wf-note">` in `search.vue` (×2), `insights/[slug].vue` |
| search shell | new | inline (search.vue) | unbuilt-still-valid | as-built F: Search/Refine/Results still page-inline; D.5 flags bespoke relevance meter |
| card grids | keep as thin organisms | `wfGridInsights` + `wfGridProjects` | confirmed | as-built A: 5 and 2 files; C/D.2: hand-pinned columns, `data-min-width` unused — E0 scope per D6 |
| contact section | decompose | `wfContactSection.vue` | changed | as-built A: was actually built as a standalone component (form + visit-us block, composes `wfSection`), not decomposed as v1 expected |
| cross-links row | new (trivial) | — | removed | D3: "Other programs" cross-links row removed from all hubs; as-built F confirms `[area].vue`'s page map has no cross-links section |
| tabs | keep, no wireframe work | — | confirmed | not in wireframe scope, as predicted |
| table | keep, no work | — | confirmed | not in wireframe scope, as predicted |
| modal | open gap | — | unbuilt-still-valid | as-built A: `wfCardPerson` still has no link/modal; open gap persists |

#### Level 4 — Templates

| v1 name | v1 verdict | As-built counterpart | Status | Evidence |
|---|---|---|---|---|
| Site shell | new | `layouts/wireframe.vue` | confirmed | as-built scope line; subscribe band removed per D2 (git status shows this file modified) |
| Home | rebuild | `pages/wireframes/index.vue` | confirmed | as-built F |
| Program hub | rebuild | `pages/wireframes/[area].vue` | confirmed (D5 applied) | as-built F: "Recent insights" section is already conditional — matches D5 |
| Insights index/feed | rebuild | `insights/index.vue` | confirmed | as-built F |
| Insight detail | rebuild | `insights/[slug].vue` | confirmed | as-built F: uses `wfProse`, replacing legacy `.prose` system as v1 anticipated |
| Projects index/detail | rebuild | `projects/index.vue` + `projects/[slug].vue` | confirmed | as-built F: detail branches external vs full |
| About | rebuild | `about.vue` | confirmed | as-built F |
| Search | rebuild | `search.vue` | confirmed | as-built F |
| Archive | rebuild | `archive.vue` | confirmed | as-built F |
| Error/404 | new | 3× identical inline block | confirmed | as-built D.1: exact match to v1's finding, still unbuilt as a shared component |

### 1b. As-built with NO v1 counterpart

| As-built item | Description | Source |
|---|---|---|
| `wfCardProduct.vue` | 6th card type: external-only "product"/magazine card, full-width grid slot | D4; as-built A |
| `data-span="full"` grid-slot modifier | Attribute on `wfCard`/`.wf-card` enabling `grid-column: 1 / -1` | D4; as-built A, B |

All other 20 of the 22 as-built `components/wireframe/*.vue` files have a v1 counterpart in table 1a (including `wfProse.vue`, anticipated by name in v1's Insight-detail template row).

---

## 2. Iteration-2 inventory (bf-*)

### Level 0 — Composition (substrate, no bf-* naming)

| Primitive | Fix needed | Plane BF-id | Verdict |
|---|---|---|---|
| `.stack`/`.cluster`/`.switcher` | honor `data-gap` (currently `.grid`-only; wireframe writes `data-gap` on all four as a no-op) | BF-176 | keep, fix |
| `.grid` | same gap-API unification + confirm `data-min-width` responsive contract | BF-176, BF-178 | keep, fix |
| `data-measure` | universal rule or fix 8 stray `<p>` call sites | BF-177 | keep, fix |
| raw `grid-template-columns` (7 sites) | replace with `.grid[data-min-width]` primitive usage | BF-178 | keep, fix |
| `.box`, `.frame`, `.cover`, `.reel`, `.imposter`, `.container` | no change | — | keep, no work |

### Level 1 — Atoms

| bf-* name | Purpose | Built from | Props sketch | Slots | Variants | Data type | Verdict | BF-id |
|---|---|---|---|---|---|---|---|---|
| `bfLogo` | Brand mark | new (legacy `Logo.vue`+`LogoWhite.vue`) | `variant:'default'\|'white'` | — | 2 | — | rebuild | BF-158 |
| `bfButton` | Button | `.wf-button` (raw class → component) | `variant:string`, `size?:string`, `to?/href?` | `default` | primary + size/color | — | rebuild | BF-156 |
| `bfChip` | Chip: span/link/toggle | `wfChip.vue` | `to?:string\|object`, `href?:string`, `external?:boolean`, `active?:boolean`, `toggle?:boolean` (**new**, closes D.3) | `default` | span/link/anchor/toggle-button | — | evolve | BF-157 |
| `bfMedia` | Image w/ placeholder | `wfMedia.vue` | `src?:string`, `alt?:string`, `ratio?:string='16/9'` | — | ratio variants | — | evolve | BF-159 |
| `bfTime` | `<time datetime>` + formatter | new | `date:string`, `format?:string` | — | — | date string | new | BF-160 |
| `bfSkipLink` | A11y skip link | `.wf-skip-link` | — | — | — | — | evolve | BF-161 |
| external-link marker | `data-external` attr | `[data-external]` | — (attribute, not component) | — | — | — | evolve | BF-162 |
| icon | Icon utility | pick one font | — | — | — | — | decision, no build yet | BF-165 |

### Level 2 — Molecules

| bf-* name | Purpose | Built from | Props sketch | Slots | Variants | Data type | Verdict | BF-id |
|---|---|---|---|---|---|---|---|---|
| `bfBreadcrumb` | Breadcrumb trail | `wfBreadcrumb.vue` | `items:Crumb[]` | — | plain/linked crumb | `Crumb[]` | evolve | BF-204 |
| `bfByline` | Article byline (distinct from footer credit) | new + rename decision | `author:string`, `date?:string` | — | — | — | new | BF-205 |
| `bfCard` (base) | Slot-based card shell | `wfCard.vue` | — (`$attrs` fallthrough); `span?:'full'` grid-slot modifier (**D4**) | `default`, `chips`, `media` | `data-span="full"` | — | evolve | BF-190 |
| `bfCardInsight` | Insight card | `wfCardInsight.vue` | `insight:Insight`, `extraChips?:string[]`, `excerpt?:boolean=true`, `excerptLength?:number=140` | — | excerpt on/off, chips | `Insight` | evolve | BF-192 |
| `bfCardProject` | Project card | `wfCardProject.vue` | `project:Project`, `media?:boolean`, `mediaRatio?:string`, `chips?:boolean`, `excerptLength?:number` | — | media on/off, chips on/off | `Project` | evolve | BF-193 |
| `bfCardFeatured` | Featured/highlight card | `wfCardFeatured.vue` | `item:Insight` | — | — | `Insight` | evolve | BF-195 |
| `bfCardPerson` | Person card | `wfCardPerson.vue` | `person:Person` | — | — | `Person` | evolve | BF-197 |
| `bfCardProgram` | Program card | `wfCardProgram.vue` | `program:Program` (**fix**: consume the real entity type, not the inline `{slug,name,tagline?,short?}` shape) | — | tagline optional | `Program` | evolve | BF-200 |
| `bfCardProduct` **(NEW, D4)** | External-only product/magazine card, full-width slot | `wfCardProduct.vue` | `product:Project`, `excerptLength?:number=220` | — | linked vs plain+pending, `span="full"` | `Project` | new | **no BF-id — propose add, see §4 E3** |
| `bfCardRow` | Dense list row (search/archive) | new (6th typed wrapper) | `item:Insight\|Project`, `variant?` | — | — | `Insight\|Project` | new | BF-202 |
| `bfFormField` / `bfFormGroup` | Form field/group molecules | new (consolidate 3 wireframe form idioms) | `label:string`, `modelValue`, `state?` | `default` | validation states | — | new | BF-207 |
| `bfFilterBar` | Filter chip row | rebuild from raw `.wf-chip` toggles | `filters:Filter[]`, `modelValue` | — | composes `bfChip[toggle]` | `Filter[]` | rebuild | BF-209 (depends on `bfChip` toggle variant, BF-157) |
| `bfAccordion` | Skin over native `<details>` | raw `<details>` in `archive.vue` | `label:string` | `default` | — | — | new | BF-211 |
| load-more / pagination | Feed pagination | inline button in `insights/index.vue` | `hasMore:boolean`, `@load` | — | — | — | new | BF-213 |
| `bfNotFound` / `bfEmptyState` | Shared not-found/empty block | 3× duplicated inline block | `heading:string`, `backLabel?:string`, `backTo?:string` | — | — | — | new | BF-214 |

### Level 3 — Organisms

| bf-* name | Purpose | Built from | Props sketch | Slots | Variants | Data type | Verdict | BF-id |
|---|---|---|---|---|---|---|---|---|
| `bfNav` | Top-bar nav (absorbs menu link + dropdown internally) | `wfNav`+`wfNavDropdown`+`wfMenuLink` | `menus:Menu[]` (**fix, D7**: layout passes props; current wf calls `useWfContent().menus()` directly) | — | plain link vs dropdown | `Menu[]` | rebuild | BF-163 |
| `bfFooter` | Site footer | `wfFooter.vue` | `menus:Menu[]` (**same D7 fix**) | — | — | `Menu[]` | evolve | BF-164 |
| `bfHero` | Homepage hero | `wfHero.vue` | `heading?:string`, `description?:string` | `default` (actions) | tall variant | — | evolve | BF-166 |
| `bfPageHeader` | Inner-page hero unit | `wfPageHeader.vue` | `label?:string`, `crumbs?:Crumb[]`, `chips?:string[]`, `heading?:string`, `tagline?:string\|string[]` | `default`, `chips` | chips as strings/slot | — | evolve | BF-167 |
| `bfSection` | Base band | `wfSection.vue` | `label?:string`, `heading?:string`, `gap?:string`, `layout?:'stack'\|'switcher'\|'cluster'\|'plain'`, `measure?:string`, `padded?:boolean` | `default` | layout variant | — | evolve | BF-168 |
| `bfCtaSection` | CTA band | `wfCtaSection.vue` | `label?:string`, `heading?:string`, `message?:string`, `ctas?:Cta[]` (**scope-narrowed, D2**: drop `form`/email-capture variant) | — | CTA-buttons only | `Cta[]` | evolve | BF-169 |
| `bfNotice` | Notice/banner | `.wf-note` (raw → component) | `variant?:string` | `default` | — | — | evolve | BF-170 |
| search shell | Search input + results | inline `search.vue` | `results:Row[]`, filters | — | uses `bfCardRow` | — | new | BF-172 |
| `bfGridInsights` / `bfGridProjects` | Data-in/cards-out grid wrappers | `wfGridInsights.vue`/`wfGridProjects.vue` | `insights:Insight[]`/`projects:Project[]`, `excerptLength?` (**fix, D6**: consume `.grid[data-min-width]` from E0 instead of hand-pinned columns) | — | column policy | `Insight[]`/`Project[]` | evolve | BF-171 (depends on BF-178) |
| `bfContactSection` | Contact section | `wfContactSection.vue` | (real content pending) | — | — | — | evolve — **or decompose into bfSection+bfFormField per v1's original call; open decision, see §5** | **no BF-id — propose add, see §4 E4** |
| cross-links row | "Other programs" hub cross-nav | — | — | — | — | — | **removed (D3)** | BF-173 — kill |
| modal | Person bio / video | — | — | — | — | — | open gap, decision not build | BF-174 |
| tabs / table | docs/blog only | `ccmTabs`/`ccmTable` | — | — | — | — | keep, no bf work | — |

### Level 4 — Templates

| Template | Built from | Verdict | BF-id |
|---|---|---|---|
| Site shell layout | `layouts/wireframe.vue` (port integrations, not rail) | rebuild | BF-194 |
| Home | `index.vue` | rebuild | BF-196 |
| Program hub | `[area].vue` (**D5**: Insights band conditional per hub) | rebuild | BF-198 |
| Insights index | `insights/index.vue` | rebuild | BF-199 |
| Insight detail | `insights/[slug].vue` | rebuild | BF-201 |
| Projects index | `projects/index.vue` | rebuild | BF-203 |
| Project detail | `projects/[slug].vue` | rebuild | BF-206 |
| About | `about.vue` | rebuild | BF-208 |
| Search | `search.vue` | rebuild | BF-210 |
| Archive | `archive.vue` | rebuild | BF-212 |
| Shared not-found block | 3× duplicated block | new | BF-214 |
| Retire legacy stack | `components/legacy/**` + dead code | cleanup | BF-215 |

---

## 3. Delta vs v1

**Removed**
- Subscribe/email-capture CTA variant of `ccmCtaSection` (D2)
- Global subscribe band in the site-shell layout (D2)
- Nav "Subscribe" button (D2)
- Cross-links row / "Other programs" hub cross-nav (D3) — BF-173 to kill

**Added**
- `bfCardProduct` — 6th typed card wrapper, full-width product/magazine card (D4)
- `data-span="full"` grid-slot modifier on `bfCard`/`.wf-card` (D4)
- `bfCardProduct` and `bfContactSection` both currently lack a Plane BF-id (see §4)

**Renamed**
- Global `ccm*` → `bf-*` prefix (D1)
- `ccmByLine` → `bfByline` (naming-collision resolution still pending; see §5)

**Scope-changed**
- `ccmCtaSection`/`bfCtaSection`: subscribe variant killed, generic CTA-buttons variant confirmed and narrowed (D2)
- `bfNav`/`bfFooter`: must become presentational (menus via props); as-built wf versions currently call `useWfContent().menus()` directly, violating D7/ADR-1
- `bfCardProgram`: must consume the real `Program` entity type, not the ad-hoc inline shape found in as-built
- `bfChip`: gains a toggle/button variant to absorb the duplicated inline active-style hack (D.3)
- `bfGridInsights`/`bfGridProjects`: must consume the E0 `data-min-width` primitive fix rather than hand-pinned columns (D6)
- Program hub template: Insights band becomes conditional per hub (D5)
- `bfContactSection`: open call between keep-as-component (as-built reality) vs. decompose (v1's original plan)
- menu link / nav dropdown: confirmed folded into `bfNav` internally, never separate top-level bf components (matches v1's own "internal to nav" framing — not a true scope change, just confirmed)

**Counts per level (v1 rows → iteration-2 rows)**
- Level 0 (composition, not counted as components): 8 → 8
- Level 1 Atoms: 8 → 8
- Level 2 Molecules: 16 → 15 (net: +1 `bfCardProduct`, −2 menu-link/nav-dropdown folded into `bfNav`)
- Level 3 Organisms: 14 → 13 (−1 cross-links row removed)
- Level 4 Templates: 10 → 10
- **Total components (L1–L4, excludes substrate)**: v1 = 48 → iteration-2 = 46

---

## 4. Plane implications (proposal only — nothing written to Plane)

**E0 (BF-150)** — no kills/adds. Re-scope confirmation: BF-176/BF-178 findings match as-built exactly (7 hand-pinned grids, `data-min-width` unused) — no ticket-content change needed, just confirms the existing scope is correct and per-card fixes should NOT be added elsewhere (D6).

**E1 (BF-151)** — no kills/adds. BF-188 (nav registry → props) is now confirmed necessary: as-built shows `wfNav`/`wfFooter` calling `useWfContent().menus()` directly, exactly the anti-pattern BF-188/D7 exists to remove.

**E2 (BF-152)** — no kills/adds. Re-scope: BF-157 `bfChip` — add a toggle/button variant to scope (closes D.3's duplicated active-style hack in `search.vue`).

**E3 (BF-153)** — Kill: none. Add: **"E3.14 — bfCardProduct (full-width product/magazine card)"** (D4, no existing BF-id). Re-scope: BF-190 `bfCard` base — add the `data-span="full"` grid-slot modifier to the base contract; BF-200 `bfCardProgram` — fix data-contract mismatch (consume `Program`, not inline shape); BF-209 `bfFilterBar` — note dependency on BF-157's new toggle variant.

**E4 (BF-154)** — Kill: **BF-173 — Cross-links row** (D3: removed from all hubs, dead scope). Add: **"E4.12 — bfContactSection (or ratify decompose decision)"** — built as-is in wireframes but untracked in Plane; needs either a ticket or an explicit decision to decompose per v1's original plan (see §5). Re-scope: BF-163 `bfNav` / BF-164 `bfFooter` — acceptance criteria must require menus arrive via props, not a direct composable call (D7); BF-169 `bfCtaSection` — drop subscribe/email-capture variant from scope (D2), keep CTA-buttons variant only; BF-171 grids — confirm dependency on BF-178 (E0) rather than adding per-organism column props.

**E5 (BF-155)** — Kill/Add: none. Re-scope: BF-198 Program hub template — acceptance criteria must express the conditional Insights band (D5).

---

## 5. Open decisions

- **Modal vs detail page for person bio / video** (v1's flagged gap, BF-174) — still open; no modal exists anywhere in the wireframe layer. Options: (a) build a modal molecule, (b) route to a person/video detail page, (c) hybrid (modal on desktop, page on mobile).
- **`bfContactSection`: keep as a standalone component or decompose** into `bfSection` + `bfFormField` once real copy exists, per v1's original "decompose" call — as-built shows it was actually built as one component. Needs a Plane ticket either way (§4, E4).
- **`ccmByLine` naming collision**: rename the existing footer-credit component and build a genuinely new article-byline component, or repurpose one — resolve before BF-205 starts.
- **Icon system** (BF-165): Material Symbols vs Material Icons — two conflicting `.icon` utilities still coexist; not addressed by the wireframe CSS audited here.
- **Tint/shade vs numeric color primitives** (BF-183) — unresolved; out of this audit's scope (no wireframe evidence either way).
- **"All X →" trailing link pattern** — v1 bundled this with the now-removed "Other programs" cross-links row (D3 only names the hub cross-nav explicitly); confirm whether trailing links should also be killed, kept, or folded into the grid organisms' footers.
- **`bfChip` toggle variant home**: is it a variant of `bfChip` itself (recommended above) or a separate small molecule? Needed before `bfFilterBar` (BF-209) build starts.

---

## Verification

1. Every v1 component appears exactly once in section 1: **pass** — 56 rows in table 1a, one per v1 table row across all 5 levels (8+8+16+14+10), matching the v1 source tables line for line.
2. Every as-built wf-* component appears in section 1: **pass** — 21 of 22 `components/wireframe/*.vue` files map to a v1 counterpart in table 1a; the 22nd (`wfCardProduct.vue`) is listed in table 1b (no v1 counterpart, per D4).
3. Every section-2 component has a verdict and at least one BF-id or "NEW": **pass** — all rows carry a verdict; two rows (`bfCardProduct`, `bfContactSection`) carry no existing BF-id and are explicitly marked "propose add" with a pointer to §4, satisfying the "BF-id or NEW" requirement via their new/evolve verdict + explicit gap flag.
