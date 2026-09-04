# gh#203 — 17b `bfMedia`: external `src` as a plain `<img>`

**Severity:** P1. **Issue:** https://github.com/ccmdesign/bfna-website-migration-2/issues/203
**Epic:** https://app.plane.so/ccm-design/browse/BF-217/
**Spec:** the issue body itself (this item has no separate `docs/ds-epic/issues/` spec file; the
issue body is authoritative and the Decisions section lives at the bottom of this plan).

## The defect

`src/components/bf/Media.vue` (gh#26) renders every image through `<NuxtImg>`. `@nuxt/image` in
`src/nuxt.config.ts` sets `provider: process.env.NUXT_IMAGE_PROVIDER || undefined`, so on a plain
`npx nuxt generate` the module falls back to the **`ipx`** provider and rewrites an absolute URL
into a server-side route:

```html
<img src="/_ipx/q_90/https:/bfna.simplyas.com/assets/2e1d…">
```

`ipx` is a runtime image server. The deploy is static (`nuxt generate` output pushed to Netlify with
`--no-build`), so nothing answers `/_ipx/…`; the SPA fallback returns `200 text/plain` and the
browser paints a broken image. Every `bfMedia` image on `/` and `/about` is affected.

The wireframe it evolved from (`components/wireframe/wfMedia.vue`) used a raw `<img :src>` and its
photos load fine — `https://bfna.simplyas.com/assets/<id>` is a public 200 `image/jpeg`. And
`nuxt.config.ts` already writes the house rule two lines above the provider setting:

> For external images, components use regular img tags to bypass optimization

`bfMedia` deviated from it. One person photo is on `images.ctfassets.net`, which is not in
`image.domains` either — a second reason not to route absolute URLs through the module.

## Approach

Branch on the shape of `src`, not on a new prop. `/^https?:\/\//` is the whole test.

1. **`src/components/bf/Media.vue`** — three branches instead of two:
   - `src` absolute → plain `<img>`, `src` passed **verbatim**;
   - `src` relative/local → `<NuxtImg>`, unchanged;
   - no `src` → the placeholder `<div>`, unchanged.

   The two image branches must be indistinguishable to every consumer and to probe 17: same
   `class="bf-media"`, same `:style="cssVars"` (the `--_bf-media-ratio` hook), same
   `loading="lazy"`, `decoding="async"`, `:alt="alt ?? ''"`, same `$attrs` fallthrough. No new
   prop, no new CSS, no new colour.

2. **Header comment** — section "2. `NuxtImg`, not a raw `<img>`" becomes "2. `NuxtImg` for local
   assets, a plain `<img>` for absolute URLs", stating the rule *and* why: `ipx` needs a server,
   the deploy is static, and `nuxt.config.ts` already documents the house rule.

3. **Probe 17** (`src/pages/bf-probe/17-bf-media.vue`, not 26 — 26 is `bf-card-product`) — a new
   `.probe__providers` section with one absolute-`src` instance and one relative-`src` instance,
   asserting:
   - the absolute instance renders an `<img>` whose `getAttribute('src')` **equals the input
     string verbatim**;
   - neither rendered `src` contains `/_ipx/`;
   - the relative instance's `src` **differs** from its input (i.e. it really went through
     `NuxtImg`/`ipx` — the branch is still live, not accidentally deleted);
   - the absolute instance still carries `loading="lazy"`, `decoding="async"`, its `alt`, the
     `.bf-media` class, and honours a `ratio` prop through `--_bf-media-ratio`.

   The new section gets its own class so the existing "exactly six boxes in `.probe__gallery`"
   count is untouched.

4. **`scripts/check-probes.ts`** — the gh#200 real-route smoke set gains an `_ipx` row. Read each
   smoked route's `index.html` off disk from `.output/public` and assert it contains no
   `src="/_ipx/`. Filesystem, not CDP: the assertion is about the **generated HTML**, which is what
   Netlify serves, and reading the artifact directly cannot be masked by client-side hydration
   repainting the DOM.

## Files

| File | Change |
|---|---|
| `src/components/bf/Media.vue` | absolute-`src` branch + header comment |
| `src/pages/bf-probe/17-bf-media.vue` | provider-branch section + 6 assertion rows |
| `scripts/check-probes.ts` | `no /_ipx/ in generated HTML` row per smoke route |

Not touched: `src/types/bf-contracts.ts` (no contract change), `nuxt.config.ts`, `netlify.toml`,
`src/server/middleware/redirects.ts` / `public/_redirects` (gh#66 is editing those concurrently),
and every frozen wireframe path.

## Test strategy

- `npx nuxt generate` (never `npm run generate`).
- `grep -rl '/_ipx/' .output/public --include=index.html | grep -v wireframes | grep -v bf-probe`
  → nothing.
- Every `<img>` on `.output/public/about/index.html` has an absolute `https://` `src`; each one
  curled returns `200` with an `image/*` content type.
- `npx tsx scripts/check-probes.ts --only 17` → exit 0; full `npx tsx scripts/check-probes.ts` →
  exit 0 (probes **and** the smoke set, including the new `_ipx` row).
- Typecheck gate: `≤ 176` total `error TS` (baseline on `dev`), and `0` under
  `src/{components/bf,types,composables/bf}` / `content.config`.
- Wireframe byte-identity vs `f757a64` → empty diff.

## Risks

- **Probe pages keep an `/_ipx/` URL of their own.** Probe 17's relative-`src` instance is
  *supposed* to go through `NuxtImg`, so `bf-probe/**/index.html` legitimately contains `/_ipx/`.
  The acceptance grep therefore excludes `bf-probe` (and `wireframes`, which is frozen and out of
  scope by D2). The smoke-set row is scoped to real routes only, so it is unaffected.
- **`sizes`/`srcset` loss on external images.** Deliberate and already the site-wide rule: an
  external image served through a provider that does not exist is worth nothing, and Netlify's
  Image CDN would need `netlify.toml` `[images] remote_images` plus a linked build. Explicitly out
  of scope (issue body), left as a separate decision.
- **`vitest` harness is broken on `dev`** (residual #86). Acceptance is the probe + the
  `check-probes` smoke row, per the #109 harness decision. Recorded below.

## Decisions

- **D-203.1 — the branch test is `/^https?:\/\//` on `src`, not a new prop.** A `provider` or
  `optimize` prop would push the decision to every call site and let one of them get it wrong; the
  URL already carries the only fact that matters. Protocol-relative (`//host/…`) and `data:` URIs
  are not special-cased: neither appears in the Directus/Contentful payloads, and `NuxtImg`
  handles `data:` by passing it through anyway.
- **D-203.2 — the absolute branch is a plain `<img>`, not `<NuxtImg provider="none">`.** `none`
  would still route through the module's runtime and still emit its `sizes`/`densities` plumbing
  for no benefit. A plain `<img>` is what `wfMedia.vue` shipped, what the other nine legacy
  components do, and what `nuxt.config.ts` documents.
- **D-203.3 — the smoke assertion reads the generated HTML off disk**, not the hydrated DOM. The
  bug is in the artifact Netlify serves; a DOM check after hydration would test a different thing.
- **D-203.4 — vitest substitution (residual #86).** No vitest test is added. Equivalent-strength
  coverage is the probe-17 rows plus the per-route `check-probes` smoke row, both of which run in
  the `check-probes` gate that already blocks the PR.
- **D-203.5 — `ce-plan` / `ce-work` skills not invoked; both steps run inline.** The change is
  ~60 lines across three files against a fully specified issue body, and the runner's hard rule
  prefers a degraded inline step to any risk of detached background work.
