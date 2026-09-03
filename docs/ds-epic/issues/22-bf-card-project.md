# 22 — `bfCardProject` — typed project card wrapper

One-line objective: port `wfCardProject.vue` to a typed `bfCard` wrapper
consuming the `Project` entity type, preserving the media/chips/pending
matrix.

## Context

Depends on 20 (`bfCard` base), 16 (`bfChip`), 17 (`bfMedia`). Builds from
`src/components/wireframe/wfCardProject.vue`. Consumed by 42
(`bfGridProjects`), 47 (home "Featured projects" band, `media chips=false`),
51 (`/projects` index). Provenance: BF-193.

## Scope

- File: `src/components/bf/CardProject.vue` → `<bfCardProject>`.
- Props:
  ```ts
  interface Props {
    project: Project           // zod-inferred type from issue 09 (bfProjects schema)
    media?: boolean             // default false
    mediaRatio?: string         // default '3/2'
    chips?: boolean             // default true
    excerptLength?: number      // default 140
  }
  ```
- `inheritAttrs: false`, `<bfCard v-bind="$attrs">` root.
- Heading: the heading ALWAYS links to `/projects/<slug>` (with ↗ when
  `external_url` is set). `pending` only adds the "Copy pending" chip —
  exactly as `wfCardProject.vue` does. There is no unlinked branch. External
  projects append the ↗ marker (`aria-hidden="true"> ↗`) after the heading
  text when `project.external_url` is set, and the link itself becomes an
  external anchor with the `[data-external]` marker from issue 19.
- Excerpt: `project.excerpt ?? project.description`, truncated to
  `excerptLength` with ellipsis (same rule as issue 21 — text arrives
  already plain from the normaliser).
- `#chips` slot (only when `chips` is true and at least one of kind/
  external/pending applies, matching `hasChips` in the wf source):
  `kindLabel(project.kind)` chip, `"External platform"` chip when
  `external_url` is set, `"Copy pending {project.pending}"` chip when
  `project.pending` is set.
- `#media` slot filled only when `media` is true: `<bfMedia :src=
  "project.image" alt="" :ratio="mediaRatio" />` (decorative — `alt=""`,
  matching the wf-* comment on why: the heading already names the
  destination).

## Out of scope

- The full-width product variant — that is `bfCardProduct` (issue 26), a
  separate wrapper, not a prop on this one.
