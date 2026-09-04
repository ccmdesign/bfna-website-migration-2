# gh#222 — `MediaProps.alt` becomes required (a11y pass 1, row 97)

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/222> ·
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) (§0 image-alt rows, §4 D23/D25/D28/D32, §5, §7) ·
Epic: <https://app.plane.so/ccm-design/browse/BF-219/>

## 1. What this row is, and what it deliberately is not

D25: **the contract carries the decision, not the default.** Today `MediaProps.alt` is
`string | null` *optional*, and `Media.vue` writes `:alt="alt ?? ''"` on both image branches.
The effect is that every image whose call site said nothing is announced to a screen-reader user
as *decorative* — a claim nobody ever made. The dev-only `console.warn` at `Media.vue:152-161`
was the compensation, and a warning that is compiled out of the production bundle is not a gate.

This row makes the omission a **compile error**. It does **not** supply alternative text: the
strings are content, not code (D28, §8 — Irene owes 433 documents, `grep -rl '"alt"' content/bf`
returns 0), and #234 owns the field, the schema, the normaliser and the importer. Inventing an
alt string here would be worse than the empty one it replaces.

## 2. Changes

| File | Change |
|---|---|
| `src/types/bf-contracts.ts:278` | `alt?: string \| null` → `alt: string`. Doc comment already says "required whenever `src` is set"; the type now agrees with it. |
| `src/components/bf/Media.vue:152-161` | Delete the `import.meta.dev` `watchEffect` warn. |
| `src/components/bf/Media.vue:184,193` | `:alt="alt ?? ''"` → `:alt="alt"` on both the plain `<img>` and the `<NuxtImg>` branch. |
| `src/components/bf/Media.vue` header §doc | Rewrite the paragraph that describes the warn so the file documents the contract it now has. |
| `scripts/check-routes.ts` | New whole-build gate: zero `<img>` in `.output/public/**/*.html` without an `alt` attribute. Same shape, exclusions and non-vacuity row as the DoD-A4 list gate. |

Not changed, on purpose:

- **`Media.vue:204-209`, the no-`src` placeholder branch.** It is a `<div aria-hidden="true">`;
  there is no `alt` to state and nothing to describe. The prop stays required at the type level
  regardless of branch, because a prop's requiredness cannot be conditioned on another prop's
  value in `defineProps<T>()` and a discriminated union here would cost every call site a cast.
- **`insights/[slug].vue:248` and `projects/[slug].vue:288`.** Both pass `:alt="heading"`, which
  makes the lead image's alt character-identical to the `<h1>` (brief §0, measured on
  `/insights/12-days-of-christmas-in-europe`). That is a real defect and it is **#234's**: fixing
  it needs the alt field that #234 ships, and #110 is what asserts the invariant. Behaviour is
  left exactly as it is; a `TODO(gh#234)` marks it.

## 3. The swept call-site list

Sweep: `grep -rnE '<(bf-media|bfmedia)' src` (case-insensitive), excluding `src/components/wireframe/**`
per brief §7 / site-epic DoD-4. Seven call sites — the issue's "starting points" list was complete
this time, `about.vue` being line 247.

| # | Call site | Passes today | Decision |
|---|---|---|---|
| 1 | `src/components/bf/CardFeatured.vue:266` | `alt=""` | **Keep `alt=""`.** Already deliberate, already commented: the card's own `<h2>` link names the destination. Comment updated — it currently cites the dev warn being deleted here. |
| 2 | `src/components/bf/CardProduct.vue:291` | `alt=""` | **Keep `alt=""`.** Same rationale, same comment fix. |
| 3 | `src/components/bf/CardProject.vue:212` | `alt=""` | **Keep `alt=""`.** Same. |
| 4 | `src/components/bf/CardPerson.vue:202` | `alt=""` | **Keep `alt=""`.** Portrait beside the person's name in the card heading. Same comment fix. |
| 5 | `src/pages/about.vue:247` | `alt="Bertelsmann Stiftung headquarters"` | **No change.** The one call site in the repo with real alternative text, hand-written at build time against a static `/images/hero/stiftung.jpg`. |
| 6 | `src/pages/insights/[slug].vue:248` | `:alt="insight.heading"` | **No change to behaviour.** `TODO(gh#234)` — content-bearing lead image with no string of its own; the `<h1>` duplicate is #234's to fix with real data. |
| 7 | `src/pages/projects/[slug].vue:288` | `:alt="project.heading"` | **No change to behaviour.** Same, `TODO(gh#234)`. |

Totals: **7 swept — 4 deliberate `alt=""`, 1 real string already present, 2 `TODO(gh#234)`.**
Zero invented alt strings.

`src/components/ds/**` renders its own raw `<img>` (`ccmSection.vue:15,23`, `ccmCard.vue:11`) and is
out of this epic (brief §7, pending site-epic #88). It ships only on `/docs/**`, which the new gate
excludes on the same terms as DoD-A4.

## 4. How a missing `alt` is proved to fail

Two independent proofs, because the type and the output can drift apart:

1. **Type.** Remove `alt` from one call site and run `npx vue-tsc --noEmit` (the `nuxt typecheck`
   half). Expect TS2739/TS2741 — "Property 'alt' is missing" — at the call site, recorded verbatim
   in the issue journal, then restored. The CI gate reads `.github/typecheck-baseline.txt`, a
   `(file, TS-code, count)` signature set, so a new signature fails even though the count is
   unchanged.
2. **Output.** The new `check-routes.ts` gate walks every prerendered `*.html` under
   `.output/public` and fails on any `<img …>` opening tag with no `alt` attribute. Negative-tested
   red by hand before the PR. It carries a non-vacuity row — "the build emitted images to inspect"
   — so a walk that finds nothing fails instead of passing quietly, exactly as DoD-A4's does.

## 5. Baseline

Expect `.github/typecheck-baseline.txt` to be **unchanged**. Every current call site already passes
an `alt`, so requiring it should surface no new error. If a signature does move, it is a real find
(a call site the sweep missed, or a `string | undefined` heading reaching a `string` prop) and gets
fixed at the call site — the baseline is not loosened to hide it. Any baseline edit is justified in
the PR body.

## 6. Risks

- **`:alt="insight.heading"` may not typecheck.** If `heading` is `string | undefined`, requiring
  `alt: string` turns it into an error. The fix must not change behaviour: `?? ''` at that call
  site would silently re-create the very coercion this row deletes on a page where the heading is
  the *only* string available. Preferred remedy in that case is to narrow at the source or to
  `String(heading ?? '')` **with** the `TODO(gh#234)` and a comment stating that the empty case is
  a missing-content bug, not a decorative declaration.
- **An `<img>` in the prerendered output that no `bfMedia` call site controls** — rich-text body
  HTML from Directus, a favicon link, an inlined SVG-as-img. The gate would go red on markup this
  row cannot fix. Mitigation: run the gate before the PR, and if such an image exists, record it
  and hand it to #234 rather than weakening the assertion.
- **`nuxt generate` cost.** ~430 pages. Never `npm run generate` (it runs the importer and needs
  Directus secrets).
- **Scope.** D23/D32: nothing in this row may change a colour, font, size, weight, letter-spacing,
  line-height, radius or shadow. The diff is a type, two bindings, a deleted `watchEffect`, comment
  text and a build script.
