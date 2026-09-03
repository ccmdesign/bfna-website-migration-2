# 29 — `bfByline` — article byline (new, resolves naming collision)

One-line objective: build a new `bfByline` molecule for article
author/date bylines, and formally resolve the `ccmByLine` naming collision
by documenting that the two components are unrelated.

## Context

Depends on 02 (`bf-scaffold`), 18 (`bfTime`, for the optional date). Builds
from **new** markup — no `wf-*` file exists for this; `insights/[slug].vue`
hand-rolls `<span>By {{ insight.authors.join(', ') }}</span>` next to a bare
`<time>`. Provenance: BF-205; v2 §5 open decision ("`ccmByLine` naming
collision: rename the existing footer-credit component and build a
genuinely new article-byline component, or repurpose one — resolve before
BF-205 starts"). Consumed by: no template in Phase 4/5 wires it in yet
(the insight-detail template, issue 50, does not list a byline in its
section order per `issues.md` — record in Decisions whether issue 50 should
pick this component up, since insight data does carry `authors`).

## Scope

- File: `src/components/bf/Byline.vue` → `<bfByline>`.
- Props:
  ```ts
  interface Props {
    author: string     // pre-joined string, e.g. authors.join(', ') — the component does not accept an array
    date?: string       // ISO date string, passed straight to bfTime
  }
  ```
- Renders `<p class="bf-byline | cluster" data-gap="xs">By {{ author
  }}<bfTime v-if="date" :date="date" /></p>` — author-only when `date` is
  omitted, author + `bfTime` when present. No slot — this is a
  props-only molecule per the ADR-1 "cards + heros = props" rule extended
  here since it has no compound anatomy.
- **Naming-collision resolution (record verbatim in Decisions)**: leave
  `src/components/ds/organisms/ccmByLine.vue` (the existing footer-credit
  component, unrelated purpose) **completely untouched** — no rename, no
  edit. `bfByline` is a net-new article byline with no relationship to
  `ccmByLine` beyond the coincidental name similarity. State this plainly
  in the spec so no later issue conflates the two.

## Out of scope

- Renaming or editing `components/ds/organisms/ccmByLine.vue` in any way.
- Avatars or author photos (no wireframe evidence).
- Multi-author lists beyond a simple joined string — the caller
  (`insight.authors.join(', ')`) does the joining, not this component.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-byline-gap` (Utopia `xs` token). No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Byline.vue
grep -Lq "ccmByLine" src/components/bf/Byline.vue
git diff --stat -- src/components/ds/organisms/ccmByLine.vue   # must be empty
```
Probe page `src/pages/bf-probe/29-bf-byline.vue` renders an author-only form
and an author+date form:
```bash
grep -q "By " .output/public/bf-probe/29-bf-byline/index.html
```
Fails today (no `bf/Byline.vue`), passes once done, and the naming
resolution is written into this file's Decisions section (not just implied
by the diff check).

## Decisions

_Runner appends here._

**D-29.1 — the `ccmByLine` naming collision is resolved by changing nothing.**

`src/components/ds/organisms/ccmByLine.vue` is left **completely untouched** —
no rename, no edit, not one byte. It is a footer credit (`© {year} CCM Design`
plus an attribution link), used once, from `ccmFooter.vue:5`. `bfByline` is a
net-new **article** byline. The two have no relationship beyond a coincidental
similarity of name, and **no later issue should conflate them**: an issue that
finds itself wanting to "reuse" or "merge" them has misread one of the two.

The collision is not merely tolerated, it does not exist, and that is provable
from Nuxt's own name resolution rather than asserted. `scanComponents` builds a
registered name by walking the configured `prefix` against the file name and
stopping as soon as the two agree:

| file | dir config (`nuxt.config.ts:168-201`) | registered name | tag |
|---|---|---|---|
| `components/ds/organisms/ccmByLine.vue` | `prefix: 'ccm'`, `pathPrefix: false` | `CcmByLine` — prefix dropped, the file name already starts with it | `<ccm-by-line>` |
| `components/bf/Byline.vue` | `prefix: 'bf'`, `pathPrefix: false` | `BfByline` | `<bf-byline>` |

Two identifiers, two kebab tags, one registry. Verified three ways, all in the
acceptance run below: both names appear in `.nuxt/components.d.ts`; the probe
renders `<bfByline>` and `<ccm-by-line />` side by side and asserts they are two
different elements with different tag names and non-overlapping content; and
`git diff --stat` on the legacy file prints nothing.

**D-29.2 — a missing author renders nothing, never `[author]`.**

The frozen wireframe (`pages/wireframes/insights/[slug].vue:8-9`) renders
`By [author]` when `authors` is empty. That placeholder is a data-gap marker,
and the gap is the ordinary case, not an edge one: **268 of the 371 rows in
`content/bf/insights/` carry an empty `authors` array** (103 carry names — one
row carries two). Shipping `[author]` would put the literal string on 72% of
insight pages.

