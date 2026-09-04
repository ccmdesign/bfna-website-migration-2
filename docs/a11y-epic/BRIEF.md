# EPIC — Accessibility pass 1: code level

**One review, two passes.** This is pass 1 — everything that is markup, semantics, data or
behaviour. Pass 2 is [`docs/a11y-visual-pass/BRIEF.md`](../a11y-visual-pass/BRIEF.md) and owns
everything that is a visual decision. The rule that divides them is D32; the audit behind both is
the same one, run once, on the routes in §0.1.

Input for lfg-ccm (BRIEF mode). Follows [`docs/site-epic/BRIEF.md`](../site-epic/BRIEF.md) and
inherits its ground rules verbatim (§5 there, which in turn inherits BF-217 §5) unless a line below
overrides one. Issue source: [`docs/a11y-epic/issues.md`](./issues.md). Do not restate this brief in
issue bodies; link it.

## 0. Where accessibility stands (2026-09-04, `dev` @ `39b8327`, BF-217 complete)

Audited live against `nuxt dev` on the ten routes in §0.1, plus a full read of
`src/components/bf/**` (37 files), `src/layouts/bf-default.vue`, `src/error.vue`, the nine bf page
templates and `public/css/**`. Every number below was measured in the rendered page or read at a
cited line — nothing here is inferred from the production site.

**The shared chrome is already correct.** This epic is not "make the site accessible from zero"; the
BF-217 work shipped a real focus system, a working skip link, labelled landmarks, native disclosure
navigation and a form-field component with correct label/error plumbing. What is missing is a small
number of systemic gaps in the layer above it — the page templates, the content contract, and four
CSS floors — plus the pieces of the component library where a correct pattern was applied in some
places and not others.

| Area | State |
|---|---|
| Skip link | **Correct end to end.** `bfSkipLink` → `#main`; `main` carries `tabindex="-1"` (`bf-default.vue:331`). Measured: 2nd Tab reveals it at `(0,0,138×40)`, `:focus-visible` true, activation lands `document.activeElement === MAIN#main` |
| Focus indicator | **Correct.** `public/css/base/focus.css:76-81` is a `@layer defaults` floor; six bf atoms restate it in `@layer components`. Measured on a keyboard-focused `input[name=email]` and on `a.bf-skip-link`: `outline: 2px solid rgb(8,8,8)`, offset `2px` — **20.03:1** against the white ground. The production bfna.org pattern (outlines removed, no replacement) is **not** inherited |
| Landmarks | `header` / `nav "Main"` / `main#main` / `footer` + six labelled `nav "Footer — …"` on all ten routes. One `<main>` per route. No `role="search"` anywhere |
| `lang` | `en` on all ten routes — but set per-layout (`bf-default.vue:218`, `wireframe.vue:43`), not in `nuxt.config.ts` `app.head` (lines 147-157 carry no `htmlAttrs`) |
| Headings | One `<h1>` on all ten routes. **Two live skips:** `/insights` `1 → 3 ("The Nuclear Option")`, `/search?q=democracy` `1 → 3 ("Alexa, Is Democracy Dead?")` |
| Section naming | 12 unnamed `<section>` elements across the ten routes (`/insights` 3, `/insights/:slug` 3, `/search` 2, one each on `/`, `/projects`, `/projects/:slug`, `/democracy`, `/archive`) |
| Image alt | **No content image on the site carries alternative text.** `grep -rl '"alt"' content/bf` → **0 of 433 documents**; `image` is a bare URL string. `Media.vue:184,193` coerces `:alt="alt ?? ''"`. Measured: `/` 9/9 `alt=""`, `/about` 14/15 `alt=""` |
| Lead images | `insights/[slug].vue:248` and `projects/[slug].vue:288` pass `:alt="heading"`. Measured on `/insights/12-days-of-christmas-in-europe` (a `format: infographic` row): `alt` is character-identical to the `<h1>` |
| Lists | `reset.css:35-40` strips `list-style` from every `ul[class]`/`ol[class]`. `role="list"` is applied in 4 places with a written rationale and **missing in 6**. Measured `/search`: `<ol class="bf-search-shell__results">`, `list-style-type: none`, `role: null`, 20 children |
| Live regions | `bfLoadMore` `role="status"` is correct and **does** update on facet change (measured: "Showing 24 of 98 items" → "Showing 10 of 10 items"). `/search`'s count region is `role="status"` but `display: none` while idle. `bfEmptyState` has no role at all |
| Keyboard | No `tabindex > 0`, no `<div @click>`, no `<a>` without `href`, no button used to navigate. Nav is native `<details>/<summary>`; closed panels measured `checkVisibility() === false` and out of tab order. **One live focus loss:** the 4th "Load more" click on `/insights` unmounts the button and drops focus to `<body>` |
| Dead controls | 5 `href="#…"` links in the chrome on every route; 2 `<button type="button">` with no handler on `/projects/100-questions` ("Open 100 Questions", "Subscribe for updates") |
| Reduced motion | `reset.css:11-13` `@view-transition { navigation: auto }` and `:8` `transition-behavior: allow-discrete` on `*`, both unguarded. Repo-wide `prefers-reduced-motion` grep: **2 hits** (`ds/molecules/ccmTabs.vue:626`, `bf/Accordion.vue:238`), none in `public/css/**` |
| Contact form | Semantics half-right: real `<form>`, `<fieldset>/<legend>`, three `label[for]`, `autocomplete="name"`/`"email"`. Measured: `required: false` and `aria-required: null` on all three fields, `aria-describedby: null`, `aria-invalid: null`, no `novalidate`, no status region. `bfFormField` already supports all of it (`FormField.vue:124-150,246-259`) and the call site uses none of it |
| 404 | Correct title ("Page not found"), correct single `<h1>`, full chrome, `lang`, skip link. No `role="alert"`/`role="status"` on the empty state |
| Detail 404s | `/insights/no-such-slug` → title "Insight \| …", `<h1>` "Insight not found". `/projects/no-such-project` → title "Project \| …", `<h1>` "Unknown project" |
| Contrast | **Every measured foreground/background pair on `/` passes AA.** Lowest is **5.14:1**; full table and the reason the weight-100 premise does not hold as a ratio failure are pass-2 brief §0 V1 |
| `/wireframes/**` | Structurally sound: `lang="en"`, skip link, `main#wf-main`, labelled navs, no heading skips, `robots: noindex`. Three `href="#"` placeholders. Frozen by BF-217 D2 — **not touched by this epic** |