- Grid/column layout (issue 42).
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- No new CSS variables beyond `bfCard`'s and `bfMedia`'s existing hooks.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/CardProject.vue
grep -q "mediaRatio" src/components/bf/CardProject.vue
```
Probe page `src/pages/bf-probe/22-bf-card-project.vue` renders the
media × chips 2×2 matrix (media on/off × chips on/off) plus one project with
`external_url` set and one with `pending` set:
```bash
grep -q "↗" .output/public/bf-probe/22-bf-card-project/index.html
grep -q "data-external" .output/public/bf-probe/22-bf-card-project/index.html
```
Fails today (no `bf/CardProject.vue`), passes once done.

## Decisions

Issue [gh#31](https://github.com/ccmdesign/bfna-website-migration-2/issues/31),
which also closes residuals
[#128](https://github.com/ccmdesign/bfna-website-migration-2/issues/128) and
[#130](https://github.com/ccmdesign/bfna-website-migration-2/issues/130) —
both were raised against `bfCardInsight` (#30) and both are properties of the
**wrapper family**, so they are settled once here rather than five more times.

**D-22.1 — `CardWrapperProps.headingLevel`, the shared card-wrapper contract
(#128).** `src/types/bf-contracts.ts` gains

```ts
export type CardHeadingLevel = 2 | 3 | 4
export interface CardWrapperProps { headingLevel?: CardHeadingLevel }
```

and every typed wrapper `extends` it, rendering
`<component :is="`h${headingLevel}`">` with a `withDefaults` value of `3`.

`bfCard` already styles `:is(h2, h3, h4)` — D-20.4 widened the base from the
frozen skin's bare `h3` on the reasoning that heading level is a function of
the **page outline** (BRIEF §5 rule 9: one `h1`, sequential levels). The base
supported three levels and no wrapper could reach two of them, so a card
dropped into a subsection — which #47/#49/#50/#51/#52 will do — emitted a level
jump.

Three decisions inside the decision:

1. **A union, not a `number`.** `headingLevel="5"` would typecheck, render an
   `<h5>` none of the base's selectors match, and silently ship a card with no
   stretched hit area and no focus indicator. As a union it is a compile error
   — the argument `TimeFormat`'s comment makes for `format`, with a worse
   consequence.
2. **Separate from `CardBaseProps`.** `span` is deliberately *undeclared* on
   the wrappers (D-21.2): it rides `$attrs` and is matched against `bfCard`'s
   own props by the `v-bind`. `headingLevel` cannot travel that road, because
   the base renders no heading for it to reach. Two interfaces, two audiences.
3. **The default is `3`, in each wrapper, not in the type.** `3` is the
   no-change value, so adopting the prop moved no pixel on any existing call
   site or probe card.

Asserted at runtime, not merely grepped: probes 21 and 22 render h2/h3/h4 cards
and **hit-test** `elementFromPoint` on empty card space at each level, so a
regression in either the base's `:is()` list or the wrapper's tag interpolation
fails the harness rather than a user.

**D-22.2 — a blank heading renders no heading and no link (#130).** The heading
is the entire text of an anchor whose `::after` `bfCard` stretches over the
whole card. A nullish or blank one therefore used to produce a **card-sized
link with no accessible name** (WCAG 2.4.4 / 4.1.2) — permitted by
`bfInsightSchema`'s `z.string().nullable()`, reached by 0 of the 371 real rows,
which is the definition of a trap.

Both wrappers now render the heading element only when the trimmed text is
non-empty, and warn at dev time in the shape `bfMedia` (gh#26) and `bfCard`
(gh#29) already use. The two fallback options were rejected together: the slug
and a literal `'Untitled'` each invent user-visible content the data does not
carry (BRIEF §5 rule 10), and each *hides* the defect behind a plausible card
instead of surfacing it. On `bfCardProject` the guard is defensive —
`bfProjectSchema` types `heading` as non-nullable, so `''` is the reachable
form — and is kept because the wrapper family should not have two answers to
one question.

One content delta rides along and is named here rather than left to be
noticed: the wrappers now render the **trimmed** heading (`headingText`) where
they previously interpolated the raw field. Judging emptiness on the trimmed
value while rendering the untrimmed one would be two different answers to the
same question, and a leading or trailing space in a link's accessible name is
noise either way. No real row is affected.

**D-22.3 — the `[data-external]` clause is not implemented; the heading link is
internal.** This spec's Scope paragraph asks for two things that cannot both
hold: *"the heading ALWAYS links to `/projects/<slug>`"* and *"the link itself
becomes an external anchor with the `[data-external]` marker"*.

The first is right, and the frozen layer proves it:
`pages/wireframes/projects/[slug].vue` renders a **compact overview page** for
every project carrying `external_url`, whose entire purpose is the
`Visit {heading}` CTA to the microsite. So an external project has an internal
destination, and `wfCardProject.vue` links to it like any other.

`[data-external]` means one thing in this design system — *this href leaves the
site* — stated by `src/utils/link.ts`'s `isExternal()` and painted by
`public/css/components/external-link.css`. On an anchor that navigates to
`/projects/…` it would be false, and it would promise a reader a departure that
does not happen. It is therefore **not** rendered, and probe 22 asserts its
absence so it cannot return by accident.

What the reader does get is exactly what the wireframe gives them: the
`<span aria-hidden="true"> ↗</span>` appended inside the link, describing the
*destination's content* rather than the link's target. `aria-hidden` because
"north east arrow" announced after every external project title is noise, and
the probe asserts the link's computed accessible name is the plain title.

(As a matter of construction the two could not coexist anyway: the marker's
`a[data-external]::after { content: " ↗" }` is (0,1,1) and the base's stretched
`.bf-card :is(h2, h3, h4) a::after { content: "" }` is (0,1,2), so on a card
heading the marker's own pseudo-element is overridden and paints nothing. The
explicit span is not a stylistic preference; it is the only thing that renders.)

**D-22.4 — `media` gets an explicit `false` default.** `wfCardProject.vue`
leaves `media` out of its `withDefaults` object, so it is `undefined` and
falsy. The spec writes `media = false`; the bf-* file states it, because a
default a reader of the component can see is worth one line. Behaviour is
identical, and the probe exercises the default by rendering a card that passes
no `media` prop at all.

**D-22.5 — `?? description`, not `|| description`.** The frozen expression is
`plain(props.project.excerpt ?? props.project.description)`, and the nullish
operator is kept verbatim: an **empty-string** excerpt does not fall back.
Three real rows (`2022`, `2023`, `2024`) carry both fields empty and correctly
render no paragraph. `plain()` is gone — HTML stripping moved into the
build-time normaliser (issue 07) and the helper retired (issue 10), so both
fields arrive plain and re-deriving the strip would be a second, drifting copy.

No real row carries a nullish `excerpt` beside a non-empty `description`, so
the probe's `fallback` card renders `city-solutions-series` with `excerpt`
nulled — the substitution D-21.3 established. The two fields on that row open
with entirely different sentences, so the assertion tests *which field was
used*, not a string length.

**D-22.6 — acceptance substitutions (residual #86, and D-22.3's consequence).**
The vitest harness on `dev` is broken and pre-existing, and two of this spec's
greps ride on the discarded half of D-22.3. What was run instead, all exiting
0:

- `npx tsx scripts/check-probes.ts --only 22` — the probe at
  `src/pages/bf-probe/22-bf-card-project.vue` under the #109 harness and the
  gh#116 `bf-probe` layout, **65 rows**, fed five real `bfProjects` documents
  (`city-solutions-series`, `transatlantic-periscope`, `transponder-magazine`,
  `bfna-documentaries`, `cepi-2010`) across fourteen cards.
- `npx tsx scripts/check-probes.ts --only 21` — **54 rows**, the retrofitted
  probe, and the full `npx tsx scripts/check-probes.ts` — **14 probes, 561
  rows**, so every earlier probe is regression-checked.
- `npx tsx scripts/verify-bf-card-insight.ts` — 0 failed, 0 skipped. Its prop-
  parity check learned about the shared contract: the `Props` body is still
  compared equal to the frozen four (a prop declared *inline* still fails), and
  the shared half is asserted at its source — the `extends` clause, the import
  from `~/types/bf-contracts`, and `CardWrapperProps`' own declaration.
- The spec's surviving greps as written: `test -f
  src/components/bf/CardProject.vue`, `grep -q "mediaRatio" …`, and `grep -q
  "↗" .output/public/bf-probe/22-bf-card-project/index.html`.
- **`grep -q "data-external" …` is not run** — see D-22.3. Its replacement is
  the inverse assertion in probe 22 (*no anchor carries `[data-external]`*)
  plus four rows on the ↗ marker: that it appears on exactly the external
  documents, sits after the title with its separating space intact, is inside
  an `aria-hidden` span, and leaves the accessible name as the plain title.
- `npm run typecheck` is replaced by the epic's no-new-errors gate: baseline
  **178** `error TS` on `dev`, **178** after, **0** in `src/components/bf`,
  `src/types`, `src/composables/bf` or `content.config`. `npx nuxt generate`
  exits 0, and the frozen wireframe sources are byte-identical to the pre-epic
  base `f757a64`.
