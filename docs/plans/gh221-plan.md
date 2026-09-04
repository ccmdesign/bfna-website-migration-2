# gh#221 — a11y-96 external-marker-alt

Row 96 of `docs/a11y-epic/issues.md`. Type: `fix`. Pass-1, structural only (D23 / D32):
nothing a sighted user can see changes.

## The defect, in two halves

Generated and literal arrow glyphs leak into accessible names.

1. **CSS.** `bfna-website-nuxt/src/public/css/components/external-link.css:64-71` declares
   `--_bf-external-marker: " ↗"` on `a[data-external]` and paints it with
   `content: var(--_bf-external-marker)` — no alternative-text form. Measured during the
   audit: `getComputedStyle(a, '::after').content === '" ↗"'` on all 15 `a[data-external]`
   on `/projects`. Every external link on the site fires this rule, which makes it the
   highest-frequency instance of the defect.
2. **Markup.** Bare `→` characters sit inside `<a>` text as plain text nodes, hidden from
   nothing. Measured on `/`: `All projects →`, `All insights →`, `All Projects →`.

## The idiom being copied (D27)

`content: <value> / ""` is already used correctly twice in this repo:

- `src/components/bf/Breadcrumb.vue:207` — `--_bf-breadcrumb-separator: "/" / "";`
  consumed at `:263` by `content: var(--_bf-breadcrumb-separator)`.
- `src/components/bf/nav/Dropdown.vue:189` — `content: "▾" / "";`

and `<span aria-hidden="true">` around a decorative glyph inside a link is already used at
`src/components/bf/CardProject.vue:194`. `external-link.css` is the outlier.

**Where the alt half goes.** Breadcrumb puts `/ ""` *inside* the custom property and warns a
consumer to keep it. This row puts it in the `content` declaration instead —
`content: var(--_bf-external-marker) / ""` — which is what the issue title asks for and is
strictly stronger: a consumer overriding the glyph hook cannot accidentally drop the empty
alternative text. Same idiom, safer placement; recorded in the file's own comment.

## Call-site sweep — method, not a list

The issue names `pages/index.vue:201,246` and gestures at `[program].vue` and the footer.
Those line numbers are stale and the list is incomplete. The sweep actually run:

```
grep -rn '[↗→←↑↓»«]' src/ content/ --include=*.vue --include=*.ts --include=*.json
```

Results, classified:

| Site | Disposition |
|---|---|
| `src/pages/index.vue:222` `All projects →` | **fix** — wrap in `<span aria-hidden="true">` |
| `src/pages/index.vue:272` `All insights →` | **fix** — same |
| `src/pages/[program].vue:216` `Include archived (N) →` (inside `bfButton to=…` → an `<a>`) | **fix** — same |
| `src/pages/insights/index.vue:331` `Include archived (N) →` (same shape) | **fix** — same |
| `src/assets/bf-data/menus.json:69` `"All Projects →"` (nav dropdown + footer, via `bf/nav/MenuLink.vue`) | **fix** — the glyph is data, so `MenuLink` splits a trailing arrow off the label at render into an `aria-hidden` span. Data unchanged, paint unchanged. |
| `src/pages/wireframes/**`, `src/composables/useWfContent.ts:167`, `src/public/css/wireframe.css:142,194` | **not touched** — frozen by BF-217 D2, byte-guarded by site-epic DoD-4, excluded by a11y BRIEF §7 |
| `src/pages/docs/**` `← Back to Documentation` (3 files) | **not touched** — `/docs/**` renders `components/ds/**`, which BRIEF §7 puts out of this epic pending the site-epic #88 call. `check-routes.ts` already excludes `/docs/**` from its whole-build DoD-A4 half for exactly this reason; the new gate inherits that exclusion and names it |
| `→` inside prose, comments and doc-block tables | **not touched** — not inside link text |
| `content/bf/**` | no arrow inside any `<a>` — checked, zero hits |

`src/public/css/utils/utils.css:19` emits `content: attr(data-icon)` on `[data-icon]::before`.
Not a literal glyph and not an arrow; out of this row's scope and out of the gate's (the gate
matches literal quoted glyphs only, so `attr()` is not swept up by accident).

## The gate (BRIEF §5 — gates only grow)

Two whole-build rows added to `bfna-website-nuxt/scripts/check-routes.ts`, alongside the
existing DoD-A9 (`lang`) and DoD-A4 (list roles) rows, disturbing neither:

- **`::after` alt-text form.** Every `content:` declaration on a `::before`/`::after` in
  `src/public/css/**` whose value contains a literal glyph must carry the `/ <string>` alt
  form. Excludes `wireframe.css` and `css-legacy/`, both named in the row's detail string.
  Prints how many glyph-emitting declarations it inspected, so it cannot pass by finding none.
- **Bare arrows in link text.** Zero `↗ → ← ↑ ↓ » «` inside the text content of an `<a>` in
  `.output/public`, unless the glyph sits inside an `aria-hidden="true"` element. Excludes
  `/wireframes/**` and `/docs/**` for the reasons above, named in the detail string. Prints
  how many anchors it inspected.

Both must be **negative-tested red** before the fix is trusted: revert each half locally,
confirm the corresponding row fails, restore.

## Verification

| Claim | How it is proved |
|---|---|
| The `::after` carries the alt form | `getComputedStyle(a, '::after').content` on `/projects` reads `" ↗" / ""` (Chromium, real browser, real build) |
| The glyph still paints | The `::after` box is measured non-zero and the rendered anchor is wider than the same anchor with the pseudo-element suppressed; plus a screenshot |
| No unhidden arrow remains in link text | The new whole-build gate over `.output/public`, non-vacuous (prints the anchor count) |
| No visual regression | D23/D32: the diff adds no colour, font, size, weight, letter-spacing, line-height, radius or shadow. `--_bf-external-marker-font-size: 0.8em` is **left alone** — a pass-2 concern |
| CI | `.github/workflows/verify.yml`: `npm ci`, typecheck signature gate (baseline 90, untouched), `npx nuxt generate` (**never** `npm run generate`), `check-routes.ts`, `check-links.ts` |

## What cannot be verified here, and is not claimed

Whether a screen reader actually stops announcing the marker **cannot be checked on this
runner** — no assistive technology, no Safari/WebKit (BRIEF §0.2, §5). Chromium's
accessibility tree is evidence about Chromium, not about VoiceOver or NVDA. This row asserts
the CSS condition and the markup condition only. The announcement is the manual AT pass in
BRIEF §8, owned by Aline + Claudio, and both the PR body and the journal say so plainly.

## Risks

1. **Missing a call site.** Mitigated by making the whole-build gate, not the grep, the
   source of truth: it reads the prerendered HTML, so a glyph arriving from data or from a
   component the grep did not cover still fails the build.
2. **Removing the glyph instead of hiding it.** `aria-hidden` wrappers keep the text node,
   including its leading space; the CSS change is to the alt half only. Both are checked by
   the "still paints" measurement above, not by reading the diff.
3. **The `aria-hidden` wrapper swallowing real link text.** Each wrapper contains the glyph
   and its separating space and nothing else. Checked in review and by the accessible name
   read out of Chromium's tree.
4. **`content: var(--x) / ""` failing to parse.** `var()` substitutes before the declaration
   is parsed, so the computed value is `" ↗" / ""`. Confirmed by measuring it in the browser,
   not by assertion.
5. **Vue whitespace condensing eating the separating space** when a glyph moves into a span —
   the exact trap `CardProject.vue:187-193` documents. Wrappers stay on one source line with
   the text they follow, and the space goes *inside* the span.
