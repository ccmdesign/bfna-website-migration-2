# 45 — `bfProse` — body-string renderer

One-line objective: port `wfProse.vue` to `bfProse`, rendering a body string
as block-level content via both the markdown-lite and legacy-HTML paths,
starting heading levels at `h2`.

## Context

Depends on 02 (`bf-scaffold`), 05 (`data-measure`, caps line length —
replaces the retired legacy `.prose` system, per the as-built A note "uses
`wfProse`, replacing legacy `.prose` system as v1 anticipated"). Builds from
`src/components/wireframe/wfProse.vue`. Consumed by 50 (insight-detail
body), 52 (project-detail full-branch body). Provenance: not present in
component-inventory-v2 §2 by name; traceable to §1a's Insight-detail
template row and as-built §A. Not in the Level-2/3 tables directly, but the
as-built inventory's own "Notes on inheritance" section groups it with the
Section family in spirit (renders inside a `bfSection measure="narrow"`
per every wf-* call site).

## Scope

- File: `src/components/bf/Prose.vue` → `<bfProse>`.
- Props:
  ```ts
  interface Props {
    content?: string | null
  }
  ```
- Ports the block-parser logic verbatim from `wfProse.vue`: a markdown-lite
  path (detects `##`/`###`/`- `/`* ` line-leading markers, strips inline
  `**bold**`/`*italic*`/`` `code` ``/`[link](url)` marks to plain text) and
  a legacy-HTML path (when the content matches `/<[a-z][^>]*>/i`, converts
  block closers to newlines, strips remaining tags, decodes `&amp;`/
  `&nbsp;`). Both paths already exist in the wf source and are ported as-is
  — no new parsing behaviour.
- **Heading-level shift**: the wf source emits `h2`/`h3` for `##`/`###`
  already — `bfProse` keeps this (headings start at `h2`, never `h1`) so
  the page's own single `h1` (from `bfPageHeader`/`bfHero`) stays unique.
  This is a **preserved constraint**, not a new fix — call it out
  explicitly in the acceptance check anyway since it's easy to regress.
  Renders `<p>[body copy]</p>` as the empty-content fallback (ported
  verbatim).
- Typography comes from the existing type scale and `data-measure` (issue
  05) applied by the **caller** wrapping this component in a
  `measure`-capped `bfSection` (matches every wf-* call site: `<wf-section
  label="Body" measure="narrow">`) — `bfProse` itself does not set
  `data-measure`, it relies on the ambient cap from its container, exactly
  as `wfProse.vue` does today (no `data-measure` attribute inside
  `wfProse.vue` itself).

## Out of scope

- MDC/`ContentRenderer` integration — bodies arrive as plain strings from
  `data` collections (issue 09's schemas), not as markdown files rendered
  through `@nuxt/content`'s MDC pipeline.
- Sanitising untrusted input (bodies are curated dataset content, not
  user-submitted).
- Custom prose components (bold/link-preserving rich rendering) — out of
  scope per the wf source's own comment ("swap for a real renderer when
  production styling needs bold/links preserved" — not this issue).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables — typography inherited from the ambient type scale;
  `data-measure` is applied by the caller, not this component.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Prose.vue
grep -Lq "<h1" src/components/bf/Prose.vue
grep -q "h2" src/components/bf/Prose.vue
```
Probe page `src/pages/bf-probe/45-bf-prose.vue` renders one markdown-lite
body and one legacy-HTML body inside a `measure="narrow"` `bfSection`:
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/45-bf-prose/index.html)" = "0" ]
grep -q "<h2" .output/public/bf-probe/45-bf-prose/index.html
```
No `h1` is emitted; line length is capped via the ambient `data-measure`.
Fails today (no `bf/Prose.vue`), passes once done.

## Decisions

### D-45.1 — the legacy path is a **strip**, not a translation

The spec's own Scope line reads "a legacy-HTML path (when the content matches
`/<[a-z][^>]*>/i`, converts block closers to newlines, strips remaining tags,
decodes `&amp;`/`&nbsp;`)" and the issue body abbreviates the two paths as
"markdown-lite (h2/h3/p/ul) and legacy-HTML". That abbreviation is easy to
misread as *both* paths producing headings and lists. They do not, and the
ported parser is unambiguous about it:

1. the pre-pass turns block **closers** into newlines, then deletes **every**
   remaining tag;
2. the line loop that follows knows only `###`, `##`/`#`, and `- `/`* `.

A legacy `<h2>Recent work</h2>` therefore reaches the loop as the bare text
`Recent work`, carries no marker, and becomes a `<p>`. So does every `<li>`.
**A legacy body renders as a run of paragraphs, one per former block** — which
is `wfProse`'s behaviour on `dev` today and is what "port verbatim" obliges this
component to keep. Probe 45 asserts it by value (`p,p,p,p,p,p,p,p` for an
eight-block legacy fixture) rather than asserting a structure the parser has
never produced.

It is also *why* the constraint this issue is named for holds so cheaply: the
rank-1 element is deleted by the strip before anything downstream could re-emit
it. The probe proves that against a fixture that actually opens with one, rather
than about a body that never had one.

### D-45.2 — the acceptance `h1` check counts occurrences, not lines

The spec writes:

```bash
[ "$(grep -c '<h1' .output/public/bf-probe/45-bf-prose/index.html)" = "0" ]
```

That cannot hold, and should not: the probe page owns the page's own rank-1
title, exactly as every probe since #14 does, and a probe with no `h1` would
breach BRIEF §5 rule 9 in the other direction. The check run is therefore:

```bash
F=.output/public/bf-probe/45-bf-prose/index.html
[ "$(grep -o '<h1' "$F" | wc -l | tr -d ' ')" = "1" ]   # the probe title, and nothing else
grep -q '<h2' "$F"
```

**`grep -o … | wc -l`, never `grep -c`** (D-37.5): `grep -c` counts matching
*lines*, and prerendered HTML is one line — it would report `1` for any number of
headings, including a component that emitted a dozen.

The DOM-level form of the same claim is stronger and is also asserted on the
probe: **zero** rank-1 elements inside any of the six `.bf-prose` roots, and
exactly **one** in the whole document.

The component-source check `grep -Lq "<h1" src/components/bf/Prose.vue` is kept
as written and passes: the file contains no `<h1` substring at all, comments
included. The ported regex reads `h[1-6]` inside a closing-tag pattern, which
does not match that string.

### D-45.3 — no `v-html`, and no stylesheet

`wfProse` renders parsed blocks through `v-for` and text interpolation, so every
block's text is escaped by Vue and no markup from the body is ever inserted as
markup. That is the parity target *and* the safer construction, so it is kept
verbatim. The spec's "sanitising untrusted input is out of scope" line therefore
costs nothing here — there is no injection surface to sanitise.

The component ships **no `<style>` block at all**. It paints nothing and lays out
nothing that `.stack[data-gap="s"]` in `@layer composition` does not already do,
and the typography is the ambient type scale. A rule here could only restate the
composition layer (which drifts) or add something the spec forbids. So: no new
CSS variables, no colour, and — vacuously — no `:not()` of any shape (D-20.5).
Probe 45 asserts the *absence* by walking the live CSSOM for any rule selecting
`bf-prose` and requiring the list to be empty, so a `<style scoped>` added by a
later change fails a row rather than passing unnoticed.

### D-45.4 — `class="bf-prose | stack"`: one added token, and why

The wf source's root is `<div class="stack" data-gap="s">`. The port adds the
block class `bf-prose` ahead of it, in the `bf-byline | cluster` /
`center | switcher` dialect this codebase already uses (`|` is a real class
token separating the block from its composition primitive, not punctuation).

It is a **selector hook, not a style hook** — nothing declares a rule for it,
and D-45.3's probe row exists to keep that true. It earns its place because
every other `bf-*` component carries its block class, because the probe needs to
frame the component without naming the primitive that a hundred other elements
also carry, and because a later template that needs to reach the prose root from
outside has a name to reach it by.

### D-45.5 — no `headingLevel` prop, and no `measure` prop

Neither is an omission.

**`headingLevel`** exists on every typed card wrapper (`CardWrapperProps`,
gh#128) because a card's heading rank depends on where the card is mounted.
Prose is different in kind: the ranks it emits are inside a document outline the
**body itself** declares — `##` means "a section of this body", `###` means "a
subsection of that". Shifting them from the call site would flatten a two-level
outline into one, or push a subsection to rank 4 with no rank-3 parent. The
body's structure is the contract; the page keeps its single rank-1 heading by
this component never emitting one.

**`measure`** is the caller's, exactly as in the wf source, which carries no
`data-measure` attribute either: every `wf-*` call site is
`<wf-section label="Body" measure="narrow">`. A cap declared inside the component
would fight the ambient one and make a wide-measure call site impossible. Probe
45 asserts both halves — the component sets no `data-measure` on its root or
anywhere below it, and the 60ch cap that *is* in force is measured three ways
that must agree (the band's resolved `max-inline-size` against a live `60ch`
ruler laid inside the same band; the prose filling that box to within 1px; the
same excerpt in a `measure="full"` band coming out strictly wider).

`ProseProps` still lands in `src/types/bf-contracts.ts` rather than in the
component, per BRIEF §5 rule 11 — the templates at issues 50 and 52 are its
consumers and will name the shape.

### D-45.6 — acceptance substitutes the probe harness for vitest

The vitest harness on `dev` is broken and pre-existing (residual
[#86](https://github.com/ccmdesign/bfna-website-migration-2/issues/86)). Per the
gh#20–#53 precedent and `docs/decisions/probe-harness.md` (#109), acceptance is
the probe page driven headlessly:

```bash
cd bfna-website-nuxt
npx nuxt generate
npx tsx scripts/check-probes.ts --only 45   # 30/30 rows
npx tsx scripts/check-probes.ts             # 37 probes, 1602 rows, 0 failures
```

The spec's `npm run typecheck` line is likewise replaced by the epic's standing
gate (orchestrator decision after #10, residual #71): **no new errors** against
the `dev` baseline of 178 `error TS` lines, and **zero** errors under
`src/components/bf`, `src/types`, `src/composables/bf` or `content.config`.
Measured after this change: **178** and **0**.

### D-45.7 — superseded by #186: the empty-content placeholder is gone (gh#61)

D-45.2's ported `<p>[body copy]</p>` fallback shipped to readers on 97 of the
354 `bfInsights` rows and 3 `bfProjects` rows, whose bodies are legitimately
null (video and infographic items, where the media *is* the body). Residual
[#186](https://github.com/ccmdesign/bfna-website-migration-2/issues/186) raised
it; gh#61 took option 1 of the three it offered — `bfProse` renders **nothing**
for empty or null content: no placeholder, no empty `<p>`, just the childless
`.stack` root.

Nothing else about the port moves. The frozen `wfProse` keeps its own
placeholder (D2) and is not edited; the two renderers differ on this one case
by decision. Probe 45's two empty-content rows now assert that nothing is
rendered, by the same two rows that used to assert the placeholder. Reasoning
lives at [`52-page-project-detail.md` D-52.6](./52-page-project-detail.md).
