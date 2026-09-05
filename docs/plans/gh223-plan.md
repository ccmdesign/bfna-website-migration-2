# gh#223 — heading semantics (narrowed): `bfSection` level prop + dev warn, `bfProse` heading depth

Issue: https://github.com/ccmdesign/bfna-website-migration-2/issues/223
Brief: [`docs/a11y-epic/BRIEF.md`](../a11y-epic/BRIEF.md) — §3 gates, D23/D26/D27/D32, §5, §7
Epic: https://app.plane.so/ccm-design/browse/BF-219/

## Scope boundary

This row was narrowed on 2026-09-04. `src/components/bf/Hero.vue` and
`src/components/bf/PageHeader.vue` were rewritten hours earlier by BF-220 #253 and now
carry written rationale defending exactly what this row used to ask to change
(`PageHeader.vue:332-335`, `Hero.vue:56-62`). Both of the findings against them were
**latent** — no route emits an empty `<h1>`, no page combines the two components — so
this is a design-system question sitting with Claudio and Aline, not an accessibility
one with a single answer. **Neither file is touched by this branch.** Same posture two
earlier runners on this epic took (gh#217, gh#228) when asked to overturn a standing
written decision.

Also untouched: `/wireframes/**`, `src/layouts/wireframe.vue`, `src/components/wireframe/**`,
`public/css/wireframe.css`, `src/assets/wireframe-data` (byte-guarded, BRIEF §7); and
`about.vue:211`'s wrong comment, which is #230's.

Line numbers in the issue body predate BF-220. Current positions:
`Section.vue:231` → **:288** (the hardcoded `<h2>`); `Section.vue:178-182` → **:196-209**
(the `label`-only rationale); the `aria-labelledby` binding → **:229**.

## 1. `src/components/bf/Section.vue`

### 1a. `headingLevel`

`Section.vue:288` hardcodes `<h2 v-if="heading">`, and `SectionProps.heading`'s doc
argues the rank should stay fixed at 2. That argument holds for a *top-level* band and
stops holding the moment a `bfSection` composes inside another band's content — which is
what #230/#232 need. Copy the repo's own idiom (D27):

- New `SectionHeadingLevel = 2 | 3 | 4` in `types/bf-contracts.ts`, its own type rather
  than a reuse of `CardHeadingLevel` (whose doc ties its three values to `bfCard`'s
  stylesheet, a fact about cards and not about bands) — the `EmptyStateHeadingLevel`
  precedent, which is also a separate type for a separate reason.
- `SectionProps.headingLevel?: SectionHeadingLevel`, `withDefaults(…, { headingLevel: 2 })`.
- Render `<component :is="\`h${headingLevel}\`" v-if="heading" :id="headingId"
  class="bf-section__heading">`.

**The default is the no-change value.** Every one of the 25 existing call sites passes no
level and keeps emitting `<h2 id=… class="bf-section__heading">` — byte-identical markup.
Rewrite `SectionProps.heading`'s comment so it documents the new contract instead of
contradicting it.

### 1b. Dev-time warning

Five call sites read `label` as "this names the landmark"; it does not (`label` renders as
`data-label`, invisible to the accessibility tree). D26 is explicit that **the component's
behaviour stands** — a `label`-only band is still deliberately unnamed — so this is an
assertion, not a fallback and not a `v-if`.

Condition (all three):

1. `import.meta.dev` — the whole block is compiled out of production.
2. The rendered root carries **no accessible name**: neither `aria-labelledby` nor
   `aria-label`. Reading the DOM attribute rather than `props.heading` covers both ways a
   band gets named in one test — the prop-derived `headingLabelledBy` at `:229` *and* a
   call-site-supplied `aria-labelledby`. That second case is load-bearing:
   `projects/index.vue:169-183` slots its own `<h2>` and passes `:aria-labelledby` because
   the heading has to be a link. It is **correct** and must stay silent.
3. The band renders an `<h2>` whose nearest `<section>` ancestor is this band's own root —
   so a nested, properly-named `bfSection`'s heading is not attributed to its parent.

Mechanism: `onMounted` + a `ref` on the root, exactly `Card.vue:129-144`'s shape (the
repo's one existing dev-time call-site assertion). **Not** vnode inspection: reading
`slots.default()` outside a render function makes Vue itself log
*"Slot … invoked outside of the render function"* in dev, which would trade one warning
for two. `PageHeader.vue`'s `hasRenderedContent` is vnode-based because it is called
*from the template*; this check is not, and cannot be without rendering something.
`onMounted` is client-only and fires once per instance, which is the "exactly one
warning" acceptance.

gh#222 deleted a dev-only `console.warn` (D25) because it was compensating for a missing
type guarantee — `MediaProps.alt` became required and the warning became dead weight.
This one is the opposite case: a type cannot express *"the `<h2>` you put in my slot is
this band's name, and you have not told the accessibility tree that"*. The relationship
is between a slot's rendered content and an ARIA attribute, and there is no type-level
place to state it. That distinction is written into the code comment.

## 2. `src/components/bf/Prose.vue`

`:123` maps both `#` and `##` to `h2`; `:148-149` emit only `h2`/`h3`; `Block` at `:88`
closes the union at those two ranks. Authored depth beyond 3 is silently flattened.

- `Block` heading tags widen to `'h2' | 'h3' | 'h4' | 'h5' | 'h6'`.
- The line loop becomes one `/^(#{1,6})\s/` branch, rank `Math.max(2, hashes)` — so `#`
  still maps to **2** and the component still cannot emit an `h1`. That constraint is
  load-bearing (BRIEF §5 rule 9, and probe 45 asserts it by name); widening the low end
  would cost the page its unique `h1`.
- Template renders `<component :is="b.tag">` for the heading branch.
- The legacy-HTML path is unchanged: `<h4>` in a legacy body is stripped to a paragraph
  by the tag pre-pass before the line loop ever sees it, which is the same mechanism that
  flattens a legacy `<h1>`. Not this row's to change.

### Does any real content author an `h4`? **No.**

Measured over all 433 documents in `bfna-website-nuxt/content/bf/**` with the component's
own detection logic (legacy pre-pass, then the line loop), counting `^#{1,6}\s` markers:

| collection | docs | with a body | `#` | `##` | `###` | `####`+ |
|---|---|---|---|---|---|---|
| insights | 371 | 257 | 5 | 312 | 157 | **0** |
| projects | 38 | 35 (`description ?? excerpt`) | 0 | 0 | 0 | **0** |
| announcements / pages / people / programs | 24 | 0 | — | — | — | — |

Two insight bodies are legacy HTML; neither contains an `<h4>`–`<h6>` tag (`<h[1-6]`
scan: zero hits). **So this fix changes not one rendered byte today.** It is a contract
fix: the parser stops discarding depth an editor is free to author tomorrow, and the
`h4`-renders-as-`h4` acceptance is verified against a fixture, not against live content.
Stated plainly rather than claimed as an output change.

## 3. `scripts/check-routes.ts`

BRIEF §5: every issue adds at least one assertion. New static gate (the wide, cheap half —
the `listRoleRows` idiom at `:1335`), over every `index.html` under `.output/public`:

> **DoD-A1 — no prerendered page emits a heading-level skip.**

Headings read in document order from the raw HTML with `<script>`/`<style>` bodies masked
first (an inlined Nuxt payload carries content strings, and two insight bodies are legacy
HTML that would otherwise be matched inside a JSON string). A skip is any step from rank
*n* to rank > *n*+1, plus a first heading that is not rank 1.

Excluded by tree: `wireframes/` and `docs/` — the two exclusions `LIST_ROLE_SKIP` already
states, for its reasons.

**Amended after the first run.** The plan assumed the two skips BRIEF §0 measured. The
gate found **23**, and one of the two was not among them:

- `/insights` — the call-site skip the audit recorded. #230's.
- **22 `/insights/<slug>` detail pages** — a new finding. Their bodies author `### ` as the
  first heading with no `## ` above it, and the article-body band
  (`insights/[slug].vue:280`) passes `label="Body"` and no `heading`, so `bfProse` emits an
  `h3` directly under the page's `h1`. Fixed either editorially (normalise the authored
  depth) or by naming the band — neither is a component change and neither is this row's.
  Filed as a residual.
