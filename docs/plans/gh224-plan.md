# gh#224 — `bfEmptyState` gains an `announced` prop (a11y pass 1, row 99)

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/224> ·
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) (§3 gates, D23/D27/D29/D32, §5, §7) ·
Epic: <https://app.plane.so/ccm-design/browse/BF-219/>

## The defect

`src/components/bf/EmptyState.vue:128` renders a plain `<div class="center | stack
bf-empty-state">` with no `role`. It is the block a page shows *instead of* its content,
including on `src/error.vue:131-137`, so a client-side navigation that ends in an error
swaps the whole page body for text that assistive technology is never told about.

Measured on `dev` @ `e72c428`, route `/this-page-does-not-exist`: **zero**
`[aria-live]`, `[role=status]` or `[role=alert]` elements inside `<main>` (a11y BRIEF §0,
"Live regions" row: *"`bfEmptyState` has no role at all"*).

## Approach

One prop, copied from the component that already solves this — **D27, reuse the repo's own
idiom**, not a new one:

- `src/types/bf-contracts.ts` — `EmptyStateProps.announced?: boolean`, documented in the
  same terms as `NoticeProps.announced` (`bf-contracts.ts:1026-1040`).
- `src/components/bf/EmptyState.vue` — `announced: false` in `withDefaults`, and
  `:role="announced ? 'status' : undefined"` on the single root. Character-for-character
  the shape at `Notice.vue:94,111`.
- `src/error.vue` — passes `announced` on its `<bfEmptyState>`.

**Why the default is `false`.** A live region that is present at first render and never
updated is noise in the accessibility tree; the announcement is for content *swapped in*
after a user action. Same call, same wording, as `NoticeProps.announced`. `error.vue` is
the `true` case because a client-side navigation into an error replaces the page body
in place, with no document-level announcement of its own.

**No `display: none` anywhere** (D29). The region is the always-mounted block itself;
nothing is hidden to make this work.

**D23 / D32 — structural only.** No colour, font, size, weight, letter-spacing,
line-height, radius or shadow. The rendered pixels are identical; only the accessibility
tree changes. No CSS file is touched at all.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/types/bf-contracts.ts` | `EmptyStateProps.announced?: boolean` + doc block |
| `bfna-website-nuxt/src/components/bf/EmptyState.vue` | default `false`; `:role` binding; block-comment section |
| `bfna-website-nuxt/src/error.vue` | pass `announced` |
| `bfna-website-nuxt/scripts/check-routes.ts` | new whole-build gate (below) |

## Verification

**New `check-routes.ts` gate** (BRIEF §5 — every issue adds at least one assertion),
whole-build, reading `.output/public/**/*.html`. Four rows so a failure says which half
broke:

1. `404.html` was prerendered at all (otherwise rows 2-3 pass by finding nothing).
2. The 404's `<main>` contains **exactly one** `role="status"` — one region, not zero and
   not a second one bolted on later.
3. The 404's empty state is the element carrying it — `role="status"` on the
   `.bf-empty-state` root, not on some other node that happens to be in `<main>`.
4. **No prerendered `.bf-empty-state` outside the 404 carries `role="status"`** — the
   default-`false` half, printed with its denominator (how many static instances were
   inspected) so the row cannot pass silently by finding none.

Negative-tested red before commit: flip the `error.vue` prop off (rows 2-4 → row 2 fails),
and flip the component default to `true` (row 4 fails once a static instance exists).

**CI gate** (`.github/workflows/verify.yml`): `npm ci`, typecheck signature gate
(baseline **90**, `.github/typecheck-baseline.txt` — adding an optional prop should not
move the signature set; if it does, updated in the same commit with a reason),
`npx nuxt generate` (**never** `npm run generate`), `check-routes.ts`, `check-links.ts`.

**Browser** (`env NUXT_IMAGE_PROVIDER=none npx nuxt dev`): on `/this-page-does-not-exist`,
`role="status"` present in `<main>` and `<h1>` still reads "Page not found"; a **client-side**
navigation into a 404 (in-page router push, not a hard load) exercises the case the row
exists for; a route with a static empty state emits no live region.

## Risks

- **Prerendered 404 is a live region on hard load.** `error.vue` passes `announced`
  unconditionally, so `404.html` ships `role="status"` in its initial HTML. Accepted: it
  is the issue's own acceptance criterion, and a region present at first paint with text
  already in it is announced at most once by a screen reader reading the document anyway.
  A `onMounted`-gated variant would be a behavioural guess this row has no evidence for.
- **Typecheck baseline movement.** An added optional prop can shift `vue-tsc`'s error
  signatures. Do not pay down baseline errors (site-epic #83 owns them); regenerate the
  signature file only if the change legitimately moves it, and say why.
- **Scope creep into #233.** `/insights` unmounts its only live region when a filter
  yields zero results, and `/search`'s count region is `display: none` while idle. Both
  real, both **#233's**. This row ships the prop and wires `error.vue` only.
- **BF-220 runs concurrently** on `Hero.vue`, `PageHeader.vue`, `Prose.vue`,
  `base/typography.css`, `public/images/hero/**`. None is touched here.