### 0.1 Routes audited

`/`, `/about`, `/insights`, `/insights/the-nuclear-option`, `/insights/12-days-of-christmas-in-europe`,
`/projects`, `/projects/100-questions`, `/democracy`, `/search` (idle and `?q=democracy`), `/archive`,
`/this-page-does-not-exist` (404), `/insights/no-such-insight-slug`, `/projects/no-such-project`,
`/wireframes/`. Desktop 1280×800 and mobile 375×812.

### 0.2 Checks this audit could not run

Stated rather than guessed, per §5:

- **Screen-reader announcement.** No AT is available in this environment. Findings that depend on
  what VoiceOver/NVDA/JAWS actually say — the `::after` external marker (#96), the Safari list-role
  behaviour (#95) — are reported as *the CSS condition plus the repo's own contrary precedent*, not
  as a confirmed announcement. Issue #110 makes them machine-checkable; a manual AT pass is a Plane
  task (§8), not an issue.
- **Safari / WebKit.** The audit ran in one Chromium engine. The `list-style: none` list-role bug is
  a WebKit behaviour; `Breadcrumb.vue:238-240` and `nav/Dropdown.vue:109` already document it in this
  repo, which is the evidence used.
- **WCAG 2.5.8 target size and 1.4.12 text spacing.** Deliberately not measured — both are functions
  of the placeholder type scale and paddings, so any number taken now is discarded by the design
  phase. Recorded with their exact method as pass-2 brief §0 V6 and V9, and run there as issues 116
  and 117.

## 1. Objective

Fix the structural and semantic accessibility defects that a visual redesign cannot fix and cannot
introduce: heading outline, landmark naming, list semantics, accessible names, image alternative
text, focus management, live-region announcements, reduced-motion handling and dead controls. Every
change in this pass is invisible to a sighted user and survives any decision the design phase makes
about type, colour, border, shadow or radius.

Contrast, type scale, link colour, target size and text spacing are **pass 2** (D32). They are not
deferred findings — they are measured, and the measurements are the starting evidence in
[`docs/a11y-visual-pass/BRIEF.md`](../a11y-visual-pass/BRIEF.md) §0. Nothing was dropped in the
split.

## 2. Definition of done (EPIC)

| # | Gate | Check |
|---|---|---|
| DoD-A1 | No heading skips | Every public route's heading levels increase by at most one; asserted by `scripts/check-routes.ts` (#110) |
| DoD-A2 | Every band is named | Zero `<section>` inside `<main>` without `aria-label` or `aria-labelledby`; asserted by `check-routes.ts` |
| DoD-A3 | Every image states a decision | Zero `<img>` without an `alt` attribute; zero `alt` string character-identical to the route's `<h1>`; `MediaProps.alt` is required (not optional) so a missing one is a typecheck error, not a silent `""` |
| DoD-A4 | Lists are lists | Every `ul`/`ol` whose computed `list-style-type` is `none` carries `role="list"`; asserted by `check-routes.ts` |
| DoD-A5 | No dead controls | Zero `href="#"` or `href="#<placeholder>"`, zero `<button>` with neither a handler nor a `type="submit"` inside a form, in `.output/public`; `npx tsx scripts/check-links.ts` green |
| DoD-A6 | Focus is never dropped | Scripted keyboard walk of "Load more" to exhaustion, facet toggling to zero results, and in-page CTA activation leaves `document.activeElement !== document.body` on every route that offers them |
| DoD-A7 | State changes are announced | A `role="status"` region is mounted and non-`display:none` in the idle state on `/insights` and `/search`, and its text changes on filter, load-more and zero-result transitions |
| DoD-A8 | Motion is optional | `@media (prefers-reduced-motion: reduce)` disables `@view-transition` and caps every transition/animation in `public/css/**`; emulating the media query produces no view transition on navigation |
| DoD-A9 | `lang` is a config default | `nuxt.config.ts` `app.head.htmlAttrs.lang` is set; every prerendered route has a non-empty `lang`, including any that render neither bf layout |
| DoD-A10 | No new colour, no new type | As BF-217 DoD-6, widened: this epic changes no colour value, no `font-size`, no `font-weight`, no `font-family`, no `letter-spacing` and no `line-height`. `git diff` on the epic branch contains none of those properties |

## 3. Repo and run configuration

Unchanged from site-epic §3: repo `ccmdesign/bfna-website-migration-2`, app root `bfna-website-nuxt/`,
`BASE_BRANCH=dev`, `MERGE_POLICY=auto`, worktrees at `$WORKTREE_ROOT/gh<N>`, sequential isolated runs,
issue order = dependency order. Specs at `docs/a11y-epic/issues/<NN>-<slug>.md`.
**Numbering continues from site-epic (last row 91); the first issue here is 92.**

Dev server: `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`. The env var is load-bearing — without it
`@nuxt/image`'s ipx provider breaks Directus-hosted images even in dev (D12).

Gates per issue: `npm run typecheck` (no new errors until site-epic #83, zero after),
`npx nuxt generate` exit 0 (**never** `npm run generate` — it runs the importer, which needs Directus
secrets), `npx tsx scripts/check-routes.ts`, `npx tsx scripts/check-links.ts`. Install with
`npm install` until site-epic #82 tracks the lockfile. Typecheck baseline at the branch point is
**73 errors**, all outside bf scope.

## 4. Decisions of record (D23–D32)

| ID | Rule |
|---|---|
| D23 | **Structural only.** An issue in this pass may not change a colour value, a font face, a font size, a font weight, a letter-spacing, a line-height, a border radius or a shadow. If a finding can only be fixed by changing one of those, it is not an issue here — it is a pass-2 row. Enforced by DoD-A10. |
| D24 | **Fix it once, in the component.** Where the same defect appears on three or more routes, the issue changes the shared component or the CSS floor, not the pages. The pages then consume the fix. This is why phase 16 lands before phase 17 and why no phase-17 row repeats a phase-16 change. |
| D25 | **The contract carries the decision, not the default.** `MediaProps.alt` becomes required. A missing alt is a typecheck failure; `alt=""` stays legal but must be written deliberately at the call site. The dev-only `console.warn` at `Media.vue:152-161` is deleted with the coercion it was compensating for — a warning that does not run in production is not a gate. |
| D26 | **`bfSection` is not changed; its call sites are.** `Section.vue:178-182` deliberately leaves a `label`-only band unnamed and says so. The defect is that five call sites read `label` as "this names the landmark" — including a comment at `about.vue:211` that asserts it outright and is wrong. #98 adds a dev-time warning; #105 fixes the call sites; the component's behaviour stands. |
| D27 | **Reuse the repo's own idiom.** Three fixes in this pass already exist correctly elsewhere in the codebase and are being applied inconsistently: `role="list"` (`Breadcrumb.vue:238-240`, `nav/Dropdown.vue:109`), `content: "x" / ""` (`Breadcrumb.vue:207`, `nav/Dropdown.vue:189`) and slotted-heading + `aria-labelledby` (`projects/index.vue:173,183`). Each issue cites the existing instance and copies it rather than inventing a variant. |
| D28 | **Alt text is content, not code.** #109 adds the field, the schema, the normaliser path and the importer path, and ships `null` for every row. The strings are Irene's. Until they arrive, `null` renders `alt=""` **only** where a call site has declared the image decorative; a content image with `alt: null` fails `check-routes.ts` on the routes it appears on. Tracked in `docs/questions-irene.md`. |
| D29 | **Announce with a region that is always mounted.** Every result-count and empty-state announcement in this epic uses a `role="status"` element that exists in the idle state with empty text. `display: none` on a live region removes it from the accessibility tree; `search.vue:454-457` already documents this trade-off as a known gap and #108 closes it. |
| D30 | **Native first for widgets.** The nav's `<details>/<summary>` is the model: no hand-rolled `aria-expanded`, no key handlers to get wrong. `bfFilterBar`'s roving tabindex is the one place a composite-widget pattern was adopted without the role that describes it; #103 either names it `role="toolbar"` or removes the roving tabindex. No new custom widget is built in this epic. |
| D31 | **This pass is the complement of site-epic #84, not a replacement.** #84 runs axe-core and catches what axe catches. #110 asserts the invariants axe cannot see: a band with no accessible name, an `alt` that duplicates the `<h1>`, focus dropped to `<body>`, a live region hidden while idle. Both gates run in CI; neither subsumes the other. |
| D32 | **The split is by visual effect, not by file extension.** A change belongs to pass 2 if a sighted user can see the difference, or if making it requires a design decision. It belongs to pass 1 otherwise — *including when it edits a `.css` file*. Four pass-1 rows touch CSS and change nothing anyone can see: #93 (a `prefers-reduced-motion` media query — no designer decides whether to honour it, and putting the floor in first means whatever motion pass 2 adds inherits it), #94 (a visually-hidden utility, which renders nothing by definition), #96 (`content: "↗" / ""` — the glyph paints identically; only the accessible name changes) and #108 (emptying a live region's *text* while idle instead of `display:none`-ing the element, which is already visually empty). Anything whose appearance actually changes — the `forms.css` focus ring included — is pass 2. |

## 5. Ground rules

site-epic §5 and BF-217 §5 apply in full (never touch `wf-*`, presentational-only, `--_bf-*`
variables, `@layer`, one component/template per issue, both gates before PR, specs in
`docs/a11y-epic/issues/`, WCAG 2.1 AA, real content, shared types in `bf-contracts.ts`). Additions:

- **Every finding cites evidence.** A route, a selector, a `file:line`, or a measured value. No issue
  body may assert a contrast ratio, a computed style or an announcement that was not measured. Where
  a check needs a tool the runner does not have (a screen reader, Safari), the spec says so in place
  of a result — see §0.2.
- **Never assert a ratio you did not compute.** The measurement method used for this brief:
  `getComputedStyle` → canvas `fillStyle` round-trip to resolve `oklch`/`color()`/`color-mix()` to
  sRGB → WCAG relative luminance. A naive regex over the computed colour string reports nonsense for
  the `color(srgb …)` values this stack emits, and did on the first pass of this audit.
- **Programmatic `.focus()` is not a focus-visibility test.** Chrome's `:focus-visible` heuristic
  keys on the last interaction modality, so `el.focus()` after a click reports no ring on elements
  that have one. Every focus-ring result in this brief came from a real `Tab` keypress or from a
  keypress immediately preceding the call. Issue specs must use the same method.
- **Every issue adds at least one assertion to `check-routes.ts`.** Gates only grow (site-epic §5).
  An issue whose fix cannot be asserted says why in its spec.
- **No new runtime dependency.** Nothing in this epic needs one. `axe-core` is pre-approved by
  site-epic §5 for #84 and is not used here.

## 6. Visual findings — handed to pass 2

The same audit produced nine visual and typographic findings, every one of them measured. They are
**not** listed here, because a finding recorded in two places drifts. They are §0 of
[`docs/a11y-visual-pass/BRIEF.md`](../a11y-visual-pass/BRIEF.md), where they are the baseline the
design phase works against, and issues 111–118 there.

Two of them are worth knowing before reading §0 above, because they correct assumptions that were
carried into this review:

- **Weight 100 is not a contrast failure.** Every foreground/background pair measured on `/` passes
  AA; the lowest is 5.14:1. Font weight does not enter the WCAG 1.4.3 calculation at all. The thin
  stroke is a real legibility question — it is just a pass-2 question, not a 1.4.3 one.
- **The focus ring is fine and stays fine only if pass 2 keeps it so.** It measures 20.03:1 against
  today's white ground. Any darker ground the skin introduces has to hold ≥3:1 (WCAG 1.4.11), which
  is pass-2 issue 115.

## 7. Not in this pass

- **Colour, type, spacing, radius, shadow, target size, motion design.** Pass 2 owns them; D23 and
  D32 are the fence; DoD-A10 is the gate that catches a violation.
- **`/wireframes/**`.** Frozen by BF-217 D2 and byte-guarded by site-epic DoD-4. Audited for structure
  only (§0) and found sound; its three `href="#"` placeholders stay.
- **`components/ds/**`.** Out of the bf stack and awaiting the site-epic #88 keep-or-delete call.
  `ccmFormField.vue:390` and `ccmTabs.vue:597` both write `outline: none`; neither ships on a bf route.
- **axe-core automation.** site-epic #84. D31 explains the split.
- **Search behaviour, form behaviour, image dimensions, SEO, redirects.** Owned by site-epic
  #70/#72/#90. This epic touches their semantics only, and says so in each row's spec.
- **WCAG AAA.** 2.3.3 (animation from interactions) is addressed by #93 because the fix is one media
  query, the risk is vestibular, and landing the floor first means whatever motion pass 2 introduces
  inherits it (D32). No other AAA criterion is in scope for either pass.

## 8. Human / Plane tasks (NOT issues)

| Task | Owner | When |
|---|---|---|
| Write alternative text for every content image — 433 documents, none currently carry any. Longest lead time in the epic; #109 ships the field and the pipeline without it | Irene | before #109 closes; tracked in `docs/questions-irene.md` |
| Decide the treatment for `format: infographic` (55 rows): a written long description, or a text alternative page. An infographic's alt cannot be its title | Irene + Claudio | before #109 |
| Supply the five placeholder URLs so #107 can retire the dead `href="#…"` controls (mirrors site-epic §8) | Irene | before #107 |
| Decide whether the participation CTAs on project pages have destinations at all, or should be removed | Irene | before #107 |
| Manual screen-reader pass — VoiceOver/Safari and NVDA/Firefox — over the ten routes in §0.1, after #110 merges. This is what §0.2 says the automated audit cannot do | Aline + Claudio | after #110 |
| Manual keyboard-only pass of the ten routes on the deploy preview | Aline | after #108 |
| Review checkpoint — accessibility sign-off before the design phase starts skinning | Aline + Claudio + Irene | after #110 |

## 9. Epic-closing verification

```bash
cd bfna-website-nuxt
npm install                                        # lockfile untracked until site-epic #82
npm run typecheck                                  # no new errors vs the 73-error baseline
npx nuxt generate                                  # NEVER `npm run generate` — needs Directus secrets
npx tsx scripts/check-routes.ts                    # DoD-A1, A2, A3, A4, A6, A7, A9
npx tsx scripts/check-links.ts                     # DoD-A5
# DoD-A8, by hand on the deploy preview: emulate prefers-reduced-motion: reduce,
# navigate between two prerendered routes, confirm no view transition runs.
# DoD-A10:
cd .. && git diff dev...HEAD -- bfna-website-nuxt/src bfna-website-nuxt/public/css \
  | grep -E '^\+.*(color|font-size|font-weight|font-family|letter-spacing|line-height|border-radius|box-shadow)\s*:' \
  | grep -v 'outline\|aria\|role='                 # must be empty except the focus/reduced-motion rules #93 adds
```

Plus the two manual passes in §8, which are the sign-off, not the gate.

## 10. Issue source

[`docs/a11y-epic/issues.md`](./issues.md) — 19 issues in four phases, numbered 92–110, continuing
from site-epic's last row (91). Row order is execution order; no issue depends on a higher-numbered
one. Phase 16 lands every shared-component and CSS-floor fix before phase 17 touches a page that
consumes it (D24).

Pass 2 continues the same sequence at 111:
[`docs/a11y-visual-pass/issues.md`](../a11y-visual-pass/issues.md) — 8 issues in three phases,
111–118. Pass 2 depends on pass 1 only through #110, whose gate it extends; the two can otherwise
run independently, and pass 2 is additionally blocked on the design phase's own decisions.