| `author` | `date` | renders |
|---|---|---|
| a name | usable | `By <name>` + `<time>` |
| a name | absent / unusable | `By <name>` |
| `''` or whitespace | usable | the `<time>` alone — a dateline is a real thing; `By ` with nothing after it is not |
| `''` or whitespace | absent / unusable | **no element at all** |

The last row is the load-bearing one, and it is the same decision `bfTime` (#27)
made for an unparseable date: an empty `<p class="bf-byline">` is not invisible.
It is a flex container inside a `.stack` or `.cluster`, so it contributes a
phantom `gap` and pushes the copy below it down a step on three insight pages
out of four.

`bfByline` mirrors `bfTime`'s trim-parse-`NaN` guard locally (one computed)
rather than sharing it through `utils/format.ts`, so this issue edits no
already-merged component. The duplication is checked, not trusted: the probe
asserts the biconditional — a `<p>` exists **iff** something rendered inside it
— from the DOM alone, so a future drift between the two guards fails the harness
instead of shipping.

**D-29.3 — contract deviations from this spec, and why.**

| Spec | As built | Why |
|---|---|---|
| `date?: string` | `date?: string \| null` | The value passed will be `Insight['publish_date']`, declared `z.string().nullable()` (`content.config.ts:69`), and `bfTime` types its own `date` the same way. Widening an optional prop is source-compatible; the narrow version forces `?? undefined` at every call site. |
| `By {{ author }}` as a bare text node | `<span class="bf-byline__author">` | A bare text run in a flex container is an anonymous flex item no selector, probe or consumer stylesheet can address — and the author half has to be conditional, which needs an element anyway. The frozen wireframe uses a `<span>` here too. |
| — | one literal space between the halves | The visible space between two flex items is `gap`, a layout property invisible to anything reading the DOM as text; without the node `textContent` reads `By Anthony T. SilberfeldFeb 2018`. A whitespace-only text run is not a flex item (Flexbox §4), so no box, gap or measurement changes. |
| `--_bf-byline-gap` (Utopia `xs`) | `--_bf-byline-gap: var(--_cluster-space, var(--space-xs))` | A flat declaration would work and would be a trap: `@layer components` outranks `@layer composition`, so the component's own rule would beat `.cluster[data-gap]` and silently make the documented composition API inert on this component. Chaining through `--_cluster-space` keeps both routes live, and the probe measures each against reference `.cluster` elements. |
| — | `align-items: baseline` | `bfCardRow`'s reasoning (`Card.vue`): the author run and the date run may be set at different sizes by the header around them, and centring their boxes leaves two visibly different text baselines in what should read as one phrase. |

**D-29.4 — substituted acceptance commands (residual #86 / harness #109).**

The vitest harness on `dev` is broken and pre-existing, so acceptance is the
probe under `scripts/check-probes.ts`, per the #20–#28 precedent.

One command in the Acceptance block above is also **malformed and was
replaced**: `grep -Lq "ccmByLine" src/components/bf/Byline.vue` cannot express
its intent, because `-q` overrides `-L` — as written it exits **0 when the
pattern is present**, the opposite of what it reads as. It is replaced by
`! grep -q "ccmByLine" src/components/bf/Byline.vue`. The component therefore
refers to the legacy organism by path and role and never by that identifier, and
the collision evidence lives here and on the probe instead.

The acceptance run, as executed:

```bash
cd bfna-website-nuxt
npx nuxt typecheck   # 178 errors == the dev baseline; 0 under src/components/bf|src/types|src/composables/bf|content.config
npx nuxt generate    # exit 0, 901 routes
test -f src/components/bf/Byline.vue
! grep -q "ccmByLine" src/components/bf/Byline.vue
grep -q "BfByline" .nuxt/components.d.ts && grep -q "CcmByLine" .nuxt/components.d.ts
git diff --stat -- src/components/ds/organisms/ccmByLine.vue          # empty
grep -q "By " .output/public/bf-probe/29-bf-byline/index.html
npx tsx scripts/check-probes.ts --only 29                              # 68/68 rows
npx tsx scripts/check-probes.ts                                        # 21 probes, 978 rows, 0 failures
```

**D-29.5 — issue 50 should adopt `bfByline`.**

The spec's Context section asks this question, and `issues.md` scopes issue 50
with "**Out:** … a byline unless the data carries an author". The data does carry
one: `Insight['authors']` is populated on 103 of 371 rows. So the condition is
met and issue 50 **should** render `bfByline` in the insight-detail page header,
passing `insight.authors.join(', ')` and `insight.publish_date` — the exact call
the frozen wireframe already makes by hand at `insights/[slug].vue:8-10`.

D-29.2 is what makes that safe to wire in unconditionally: on the 268 rows with
no author the component renders the date alone, and on a row with neither it
renders nothing, so issue 50 needs no `v-if` of its own and no second copy of
the emptiness rule. It should **not** re-derive the join, the placeholder or the
date formatting.

No other Phase 4/5 template consumes `bfByline`; `bfCardInsight` deliberately
does not (a card shows a date, not a byline — see #21).
