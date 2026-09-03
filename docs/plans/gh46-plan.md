# Plan — gh#46 / issue 37 — `bfHero`

**Spec:** [`docs/ds-epic/issues/37-bf-hero.md`](../ds-epic/issues/37-bf-hero.md) ·
**Epic:** [BF-217](https://app.plane.so/ccm-design/browse/BF-217/) ·
**Branch:** `feature/gh46-bfhero` off `dev`

## Approach

Port `src/components/wireframe/wfHero.vue` (read-only, D2) into
`src/components/bf/Hero.vue` one-for-one. The wf source is already
composition-driven — `<section>` wrapping `div.center | stack[data-gap="s"]`,
`<h1>`, conditional `<p data-measure="normal">`, and a `.cluster[data-gap="s"]`
guarded by `v-if="$slots.default"`. Nothing about that structure needs to
change; what changes is the class name (`wf-slot wf-hero` → `bf-hero`), where
the band's own three declarations live, and that the type comes from the shared
contracts file.

The band geometry currently lives in `public/css/wireframe.css`:

```css
.wireframe .wf-hero { min-height: 60svh; display: grid; align-content: center; }
```

That is ported by **value**, not by class name, into a scoped
`@layer components` rule on `.bf-hero`, with the height behind
`--_bf-hero-min-height` (default `60svh`) per the `--_bf-{component}-{property}`
convention (BRIEF §5 rule 4).

## Files

| File | Change |
|---|---|
| `src/types/bf-contracts.ts` | add `HeroProps` (`heading?`, `description?`, both `string \| null`) — BRIEF §5 rule 11, matching the Accordion/Button/EmptyState/… precedent |
| `src/components/bf/Hero.vue` | **new** — `<bfHero>` |
| `src/pages/bf-probe/37-bf-hero.vue` | **new** — probe, `layout: 'bf-probe'` |
| `docs/ds-epic/issues/37-bf-hero.md` | append Decisions |

Nothing else. No stylesheet outside the SFC, no token added, no colour.

## Design decisions taken up front

1. **No `level` prop, and the word does not appear in the file.** The spec's
   acceptance greps the *source* for its absence, so it cannot appear even in a
   comment. The `<h1>` is unconditional: the hero owns the page heading, as
   `wfHero` does implicitly and `bfEmptyState` (gh#42) does explicitly. This is
   deliberately unlike the card wrappers (#128), which take one *because*
   several appear per page.
2. **`heading` is optional and nullable, and the `<h1>` still always renders.**
   That is the wf contract exactly (`heading?: string | null`, unguarded
   `<h1>`). A hero with no heading is a caller bug, and an empty `<h1>` is the
   honest render of it; suppressing the element would make a page silently
   `h1`-less, which BRIEF §5 rule 9 cares about more.
3. **`.cluster` only when the slot is filled** — `v-if="$slots.default"`, the wf
   guard, so an actionless hero emits no empty flex box contributing a
   `.stack` gap.
4. **No `font-size` anywhere.** `h1` already resolves to `var(--size-4)` in
   `base/typography.css` `@layer defaults`, and the `<p>` to the body size;
   both are Utopia. A bespoke size here would be the thing the spec forbids.
5. **`min-height`, not `min-block-size`.** The ported value must be the ported
   property: `wireframe.css` writes `min-height`, and the probe reads it back.
6. **No `:not()` at all** (D-20.5), no `background-image`, no colour literal and
   no `--color-*` declaration (D5, BRIEF §5 rule 2, spec grep).
7. **`inheritAttrs` left at its default.** One root, nothing to choose between;
   a caller's `class` merges with `bf-hero` rather than replacing it.

## Test strategy

The vitest harness on `dev` is broken and pre-existing (residual #86), so
acceptance is the probe under the #109 harness, per the gh#20–#45 precedent.

`src/pages/bf-probe/37-bf-hero.vue` mounts **all three forms at once** —
heading-only, heading+description, heading+description+actions (`bfButton` in
the slot) — because the spec's own static check counts three `<h1>`s in the
prerendered HTML. The probe's own title is therefore an `<h2>`; the `bf-probe`
layout is a bare `<slot />` and contributes no heading of its own (verified).

Rows assert, against the live DOM and the live CSSOM:

- three `.bf-hero` roots, each with exactly one `<h1>`, carrying `heading`
  verbatim — and exactly three `<h1>` in the whole document;
- `description` renders only where given (no empty `<p>`), with
  `data-measure="normal"` and a resolved measure;
- the `.cluster` wrapper is **absent** in the heading-only and
  heading+description forms and present, with `data-gap="s"`, in the third;
- the resolved `min-height` is ≥ 60svh, measured against a `60svh` reference
  element rather than string-compared;
- `display: grid` and `align-content: center` — the two remaining `.wf-hero`
  declarations;
- `--_bf-hero-min-height` is declared in the rule and overridable from the call
  site;
- the rule sits in `@layer components` in the live CSSOM, declares no
  `font-size` and no colour, and no `bf-*` rule on the page uses `:not()` with a
  complex selector.

Then, in the app dir:

```bash
npx nuxt typecheck   # ≤ 178 (baseline), 0 in src/components/bf|types|composables/bf
npx nuxt generate
npx tsx scripts/check-probes.ts --only 37
npx tsx scripts/check-probes.ts
```

plus the spec's own greps and the wireframe byte-identity diff.

## Risks

| Risk | Mitigation |
|---|---|
| `grep -c '<h1'` counts *lines*, and Nuxt's prerendered HTML may be one line | verify against the real `.output/public` file; if it is line-collapsed, record the substitution (`grep -o … \| wc -l`, same assertion, working arithmetic) in the spec's Decisions rather than weakening it |
| the word `level` sneaking into a comment and failing `grep -Lq "level"` | grep the finished file as an explicit acceptance step |
| `60svh` unmeasurable headlessly | the harness pins the viewport (`1280x1024`), and the row compares against a live `60svh` reference element, not a constant |
| a `.cluster` rendered but empty | asserted absent in two of the three forms |
