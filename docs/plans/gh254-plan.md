# gh#254 — Article typography: type scale, body weight, programme spine

Issue: <https://github.com/ccmdesign/bfna-website-migration-2/issues/254>
Epic: <https://app.plane.so/ccm-design/browse/BF-220/>
Wave plan: `docs/plans/bf220-design-phase-wave-1-plan.md`
Depends on: #251 (programme colour tokens), #252 (`data-program` on `<html>`), #253 (hero scrim)

Planning mode: `ce-plan` was entered in pipeline mode and its Phase 0 references were read;
the run resolved **Durable / markdown**, and then took the skill's sanctioned fallback — this
hand-written plan — because every file the issue names had already been read in-session and
the Utopia arithmetic below was computed and verified before planning began. This is the same
disposition `docs/plans/gh253-plan.md` records, for the same reason, and it is written down
rather than left to be inferred.

---

## 1. What is actually true today (measured, not assumed)

### 1.1 The type ramp reproduces exactly

`tokens/primitive-spacing.css:16` carries the generator URL
`utopia.fyi/type/calculator?c=320,12,1.125,1248,18,1.2,5,2`. Reproducing Utopia's own formula
— step value `f · rᶰ` at each end, slope `(max−min)/(1248−320)`, intercept
`(min − slope·320)/16`, everything rounded to 4 dp — regenerates **`--size--2` through
`--size-5` byte for byte** against the shipped file. That is the proof the two new steps are
*regenerated* rather than hand-invented, which is what the issue asks for.

