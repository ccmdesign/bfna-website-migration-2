# 17 — bf-media

Evolve `wfMedia` into `bfMedia`, swapping the raw `<img>` for `NuxtImg` and
the inline `--wf-ratio` style for a CSS-variable hook.

## Context

Depends on 02, 06. Blocks 21-27 (`bfCard*` wrappers all render media
through this), 37 (`bfHero` — not directly, no media prop there per
as-built), 44 (`bfContactSection` if it carries an image — check as-built,
none today). Builds from
`bfna-website-nuxt/src/components/wireframe/wfMedia.vue` (9 lines: `<img>`
when `src` set with an inline `aspect-ratio`/`object-fit` style, else a
`.wf-media` placeholder `<div>` with `--wf-ratio` inline). Provenance:
BF-159; as-built-wireframe-inventory.md §A.

## Scope

- New `bfna-website-nuxt/src/components/bf/Media.vue` (`<bfMedia>`).
- Props: `src?: string | null`, `alt?: string | null`, `ratio?: string =
  '16/9'` — same defaults as `wfMedia.vue`.
- When `src` is set: render `<NuxtImg :src="src" :alt="alt" loading="lazy">`
  (the module is installed — `@nuxt/image` is in `src/nuxt.config.ts`
  `modules:`) with explicit `width`/`height` (or `aspect-ratio` CSS)
  derived from the `ratio` prop so there is no cumulative layout shift —
  `object-fit: cover` via CSS, not an inline `style` string (replacing
  `wfMedia.vue:11`'s inline `style="aspect-ratio: …; object-fit: cover"`).
- When `src` is absent: render the placeholder `<div>`, ratio applied
  through `--_bf-media-ratio` (replacing `wfMedia.vue:12`'s inline
  `--wf-ratio` custom property — same mechanism, `--_bf-*` name).
- `alt` is **required** whenever `src` is set — enforce via a dev-time
  warning (Vue's `console.warn` in a `watchEffect`, or a prop validator) if
  `src` is truthy and `alt` is falsy; do not silently render `alt=""`.

## Out of scope

- Art direction, `<picture>` source sets, or a lightbox — none exists in
  the wireframe layer, none is built here.
- Editing `wfMedia.vue` or any of its 6 call sites — frozen (D2).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).
- Any new colour for the placeholder box — reuse whatever token/pattern the
  `.wf-media` crosshatch placeholder already implies is the intended
  "no image yet" treatment (a neutral/surface token), no new literal.

## Styling

Tokens: neutral/surface semantic token for the placeholder box background
(reuse existing, no new literal). CSS-variable hook: `--_bf-media-ratio`
(replaces `--wf-ratio`), bound via computed `cssVars`. `@layer components`.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Media.vue   # today: fails
grep -c "NuxtImg" src/components/bf/Media.vue        # after: >=1
grep -c "loading=\"lazy\"" src/components/bf/Media.vue   # after: >=1
grep -c "\-\-_bf-media-ratio" src/components/bf/Media.vue   # after: >=1
git diff --stat -- src/components/wireframe/wfMedia.vue   # must be empty
```
Plus: a probe page renders 1/1, 3/2, and 16/9 in both real-image and
placeholder states with no cumulative layout shift (per the issues.md
`verify` column — manual/Lighthouse CLS check).

## Decisions

_Runner appends here._
