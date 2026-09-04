# 37 — `bfHero` — homepage hero

One-line objective: evolve `wfHero.vue` into `bfHero`, the full-bleed
homepage hero band.

## Context

Depends on 02 (`bf-scaffold`), 15 (`bfButton`, likely used inside the
default/actions slot by callers — not by this component itself). Builds
from `src/components/wireframe/wfHero.vue`. Consumed by 47 (home template).
Provenance: BF-166.

## Scope

- File: `src/components/bf/Hero.vue` → `<bfHero>`.
- Props:
  ```ts
  interface Props {
    heading?: string | null
    description?: string | null
  }
  ```
  Default slot for action buttons (the part that varies per the wf source's
  own comment).
- Root: `<section class="bf-hero">` with the same taller minimum height the
  wireframe uses (`min-height: 60svh` in `wireframe.css`'s `.wf-hero` — port
  the value, not the class name, into `--_bf-hero-min-height`).
- Renders `<h1>{{ heading }}</h1>` (this **is** the page h1 — no `level`
  prop, not configurable away, matching the wf source's implicit "hero
  owns the h1" contract and the acceptance line "heading level is the
  page h1 and is not configurable away"), conditional `<p data-measure=
  "normal">{{ description }}</p>`, and a `.cluster` wrapping the default
  slot only when `$slots.default` is present (matches `wfHero.vue`'s
  `v-if="$slots.default"` guard).
- Composition classes (`.center | .stack`, `data-gap="s"`) drive internal
  spacing; sizing comes from the Utopia type scale, not a bespoke
  `font-size`.

## Out of scope

- Background imagery or art direction (D5 — no art direction in this
  epic).
- Carousels (no wireframe evidence).
- Inner-page headers — that is `bfPageHeader` (issue 38), a separate
  component, not a variant of this one.
- No edits under `pages/wireframes/` or `components/wireframe/` (D2).

## Styling

- CSS variable `--_bf-hero-min-height` (`60svh`, ported from `.wf-hero`).
  No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Hero.vue
grep -q "<h1" src/components/bf/Hero.vue
! grep -q "level" src/components/bf/Hero.vue
```
Probe page `src/pages/bf-probe/37-bf-hero.vue` renders heading-only,
heading+description, and heading+description+actions forms:
```bash
[ "$(grep -c '<h1' .output/public/bf-probe/37-bf-hero/index.html)" = "3" ]
! grep -q -- "--color-.*:.*#" src/components/bf/Hero.vue
```
Fails today (no `bf/Hero.vue`), passes once done.

> **Amended 2026-09-04, gh#249.** Both `grep -Lq` lines above are now `! grep -q`,
> writing back the substitution D-37.5 §1 published but never applied to this block,
> and `background-image` has been dropped from the second pattern. It was the last
> mechanical enforcement of BRIEF D5 / §5 rule 2 standing in front of work that has to
> paint one: BF-220 gives `bfHero` a photograph and a scrim. The colour-literal half of
> the assertion is kept — a hard-coded hex in this component is still a defect — and
> what a new colour now has to clear is a measured contrast floor rather than a ban. See
> [`docs/decisions/design-phase-colour-and-art-direction.md`](../../decisions/design-phase-colour-and-art-direction.md).
> D-37.5 §2's `grep -c` defect is **not** amended here: gh#249's scope is the colour
> rule, the substitution below still stands, and rewriting a passing check that no one
> is blocked on is not this issue's business.

## Decisions

Appended by the item-runner for [gh#46](https://github.com/ccmdesign/bfna-website-migration-2/issues/46).

### D-37.1 — the `<h1>` is unconditional, and the word `level` is absent from the file

The spec greps the **source** for the absence of `level`, so it appears nowhere
in `components/bf/Hero.vue` — not in a prop, not in a comment. Where the
reasoning had to be written down it is written as *"heading rank"*, and the
long-form version lives in `HeroProps` in `types/bf-contracts.ts`, which the
grep does not cover and which is where the contract belongs.

`heading` stays optional and nullable (`string | null`, `wfHero`'s own type,
and what `pages.json`'s `home` row actually supplies), but the `<h1>` element
itself is **not** guarded by it. A hero with no heading is a caller bug and an
empty `<h1>` is the honest render of it; suppressing the element would leave
the page silently without a top-rank heading, which BRIEF §5 rule 9 cares about
more than it cares about an empty one.

### D-37.2 — `HeroProps` lives in `bf-contracts.ts`

BRIEF §5 rule 11, and the majority precedent: `ButtonProps`, `ChipProps`,
`MediaProps`, `TimeProps`, `BylineProps`, `AccordionProps`, `LoadMoreProps`,
`EmptyStateProps`, `FormFieldProps` and the rest are all declared there.
`bfNav` and `bfFooter` declare theirs inline, but they are the exception and
their props are a single shared `Menu[]`.

### D-37.3 — the band ports three declarations by value; padding is not one of them

`wireframe.css` gives the hero exactly
`min-height: 60svh; display: grid; align-content: center`, and all three are
ported into `.bf-hero` in `@layer components` — the values, not the class name
(D2). Only the height is behind a hook, `--_bf-hero-min-height`: a hub or a
campaign band may want a shorter one, whereas a caller who wants a different
layout *inside* the section wants a different section.

`min-height`, not `min-block-size`: the ported declaration is the property the
frozen source writes.

The wf root also carries `wf-slot`, which contributes
`padding-block: var(--space-3xl)` and the wireframe's dashed label box. That is
scaffolding, not hero, and it is **not** ported: with `min-height: 60svh` and
`align-content: center` the copy already sits in the optical middle of the
band. Band padding is `bfSection`'s (issue 39), which does not exist on `dev`
yet — the same situation `bfEmptyState` recorded at gh#42.

No `font-size` is declared anywhere in the component: `h1` already resolves to
`var(--size-4)` and the `<p>` to the body size, both Utopia, in
`base/typography.css`'s `@layer defaults`. Probe 37 asserts the hero's `h1`
computes the same size as a `.h1` reference, and that the component's own rule
declares no `font-size`, `color`, `background` or `border`.

### D-37.4 — `v-if="$slots.default"` is kept, and it has a foot-gun the callers must know about

The guard is `wfHero`'s and the spec asks for parity, so it is unchanged. But
`$slots.default` is truthy whenever the **parent passed slot content at all**,
regardless of whether that content renders anything: a call site writing

```vue
<bfHero :heading="…"><template v-if="hasActions">…</template></bfHero>
```

gets an empty `.cluster` — and therefore a `.stack` gap — under a hero with no
actions. Probe 37 caught exactly this on its first run, from its own template.

Not fixed here, because a content-emptiness check would diverge from both the
frozen source and this spec's own wording, and that is a contract change
needing sign-off rather than a mechanical review fix. Filed as a residual
finding for the home template (issue 47) to consume: **pass no slot at all
when there are no actions**, rather than passing a slot that renders nothing.
The probe is written that way, which is also how a real call site behaves.

### D-37.5 — acceptance substitutions (two spec commands, as written, are wrong)

Both are defects in the command, not in the component; both were verified
against controls before being substituted, and both substitutions assert the
identical property.

1. **`grep -Lq` is inverted.** `grep -L` lists files *without* a match, but
   `-q` short-circuits to plain quiet-match semantics, so
   `grep -Lq "level" src/components/bf/Hero.vue` exits **0 when `level` IS
   present** — the opposite of the intent. Verified: it exits `1` for
   `Hero.vue` and `Button.vue` (neither contains the word) and `0` for
   `CardInsight.vue` (which does, four times). As written the command would
   fail a correct component and pass a violating one. Substituted with the
   negation, for both `grep -Lq` lines:

   ```bash
   ! grep -q "level" src/components/bf/Hero.vue
   ! grep -q "background-image\|--color-.*:.*#" src/components/bf/Hero.vue
   ```

   *(As run at gh#46. gh#249 has since written both negations back into the
   acceptance block above and dropped `background-image` from the second pattern —
   see the amendment note there. The `level` line is unchanged in substance.)*

2. **`grep -c` counts lines, not occurrences.** Nuxt's prerendered HTML is a
   single line — `wc -l .output/public/bf-probe/37-bf-hero/index.html` is `0` —
   so `grep -c '<h1' …` reports `1` for a page holding three. (Probe 33's
   equivalent check passes only because its expected value happens to be `1`.)
   Substituted with an occurrence count, same assertion:

   ```bash
   [ "$(grep -o '<h1' .output/public/bf-probe/37-bf-hero/index.html | wc -l | tr -d ' ')" = "3" ]
   ```

   All three are `class="bf-hero__heading"`, one per form; the probe's own
   report is headed by an `<h2>`, the `--size-4` type reference is a
   `<p class="h1">` rather than a fourth `<h1>`, and `layouts/bf-probe.vue` is
   a bare `<slot />` that contributes no heading — all three verified in the
   emitted HTML.

3. **`npm run typecheck` → the no-new-errors gate.** `dev` carries 178
   pre-existing `error TS` (residual #71), so a green run is impossible. The
   gate applied is the orchestrator's: the total must not rise, and the count
   inside `src/components/bf`, `src/types`, `src/composables/bf` and
   `content.config` must be zero. Measured before any edit: **178 / 0**. After:
   **178 / 0**.

4. **vitest is substituted by the probe**, per residual #86 and the #109
   harness decision — `npx tsx scripts/check-probes.ts --only 37` (35 rows) and
   the full suite (29 probes, 1324 rows), both exit 0.

### D-37.6 — the probe mounts all three forms at once, and carries three `<h1>`s

The inverse of probe 33's choice, for the same reason stated the other way
round: that spec counts one `<h1>`, this one counts three. `/bf-probe/37-bf-hero`
is therefore the one page in the epic that deliberately does not satisfy BRIEF
§5 rule 9. A probe is a measuring instrument rather than a page of the site,
the rule under test is *"`bfHero` contributes exactly one `h1`"* — asserted per
component root — and the only honest way to test three configurations of that
at once is to render three.

The `min-height` row compares against a live `60svh` reference element with
**±1px of tolerance**, the allowance `docs/decisions/probe-harness.md` already
records for probe 03: Chrome snaps a used `min-height` to its 1/64px
`LayoutUnit` grid while reporting a `height` unrounded, so an identical `60svh`
reads `614.4px` against `614.391px`. A wrong unit or a missing declaration
still fails the row, because either moves the value by hundreds of pixels.
