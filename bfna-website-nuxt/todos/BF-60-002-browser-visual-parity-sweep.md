---
id: BF-60-002
title: "Browser visual parity sweep for BF-50 crop/centering across product surfaces (plan U6)"
severity: P3
autofix_class: advisory
owner: human
source: ce:review autofix — PR #1 (bfna-website-migration-2), run 20260519-073405-3ec2ee2a
requires_verification: true
status: open
---

# Browser visual parity sweep — BF-50 crop/centering (plan U6)

## Context

The CSS port is verified **byte-identical** to the proven live Eleventy
`global.css` (0-byte diff vs live HEAD; `--black--hsl` typo fully fixed; scope
guards on `.product-card--item` / shared base `.product-card__image > img` /
`ProductCardThin` JS intact). Static parity is therefore extremely high
confidence. Plan U6 still calls for a runtime visual sweep as final
confirmation — this is the Step 5 browser-test work, recorded here so it is not
lost.

## Action (Step 5 — browser tests)

Build, then visually compare each surface to live-site behavior at
375 / 768 / 1024 / 1440px:

- `src/pages/[...slug].vue` — product / super-product / publication detail
  (`ProductHero`, `ProductCardThin`): hero contained/centered with visible
  standard shadow, no `overflow:hidden` clip; publication card unchanged.
- `src/pages/future-leadership/index.vue` — workstream listing
  (`ProductCardWebsite`, `ProductCard`): website card contained/centered, no
  180%/negative-margin bleed, no `z-index:-1` overlap.
- `.product-card--report` surface: book stays at `max-width:50%` at >=40em
  ("Nate 3D book" look visually identical to live), no `-30%/-15%` bleed <40em.
- `src/pages/democracy/index.vue`, `digital-world/index.vue`,
  `politics-society/index.vue`, `archives/index.vue`, `podcasts/index.vue`,
  `podcasts/[slug].vue` — no clipped/bled/shadow-missing product images.
- Confirm a non-`--website`/`--video` hero (e.g. plain `--democracy`) is
  visually unchanged.

## References

- Plan: `bfna-website-nuxt/docs/plans/2026-05-19-001-fix-image-blur-and-crop-parity-plan.md`
  (Implementation Unit U6)
- PR: https://github.com/ccmdesign/bfna-website-migration-2/pull/1
- Run artifact: `/tmp/compound-engineering/ce-code-review/20260519-073405-3ec2ee2a/`
