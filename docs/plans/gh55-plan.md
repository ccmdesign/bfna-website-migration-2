# Plan — gh#55 / issue 46: site shell layout `bf-default`

**Spec:** [`docs/ds-epic/issues/46-layout-bf-shell.md`](../ds-epic/issues/46-layout-bf-shell.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

Folded residuals: [#103](https://github.com/ccmdesign/bfna-website-migration-2/issues/103) (P1),
[#107](https://github.com/ccmdesign/bfna-website-migration-2/issues/107),
[#108](https://github.com/ccmdesign/bfna-website-migration-2/issues/108),
[#164](https://github.com/ccmdesign/bfna-website-migration-2/issues/164).

## Approach

1. **`src/layouts/bf-default.vue`** — the only new runtime file, and the only data
   reader in the view tree (D8). `const { menus, announcement } = await useBfSite()`
   (explicit import — `composables/data/**` is not auto-imported; probe 13 sets the
   precedent). Top-level `await` is safe: `NuxtLayout` renders the layout inside a
   `<Suspense>` (`node_modules/nuxt/dist/app/components/nuxt-layout.js:88`).

   DOM order, matching the spec exactly:

   | # | element | note |
   |---|---|---|
   | 1 | `<bfSkipLink target="#main">` | first focusable in the document; nothing focusable above it |
   | 2 | `<bfNav :menus>` | props, never a composable (D8) |
   | 3 | `<bfNotice v-if="announcement" variant="info">` | `announcement.message` linked to `announcement.url`; the `status === 'published'` gate lives in the composable, not here |
   | 4 | `<main id="main" tabindex="-1" class="stack" data-gap="xl"><slot /></main>` | `tabindex="-1"` so the skip link's fragment jump actually moves focus |
   | 5 | `<bfFooter :menus>` | props |

   No hero slot (spec: every template composes its own header inline).
   `useHead`: `htmlAttrs.lang = 'en'`, a `titleTemplate`, viewport — and **no**
   `noindex` (the wireframe layout's `noindex` must not follow production).

2. **#103 — the `@layer` order statement on real routes.** `nuxt.config`'s `css: []`
   is empty and there is no `src/app.vue`, so a route's layout is the only stylesheet
   injector. `bf-default` therefore links `/css/styles.css` (whose first line *is* the
   order statement) **and** restates `@layer …;` inline with
   `tagPriority: 'critical'`, exactly as `layouts/bf-probe.vue` does — under `nuxt dev`
   Vite injects each SFC `<style>` independently of the link, so a component's own
   `@layer components { … }` can otherwise be the first `@layer` the browser sees and
   silently make `components` the *weakest* layer. `layouts/legacy-base.vue` is not
   touched.

3. **#107 — the semantic page ground.** Already half-done on `dev`: gh#116 added
   `--color-surface-page: var(--color-white)` to `tokens/semantic-colors.css` and
   repointed probes 03/14/15 off the `--color-white` primitive (verified by grep —
   the only surviving mention in 14 is an assertion that the alias *resolves to* the
   primitive, which is the point of the row). So no second token is minted:
   `bf-default` paints `html`/`body` from `--color-surface-page` + `--color-text`
   inside `@layer overrides`. See Decisions in the spec.

4. **#108 — assert layer ORDER, not membership.** Probe 46 reads the order statement
   out of `document.styleSheets` (`CSSLayerStatementRule.nameList`) and asserts the
   exact eight-name sequence, *and* corroborates it behaviourally: a rule in
   `@layer overrides` must beat a `.bf-*` declaration in `@layer components` on the
   same element.

5. **#164 — `bfSection` accessible name.** `src/components/bf/Section.vue` gains
   `const headingId = useId()`, `:id="headingId"` on the `<h2>` and
   `:aria-labelledby="heading ? headingId : undefined"` on the `<section>`. Only when
   `heading` is present — a band with no heading stays an unnamed `<section>` rather
   than gaining a dangling idref. `v-bind="rootAttrs"` stays last, so a caller's own
   `aria-labelledby` still wins. One row added to probe 39.

6. **Probe** `src/pages/bf-probe/46-layout-bf-shell.vue`, `definePageMeta({ layout: 'bf-default' })`,
   with a delete-later comment (#56 covers the real route). Follows
   `docs/decisions/probe-harness.md`: `[data-probe-verdict]` root, `[data-probe-row][data-ok]`
   rows, `data-probe-keys="Tab,Enter"` for the real-keyboard rows.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/layouts/bf-default.vue` | new |
| `bfna-website-nuxt/src/pages/bf-probe/46-layout-bf-shell.vue` | new |
| `bfna-website-nuxt/src/components/bf/Section.vue` | `aria-labelledby` (#164) — the one sanctioned edit outside the layout |
| `bfna-website-nuxt/src/pages/bf-probe/39-bf-section.vue` | one row for #164 |
| `docs/ds-epic/issues/46-layout-bf-shell.md` | Decisions appended |

## Test strategy

Probe 46 asserts, at runtime, in the built output:

- the skip link is the **first** focusable element in the document, reached by a real `Tab`;
- a real `Enter` on it moves `document.activeElement` to `#main` (the `tabindex="-1"` half);
- `<main id="main">` exists **exactly once** in the document;
- `bfNav` and `bfFooter` rendered, with link counts derived from the real `menus` module — not hard-coded;
- the announcement band is present **iff** `publishedAnnouncement()` returns a document, and carries `announcement.url`;
- `html[lang="en"]`, and **no** `<meta name="robots" content="noindex">`;
- the `@layer` order statement is present with the exact declared sequence (#108), plus the behavioural `overrides > components` corroboration;
- `body`'s resolved background equals the resolved `--color-surface-page` (#107).

Gates: `npx tsx scripts/check-probes.ts --only 46` (plus `--only 39`, `03`, `14`, `15`)
and the full run exit 0; `npx nuxt generate` exits 0; typecheck ≤ baseline **178**
with **0** errors in `src/(components/bf|types|composables/bf)` or `content.config`;
`grep -rn "queryCollection\|useBf" src/components/bf` empty (D8);
`grep -rn "wireframe" src/layouts/bf-default.vue` empty; wireframe byte-identity diff empty.

## Risks

- **Top-level `await` in a layout.** Mitigated by the `NuxtLayout`/`Suspense` reading above and by `npx nuxt generate`.
- **Probe 46 runs under `bf-default`, not `bf-probe`,** so the probe root is nested inside the layout's `<main>`. The harness selects `[data-probe-verdict]` anywhere in the document, so this is fine — but it means probe 46 must not render a second `<main>`.
- **Prerender batching** (`src/nuxt.config.ts`'s seeded probe routes): probes are read from the directory, so a new probe is picked up with no config edit.
- **`--color-surface` vs `--color-surface-page`.** The runner brief asked for `--color-surface`; the file's own gh#116 comment reserves that name for a component surface and states `--color-surface-page` as the page-canvas name. Minting both would be two names for one paint. Recorded as a deviation in Decisions.
