# EPIC — Accessibility pass 2: visual

**One review, two passes.** This is pass 2 — everything a sighted user can see, and everything that
needs a design decision before it can be written. Pass 1 is
[`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) and owns markup, semantics, data and behaviour.
The rule that divides them is pass-1 D32: **by visual effect, not by file extension.**

Input for lfg-ccm (BRIEF mode). Follows [`docs/site-epic/BRIEF.md`](../site-epic/BRIEF.md) and
inherits its ground rules (§5 there) unless a line below overrides one. Issue source:
[`docs/a11y-visual-pass/issues.md`](./issues.md). Do not restate this brief in issue bodies; link it.

## 0. The nine measured findings

Same audit as pass 1, same routes (§0.1 there), same day. Every ratio below was computed —
`getComputedStyle` → canvas `fillStyle` round-trip to resolve `oklch`/`color()`/`color-mix()` to
sRGB → WCAG relative luminance. Every size and weight was read from `getComputedStyle` at 1280×800.
Nothing here is a ratio anyone eyeballed.

**These are not deferred pass-1 findings.** They are the finished measurement of the current state,
which is the baseline the design phase works against and the "before" column every pass-2 issue
re-measures against.

| # | Finding | Measured evidence | Issue |
|---|---|---|---|
| V1 | **Weight 100 is a legibility decision, not a contrast failure.** The premise carried into this review does not hold as a WCAG ratio failure: font weight does not enter the 1.4.3 calculation, and **every measured pair on `/` passes AA**. The thin stroke is still a real legibility question — it is just this pass's question, not 1.4.3's | Lowest pair on `/`: **5.14:1** — `#306491` on the notice ground `rgb(227,234,237)`. Then **6.25:1** ×3 (`#306491` on white; white on the `#306491` button; white on the `#306491` skip link). Then **9.4:1** (`#0000EE` on white). Then **20.03:1** (`#080808` on white). Body copy, nav links, chips, `<time>` and card links all compute `font-weight: 100` | 111 |
| V2 | **The type scale is placeholder and inverts at small sizes.** Headings are barely larger than body; chip text is under 10px | `/` at 1280px: `h1.bf-hero__heading` 19.22px/600, `h2.bf-section__heading` 15.19px/500, `h3` 13.50px/500, `p.bf-hero__description` 12px/100, `time.bf-time` 12px/100, **`span.bf-chip` 9.48px/100** | 111 |
| V3 | **Three link colours on one page, one of them the browser default.** Any plain `<a>` outside a bf atom falls to the UA colour; the palette never claims it | `/`: card and grid links `rgb(0, 0, 238)` (UA default); `a.bf-nav__link` `rgb(8, 8, 8)`; `a.bf-button` and brand links `rgb(48, 100, 145)` | 112 |
| V4 | **The focus ring passes today and is a constraint on every ground the skin introduces.** It is painted with `--color-text` on the *page* ground rather than `currentcolor` on the element, by deliberate choice — a light element would otherwise paint a light ring on a light page | `2px solid rgb(8,8,8)`, `outline-offset: 2px`, **20.03:1** against `rgb(255,255,255)`. Measured on a keyboard-focused `input[name=email]` and on `a.bf-skip-link`. Rationale at `public/css/base/focus.css:41-55`. WCAG 1.4.11 needs ≥3:1 against whatever ground replaces white | 115 |
| V5 | **`forms.css`'s alternate focus ring is 80% transparent.** Dead code on every bf route today — every input on the site is a `bfFormField`, whose `@layer components` rule wins — but it is the shape a designer might reach for, and it is a live trap for the next non-`bfFormField` input | `public/css/base/forms.css:34-40`: `outline: none` replaced by `box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)` | 115 |
| V6 | **Target sizes (WCAG 2.5.8, 24×24 CSS px) were not measured** — deliberately. Paddings and the type scale are both placeholder, so a number taken now is discarded by the first design decision. Chips at 9.48px text are the obvious risk to re-check | — (see §0.1) | 116 |
| V7 | **The nav wraps to three rows at 375px with no toggle.** Structurally this is sound — nothing is hidden from assistive technology, nothing overflows — which is exactly why it is a design problem and not a pass-1 one | 375×812: `document.documentElement.scrollWidth === innerWidth === 375`; all 8 top-level items pass `checkVisibility()`; `header button` count 0; `.hide-on-mobile` count 0 | 113 |
| V8 | **No image declares intrinsic dimensions, and the lead image is lazy.** CLS and LCP; **owned by site-epic #70**, listed here so this pass knows the layout shifts under it until #70 lands | `/` 9/9 and `/about` 15/15 images carry neither `width` nor `height`. `components/bf/Media.vue:189,198` sets `loading="lazy"` unconditionally, including above the fold | — (site#70) |
| V9 | **Text spacing (WCAG 1.4.12) was not verified** — same reason as V6. Re-run against the chosen scale: 1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing, 2× paragraph spacing, checking for clipping and overlap | — (see §0.1) | 117 |

### 0.1 Why two findings have no measurement

V6 and V9 are the two WCAG criteria whose result is a pure function of the type scale and the
paddings. Both are placeholder. Measuring them now produces a number that the first design decision
invalidates, and a recorded number that is wrong is worse than a stated gap — so they are recorded
as gaps with the exact method to run once the scale is set (issues 116 and 117). This is the same
reasoning pass-1 §0.2 gives for the checks that needed a screen reader.

### 0.2 What this pass cannot do yet

Six of the eight issues are blocked on decisions nobody has made. A type scale, a link colour and a
mobile-nav treatment are Aline's and Claudio's calls, not a runner's. The issue rows are written so
that the **verification** half is runnable the moment the decision lands, and so the decision itself
is a named Plane task (§8) rather than an implicit blocker. Nothing in phase 21 can start before
phase 20 merges.

## 1. Objective

Make the visual layer meet WCAG 2.1 AA on whatever the design phase decides, and prove it with the
same measurement method that produced §0. This pass does not preserve the current values — the type
scale, the faces and the link colour are all expected to change. It fixes the values that are
accessibility-load-bearing regardless of taste (contrast ≥4.5:1, focus ring ≥3:1, targets ≥24px,
1.4.12 spacing without clipping) and hands the rest to the designer as a constraint they must hold.

The information architecture, page layout and palette *values* are settled and stay settled; this
pass may not move them.

## 2. Definition of done (EPIC)

| # | Gate | Check |
|---|---|---|
| DoD-V1 | Contrast | Every text/background pair on the ten routes in pass-1 §0.1 computes ≥4.5:1 (≥3:1 for text ≥24px, or ≥18.66px bold); measured with the §0 method, asserted by `check-routes.ts` (#118) |
| DoD-V2 | Non-text contrast | Every focus ring, form-control border and meaningful icon computes ≥3:1 against its own adjacent ground — not against the element's fill (WCAG 1.4.11) |
| DoD-V3 | One link treatment | Zero computed link colours outside the token set; in particular zero occurrences of the UA default `rgb(0,0,238)` in `.output/public` |
| DoD-V4 | Minimum size | No rendered text computes below the floor the type scale sets, and that floor is a named token, not a literal |
| DoD-V5 | Target size | Every interactive target measures ≥24×24 CSS px, or meets the 2.5.8 spacing exception; measured at 1280×800 and 375×812 |
| DoD-V6 | Text spacing | With 1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing and 2× paragraph spacing applied, no content is clipped, overlapped or made unreachable on any of the ten routes |
| DoD-V7 | Motion | Whatever motion this pass introduces is inside the `prefers-reduced-motion` floor pass-1 #93 lands; emulating the query produces no transition, animation or view transition anywhere |
| DoD-V8 | Pass 1 holds | `npx tsx scripts/check-routes.ts` still passes every pass-1 assertion (DoD-A1…A9). A skin change may not reintroduce a structural defect |

## 3. Repo and run configuration

Unchanged from pass-1 §3: repo `ccmdesign/bfna-website-migration-2`, app root `bfna-website-nuxt/`,
`BASE_BRANCH=dev`, `MERGE_POLICY=auto`, sequential isolated runs, specs at
`docs/a11y-visual-pass/issues/<NN>-<slug>.md`. **Numbering continues from pass 1 (last row 110); the
first issue here is 111.**

Dev server: `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`. Gates per issue: `npm run typecheck`,
`npx nuxt generate` exit 0 (**never** `npm run generate`), `npx tsx scripts/check-routes.ts`,
`npx tsx scripts/check-links.ts`.

## 4. Decisions of record (D33–D38)

| ID | Rule |
|---|---|
| D33 | **Measure, never estimate.** The method in §0 is the method. A naive regex over a computed colour string returns nonsense for the `color(srgb …)` and `color-mix()` values this stack emits — it did on the first pass of this audit, reporting 3.34:1 for a pair that is actually 5.14:1. Resolve through a canvas round-trip or do not report a number. |
| D34 | **Programmatic `.focus()` is not a focus-visibility test.** Chrome's `:focus-visible` heuristic keys on the last interaction modality, so `el.focus()` after a click reports no ring on elements that have one. Every focus measurement uses a real `Tab` keypress, or a keypress immediately preceding the call. |
| D35 | **Tokens, never literals.** Every value this pass changes lands as a token in the existing `--_bf-*` / `--color-*` scheme. A literal in a component's `<style>` block is a defect regardless of whether the value is correct, because the next contrast re-run has to find it. Inherits BF-217 §5 and site-epic DoD-6's "no new colour" in spirit: new *values* are expected here, new *ad-hoc* values are not. |
| D36 | **Palette values are settled; their pairings are not.** The new hues are deliberate (restructure scope) and this pass does not change them. What it may change is which hue sits on which ground, and what weight and size the text is at — which is where every one of the AA failures, if any appear, will actually be fixed. |
| D37 | **The design phase decides; this pass verifies and applies.** Phase 20 rows carry the decision as an input, not as an assumption. A runner that reaches a phase-20 row without the decision in `docs/questions-design.md` stops and says so rather than choosing a scale itself. |
| D38 | **A skin change may not cost a structural fix.** DoD-V8 is not a formality: raising a heading's size is a pass-2 change, changing which element it is is a pass-1 regression. Every pass-2 PR runs the full pass-1 gate. |

## 5. Ground rules

site-epic §5 and BF-217 §5 apply in full. Additions:

- **Every finding cites evidence** — a route, a selector, a `file:line`, or a measured value —
  and **never assert a ratio you did not compute** (D33). Both inherited verbatim from pass-1 §5;
  they matter more here, where every issue's output *is* a number.
- **Both viewports, both themes.** Every measurement is taken at 1280×800 and 375×812. If a dark
  mode exists by then, both.
- **Re-measure, do not re-reason.** An issue closes on a fresh measurement, not on an argument that
  the change should have worked.
- **Every issue adds at least one assertion to `check-routes.ts`.** Gates only grow (pass-1 §5).

## 6. Structural findings — owned by pass 1

The same audit produced 24 structural and semantic findings. They are pass-1 §0 and issues 92–110,
and are not restated here. Two are worth knowing while reading §0, because they bound what this
pass can assume:

- The focus system, the skip link, the landmark set and `bfFormField`'s label/error plumbing are
  **already correct** and measured so. This pass inherits a working baseline, not a broken one.
- The production bfna.org pattern of removing outlines with no replacement was **not** inherited —
  see V4. Do not "fix" a problem that is not there.

## 7. Not in this pass

- **Markup, semantics, ARIA, focus management, alt text, data contract.** Pass 1, issues 92–110.
- **Information architecture, page layout, palette values.** Settled (D36).
- **Image dimensions and lazy-loading.** site-epic #70 owns V8; this pass consumes the fix.
- **Branding.** BF-217 D5 and site-epic's "Not in this epic" both stand. A type scale and a link
  token are not a rebrand.
- **`/wireframes/**`.** Frozen (BF-217 D2), byte-guarded (site-epic DoD-4), and audited for
  structure only. This pass never touches them.
- **WCAG AAA contrast (1.4.6) and AAA text presentation (1.4.8).** Worth reaching for if the scale
  allows; not a gate.

## 8. Human / Plane tasks (NOT issues)

| Task | Owner | When |
|---|---|---|
| Decide the type scale, the faces and the weights. Everything currently in the repo is placeholder and arbitrary — h1 19.22px, chips 9.48px, body weight 100. Record it in `docs/questions-design.md` (D37) | Aline + Claudio | before #111 |
| Decide the link treatment — colour, underline, hover and visited — so #112 has something to apply. Today there are three treatments, one of them the browser default | Aline | before #112 |
| Decide the mobile nav treatment at ≤375px: keep the three-row wrap, or introduce a disclosure. If a disclosure, pass 1's `<details>`-based pattern is the one to reuse | Aline + Claudio | before #113 |
| Manual low-vision review — 200% zoom, 400% reflow, Windows High Contrast — after #117 | Aline | after #117 |
| Sign-off that the skin meets AA before it ships, on the deploy preview | Aline + Claudio | after #118 |

## 9. Epic-closing verification

```bash
cd bfna-website-nuxt
npm install
npm run typecheck
npx nuxt generate                                  # NEVER `npm run generate` — needs Directus secrets
npx tsx scripts/check-routes.ts                    # DoD-V1…V5, V8 (pass-1 assertions included)
npx tsx scripts/check-links.ts
# DoD-V6, by hand on the deploy preview: apply the 1.4.12 spacing overrides via devtools
# on each of the ten routes, screenshot, check for clipping and overlap.
# DoD-V7, by hand: emulate prefers-reduced-motion: reduce, exercise every interaction
# this pass added motion to, confirm none of it runs.
```

Plus the two manual passes in §8, which are the sign-off, not the gate.

## 10. Issue source

[`docs/a11y-visual-pass/issues.md`](./issues.md) — 8 issues in three phases, numbered 111–118,
continuing from pass 1's last row (110). Row order is execution order. Phase 20 carries the three
design decisions and must merge before phase 21 measures anything against them.
