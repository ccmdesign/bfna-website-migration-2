# Plan — gh#31 / issue 22 `bfCardProject` (+ residuals #128, #130)

**Issue:** [gh#31](https://github.com/ccmdesign/bfna-website-migration-2/issues/31) ·
**Spec:** [`docs/ds-epic/issues/22-bf-card-project.md`](../ds-epic/issues/22-bf-card-project.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)
**Folded in:** [#128](https://github.com/ccmdesign/bfna-website-migration-2/issues/128)
(shared `headingLevel`), [#130](https://github.com/ccmdesign/bfna-website-migration-2/issues/130)
(a null heading must not produce an unnamed stretched link).

Three parts, one PR. Parts (a) and (b) are the wrapper *contract*; (c) is the
second wrapper written against it. Doing them together is the point: #128 says
explicitly that the fix belongs in one issue across the wrapper family rather
than per-wrapper, and #31 is the first wrapper after the one that raised it.

---

## (a) Contract — `CardWrapperProps` in `src/types/bf-contracts.ts`

```ts
export type CardHeadingLevel = 2 | 3 | 4

export interface CardWrapperProps {
  headingLevel?: CardHeadingLevel   // default 3, applied by each wrapper
}
```

- **Why a shared interface and not a prop per wrapper.** `bfCard`'s D-20.4
  already widened every selector in the base stylesheet from the frozen skin's
  bare `h3` to `:is(h2, h3, h4)`, on the reasoning that heading level is a
  function of the *page outline*. The base supports three levels; before this,
  no wrapper could reach two of them. Six wrappers each declaring their own
  `2 | 3 | 4` union is six copies able to drift (the same argument D-21.2 used
  to keep `span` off the wrappers).
- **Not merged into `CardBaseProps`.** `span` reaches the base *through*
  `$attrs` and is deliberately undeclared on wrappers (D-21.2). `headingLevel`
  is the opposite: the wrapper is the only thing that can act on it, because
  the base never renders a heading. Two interfaces, two audiences.
- **Default 3, in each wrapper's `withDefaults`,** not in the type. A card in a
  section under an `h2` holds an `h3`, which is what every call site does
  today, so the default is the no-change value.
- Wrappers render `<component :is="\`h${headingLevel}\`">`.

## (b) Retrofit `src/components/bf/CardInsight.vue` (#30)

1. `interface Props extends CardWrapperProps`; `headingLevel: 3` in
   `withDefaults`; `<h3>` → `<component :is="…">`.
2. **#130.** `heading` is `z.string().nullable()` in `bfInsightSchema`. A blank
   heading currently renders `<h3><NuxtLink>{{ null }}</NuxtLink></h3>` — an
   anchor with no accessible name whose `::after` is stretched over the whole
   card (WCAG 2.4.4 / 4.1.2). Fix: when the heading is nullish or blank the
   wrapper renders **no heading element and no link at all**, plus a dev-time
   `console.warn` in the shape `bfMedia` (gh#26) and `bfCard` (gh#29) already
   use. Rationale for "no link" over a fallback name is in the spec's
   Decisions section — briefly: the two candidate fallbacks (the slug, or the
   word "Untitled") both invent user-visible content the data does not have,
   and BRIEF §5 rule 10 is explicit that components render real content.
3. `scripts/verify-bf-card-insight.ts` asserts *"every wf-\* prop name
   survives, none added"* against the frozen `wfCardInsight.vue`. That check
   has to learn about the one deliberate addition, or the retrofit fails a
   script whose whole job is catching an undeclared contract change. It is
   widened to `frozen ∪ {headingLevel}` **and** given a companion row asserting
   that the addition is exactly that one name, so a second silent prop still
   fails it.
4. Probe 21 gains a `headingLevel` row and a null-heading row (both named in
   the runner brief), plus the count updates the two new cards force.

## (c) `bfCardProject` — `src/components/bf/CardProject.vue`

Follows #30's wrapper pattern exactly: `inheritAttrs: false` + a root of
`<bfCard v-bind="$attrs">`, the entity as one prop, no stylesheet of its own,
no `queryCollection`.

```ts
interface Props extends CardWrapperProps {
  project: Project        // ~/types/bf-contracts
  media?: boolean         // false
  mediaRatio?: string     // '3/2'
  chips?: boolean         // true
  excerptLength?: number  // 140
}
```

Parity with `components/wireframe/wfCardProject.vue` (read, never edited):

| | |
|---|---|
| heading | **always** links to `/projects/<slug>`, with `<span aria-hidden="true"> ↗</span>` appended when `external_url` is set. There is no unlinked branch — `pending` only adds a chip. The wireframe's own project detail template proves the rule: an external project still has an internal overview page, which carries the "Visit …" external CTA. |
| excerpt | `project.excerpt ?? project.description`, truncated to `excerptLength` with a single `…`. `??`, not `\|\|`, so an empty-string excerpt does **not** fall back — the frozen arithmetic, kept. No `plain()`: the normaliser already stripped HTML. |
| chips | `kindLabel(project.kind)` · `External platform` · `Copy pending {pending}`, and the slot is provided only when `chips` and at least one of the three apply (the frozen `hasChips`). |
| media | `<bfMedia :src="project.image" alt="" :ratio="mediaRatio" />`, only when `media`. `alt=""` is the deliberate decorative declaration — the heading already names the destination. |

**The `data-external` clause of the spec is not implemented, deliberately.**
The spec's Scope says both "the heading ALWAYS links to `/projects/<slug>`"
*and* "the link itself becomes an external anchor with the `[data-external]`
marker". Those cannot both hold. The runner brief settles it for the first, and
`[data-external]` on an anchor that navigates to an internal route would
promise the reader a departure that does not happen. Two acceptance greps ride
on the discarded half; the substitution and its equivalent-strength
replacements are recorded in the spec's Decisions section (see below).

## Probe — `src/pages/bf-probe/22-bf-card-project.vue`

`bf-probe` layout, #109 DOM convention (`[data-probe-verdict]` root,
`[data-probe-row][data-ok]` rows), real `bfProjects` documents queried **by the
page** (the component fetches nothing):

| card | document | why |
|---|---|---|
| matrix ×4 | `city-solutions-series` | media on/off × chips on/off; a 1550-char excerpt so truncation is real |
| `external` | `transatlantic-periscope` | `external_url` set, mapped `kind`, real image → ↗ + both chips |
| `pending` | `transponder-magazine` | `pending: 'Q6'`, no `external_url` → pending chip, **still linked** |
| `both` | `bfna-documentaries` | `external_url` **and** `pending: 'Q7'`, `kind: null` → chip set without the kind chip |
| `nochips` | `cepi-2010` | no kind, no external, no pending → `hasChips` false, no chips element at all |
| `fallback` | `city-solutions-series` with `excerpt: null` | forces `?? description`; a spread of a real row, the substitution probe 21 already established |
| `h2` / `h4` | `transatlantic-periscope` | `headingLevel` renders the tag *and* the base's stretched-link rules still bite at h2/h4 |
| `noheading` | a real row with `heading: ''` | #130 on this wrapper: no heading element, no anchor |
| `spanned` | `transatlantic-periscope` | `$attrs`: caller `class`, `data-*`, and `span="full"` as `bfCard`'s prop |

## Verification (this issue's acceptance)

1. **Typecheck gate** (no-new-errors, per the epic): baseline recorded **178**
   `error TS` before any edit; after, count ≤ 178 **and** 0 in
   `src/components/bf`, `src/types`, `src/composables/bf`, `content.config`.
2. `npx nuxt generate` exits 0 (never `npm run generate`).
3. `npx tsx scripts/check-probes.ts --only 22`, `--only 21`, and the **full**
   run — all exit 0.
4. `npx tsx scripts/verify-bf-card-insight.ts` — 0 failed, 0 skipped (the
   retrofit must not regress #30's own verifier).
5. The spec's shell greps that survive the `data-external` decision.
6. Frozen wireframe sources byte-identical to the pre-epic base `f757a64`.

## Risks

| risk | mitigation |
|---|---|
| `<component :is>` breaks the base's `:is(h2, h3, h4)` selectors | the probe asserts the stretched `::after` is `absolute` and the anchor's own `position` is `static` at **h2 and h4**, not only h3 |
| the retrofit changes #30's rendered output | `headingLevel` defaults to 3; every existing call site and every probe-21 card renders byte-identically unless it asks otherwise |
| `verify-bf-card-insight.ts` fails on the added prop | widened deliberately, with a companion row pinning the addition to exactly `headingLevel` |
| remote `image` URLs through `NuxtImg` during prerender | `bfna.simplyas.com` is already in `nuxt.config`'s `image.domains`; one media card also uses the `image: null` placeholder branch so the ratio assertion does not depend on a network fetch |
