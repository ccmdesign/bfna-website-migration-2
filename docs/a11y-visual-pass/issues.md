# Issue index — accessibility pass 2: visual

**Pass 2 of 2.** Everything a sighted user can see, and everything that needs a design decision
first. Markup, semantics, data and behaviour are
[`docs/a11y-epic/issues.md`](../a11y-epic/issues.md) (issues 92–110); the rule that divides them is
pass-1 brief D32 — by visual effect, not by file extension.

Ordered, dependency-aware. **Row order is execution order**; `depends-on` is the `Blocked-by` map.
Brief: [`docs/a11y-visual-pass/BRIEF.md`](./BRIEF.md). Per-issue specs go to
`docs/a11y-visual-pass/issues/<NN>-<slug>.md`. Paths are relative to `bfna-website-nuxt/` unless
prefixed with `docs/`. `site#` = a site-epic row coordinated with, not duplicated. Every issue
additionally passes the gates in brief §3 and adds at least one assertion to `check-routes.ts`
(brief §5); the `verify` column names the issue-specific check on top of that.

Numbering continues from [`docs/a11y-epic/issues.md`](../a11y-epic/issues.md), whose last row is 110.

**Every phase-20 row is blocked on a decision that is a Plane task (brief §8), not a runner's
call (D37).** A runner reaching one without the decision recorded in `docs/questions-design.md`
stops and says so.

---

## Index

