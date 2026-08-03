# Component Inventory — from Front 2 wireframes (Jul 31 2026)

Extracted from actual usage across the clickable wireframes (`/wireframes/*`, 9 templates + nav/footer).
This is Front 3's build list: every pattern below exists in the wireframes with real content.json data behind it.
**How we build it** (workstreams, tiers, sequencing, a11y) lives in `design-system-approach.md` — this doc is only the component list.

Columns: **DS counterpart** = closest existing component (`ds/` = ccm*, `legacy/` = old stack, `—` = none).
**Verdict**: `evolve` = ccm* component is the base, extend it · `rebuild` = exists only in legacy, rebuild on ccm* · `new` = nothing usable exists.

## Organisms (global)

| Component | Used on | Wireframe spec | DS counterpart | Verdict |
|---|---|---|---|---|
| Site header / nav | all pages | Sticky; logo; 4 dropdown groups (About, Programs, Projects, Insights) — single dropdown open at a time, keyboard-accessible (native `<details>` in wireframe); Search link; Subscribe button. **Data-driven** from one nav registry (replaces nav hardcoded in 4 legacy components) | `ccmTopbar` + legacy `MainNav`/`Header`/`OffCanvas` | rebuild — data-driven nav is a Front 3 scope item |
| Footer | all pages | Mirrors top nav: brand column (name, Search, Subscribe) + 4 link columns + copyright row. Same nav registry as header | `ccmFooter`, legacy `Footer` | evolve `ccmFooter`, feed from nav registry |
| Skip link | all pages | "Skip to content" → `#main` | — | new (trivial, a11y baseline) |

## Page zones (templates compose these)

| Component | Used on | Wireframe spec | DS counterpart | Verdict |
|---|---|---|---|---|
| Hero | homepage | 60svh, centered; h1 value prop + 2-button cluster (primary + secondary) | `ccmHero`, legacy `Hero`/`ProductHero` | evolve `ccmHero` (needs tall variant) |
| Page header | hubs, project, insight, index pages, about | Breadcrumb + chip row (type/area/format/Archive) + h1 + optional dek/subheading + optional byline + optional lead media (21/9) | partial: `ccmBreadcrumb` + `ccmByLine` + chips | new composition of existing molecules |
| Section | every page, ~30 instances | Full-bleed band; `center` inner container; h2 + content + optional "All X →" link. Wireframe: flush sections, shared 1px border. Legacy `SplitSection`/`VideoSection` fold in as variants | `ccmSection` (buggy — see Front 3 kickoff issues: `fullWidth` no-op, prop leak) | evolve after fixes |
| Subscribe CTA | homepage, insight detail, about, footer | Email input + primary button (Mailchimp, Q13). Inline (cluster) and stacked variants | `ctaSignup.vue` (content/), `ccmFormField`/`ccmFormGroup` | evolve |
| Filter bar | insights feed | Chip groups (format × program) with active state + archive toggle + clear; **query-param driven**, shareable URLs | legacy `SimpleFilters` | rebuild |
| Archive banner | archived insight detail | Notice strip: "From our archive: published X" + link to recent work in same area | `callout.vue` (content/) | evolve into generic notice/banner |
| Cross-links row | hub pages | "Also explore:" + sibling area links | — | new (trivial) |
| Search | search page | Live input + results list (chip + linked title + date rows). Real search is Front 4; component shell is Front 3 | — | new |

## Molecules

