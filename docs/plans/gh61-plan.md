# Plan — gh#61 / issue 52: Project detail `/projects/:slug`

Spec: [`docs/ds-epic/issues/52-page-project-detail.md`](../ds-epic/issues/52-page-project-detail.md) ·
Epic: https://app.plane.so/ccm-design/browse/BF-217/

`ce-plan` was not invoked: the runner template sanctions writing this file
directly, and the spec already fixes the band order, the component set and the
prop map, so a planning pass would have restated it. Recorded here rather than
only in the journal.

## Approach

One new page, `src/pages/projects/[slug].vue`, on `bf-default`. It descends
from the frozen `src/pages/wireframes/projects/[slug].vue` (D2: read, never
edited, never imported) and retires no legacy file — `pages/projects/` holds
only `index.vue` today and the catch-all `pages/[...slug].vue` ranks below a
static segment in vue-router, so the route simply starts being answered here.

Three branches, in the frozen source's own order:

1. **`project.external_url` truthy** — `bfPageHeader` (`tagline` = the
   `paragraphs()` overview) → Microsite CTA `bfCtaSection` → Participation path
   `bfCtaSection` → Related insights.
2. **`project` without an `external_url`** — `bfPageHeader` with a slotted
   `bfMedia ratio="21/9"` → Body `bfSection measure="narrow"` + `bfProse` →
   Participation path → conditional Episodes band → conditional
   Outcomes/alumni band → Related insights.
3. **no such slug** — `bfEmptyState`, replacing the frozen source's raw
   `<div class="center | stack">` (as-built D.1 finding #1).

## Files

| file | change |
|---|---|
| `bfna-website-nuxt/src/pages/projects/[slug].vue` | **new** — the template |
| `bfna-website-nuxt/src/components/bf/Prose.vue` | folded residual #186 — empty content renders nothing |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | `ProseProps.content` doc updated to match |
| `bfna-website-nuxt/src/pages/bf-probe/45-bf-prose.vue` | the two empty-content rows now assert "nothing rendered" |
| `bfna-website-nuxt/src/pages/insights/index.vue` | folded residual #188 — two-entry crumb trail |
| `docs/ds-epic/issues/52-page-project-detail.md` | Decisions appended |

No `bf-*` component gains a data call (D8); the page makes both composable
calls and hands entities down as props. No new colour, no new CSS file, no
`:not()` (D-20.5) — the page ships no `<style>` block at all.

## Data reads

| read | member | note |
|---|---|---|
| the project | `useBfProjects().projectBySlug` | searches all 38, children included |
| cohorts | `useBfProjects().projectChildren` | 20 children, `heading` desc |
| related | `useBfInsights().insightsForProject` | active items whose `projects[]` holds the slug |
| chips | `kindLabel` from `~/utils/format` | |
| overview | `paragraphs` from `~/utils/format` | external branch tagline |

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the generated output plus the probe harness:

```bash
cd bfna-website-nuxt
npx nuxt typecheck   # gate: no NEW errors vs the 176-error dev baseline
npx nuxt generate
npx tsx scripts/check-probes.ts --only 45
npx tsx scripts/check-probes.ts
```

Route-level assertions run over `.output/public/projects/<slug>/index.html`
for four representative slugs:

| slug | branch | proves |
|---|---|---|
| `transatlantic-barometer` | external | Microsite CTA present, no Body band, no Related band (0 related insights) |
| `wisdom-of-the-crowd` | external | the same header/CTA set **with** a Related insights band (2 rows) |
| `leadership-in-action` | full | Body band, Participation, Related (3 rows), **no** Episodes band |
| `cepi-2010` | full, orphaned `parent_project: "cepi"` (BF-218 F4) | renders rather than crashing; `description: null` falls back to `excerpt` |

## Risks

1. **No project can currently reach the Episodes band.** `indo-pacific-nexus`
   is the only row carrying `podcast`, and it also carries
   `external_url: "#ipn-microsite-url"`, so the frozen branch order sends it
   down the external path where the band does not exist. Parity is the
   instruction, so the band ships as written and unreached; the finding is
   recorded as a decision and handed off as a residual rather than
   "fixed" by reordering a branch the spec pins.
2. **Two `external_url` values are `#…` placeholders** (`astropolitics`,
   `indo-pacific-nexus`). Rendered as given — inventing a URL would be worse
   than shipping the client's own marker.
3. **#186 changes a component every template consumes.** Probe 45 asserts the
   placeholder today, so the probe moves with the component and the full probe
   suite runs before the PR opens.
