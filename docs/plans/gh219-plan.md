# gh#219 — `.visually-hidden` utility (a11y-94)

Row 94 of `docs/a11y-epic/issues.md`. Type: `css`. Infrastructure row — #224, #225, #226
and #229 all consume the utility this issue lands.

## Problem

`src/components/bf/LoadMore.vue:189-208` hand-rolls the standard visually-hidden clip
inside its own scoped `@layer components` block, for the single `role="status"` span it
renders. Every later live region in this epic needs the same twelve lines, and there is no
shared utility to reach for: `grep` over `public/css/utils/utils.css` finds neither
`.visually-hidden` nor `.sr-only`. The one `.sr-only` in the repo is
`src/public/css-legacy/global.css:180`, which is retired with `layouts/legacy-base.vue`
(gh#67/#68) and is not revived here.

## Approach

1. Add one `.visually-hidden` rule to `public/css/utils/utils.css`, inside the existing
   `@layer utils` block. The declarations are copied verbatim from `LoadMore.vue:200-208`
   — the well-worn clip recipe, with **both** `clip-path: inset(50%)` and the deprecated
   `clip: rect(0 0 0 0)`, and the comment explaining why both.
   - **Clip, not `display: none`** (brief D29 / D32). `display: none` and
     `visibility: hidden` remove the element from the accessibility tree; that is the exact
     bug #233 exists to fix on `/search`. A live region has to stay in the tree.
   - `@layer utils` is the correct layer: it sits after `components` in the order declared
     at `public/css/styles.css:2`, so the utility outranks any component rule it lands on.
2. Mirror the identical edit into `src/public/css/utils/utils.css`. `dev` carries **two**
   tracked `public/` trees whose `css/` subtrees are byte-identical and hand-synced;
   `diff -r public/css src/public/css` is empty today and must stay empty.
3. `LoadMore.vue`: the status span gains `class="bf-load-more__status visually-hidden"` and
   the scoped `<style>` loses the `.bf-load-more__status` block (~12 declarations plus its
   comment, which moves to the utility). The BEM class is kept as the hook the harness and
   any future styling address; only the hiding mechanism moves.
4. `scripts/check-routes.ts` gains a whole-build gate (brief §5 — every issue adds at least
   one assertion). Modelled on `reducedMotionRows()`: read the **served** copy under
   `.output/public/css/utils/utils.css`, not the source, for the same reason that gate
   gives — two `public/` trees plus a copy step, so a grep over a file on disk could stay
   green through a build that shipped the other one.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/public/css/utils/utils.css` | + `.visually-hidden` in `@layer utils` |
| `bfna-website-nuxt/src/public/css/utils/utils.css` | identical mirror |
| `bfna-website-nuxt/src/components/bf/LoadMore.vue` | span consumes the utility; scoped block deleted |
| `bfna-website-nuxt/scripts/check-routes.ts` | + `visuallyHiddenRows()` build gate |
| `bfna-website-nuxt/docs/plans/gh219-plan.md` | this file |

## Verification

- `diff -r public/css src/public/css` → empty (the two trees stay in step).
- `npx nuxt generate` (**never** `npm run generate` — it runs the Directus importer).
- `npx tsx scripts/check-routes.ts` — the new gate plus every existing one.
- `npx tsx scripts/check-links.ts`.
- Typecheck signature gate against the 90-error baseline in
  `.github/typecheck-baseline.txt`. Not paid down here — site-epic #83 owns it.
- **Browser, `/insights`** (the route that renders `bfLoadMore`), against
  `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`: the `.bf-load-more__status` span is in the
  accessibility tree with `role="status"`, `getBoundingClientRect()` is ~1×1, the computed
  `clip-path` is `inset(50%)`, `display` is **not** `none`, `textContent` still reads
  "Showing N of M items", and the winning rule is the `.visually-hidden` one from
  `/css/utils/utils.css`. Also record which `public/` tree the served bytes came from.

## Risks

- **Cascade layer.** `utils` beats `components`, so the utility wins over the scoped rule
  that is being deleted anyway. The risk is the reverse: `postcss-preset-env`'s cascade-
  layer polyfill flattening layers (gh#101). `public/css/**` is served through `<link>` and
  never passes through postcss (`src/nuxt.config.ts:215`), so this file is not exposed to
  it; `cascadeLayerRows()` already guards the SFC side.
- **The two `public/` trees drifting.** Mitigated by the `diff -r` check above and by the
  gate reading the built copy.
- **D23/D32.** The rule declares no colour, font, size, weight, letter-spacing,
  line-height, radius or shadow — it renders nothing visible by definition, which is why
  D32 names #94 explicitly as a pass-1 CSS row.
- **Out of scope, noticed not touched:** the span is `v-if="announcement"`, so it is not
  mounted in the idle state — D29 wants an always-mounted region. That is issue #108/#233's
  scope, not this row's.
