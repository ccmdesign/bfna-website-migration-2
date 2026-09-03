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

_Runner appends here._