- `/search` is **not** among them: its measured `1 → 3` exists only after hydration renders
  result cards, and the prerendered idle page has no skip.

So the exclusion became a **debt ledger**, `HEADING_SKIP_KNOWN` — the shape
`.github/typecheck-baseline.txt` and `check-contrast.ts`'s `KNOWN_FAILURES` already use.
It stores each page's *exact* skip, so the debt can be paid but not deepened: a listed page
that starts skipping differently fails like any other. A listed page that stops skipping is
printed by its own row rather than failing — deliberately unlike the contrast gate, because
most of these clear through editorial changes to `content/bf/**` that land outside any
issue, and a gate that reddens because somebody improved a body is a gate people delete.

Negative-tested by running the gate before the ledger existed: it went red on exactly those
23 pages while all 25 other check groups stayed green, then green once they were recorded.

## 4. Verification

- `npx nuxt generate` (**never** `npm run generate` — needs Directus secrets),
  `npx tsx scripts/check-routes.ts`, `npx tsx scripts/check-links.ts`.
- Typecheck signature gate; baseline 90 in `.github/typecheck-baseline.txt`. No baseline
  error is paid down.
- Browser, on `env NUXT_IMAGE_PROVIDER=none npx nuxt dev`:
  1. a page composing `bfSection` still emits `<h2 class="bf-section__heading">` and its
     `aria-labelledby` still resolves to that element's `id`;
  2. a `bfSection` given `:heading-level="3"` emits `<h3>` with the same `id`/class wiring;
  3. the dev warning fires exactly once for a slotted `<h2>` in a band with no name, and
     is silent for `projects/index.vue`'s named-by-`aria-labelledby` bands;
  4. the warning's text does not appear in `.output/public/_nuxt/**`;
  5. `bfProse` given a fixture body authoring `####` emits `<h4>`.
- DoD-A10 / D23: `git diff dev...HEAD` contains no `color`, `font-size`, `font-weight`,
  `font-family`, `letter-spacing`, `line-height`, `border-radius` or `box-shadow`.

## 5. Risks

| Risk | Mitigation |
|---|---|
| `headingLevel` changes today's rendered output | Default is `2` — the current hardcoded rank. Asserted by the browser reading, and by `nuxt generate` diffing to the same markup. |
| The dev warning fires in production | `import.meta.dev` guards the whole block; verified by grepping the built `_nuxt` bundle for the warning string. |
| The warning is noisy — fires on correct call sites | The accessible-name test reads the *rendered* attribute, so `projects/index.vue`'s slotted-heading-plus-`aria-labelledby` bands stay silent. |
| D26 broken — a `label`-only band gets named | Nothing in the component's naming path changes; `headingLabelledBy` at `:209` is untouched. |
| A gate that cannot pass | The heading-skip gate excludes the two routes #230 owns, and says so in its own label. |
| Scope creep into #230 | No page template is edited on this branch. `git diff --stat` is the check. |
