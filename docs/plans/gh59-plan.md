# gh#59 — plan — Insight detail `/insights/:slug`

Spec: [`docs/ds-epic/issues/50-page-insight-detail.md`](../ds-epic/issues/50-page-insight-detail.md).
Frozen source (read, never edited): `bfna-website-nuxt/src/pages/wireframes/insights/[slug].vue`.

## Approach

One new file, `bfna-website-nuxt/src/pages/insights/[slug].vue`, on
`definePageMeta({ layout: 'bf-default' })`. It retires no legacy file: the
catch-all `pages/[...slug].vue` keeps every route it holds today, and a
directory route outranks a catch-all in vue-router, so `/insights/<slug>`
simply starts being answered here.

The page is the only place data is read (D8): three awaited composable calls —
`useBfInsights()`, `useBfPages()`, `useBfPrograms()` — and every component in
the template receives entities as props.

Band order, ported from the frozen page:

1. `bfPageHeader` — crumbs `Home → Insights`, chips, heading, subheading
   tagline, and a byline row in the default slot.
2. Archive banner — `bfNotice variant="note"`, conditional on `insight.archived`,
   copy from `useBfPages().pageBySlug('archive-banner')`.
3. Body — `bfSection label="Body" measure="narrow"`: excerpt dek, `bfMedia`,
   `bfProse`, conditional download link.
4. Related — `bfSection` wrapping `bfGridInsights`, `activeByProgram(program)`
   minus self, first 3, `headingLevel` 3.
5. `bfEmptyState` for an unknown slug — the sole `<h1>` on that render.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/pages/insights/[slug].vue` | **new** — the template |
| `docs/ds-epic/issues/50-page-insight-detail.md` | append Decisions |
| `docs/plans/gh59-plan.md` | this file |

Nothing else. No component is modified, no type is added, no stylesheet is
touched, and no colour is introduced.

## Decisions this plan commits to

- **Byline.** The spec's "Out of scope" excludes a byline *unless the data
  carries an author*, and `Insight.authors` is a real `string[]`. So the header
  slot renders `bfByline` (#38) when `authors.length`, and a bare `bfTime` when
  it does not — never the wireframe's `By [author]` placeholder, which is
  wireframe scaffolding, not copy.
- **The non-program program values (F3 of BF-218).** 52 of the 354 items carry
  `program` values that are not programs — `PENDING-Q3 (Digital World retired)`
  (31), `RE-TAG (was fake category: Podcasts)` (12), `RE-TAG (was fake category:
  Archives)` (9). Two consequences, both guarded:
  - the **related-band heading** falls back to `More insights` unless
    `insight.program` matches a `bfPrograms` row's `name`, so no reader ever
    sees `More on PENDING-Q3 (Digital World retired)`;
  - the **program chip** and the **banner's forward link** are omitted for the
    same values, for the same reason.
  The band itself still renders (those items do have siblings) but only when
  `related.length > 0`.
- **The download link uses `insight.download`**, which is a real asset URL on
  the 34 rows that carry one. The frozen page writes `href="#"` because a
  wireframe has nowhere to point.
- **No `plain()`.** The excerpt is rendered as the stored string: HTML
  strip/decode moved into the normaliser (D3), and the spec greps for the
  absence of the call.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (#86) — acceptance does
not depend on it. Instead:

1. Typecheck gate: `npx nuxt typecheck` count ≤ 176 (baseline on this branch's
   base), and zero errors matching `src/(components/bf|types|composables/bf)|content.config`.
2. `npx nuxt generate` exits 0.
3. The spec's own three greps (`bf-notice` present, `wf-note` absent, `plain(`
   absent).
4. `npx tsx scripts/check-probes.ts` — full run, exit 0 (no new probe: the spec
   calls for none).
5. Browser: serve `.output/public` and read at least three prerendered detail
   pages — a plain active one, an archived one (banner), and `uncivil-war-2`
   (the disambiguated duplicate slug from #151) — plus an unknown slug for the
   empty state.
6. Wireframe byte-identity: `git diff --stat` against the pre-epic SHA over the
   four frozen paths prints nothing.

## Risks

- **Prerender coverage.** The crawler reaches detail pages through `/insights`,
  whose `bfLoadMore` hides all but the first 24, so `npx nuxt generate` will
  emit far fewer than 354 slug directories. That is the seed-list job of #68
  (`nitro.prerender.routes`), which the spec itself names as out of scope here;
  this issue verifies per-slug correctness and records the observed count.
- **`bfPageHeader` always renders an `<h1>`**, so the not-found branch must not
  render it at all — the `v-if`/`v-else` split is on `insight`, at the top of
  the template, exactly as the frozen page splits it.
