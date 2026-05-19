---
id: BF-60-002
title: "Browser visual parity sweep for BF-50 crop/centering across product surfaces (plan U6)"
severity: P3
autofix_class: advisory
owner: human
source: ce:review autofix — PR #1 (bfna-website-migration-2), run 20260519-073405-3ec2ee2a
requires_verification: true
status: deferred-to-browser-tests
resolved_by: todo-resolve (static reasoning pass, 2026-05-19)
---

## Resolution (todo-resolve static pass, 2026-05-19)

**Static parity: CONFIRMED at the strongest possible level (0-byte diff vs
proven-live). The runtime visual sweep at 375/768/1024/1440px: DEFERRED to
browser tests (Step 5 / plan U6) — it genuinely requires a build + running
browser and cannot be performed by static reasoning.**

Static verification performed against the read-only live Eleventy reference
(`ccmdesign/bfna-website`):

- Live `src/assets/css/global.css` is at clean HEAD with the two BF-50 fix
  commits applied: `e58f9ea` ("vertically+horizontally center … max-width 90%")
  + `e791506` ("contain/center product feature images + standard shadow").
  `git status` clean — so the reference is the **post-fix proven** file.
- Worktree `src/public/css-legacy/global.css` is **byte-identical** to that file:
  both 74984 bytes, `diff` reports a **0-byte difference**. The CSS port is an
  exact transcription of the proven-live fix — not a re-derivation. (Highest
  confidence a static check can give.)
- `--black--hsl` broken double-dash token: **0 occurrences** anywhere in the
  worktree `src/` (`grep -rn -- '--black--hsl' src/` → none). The standard shadow
  token `0px 8px 32px hsl(var(--black-hsl), 0.15)` is present on the hero
  (`.product-hero--website/--video .product-hero__image > img`, ~L2647), the
  `--website` card (~L2475), and the `--report` card (~L2448). Token typo fully
  fixed. CONFIRMED.
- Scope guards intact (inspected directly):
  - Shared base `.product-card__image > img` keeps the live values
    (`@max-63.9375em { margin:-15% -2% -8%; max-width:104% }`,
    `@64em { max-width:90% }`) — unchanged, not regressed.
  - `.product-card--item` block (theme/layout, ~L2392-2435) unchanged; the
    rebuild's publication / "Nate 3D book" path is `ProductCardThin.vue`
    (`.product-card--item` + `adjustImageSize()` JS + scoped CSS) — verified
    left untouched (D6).
  - `.product-card--report` block: contained/centered base + standard shadow,
    `@40em max-width:50%` and `@64em { position:static; max-width:50% }`
    preserved (Nate-3D look), no `-30%/-15%` or absolute-110% bleed. CONFIRMED.
  - `.product-hero__image` is `display:flex; align-items:center;
    justify-content:center`; img `display:block; max-width:90%; width:auto;
    height:auto; margin-inline:auto; object-fit:contain`; no `overflow:hidden`
    clip, no `@64em` 150% oversize. CONFIRMED.

Because the file is byte-identical to the proven-live shipped CSS, every BF-50
static parity assertion in this todo is verified. Static confidence is maximal.

**Deferred to browser tests (Step 5 / plan U6) — NOT guessed:** the per-surface
runtime visual sweep at 375/768/1024/1440px on `[...slug].vue`,
`future-leadership/index.vue`, the `--report` surface, and the
democracy/digital-world/politics-society/archives/podcasts index+slug pages,
plus the non-`--website`/`--video` hero regression check, is the legitimate
Step-5 browser-test work. It requires a build and a running browser to render
each surface; static reasoning cannot produce screenshots or confirm rendered
pixels. The 0-byte-diff-vs-proven-live result makes a visual regression highly
unlikely, but empirical confirmation is correctly owned by the downstream
browser-test step. Does NOT block PR #1.

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
