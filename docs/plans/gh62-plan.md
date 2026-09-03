# Plan — gh#62 / issue 53 — About `/about`

**Spec:** [`docs/ds-epic/issues/53-page-about.md`](../ds-epic/issues/53-page-about.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh62-about-about`

Written by the runner (the sanctioned fallback for STEP 1): every input the
planner would have read — the spec, `pages/wireframes/about.vue`, the five
`bf-*` components, both composables, probe 23 and the eight `featured` rows —
was read first-hand before this file was written, so a second planning pass
would have re-derived the same three decisions at the cost of the research.

## Approach

`src/pages/about.vue` is **rewritten in place**, not edited: every line of the
legacy hardcoded `aboutData` template goes, and the file comes back as the
`bf-default` port of the frozen `pages/wireframes/about.vue`. No
`about.vue.legacy` copy is left behind (the spec's acceptance greps for its
absence). `pages/team.vue` is **not** touched here — #66 redirects it, #67
deletes it.

Five zones, in the frozen source's order:

| # | Zone | Component | Data |
|---|---|---|---|
| 1 | Mission | `bfPageHeader` | `useBfPages().aboutPage()` |
| 2 | Board of Directors, `id="board"` | `bfSection` + `.grid[data-min-width="16rem"]` of `bfCardPerson` | `useBfPeople().boardMembers()` — 4 |
| 3 | Team, `id="team"` | same grid | `useBfPeople().teamMembers()` — 10 |
| 4 | Bertelsmann Stiftung | `bfSection layout="switcher" gap="l"` + `bfMedia` + `.stack` | `useBfPages().stiftungPage()` |
| 5 | Contact, `id="contact"` | `bfContactSection` | component defaults |

Board 4 + Team 10 = **14 cards over 13 people** — `irene-braam` is in both
lists by the client's own decision, documented at length in `useBfPeople.ts`.
See Decisions below: the spec's "13 people render across the two grids" is
about *people*, and the card count is 14.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/pages/about.vue` | rewritten (legacy content retired) |
| `bfna-website-nuxt/src/components/bf/CardFeatured.vue` | folded residual #187 — link to `external_url` when present |
| `bfna-website-nuxt/src/pages/bf-probe/23-bf-card-featured.vue` | rows for both link branches |
| `docs/ds-epic/issues/53-page-about.md` | Decisions appended |
| `docs/plans/gh62-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`,
`layouts/wireframe.vue` or `public/css/wireframe.css`.

## Folded residual — [#187](https://github.com/ccmdesign/bfna-website-migration-2/issues/187)

`bfCardFeatured` links its heading to `/insights/<slug>`. `useBfInsights`
builds `items` as `all.filter(i => !i.featured && !i.retired_news)` and
`bySlug` searches `items`, so **no featured row is reachable at that route** —
every featured card on `/` 404s. All eight `featured` documents carry
`content: null` and a populated `external_url`: they are pointers to other
sites, which is why the normaliser never made them insight pages.

Fix at the component, not at `bySlug`: widening `bySlug` would create
`/insights/<slug>` routes for records that have no body to render. The heading
anchor becomes the `bfCardProduct` shape — a raw `<a>` with `data-external`
(so `external-link.css` paints the `↗`) when the URL is off-site — falling
back to the `NuxtLink` to `/insights/<slug>` when `external_url` is absent, so
a future featured row that *does* have a body still routes internally.
`rel="noopener"` is added on the external branch.

## Test strategy

- `npx nuxt typecheck` — gate is **no new errors** vs the recorded baseline of
  **176**, and **0** in `src/components/bf|types|composables/bf|content.config`.
- `npx nuxt generate` exits 0 (never `npm run generate`).
- The spec's own acceptance greps against `.output/public/about/index.html`:
  `id="board"`, `id="team"`, 13 people / 14 cards, no `grid-template-columns`
  in the page source, no `about.vue.legacy`.
- `#contact` is checked too — #66 redirects `/team` → `/about#team`, and all
  three anchors ride the same `bfSection` `$attrs` allow-list.
- `npx tsx scripts/check-probes.ts --only 23` and the full `check-probes` run,
  both exit 0.
- Wireframe byte-identity: `git diff --stat` against the pre-epic base
  `f757a64` over the four frozen paths prints nothing.
- Browser pass over the served `.output/public` for `/about` and `/`.

## Risks

1. **`id` not reaching the `<section>`.** `bfSection` sets
   `inheritAttrs: false` and forwards a filtered `$attrs`; `id` is on the
   allow-list, and `bfContactSection`'s root *is* a `bfSection`, so the
   fallthrough chains. Verified against the generated HTML rather than assumed.
2. **Probe 23 regressions.** Three existing rows assert the internal href and
   that no card links to `http…`. They are rewritten to the new contract, not
   deleted — both branches stay asserted.
3. **`teamMembers()` / `boardMembers()` called from the template** would
   re-filter and re-sort on every render and hand `v-for` fresh arrays; both
   are resolved once in `<script setup>`, the shape `/projects` already uses.
