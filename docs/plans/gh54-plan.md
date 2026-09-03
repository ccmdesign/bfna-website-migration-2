# Plan — gh#54 / issue 45 · `bfProse`

**Spec:** [`docs/ds-epic/issues/45-bf-prose.md`](../ds-epic/issues/45-bf-prose.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh54-bfprose` off `dev`

## Approach

One component, `src/components/bf/Prose.vue` → `<bfProse>`, a **body-string
renderer**. The block parser is ported **verbatim** from
`src/components/wireframe/wfProse.vue` (read, never edited — D2): same `inline()`
mark-stripper, same legacy-HTML pre-pass, same line loop, same `Block` union,
same `<p>[body copy]</p>` fallback. No parsing behaviour is added, removed or
"improved" — parity with the wf source is the whole contract of this issue.

Three things change around that verbatim core, and only three:

1. **Typed props from the shared contract.** `ProseProps` is added to
   `src/types/bf-contracts.ts` (BRIEF §5 rule 11) — `content?: string | null`,
   nothing else.
2. **`$attrs` fallthrough** (BRIEF §5 rule 4). The wf source has a single root
   already, so default fallthrough is correct and no `inheritAttrs: false` /
   filter is needed; the root `<div class="stack" data-gap="s">` merges whatever
   the call site passes.
3. **Comment/provenance header** in the house style, naming the ported logic and
   the heading-level constraint.

**No `v-html`.** The wf source renders parsed blocks through `v-for` and text
interpolation, so every block's text is escaped by Vue. That is the parity
target *and* the safer construction, and it is what this port keeps — the spec's
"sanitising untrusted input is out of scope" line stops being load-bearing when
no raw HTML is ever inserted.

**No `data-measure` inside the component** (spec § Scope, explicit). The line
cap arrives from the caller's `bfSection measure="narrow"`, whose inner
`.center[data-measure="narrow"]` resolves `--_center-measure: 60ch` in
`@layer composition`. The probe *measures* that rather than asserting the
attribute's absence alone.

**Heading levels start at `h2`.** `##` → `h2`, `###` → `h3`, and a legacy
`<h1>…</h1>` in a legacy body is stripped to a bare paragraph line by the
tag-strip pass — so no rank-1 heading can escape the component by either path.
The component source contains no `<h1` substring at all, comments included, so
the spec's own grep is honest.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/Prose.vue` | **new** — the component |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | `ProseProps` appended |
| `bfna-website-nuxt/src/pages/bf-probe/45-bf-prose.vue` | **new** — the probe, `layout: 'bf-probe'`, harness DOM convention |
| `docs/ds-epic/issues/45-bf-prose.md` | Decisions section appended |
| `docs/plans/gh54-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched (D2), and the diff check for that is part
of acceptance.

## Styling

**No stylesheet at all.** The component paints nothing and lays nothing out that
`.stack[data-gap="s"]` in `@layer composition` does not already do, and the
typography is the ambient type scale. A `<style>` block would either restate the
composition layer (drift) or introduce a rule the spec forbids. So: no new CSS
variables, no new colour, and — vacuously — no `:not()` of any shape (D-20.5).
The probe still runs the D-20.5 CSSOM walk, because the assertion is about the
*emitted* CSS on the page, not about this file.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe page under the #109 harness, per the gh#20–#53
precedent:

```bash
cd bfna-website-nuxt
npx nuxt typecheck            # gate = no NEW errors vs the 178-error dev baseline
npx nuxt generate
npx tsx scripts/check-probes.ts --only 45
npx tsx scripts/check-probes.ts
```

Probe `/bf-probe/45-bf-prose` renders, each inside its own
`<bfSection measure="narrow">`:

- a **markdown-lite** body — `##`/`###` headings, `- ` and `* ` list items,
  paragraphs, and every inline mark (`**bold**`, `*italic*`, `` `code` ``,
  `[label](url)`) present so the strip is observable;
- a **legacy-HTML** body — `<p>`, `<h2>`, `<h3>`, `<ul><li>`, `<br>`, a nested
  `<strong>`/`<a>`, `&amp;` and `&nbsp;`, plus a legacy `h1`-ranked heading, so
  the rank-1 case is proved by construction rather than by assumption;
- an **empty-string** body and a **null** body — both must render the single
  `[body copy]` fallback paragraph;
- a **1000-char real excerpt** inside the narrow band, whose rendered inline
  size is measured against the 60ch cap (BRIEF §5 rule 10 — real content).

Rows assert: block tag sequences per path, inline marks stripped, entities
decoded (`&` restored, `&nbsp;` → space), list items grouped into one `<ul>`,
zero `h1`-ranked elements anywhere below the two prose roots, the whole-document
`h1` count equal to exactly **1** (the probe's own title — counted with
`grep -o … | wc -l` in the generated HTML, never `grep -c`, D-37.5), the
fallback text, root shape `div.stack[data-gap="s"]`, no `data-measure` attribute
on or inside the component, the 60ch cap measured, `$attrs` reaching the root,
no inline `style`, and the D-20.5 `:not()` walk.

## Risks

| Risk | Mitigation |
|---|---|
| The spec's literal `grep -c '<h1' … = 0` cannot hold — the probe page owns the page's own `h1` title, as every probe since #14 does. | Deviation recorded in the spec's Decisions: the check becomes an **occurrence** count (`grep -o`, D-37.5) equal to 1, plus a DOM row asserting zero rank-1 headings inside the prose roots. Strictly stronger than the literal text. |
| Porting "verbatim" is easy to drift on while retyping. | The wf source is copied, then only the props/typing lines change; a probe row cross-checks the two parsers agree on a shared fixture by rendering `wfProse`'s own expected block sequence. |
| A legacy body containing a rank-1 heading could leak a rank-1 element. | It cannot: the tag-strip pass runs before the line loop, so the text survives and the tag does not. Asserted explicitly rather than argued. |
| `npm run typecheck` (spec) is not the epic gate. | The epic gate is *no new errors* vs the 178-error `dev` baseline, and zero errors in `src/components/bf`, `src/types`, `src/composables/bf`, `content.config`. Both numbers journalled. |
