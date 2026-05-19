---
id: BF-60-001
title: "Verify BF-51 blur fix in a production-like build (Q2 — likely deferred Directus-provider rework)"
severity: P3
autofix_class: advisory
owner: human
source: ce:review autofix — PR #1 (bfna-website-migration-2), run 20260519-073405-3ec2ee2a
requires_verification: true
status: deferred-to-browser-tests
resolved_by: todo-resolve (static reasoning pass, 2026-05-19)
---

## Resolution (todo-resolve static pass, 2026-05-19)

**Static-verifiable claims: CONFIRMED. Production-build / runtime steps: DEFERRED to
browser tests (Step 5) — they genuinely require `npm run build` + a running browser
with the deployed `@nuxt/image` provider and cannot be settled by static reasoning.**

Verified against the read-only live Eleventy reference
(`ccmdesign/bfna-website`, working tree clean at HEAD `e58f9ea`+`e791506` =
the two BF-50 fix commits) and the worktree source:

- `src/directus/common.js:62-63` `getImage()` = `${process.env.BASE_URL}/assets/{imageId}`
  — param-less, extension-less. CONFIRMED verbatim.
- `src/composables/useExternalImage.ts` `isExternalImage()` returns external for any
  host that is not localhost / 127.0.0.1 / `bfna-site-v2.netlify.app` — so the
  Directus host `bfna.simplyas.com` is treated **external**. CONFIRMED.
- All four product components (`ProductHero.vue`, `ProductCard.vue`,
  `ProductCardWebsite.vue`, `ProductCardThin.vue`) render product images via the
  external plain-`<img>` fallback branch (`v-else` of `!isExternalImage(...)`),
  with no `srcset`. CONFIRMED. Therefore `@nuxt/image` does **not** process product
  images on the current code path — the U4/U5 changes are a correct, inert-today
  parity port, exactly as this todo states. Not dead/wrong code.
- U5 config is in place: `src/nuxt.config.ts` `quality: 90`, `screens` extended with
  `'3xl': 1920, '4xl': 2400` (live ~2400w ceiling), `domains: ['bfna.simplyas.com']`,
  `provider: process.env.NUXT_IMAGE_PROVIDER || undefined`. CONFIRMED.
- U4 component changes in place: matching corrected `sizes` on both the `<NuxtImg>`
  and the external `<img>` fallback in all four components; PNG passthrough via
  `:format="isPng(url) ? undefined : 'webp'"` (+ new `isPng()` helper, tolerant of
  Directus query/fragment). CONFIRMED. `ProductCardThin.vue` `adjustImageSize()` JS +
  scoped CSS left intact (D6 publication/"Nate 3D book" scope guard). CONFIRMED.
- BF-50 crop/centering CSS half is **fully effective**: `global.css` is byte-identical
  to the proven live file (74984 B, 0-byte diff) — see BF-60-002. CONFIRMED.

**Deferred to browser tests (Step 5) — NOT guessed, genuinely build/runtime-bound:**
Action items 1–4 below all require a production-like build (Netlify Image CDN
provider) and devtools inspection of rendered `srcset`/`currentSrc` at 1440px retina.
Static analysis can only establish the *expected* outcome (the external Directus
domain is not resized by the default provider, so the blur persists for product
images until the deferred Directus-aware provider / native-transform-param work
lands — plan "Deferred to Follow-Up Work", Q2/Q4/Q5). It cannot *empirically confirm*
the rendered srcset without running the build/browser. This is owned by the
downstream browser-test step and the deferred Directus-provider follow-up; do NOT
block PR #1.

Note (environment, out of scope): the `useExternalImage` vitest spec could not be
executed in this worktree — `@vue/test-utils` (optional peer of `@nuxt/test-utils`)
is not installed in the worktree `node_modules`. Pre-existing env/install gap,
unrelated to either todo; the logic is fully verified by direct code inspection
above. Flagged for the build/CI step, not fixed here (out of scope).

# Verify BF-51 blur fix in production / resolve deferred Directus-provider rework

## Context

This is **not a defect in PR #1** — it is the plan's own "Deferred to Follow-Up Work"
item (Scope Boundaries section) and is prominently documented in the PR body's "Q2"
section. Recorded here so Step 4 / downstream can route it.

## What was verified

- `src/directus/common.js:62-63` `getImage()` returns a param-less, extension-less
  URL: `${BASE_URL}/assets/{id}` where `BASE_URL` is the Directus host
  `bfna.simplyas.com`.
- `useExternalImage.isExternalImage()` treats `bfna.simplyas.com` as **external**
  (only localhost / 127.0.0.1 / `bfna-site-v2.netlify.app` are internal).
- Therefore every product hero/card image renders via the **plain `<img>` fallback**
  (no `srcset`), so `@nuxt/image` — and thus the U5 `quality: 90` / extended
  `screens` config and the U4 `<NuxtImg>` `sizes`/`format` props — **never process
  product images on the current code path**.

## Consequence

- The BF-50 crop/centering half (CSS) is **fully effective and complete** — the
  `global.css` is byte-identical to the proven live Eleventy file.
- The BF-51 blur half (U4/U5) is a **correct, no-harm parity port** but is **inert
  for product images today**. It is the correct destination state and harmless now;
  it is not dead or wrong code.

## Action (deferred follow-up — do NOT block PR #1)

1. `npm run build` in a production-like env (Netlify Image CDN provider).
2. Inspect rendered `srcset`/`currentSrc` on a `--website` product hero and a
   `ProductCardWebsite` listing card at 1440px retina.
3. If the active provider cannot resize the external Directus domain (expected),
   implement the deferred fix: either a Directus-aware `@nuxt/image` provider, or
   append Directus native transform params (`?width=&quality=&format=`) in
   `src/directus/common.js getImage()`. Re-run the build-time importer
   (`node ./contentImporter.js` via the `generate` script) afterward (plan Q5).
4. Re-derive / re-confirm the component `sizes` against the real rendered box once
   `@nuxt/image` actually processes the images (plan D3/Q4).

## References

- Plan: `bfna-website-nuxt/docs/plans/2026-05-19-001-fix-image-blur-and-crop-parity-plan.md`
  (Scope Boundaries → "Deferred to Follow-Up Work"; Open Questions Q2/Q4/Q5)
- PR: https://github.com/ccmdesign/bfna-website-migration-2/pull/1 (body → "Q2" section)
- Run artifact: `/tmp/compound-engineering/ce-code-review/20260519-073405-3ec2ee2a/`