| Component | Used on | Wireframe spec | DS counterpart | Verdict |
|---|---|---|---|---|
| Card | everywhere (5 variants) | See variant table below. One card component, slots/props per variant — not 7 components | `ccmCard`; legacy `Card`/`DocCard`/`HighlightCard`/`AnnouncementCard`/`ProductCard{,Thin,Website}`; `custom/projectCard` | evolve `ccmCard`; retire the 7-strong legacy card family |
| Logo | header, footer | Brand mark, standard + inverse (white) variant | legacy `Logo`/`LogoWhite` | rebuild as single `ccmLogo` w/ variant prop (migration tier 1) |
| Button | everywhere | Default (outline) + `primary` (filled); renders as link or button; optional external marker | `ccmButton` | evolve |
| Chip | everywhere | Static (format, program, project, Archive, Featured, External platform) + **interactive** (filter toggle w/ active state, cohort links) | `ccmChip` | evolve — needs link/active support |
| Breadcrumb | all inner pages | Home / section / current | `ccmBreadcrumb`, legacy `Breadcrumb` | evolve |
| Byline | insight header | "By {authors}" + date; author is a required CMS field (empty in some legacy data) | `ccmByLine` | evolve |
| Media / figure | cards, page headers, insight body | Responsive image/video with aspect-ratio prop — wireframe ratios in use: 16/9, 3/2, 21/9, 1/1 | — | new |
| Accordion | archive (per-year), nav dropdowns | Native `<details>/<summary>` with count in summary | — | new (thin skin over native) |
| Load more | insights feed | Button with remaining count; +24 per click | — | new (or pagination — Front 4 call) |
| External-link marker | nav, buttons, links to microsites/Stiftung | `↗` suffix + `rel`/`target` handling; GGS requirement: clear external signaling | — | new (attribute/utility, not a component) |
| Date display | cards, bylines, archive rows | `<time>` with Month YYYY formatting | — | new (formatter util + element) |

### Card variants (one component)

| Variant | Where | Anatomy |
|---|---|---|
| Program | homepage | title + CTA button |
| Project | homepage, hubs, projects index | media 3/2 + optional chip (External platform) + title (+ ↗) + excerpt + CTA button |
| Insight | homepage, hubs, project, insight related, feed | chip row (format, program/project, Archive) + linked title + date |
| Featured/highlight | homepage insights strip | media 16/9 + Featured chip + title + link |
| Person | about (board/team) | media 1/1 + name + role — data waits on `people` in content snapshot (Front 1) |

Card behaviors proven in the wireframes: equal-height in grids (`:last-child` pushed to bottom), must tolerate real-length excerpts (legacy excerpts run 100–980 chars, contain HTML entities — strip/decode at the data layer, not in components).

## Composition layer (exists — no build needed)

Used by every wireframe page, carries over as-is: `center`, `stack`, `cluster`, `grid` (`data-min-width` xs/s/m), `switcher`, plus `data-gap` / `data-measure` APIs. Unused so far: `reel`, `cover`, `box`, `frame`, `imposter`.
House rule (from Front 2): interactive elements as direct children of `.stack` must be wrapped in a `div` or they stretch full width.

## Counts

- **Evolve (ccm* base exists):** 9 — Footer, Hero, Section, Subscribe, Card, Button, Chip, Breadcrumb, Byline
- **Rebuild (legacy only):** 3 — Nav (data-driven), Filter bar, Logo
- **New:** 8 — Skip link, Page header composition, Cross-links, Search shell, Media/figure, Accordion, Load more, external-link + date utilities

## Legacy retire mapping (all 23)

| Legacy | Absorbed by |
|---|---|
| `Card`, `DocCard`, `HighlightCard`, `AnnouncementCard`, `ProductCard`, `ProductCardThin`, `ProductCardWebsite` | `ccmCard` variants |
| `Hero`, `ProductHero` | `ccmHero` variants |
| `Breadcrumb` | `ccmBreadcrumb` |
| `SimpleFilters` | Filter bar (ccmChip/ccmTabs composition) |
| `SplitSection`, `VideoSection` | `ccmSection` variants |
| `Header`, `MainNav`, `OffCanvas`, `PlatformNav` | data-driven Nav (`ccmTopbar` base) |
| `Footer` | `ccmFooter` |
| `Logo`, `LogoWhite` | `ccmLogo` (variant prop) |
| `Frame` | layout primitive or delete |
| `HomepageUpdates`, `PeopleSection` (templates) | rebuilt on the new UX templates |

Existing `ccm*` not used by the new UX: `ccmTabs`, `ccmTable` — keep for blog/docs, no wireframe-driven work.

## Notes

- `ccmSection` and token issues logged in `fronts/03-design-system.md` → "Issues to resolve at kickoff".
- Pending decisions that touch components: Q13 (Mailchimp — Subscribe), Q10/Q9 (archive curation/evergreen — Archive index only). Q1 resolved Jul 31: "Programs" + "Projects" are final labels.
