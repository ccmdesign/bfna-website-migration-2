# Accessibility constraints for the design phase

**This is not an epic. It is the measured baseline and the gates the visual work must hold.**

The visual pass is owned by Plane epic **BF-220 — "Design phase wave 1: programme colour, hero/scrim, article flagship"** (GitHub issues #249-#254), which runs under the ds-epic brief. This document was originally written as a second epic with its own issue index; that index has been retired to avoid two epics changing the same properties. What survives is the part BF-220 does not have: **nine measured findings, the method that produced them, and the accessibility floor its issues must not fall through.**

Pass 1 — the structural and semantic work — is [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md), issues #217-#235. The rule that divided the two passes is pass-1 D32: by visual effect, not by file extension.

**If you are implementing a BF-220 issue, the two sections you need are §2 (the gates) and §4 (D33-D34, how to measure without getting a wrong number).**

## 0. The nine measured findings

Same audit as pass 1, same routes (§0.1 there), same day. Every ratio below was computed —
`getComputedStyle` → canvas `fillStyle` round-trip to resolve `oklch`/`color()`/`color-mix()` to
sRGB → WCAG relative luminance. Every size and weight was read from `getComputedStyle` at 1280×800.
Nothing here is a ratio anyone eyeballed.

**These are not deferred pass-1 findings.** They are the finished measurement of the current state,
which is the baseline the design phase works against and the "before" column every pass-2 issue
re-measures against.

| # | Finding | Measured evidence | BF-220 issue |
|---|---|---|---|
| V1 | **Weight 100 is a legibility decision, not a contrast failure.** The premise carried into this review does not hold as a WCAG ratio failure: font weight does not enter the 1.4.3 calculation, and **every measured pair on `/` passes AA**. The thin stroke is still a real legibility question — it is just this pass's question, not 1.4.3's | Lowest pair on `/`: **5.14:1** — `#306491` on the notice ground `rgb(227,234,237)`. Then **6.25:1** ×3 (`#306491` on white; white on the `#306491` button; white on the `#306491` skip link). Then **9.4:1** (`#0000EE` on white). Then **20.03:1** (`#080808` on white). Body copy, nav links, chips, `<time>` and card links all compute `font-weight: 100` | #254 |
| V2 | **The type scale is placeholder and inverts at small sizes.** Headings are barely larger than body; chip text is under 10px | `/` at 1280px: `h1.bf-hero__heading` 19.22px/600, `h2.bf-section__heading` 15.19px/500, `h3` 13.50px/500, `p.bf-hero__description` 12px/100, `time.bf-time` 12px/100, **`span.bf-chip` 9.48px/100** | #254 |
| V3 | **Three link colours on one page, one of them the browser default.** Any plain `<a>` outside a bf atom falls to the UA colour; the palette never claims it | `/`: card and grid links `rgb(0, 0, 238)` (UA default); `a.bf-nav__link` `rgb(8, 8, 8)`; `a.bf-button` and brand links `rgb(48, 100, 145)` | #251 / #252 |
| V4 | **The focus ring passes today and is a constraint on every ground the skin introduces.** It is painted with `--color-text` on the *page* ground rather than `currentcolor` on the element, by deliberate choice — a light element would otherwise paint a light ring on a light page | `2px solid rgb(8,8,8)`, `outline-offset: 2px`, **20.03:1** against `rgb(255,255,255)`. Measured on a keyboard-focused `input[name=email]` and on `a.bf-skip-link`. Rationale at `public/css/base/focus.css:41-55`. WCAG 1.4.11 needs ≥3:1 against whatever ground replaces white | #250 |
| V5 | **`forms.css`'s alternate focus ring is 80% transparent.** Dead code on every bf route today — every input on the site is a `bfFormField`, whose `@layer components` rule wins — but it is the shape a designer might reach for, and it is a live trap for the next non-`bfFormField` input | `public/css/base/forms.css:34-40`: `outline: none` replaced by `box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent)` | #250 |
| V6 | **Target sizes (WCAG 2.5.8, 24×24 CSS px) were not measured** — deliberately. Paddings and the type scale are both placeholder, so a number taken now is discarded by the first design decision. Chips at 9.48px text are the obvious risk to re-check | — (see §0.1) | — (unowned) |
| V7 | **The nav wraps to three rows at 375px with no toggle.** Structurally this is sound — nothing is hidden from assistive technology, nothing overflows — which is exactly why it is a design problem and not a pass-1 one | 375×812: `document.documentElement.scrollWidth === innerWidth === 375`; all 8 top-level items pass `checkVisibility()`; `header button` count 0; `.hide-on-mobile` count 0 | — (unowned) |
| V8 | **No image declares intrinsic dimensions, and the lead image is lazy.** CLS and LCP; **owned by site-epic #70**, listed here so this pass knows the layout shifts under it until #70 lands | `/` 9/9 and `/about` 15/15 images carry neither `width` nor `height`. `components/bf/Media.vue:189,198` sets `loading="lazy"` unconditionally, including above the fold | — (site#70) |
| V9 | **Text spacing (WCAG 1.4.12) was not verified** — same reason as V6. Re-run against the chosen scale: 1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing, 2× paragraph spacing, checking for clipping and overlap | — (see §0.1) | — (unowned) |

### 0.1 Why two findings have no measurement

V6 and V9 are the two WCAG criteria whose result is a pure function of the type scale and the
paddings. Both are placeholder. Measuring them now produces a number that the first design decision
invalidates, and a recorded number that is wrong is worse than a stated gap — so they are recorded
as gaps with the exact method to run once the scale is set — §2 DoD-V5 and DoD-V6 carry it. This is the same
reasoning pass-1 §0.2 gives for the checks that needed a screen reader.

### 0.2 Three findings no BF-220 issue currently owns

V6 (target size), V7 (mobile nav) and V9 (text spacing) map to none of #249-#254. They are unowned,
not dropped — each needs a home before the design phase closes, and each is only measurable once the
type scale in #254 has landed. §8 carries them as tasks.

## 1. Objective

BF-220 is free to change the type scale, the faces, the link colour and the hero treatment — none of
those values is preserved here, and §0 is a "before" measurement, not a target. What this document
fixes is the narrow set that is accessibility-load-bearing regardless of taste: contrast ≥4.5:1,
focus ring ≥3:1 against its own ground, targets ≥24px, 1.4.12 spacing without clipping, and no
regression of a pass-1 structural fix.

One correction BF-220's brief does not carry: **weight 100 is not a contrast failure** (§0 V1).
Every pair measured on `/` passes AA. If #254 changes the body weight, that is a legibility
decision, and it should be made on legibility grounds rather than on a contrast argument that does
not hold.

## 2. The gates BF-220 must hold

These were written as an epic's definition of done. They are now the accessibility floor for the visual work: whatever type scale, palette pairing and hero treatment BF-220 lands, these have to be true of the result. #250's `check-contrast.ts` is the natural home for V1-V3.

| # | Gate | Check |
|---|---|---|
| DoD-V1 | Contrast | Every text/background pair on the ten routes in pass-1 §0.1 computes ≥4.5:1 (≥3:1 for text ≥24px, or ≥18.66px bold); measured with the §0 method, asserted by `check-contrast.ts` (BF-220 #250) |
| DoD-V2 | Non-text contrast | Every focus ring, form-control border and meaningful icon computes ≥3:1 against its own adjacent ground — not against the element's fill (WCAG 1.4.11) |
| DoD-V3 | One link treatment | Zero computed link colours outside the token set; in particular zero occurrences of the UA default `rgb(0,0,238)` in `.output/public` |
| DoD-V4 | Minimum size | No rendered text computes below the floor the type scale sets, and that floor is a named token, not a literal |
| DoD-V5 | Target size | Every interactive target measures ≥24×24 CSS px, or meets the 2.5.8 spacing exception; measured at 1280×800 and 375×812 |
| DoD-V6 | Text spacing | With 1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing and 2× paragraph spacing applied, no content is clipped, overlapped or made unreachable on any of the ten routes |
| DoD-V7 | Motion | Whatever motion this pass introduces is inside the `prefers-reduced-motion` floor pass-1 #93 lands; emulating the query produces no transition, animation or view transition anywhere |
| DoD-V8 | Pass 1 holds | `npx tsx scripts/check-routes.ts` still passes every pass-1 assertion. A skin change may not reintroduce a structural defect — raising a heading's size is a visual change, changing which element it is is a pass-1 regression |

## 3. Where the work happens

BF-220, in `ccmdesign/bfna-website-migration-2`, base `dev`, under `docs/plans/bf220-design-phase-wave-1-plan.md`. Nothing in this document is dispatched on its own.

## 4. How to measure (D33–D38)

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

## 8. Tasks this leaves open

| Task | Owner | When |
|---|---|---|
| Decide the type scale, the faces and the weights — everything in the repo is placeholder (h1 19.22px, chips 9.48px, body weight 100). Note V1: the weight call is a legibility one, not a contrast one | Aline + Claudio | inside BF-220 #254 |
| Decide the link treatment — colour, underline, hover, visited. Three exist today, one of them the browser default (V3) | Aline | inside BF-220 #251/#252 |
| **Find a home for V6 (target size), V7 (mobile nav) and V9 (text spacing)** — no BF-220 issue covers them, and all three are only measurable once #254's scale lands | Claudio | before the design phase closes |
| Manual low-vision review — 200% zoom, 400% reflow, Windows High Contrast | Aline | after BF-220's last issue merges |
| Sign-off that the skin meets AA on the deploy preview | Aline + Claudio | before the skin ships |

## 9. How to verify the gates

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

Plus the manual passes in §8, which are the sign-off, not the gate.

## 10. Status

Folded into BF-220 on 2026-09-04. The issue index that used to live at `docs/a11y-visual-pass/issues.md` (rows 111-118) has been deleted; §0's findings table maps each finding to the BF-220 issue that now owns it, and names the three that no issue currently covers — V7 (mobile nav), V6 (target size) and V9 (text spacing). Those three are unowned, not dropped: they need a home before the design phase closes.
