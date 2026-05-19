---
id: BF-60-001
title: "Verify BF-51 blur fix in a production-like build (Q2 — likely deferred Directus-provider rework)"
severity: P3
autofix_class: advisory
owner: human
source: ce:review autofix — PR #1 (bfna-website-migration-2), run 20260519-073405-3ec2ee2a
requires_verification: true
status: open
---

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
