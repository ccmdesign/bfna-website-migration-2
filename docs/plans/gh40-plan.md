# Plan — gh#40 / issue 31 · `bfAccordion`

**Spec:** [`docs/ds-epic/issues/31-bf-accordion.md`](../ds-epic/issues/31-bf-accordion.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) · **Base:** `dev` @ `7494a58`

## Approach

A styled skin over native `<details>`/`<summary>`, and nothing else. The whole
value of the component is what it does *not* do: no `aria-expanded`, no
`role="button"`, no `v-show`, no open-state ref. The browser already owns the
disclosure widget's semantics, its keyboard contract (Enter **and** Space on the
`<summary>`), and — the part a hand-rolled version gets wrong — the fact that
content inside a closed `<details>` is removed from the tab order for free.

Three things the native element does *not* give us, which this component adds:

1. **A visible focus ring on the `<summary>`.** Chrome paints a UA ring, other
   engines vary, and the CUBE stack declares no `summary:focus-visible` rule —
   the same gap `bfBreadcrumb` found for `a:focus-visible` (gh#37 P2-1). Ring
   colour comes from `--_bf-accordion-focus-color: var(--color-text)`, the
   gh#24-P2-1 pattern: the ring is drawn on the page ground, so `currentcolor`
   would risk light-on-light.
2. **A CSS-drawn marker.** `list-style` on a `<summary>` produces a marker some
   screen readers announce as list-item text (`::marker` content is in the
   accessible name computation the same way `::before` is — the
   `bfBreadcrumb` separator lesson). So: `list-style: none` +
   `summary::-webkit-details-marker { display: none }` to kill the UA glyph, and
   a `::after` chevron with **empty alternative text**
   (`content: "…" / ""`) as the visible affordance.
3. **Spacing and a rule line** from Utopia space tokens, so the band reads as a
   band inside a section without a hand-pinned pixel anywhere.

## Files

| File | Change |
|---|---|
| `bfna-website-nuxt/src/components/bf/Accordion.vue` | **new** — the component |
| `bfna-website-nuxt/src/types/bf-contracts.ts` | **+** `AccordionProps` (majority atom precedent: Logo/Button/Chip/Media/Time/Byline/SkipLink/FilterBar all export theirs) |
| `bfna-website-nuxt/src/pages/bf-probe/31-bf-accordion.vue` | **new** — probe, `layout: 'bf-probe'`, `data-probe-keys="Enter,Space"` |
| `docs/ds-epic/issues/31-bf-accordion.md` | **+** Decisions section |
| `docs/plans/gh40-plan.md` | this file |

Nothing under `pages/wireframes/`, `components/wireframe/`, `layouts/wireframe.vue`
or `public/css/wireframe.css` is touched. `archive.vue` is read for parity only.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under `scripts/check-probes.ts` — the gh#20–#30
precedent, per `docs/decisions/probe-harness.md`.

Probe `31-bf-accordion` renders, at minimum:

- a **closed** accordion (no `open` prop) and an **open-by-default** one
  (`:open="true"`) — the spec's two named cases;
- a **parity** case reproducing the archive page's per-year block: a summary
  string of the `2024 (17)` shape and a `.stack` list of chip + link + time
  inside, so the real content shape is exercised;
- a **long-content** case (BRIEF §5 rule 10 — real excerpt lengths);
- a **keyboard row**: `data-probe-keys="Enter,Space"` dispatched as trusted CDP
  events onto the focused `<summary>`, asserting the toggle actually flipped
  `details.open` twice and that both key events were `isTrusted`;
- **tab-order**: a focusable control inside a closed accordion is *not*
  reachable (`el.focus()` corroborated by an offsetParent/`checkVisibility`
  read), and becomes reachable once open;
- **no re-implemented ARIA**: zero `aria-expanded` / `role="button"` anywhere on
  the page's accordions;
- **layer + inline-style + `$attrs`** rows, as every atom probe carries;
- **marker**: `::marker`/`::-webkit-details-marker` painted nothing, `::after`
  paints the chevron with empty alt text, `list-style-type: none`;
- **focus ring**: a `summary:focus-visible` rule exists in `@layer components`,
  declares both outline and the `--outline-focus` halo, and resolves through
  `--_bf-accordion-focus-color` rather than `currentcolor`.

Gates, in `bfna-website-nuxt/`:

```
npx nuxt typecheck   # ≤ 178 baseline, 0 in src/components/bf|types|composables/bf
npx nuxt generate
npx tsx scripts/check-probes.ts --only 31
npx tsx scripts/check-probes.ts
grep -q "<summary" .output/public/bf-probe/31-bf-accordion/index.html
```

Plus the wireframe byte-identity diff (must print nothing).

## Risks / decisions to record

1. **`bfSection` does not exist yet.** The spec asks the probe to nest the
   accordion inside `bfSection` "(issue 39)" — but issues.md row 39 (`bf-section`)
   maps to **gh#48**, which runs *after* this one; this issue's only
   `Blocked-by` is #11. The probe therefore nests each accordion in a plain
   `<section class="section stack" data-gap="m">` band built from the same CUBE
   primitives `bfSection` will render, which is what the "no layout breakage"
   claim is actually about. Recorded in Decisions.
2. **D-20.5 (gh#29)** — no `:not()` with a complex selector. The "closed" and
   "open" branches are expressed as `details[open]` / plain `details`, which
   needs no negation at all.
3. **`:open` is a boolean attribute binding, not state.** `<details :open="open">`
   sets the *initial* attribute; the user's clicks then mutate the DOM property
   and Vue does not fight them, because nothing re-renders that node. No
   `v-model`, no `@toggle` handler, no emit — the spec's "no JS state of its own".
4. **No `height` animation** (spec, out of scope). A `grid-template-rows`
   transition would need a wrapper and buys nothing the wireframe evidences.
5. **No new colour.** Ring `--color-text`, marker/rule `--color-neutral-tint-*`,
   both existing semantic tokens.
