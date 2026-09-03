# Plan — gh#36 / issue 27: `bfCardRow`, with residual #138 folded in

**Issue:** [gh#36](https://github.com/ccmdesign/bfna-website-migration-2/issues/36) ·
**Residual folded in:** [gh#138](https://github.com/ccmdesign/bfna-website-migration-2/issues/138) ·
**Spec:** `docs/ds-epic/issues/27-bf-card-row.md` ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/)

Two parts, one PR. Part (a) is a base change to `bfCard` that part (b) then
gets to rely on.

## Part (a) — #138: move the stretched-link overlay to `::before`

### The defect

`external-link.css` paints the external marker through `a[data-external]::after`
— specificity (0,1,1). `Card.vue`'s stretched link is
`.bf-card :is(h2, h3, h4) a::after { content: "" }` — (0,1,2), because `:is()`
takes the specificity of its most specific argument. Both sit in
`@layer components`, so the card's empty `content` wins and **no `bfCard`
heading link can ever show the ↗**. Option 3 of #138's suggested fixes.

### The change

`Card.vue`'s `@layer components` block, one selector:

```css
.bf-card :is(h2, h3, h4) a::before { content: ""; position: absolute; inset: 0 }
```

`::before` instead of `::after`, freeing `::after` for the marker. Nothing else
about the overlay changes — same `content`, same `position: absolute; inset: 0`,
same containing block, same `position: static` exemption on the anchor.

### Why this is safe

- The overlay is `position: absolute`, so it is out of flow: `::before` vs
  `::after` changes no box, no order, no paint stacking within the anchor
  (both are painted after the anchor's own background, and only these two
  boxes exist).
- The anchor's text content is unaffected: `::before` on an anchor that is
  `position: static` and absolutely positioned generates no inline box in the
  text flow.
- The marker's `::after` then applies unopposed at (0,1,1) — no rule competes.

### Risks and what catches them

| Risk | Caught by |
|---|---|
| overlay stops covering the card | probe 20 checks 6 (`elementFromPoint`, dispatched click) |
| heading anchor becomes its own containing block | probe 20 `position: static` check |
| non-heading links swallowed | probe 20 check 7 |
| the ↗ still invisible | **new** probe 20 row (this issue) |
| probes 21–26 regress | full `npx tsx scripts/check-probes.ts` |

### Probe 20 extension

One new card in the existing grid — `data-probe-card="external"` — whose
heading anchor carries `data-external`, plus rows asserting:

1. the heading anchor's `::after` resolves a non-empty `content` (the ↗ is
   painted) — read with `getComputedStyle(el, '::after').content`;
2. `::before` carries the overlay (`position: absolute`);
3. the card is *still* fully clickable: `elementFromPoint` at the card's
   bottom-right corner returns that anchor, and a dispatched click fires its
   handler.

Probes 21–26 must pass unchanged (no edits to them).

## Part (b) — `bfCardRow`

### Files

| File | What |
|---|---|
| `src/components/bf/CardRow.vue` | new — `<bfCardRow>` |
| `src/types/bf-contracts.ts` | append `CardRowProps` (BRIEF §5 rule 11: shared types live here) |
| `src/pages/bf-probe/27-bf-card-row.vue` | new probe |
| `src/components/bf/Card.vue` | part (a) + a `[data-row]` modifier block |
| `docs/ds-epic/issues/27-bf-card-row.md` | Decisions section |

### The component

```ts
interface CardRowProps extends CardWrapperProps {
  item: Insight | Project
  variant?: string
}
```

- `inheritAttrs: false`; renders `<bfCard v-bind="$attrs" data-row>` — no new
  stylesheet, only a **row modifier** on the base (the runner brief's
  constraint), and the base's own slots.
- Type guard, not `instanceof`: `'publish_date' in item` discriminates.
  `publish_date` is Insight-only and always present on the schema (nullable,
  but the key exists); `external_url` is on **both** schemas, so the spec's
  "`kind`/`external_url`" phrasing is narrowed to `kind` in the negative
  branch. Recorded as a decision.
- Insight branch: format chip (`formatLabel`), conditional `Archive` chip,
  `/insights/:slug` link, `<bfTime :date="item.publish_date" />`.
- Project branch: `kindLabel` chip, `/projects/:slug` link, **no time**
  (projects carry no display date in the row markup).
- Heading via `<component :is="\`h${headingLevel}\`">`, default 3, `v-if` on
  non-empty heading (#130 — never a stretched link with no accessible name).
- `variant` is an open string, rendered as `:data-variant` for a consumer to
  style. Documented in the probe.

### The layout

The spec asks for chip + heading + time on one visual line via a `.cluster`
`data-gap="xs"` — mirroring `archive.vue:17`. But `bfCard` renders its chips
slot in its own `.bf-card__chips | cluster` wrapper with `order: -1`, which
stacks it *above* the heading. So the row modifier is what flattens the card:

```css
.bf-card[data-row] { flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: var(--_bf-card-row-gap); }
.bf-card[data-row] .bf-card__chips { order: 0; }
.bf-card[data-row] > time { margin-block-start: 0; }
```

with `--_bf-card-row-gap: var(--space-xs)` declared on the modifier, per the
spec's Styling section. Tokens only; no `:not()` at all, so D-20.5 is moot.
No new colour. Heading takes no `white-space: nowrap` and no fixed width, so a
980-character heading wraps.

### The probe — `src/pages/bf-probe/27-bf-card-row.vue`

`bf-probe` layout, `[data-probe-verdict]` root + `[data-probe-row][data-ok]`
rows per `docs/decisions/probe-harness.md`. Real content through
`useAsyncData` + `queryCollection` (probes 21/22 shape), rendered in a plain
`stack` — one `<ul class="stack">`, one `v-for` over a **mixed array** of
insights and projects, proving the union works from one call site. Includes
one insight whose heading is 980 real characters.

Assertions: both branches render from one `v-for`; the insight row carries a
`<time datetime>` and the project row does not; chip labels come from the
formatters; the row lays out on one line (chip, heading and time share a
baseline / the row's content box is one line for the short rows); the
980-char heading wraps to multiple lines without the row's inline size
exceeding the container; `headingLevel` renders the asked-for element;
`variant` reaches `data-variant`; `$attrs` fallthrough.

## Verification

```bash
cd bfna-website-nuxt
npx nuxt typecheck 2>&1 | grep -cE 'error TS'        # ≤ 178 (baseline)
npx nuxt typecheck 2>&1 | grep -E 'error TS' | grep -E 'src/(components/bf|types|composables/bf)|content\.config' | wc -l   # 0
npx nuxt generate                                     # exit 0
test -f src/components/bf/CardRow.vue
grep -q "Insight | Project" src/components/bf/CardRow.vue
grep -q "bf-card-row" .output/public/bf-probe/27-bf-card-row/index.html
npx tsx scripts/check-probes.ts --only 27
npx tsx scripts/check-probes.ts --only 20
npx tsx scripts/check-probes.ts                       # full run
```

plus the cumulative wireframe byte-identity diff (must print nothing).

## Test strategy substitution

The vitest harness on `dev` is broken and pre-existing (residual #86). The
spec names `npm run typecheck`, which invokes it; the equivalent-strength
check is the typecheck gate above plus `scripts/check-probes.ts`, exactly the
#109 harness decision. Recorded in the spec's Decisions section.