| # | slug | title | type | depends-on | builds-from | folds | verify |
|---|---|---|---|---|---|---|---|
| **Phase 20 — Design decisions land (each blocked on a brief §8 task)** |
| 111 | `type-scale` | Apply the decided type scale, faces and weights as tokens (D35). Everything shipping today is placeholder and arbitrary: **h1 19.22px/600, h2 15.19px/500, h3 13.50px/500, body 12px/100, `.bf-chip` 9.48px/100** — headings barely exceed body, and chip text is under 10px. Sets the named minimum-size token DoD-V4 asserts against. Resolves V1's legibility half and V2 | design | — | `public/css/base/typography.css`, the `--_bf-*` font tokens; measured baseline in brief §0 V1, V2 | — | no rendered text on the ten routes computes below the new floor token; heading sizes are strictly decreasing h1→h3; re-run the brief §0 contrast table and record the new numbers; DoD-V4 |
| 112 | `link-tokens` | One link treatment as tokens — colour, underline, hover, visited — applied to plain `<a>` as well as bf atoms. Today there are three: card and grid links compute the **UA default `rgb(0,0,238)`**, `a.bf-nav__link` computes `rgb(8,8,8)`, buttons and brand links `rgb(48,100,145)`. Resolves V3 | design | 111 | `public/css/base/typography.css`, `public/css/components/`, `components/bf/` atoms that declare their own link colour | — | zero occurrences of `rgb(0, 0, 238)` among computed link colours in `.output/public`; every link colour is one of the token set; each computes ≥4.5:1 on its ground; DoD-V3 |
| 113 | `mobile-nav` | Apply the decided ≤375px nav treatment. Measured today at 375×812: the bar wraps to three rows, **no toggle exists** (`header button` count 0), all 8 top-level items stay reachable, `scrollWidth === innerWidth === 375`, and nothing uses `.hide-on-mobile` — so this is a layout decision, not an accessibility defect. If a disclosure is chosen, reuse pass 1's native `<details>/<summary>` pattern rather than building a widget (pass-1 D30). Resolves V7 | design | 111 | `components/bf/Nav.vue`, `components/bf/nav/`, `public/css/components/` | — | at 375×812 every top-level nav item is still reachable by keyboard and still passes `checkVisibility()`; `scrollWidth === innerWidth`; if a disclosure lands, it is `<details>`-based and every pass-1 nav assertion still passes; DoD-V8 |
| **Phase 21 — Verify against the chosen skin (nothing here can start before phase 20 merges)** |
| 114 | `contrast-audit` | Re-run the brief §0 measurement across the ten routes in pass-1 §0.1, both viewports, and fix every pair that falls below AA — by re-pairing hue and ground, or by size and weight, **never by changing a palette value** (D36). Baseline to beat, all currently passing: lowest **5.14:1** (`#306491` on `rgb(227,234,237)`), then **6.25:1** ×3, **9.4:1**, **20.03:1** | fix | 111, 112 | brief §0 V1 table; measurement method in brief §0 and D33 | — | every text/background pair ≥4.5:1 (≥3:1 for large text), computed via the canvas round-trip, at 1280×800 and 375×812; the before/after table is committed in the spec; DoD-V1 |
| 115 | `focus-indicator` | Hold the focus ring at ≥3:1 against every ground the new skin introduces — it measures **20.03:1** today (`2px solid rgb(8,8,8)`, offset 2px, on white) and the ring is deliberately painted with `--color-text` on the *page* ground, not `currentcolor` on the element (`public/css/base/focus.css:41-55`). Also rewrite `forms.css:34-40`, which writes `outline: none` and replaces it with an 80%-transparent `box-shadow`: dead code today (every input on the site is a `bfFormField`, whose `@layer components` rule wins) but a live trap for the next non-`bfFormField` input. **Moved here from pass-1 #104 — it is a focus-*appearance* decision (D32).** Resolves V4, V5 | fix | 111, 112 | `public/css/base/focus.css:76-81`, `public/css/base/forms.css:34-40`, the six bf atoms that restate the ring | pass-1 #104 (the CSS half only; the semantics half stays there) | every focus ring ≥3:1 against its adjacent ground on every route, measured after a **real `Tab` keypress** (D34 — `.focus()` gives a false negative); a planted non-`bfFormField` `<input>` shows the real ring, not the transparent one; DoD-V2 |
| 116 | `target-size` | Measure WCAG 2.5.8 for the first time and fix what fails. **Not measured in the audit, deliberately** — paddings and the type scale were both placeholder, so any number taken then was invalidated by #111. Chips are the known risk: 9.48px text before #111. Resolves V6 | fix | 111, 113 | brief §0.1; `components/bf/Chip.vue`, `components/bf/Button.vue`, nav and footer links | — | every interactive target ≥24×24 CSS px or meeting the 2.5.8 spacing exception, at 1280×800 and 375×812; the measured table is committed in the spec; DoD-V5 |
| 117 | `text-spacing` | Verify WCAG 1.4.12 for the first time and fix what clips. Same reason as #116 for not having been measured. Method: apply 1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing, 2× paragraph spacing, then check every route for clipped, overlapped or unreachable content. Resolves V9 | fix | 111 | brief §0.1; `public/css/base/typography.css`, every component with a fixed height or `overflow: hidden` | — | no clipping, overlap or lost content on the ten routes under the four overrides, at both viewports; screenshots committed in the spec; DoD-V6 |
| **Phase 22 — Gate** |
| 118 | `visual-gate` | Extend `scripts/check-routes.ts` with the assertions this pass makes checkable, using the same canvas round-trip the audit used (D33): computed text contrast per route, non-text contrast for focus rings and control borders, minimum computed font size against #111's floor token, zero UA-default link colours, and target-size measurement. Runs the full pass-1 assertion set unchanged, so a skin change cannot silently cost a structural fix (D38, DoD-V8) | tooling | 111, 112, 113, 114, 115, 116, 117 | `scripts/check-routes.ts` (1129 lines, extended by pass-1 #110); the audit's measurement functions | — | script fails on a planted defect of each kind and passes on the pass-2 branch; every pass-1 assertion (DoD-A1…A9) still green; DoD-V1…V5, V8 |

---

## Not in this pass

- **Markup, semantics, ARIA, accessible names, focus management, alt text, the data contract.**
  Pass 1, issues 92–110. Four of those rows edit CSS and belong there anyway, because nothing
  visible changes — pass-1 D32 lists them.
- **Information architecture, page layout, palette values.** Settled (D36). This pass re-pairs hues
  and grounds; it does not pick new ones.
- **Image `width`/`height` and above-the-fold `loading="lazy"`.** site#70 owns it (brief §0 V8).
  Listed there so this pass knows the layout shifts under it until #70 lands; not duplicated here.
- **Motion design.** If this pass adds any, it inherits the `prefers-reduced-motion` floor pass-1
  #93 lands, and DoD-V7 checks it. Designing new motion is not in scope.
- **Branding.** BF-217 D5 stands. A type scale and a link token are not a rebrand.
- **AAA contrast (1.4.6) and AAA text presentation (1.4.8).** Reach for them if the scale allows;
  not a gate.

## Open design inputs this pass waits on (mirrors `docs/questions-design.md`)

| Input | Unblocks |
|---|---|
| The type scale, faces and weights — everything in the repo today is placeholder | #111, and transitively every other row |
| The link treatment: colour, underline, hover, visited | #112 |
| The ≤375px nav treatment: keep the three-row wrap, or introduce a `<details>`-based disclosure | #113 |