| step | min @320 | max @1248 |
| --- | --- | --- |
| `--size-4` (today's `h1`) | 19.22px | 37.33px |
| `--size-5` (ships, unused) | 21.62px | 44.79px |
| **`--size-6` (new)** | **24.33px** | **53.75px** |
| **`--size-7` (new)** | **27.37px** | **64.50px** |

### 1.2 Only three body weights ship, and the CSS the site declares does not match them

`https://use.typekit.net/tsd2tcy.css` serves `trade-gothic-next` at **300, 400, 700, 800**
(roman and italic). There is no 100, no 500, no 600. The CSS font-matching algorithm therefore
resolves the site's declarations like this:

| declared | resolves to | where |
| --- | --- | --- |
| `font-weight: 100` | **300** (Light) | `typography.css:124-130` — every `p`, `li`, `input`, `button`, `a` |
| `font-weight: 500` | **400** (Regular) | `typography.css:38-67` — `h2`…`h6` |
| `font-weight: 600` | **700** (Bold) | `typography.css:32-36` — `h1` |
| `font-weight: 400` | 400 | `typography.css:132-134` — `strong` |

Two consequences the issue's framing implies but does not state:

1. **`h2`–`h6` render at body weight.** Declared 500, matched to the 400 face — the same face
   `:root` sets. The audit table in the issue reads "h2 … weight 500", which is the *declared*
   value; the rendered face is Regular.
2. **`strong` is only visible because body copy is Light.** 300 against 400 is the entire
   emphasis signal today. Raising body copy to 400 without touching `strong` deletes inline
   emphasis site-wide. That is a regression this issue would introduce, so it is repaired here.

The display family is worse off and is **not** this issue's to fix: `--font-family-display` is
`"Sentinel SSm A", "Sentinel SSm B", sans-serif`, and
`https://cloud.typography.com/7264818/6341032/css/fonts.css` currently returns
`/* DEACTIVATED */`. Every heading on the site is rendering in the generic `sans-serif`
fallback. Filed as a residual; nothing below depends on Sentinel returning.

### 1.3 `--color-program` already degrades

`semantic-colors.css:302-306` declares the neutral `:root` default first and by design
(`--hsl-program: var(--hsl-navy)`, `#003C5C`, 11.66:1 on white). #252 puts `data-program` on
`<html>` only when `program?.slug` resolves to one of the three real programmes — the 52
mis-tagged rows and every non-article route fall through to that default. **So a spine painted
in `--color-program` is navy on an article with no programme, and needs no `v-if`, no fallback
declaration and no second token.** That is the graceful degradation the acceptance asks for.

### 1.4 The two article bands do not share a left edge

`bfPageHeader` composes `bfSection` with no `measure`, so its `.center` resolves
`--_bf-section-measure` → `--theme-center-measure` → **1100px**. The body band is
`measure="narrow"` → `.center[data-measure="narrow"]` → **60ch**. Both are `margin-inline: auto`.
The `<h1>` therefore ranges left roughly 300px outside the column its own article body occupies.

---

## 2. Decisions

**D1 — The two new steps are regenerated, and the generator URL moves with them.**
`primitive-spacing.css:16` becomes `…,1248,18,1.2,7,2,…`. The comment convention at that line
is the contract that lets the next person re-derive the file; a URL that no longer describes
the block below it is worse than no URL.

**D2 — The article `<h1>` takes the top of the ramp, and the header band takes the body's
measure.** `--size-7` (27.4→64.5px), `line-height: 1.05`, `text-wrap: balance`. The header
band's `--_bf-section-measure` is set to `60ch` — `bfSection` documents that hook as the
supported way for a call site to retune the band's measure — so the breadcrumb, chips, `<h1>`,
standfirst and byline all range left on the same vertical as the body copy beneath them.
*Fallback recorded in advance:* the reading column is ~480px wide, so 64.5px yields ~8
characters a line. If the browser pass shows that reading as broken rather than bold, the step
drops to `--size-6` and the reason is recorded in the journal and in `docs/decisions/`. Taking
the top step is preferred because shipping `--size-7` unused would reproduce, one step higher,
exactly the complaint the issue opens with.

**D3 — Heading weights become tokens, and only tokens that name a shipped face.**
`h1` → `var(--font-weight-bold)`: 700 is the face 600 was already matching, so **nothing about
`h1` changes on screen** — the declaration merely stops lying. `h2`–`h6` → `var(--font-weight-bold)`
as well: they are declared 500 and rendering at 400, i.e. at body weight, and 700 is the next
face that actually exists. This is the "bolder typography" half of the brief and it is the one
change in this issue that is both site-wide and visible, alongside the body weight. It is *not*
folded into the body-weight commit — see §3.

**D4 — `strong` moves to `var(--font-weight-bold)`.** Forced by D5; see §1.2.

**D5 — Body weight `100` → `var(--font-weight-normal)`.** 300 → 400. Its own commit, per the
acceptance. The brace at `typography.css:135` does not move and no selector or declaration
order changes, so the cascade repair recorded in the comment at `typography.css:84-100` is
untouched: these rules stay inside `@layer defaults` and stay beatable by every `bf-*`
component's `font: inherit`.

**D6 — `h5` drops to `--size--1`; `h4` keeps `--size-0`.** The smallest change that makes the
two ranks differ. `h6` also sits at `--size--1` but is `text-transform: uppercase`, so the
three ranks stay mutually distinguishable. `--size--2` was considered for `h6` and rejected:
12.5px at its maximum, against an audit that already flags sub-10px chip text.

**D7 — The spine is a `border-inline-start` on the article body band's `.center`, and the
header band carries the same border in `transparent`.** Both columns then have one box model
and one left edge, so D2's "hard vertical" survives a 4px border rather than being knocked 2px
sideways by `margin-inline: auto` re-centring a wider box. Opaque fill, never text, so
`--color-program` is the correct tier (`--color-program-on-light` is the only text-safe one and
this is not text).

**D8 — The rules live in a new static stylesheet, `src/public/css/components/article.css`,
imported from `styles.css`, not in an SFC `<style scoped>` block.** `nuxt.config.ts:216-221`
records that `public/css/**` is served through `<link>` and never passes through Vite or
PostCSS. #253's shipped defect was a specificity tie broken by source order *in the bundle*,
invisible on the dev server. A static stylesheet whose layer position is fixed by
`styles.css:2` cannot acquire that failure mode. Nothing here ties on specificity in any case —
`.bf-article-header .bf-page-header__heading` is (0,2,0) and no other rule names that class —
but the file placement removes the class of bug rather than the instance.

---

## 3. Commits

| # | Commit | Contents |
| --- | --- | --- |
| 1 | `feat(tokens): extend the Utopia type ramp to --size-7 [gh#254]` | D1 |
| 2 | `feat(type): tokenise heading weights, split h4 from h5 [gh#254]` | D3, D6 |
| 3 | `feat(type): raise body copy to --font-weight-normal [gh#254]` | D5, D4 — **its own commit, per the acceptance** |
| 4 | `feat(article): programme spine and display h1 [gh#254]` | D2, D7, D8 |

Commit 3 is the one the acceptance isolates, and it is isolated: it touches
`typography.css:124-134` and nothing else, so it can be reverted alone.

---

## 4. Files

| File | Change |
| --- | --- |
| `bfna-website-nuxt/src/public/css/tokens/primitive-spacing.css` | generator URL `5,2` → `7,2`; add `--size-6`, `--size-7` |
| `bfna-website-nuxt/src/public/css/base/typography.css` | heading weights → tokens; `h5` → `--size--1`; body weight → `--font-weight-normal`; `strong` → `--font-weight-bold` |
| `bfna-website-nuxt/src/public/css/components/article.css` | **new** — `.bf-article-header`, `.bf-article-body` |
| `bfna-website-nuxt/src/public/css/styles.css` | one `@import` in the components block |
| `bfna-website-nuxt/src/pages/insights/[slug].vue` | two class names on the two existing bands |

Out of scope, per the issue and confirmed against `Prose.vue:88-102`: **inline citations.**
The parser's `Block` union admits `h2 | h3 | p | ul` and `inline()` strips `[text](url)` to
`text`, so no `<a>` can reach an article body. Making citations visible is a renderer
replacement plus a `rel`/`target` policy decision, sized as its own piece of work; one residual
describes it honestly and this issue does not attempt it.

---

## 5. Verification

Gates, against the baselines measured on this branch before any edit:

| gate | baseline on `dev` | requirement |
| --- | --- | --- |
| `validate:tokens` | 0 errors, 1 warning, 824 tokens | no new errors |
| `check:contrast` | 17 pairs, 16 pass, 1 known (`#263` amber) | unchanged — **no new pairs, no new allowlist rows** |
| `lint:css` | 422 problems | no new problems |
| `nuxt generate` + `check-routes` | green | green |
| `typecheck` | 89–90 diagnostics vs `.github/typecheck-baseline.txt` | no new |

Browser, on served `nuxt generate` output as well as the dev server, at 375 and 1440:

1. `/`, `/about`, `/search`, one programme hub, one `/insights/:slug` **with** a programme, one
   **without** — the body-weight change is site-wide and every route is sampled for it.
2. Computed `font-weight` on body copy is `400` on every page sampled, and no `bf-*` atom's
   `font: inherit` broke (the `bfChip` `<span>`/`<a>`/`<button>` branches from residual #113 are
   the specific thing to re-check).
3. The article `<h1>` computed size at 375 and 1440, reported as px.
4. The spine paints the right programme hue on a programme article and navy on one without.
5. `h4` and `h5` computed sizes differ.
6. No horizontal overflow at either width; console clean.

The vitest suite is dead on `dev` (0 tests collected, no `test` script, no CI step — residual
#269). Nothing is written into it and "tests pass" is not treated as evidence.
