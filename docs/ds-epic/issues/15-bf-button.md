# 15 — bf-button

Componentise the raw `.wf-button` CSS class as `bfButton`, rendering
`NuxtLink`/`<a>`/`<button>` from one component.

## Context

Depends on 02, 06. Blocks 32 (`bfLoadMore`), 37 (`bfHero` actions slot),
40 (`bfCtaSection`), 44 (`bfContactSection`) — all consume `bfButton`.
Builds from `.wf-button` (`bfna-website-nuxt/public/css/wireframe.css`
lines 262-276 — raw lo-fi styling, `#222`/`#fff` literals, no token), used
today by 2 components (`wfCtaSection.vue`, `wfContactSection.vue`) and 5
pages, always as a raw `class="wf-button"` on hand-written `<button>`/`<a>`
elements — never a Vue component. Provenance: BF-156; v2 §2 Level 1 row 2.

## Scope

- New `bfna-website-nuxt/src/components/bf/Button.vue` (`<bfButton>`).
- Element resolution (same three-way branch `wfChip.vue` already
  demonstrates for chips): `to` prop set → renders `<NuxtLink :to="to">`;
  `href` prop set (and no `to`) → renders `<a :href="href">` with
  `[data-external]` marker when `external` is true (same attribute
  convention as `wfChip.vue:13`'s `:data-external="external || undefined"`);
  neither set → renders `<button type="button">`.
- Props: `to?: string | Record<string, unknown>`, `href?: string`,
  `external?: boolean`, `variant?: 'primary' | 'default' = 'default'`
  (mirrors `.wf-button[data-variant="primary"]`'s filled variant — the
  unstyled default is the base), `size?: string`, `disabled?: boolean`.
- Slots: `default` (label content).
- States: visible focus ring (existing focus-ring token/utility — reuse,
  don't invent); `disabled` renders a non-interactive, non-focusable
  `<button disabled>` (the `to`/`href` branches don't support a native
  `disabled` — when `disabled` is true and `to`/`href` are set, still
  render as `<button disabled>`, never a disabled-looking but clickable
  link).
- `$attrs` forwarded to the root element; `inheritAttrs: false` +
  `v-bind="$attrs"` on whichever of `NuxtLink`/`a`/`button` is rendered.

## Out of scope

- Icon-only or loading-spinner variants — no wireframe evidence, not built.
- Editing `.wf-button` in `public/css/wireframe.css` — that file, and every
  file under `pages/wireframes/`/`components/wireframe/`, is frozen (D2);
  `bfButton` gets its own styling from tokens, it does not reuse the
  `.wf-button` class.
- Any new colour — the primary/default variant styling comes from existing
  semantic tokens (`--color-primary`, `--color-text`, etc.), not the
  literal `#222`/`#fff` the wireframe class uses.

## Styling

Tokens: `--color-primary` (or the button-appropriate semantic token) for
`variant="primary"`'s fill, `--color-text`/`--color-surface` for the
default/unstyled variant, existing focus-ring token. CSS-variable hooks:
`--_bf-button-bg`, `--_bf-button-color`, `--_bf-button-border`,
`--_bf-button-padding` — bound via a computed `cssVars` per BRIEF §5.4.
`@layer components`. hsl format, not oklch.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/Button.vue   # today: fails
grep -c "NuxtLink" src/components/bf/Button.vue    # after: >=1
grep -c "variant" src/components/bf/Button.vue     # after: >=1
grep -c "wf-button" src/components/bf/Button.vue   # after: 0 — does not reuse the frozen class
git diff --stat -- public/css/wireframe.css   # must be empty
```
Plus: the full variant × size × element (`to`/`href`/`button`) matrix
renders on a probe page, every instance is keyboard-reachable with a
visible focus state (per the issues.md `verify` column — manual check).

## Decisions

_Runner appends here._

### D15.1 — `disabled` outranks `to` and `href`

The spec says a disabled `bfButton` renders `<button disabled>` even when
`to`/`href` are set; the element-resolution branch therefore tests `disabled`
**first**. Neither `<a>` nor `NuxtLink` supports a native `disabled`, and the
`aria-disabled` + `pointer-events: none` fake leaves an element that is still
in the tab order and still activates on Enter — which would fail this issue's
own "disabled state non-focusable" acceptance. `scripts/verify-bf-button.ts` §6
asserts against the prerendered HTML that every `disabled` attribute on the
probe page sits on a `<button>` and that no `aria-disabled` appears at all.

### D15.2 — the default variant paints no ground

The wireframe class fills white; the `bf-*` default fills **nothing**
(`--_bf-button-bg: none`). BRIEF §5 rule 2 bans the `--color-white` primitive,
the semantic layer has no `--color-surface`, and the only white-ish semantic
name is `--color-text-inverse`, whose meaning is text rather than ground. On
the white page ground the render is identical to the wireframe's; on a dark
panel the button stays usable, which a hard-coded white would not. `none`
rather than `transparent` also keeps the shared colour-literal scan (inherited
from `verify-bf-logo.ts`, which counts a bare `transparent` as a literal)
green.

### D15.3 — primary is `--color-primary` + `--color-text-inverse`

The Styling section names `--color-primary` first, and it is the
button-appropriate semantic token, so `variant="primary"` fills with it and
labels with `--color-text-inverse` — the semantic alias gh#101 added precisely
so a `bf-*` component would stop reaching for the `--color-white` primitive
(residual #99). Contrast is ≈6.2:1, WCAG 2.1 AA at any size. The primary
border is the same token as the fill, so the 2px box is unchanged between
variants and a row of mixed buttons stays aligned.

### D15.4 — `size` changes only the font size

`.wf-button`'s padding is `0.4em 1.2em`, so the box is already font-relative.
`size` therefore sets nothing but `--_bf-button-font-size`, and the padding
scales with it — there is no per-size padding table to drift. `s`/`m`/`l` map
onto the existing Utopia steps `--size--1`/`--size-0`/`--size-1`; **omitting**
`size` inherits, which is what the wireframe class's `font: inherit` does, so
an unsized `bfButton` is wireframe-exact wherever it is dropped. `size` is
typed as the spec types it — an open `string` — and an unrecognised value
degrades to that same inheriting base rather than erroring.

### D15.5 — `cssVars` carries only what a prop changes

`:style="cssVars"` binds `--_bf-button-bg`/`-color`/`-border` for
`variant="primary"` and `--_bf-button-font-size` for a recognised `size`;
every default lives in the stylesheet inside `@layer components`, where a
consumer's own rule can outrank it (an inline style cannot be). This is the
repo's own Standard 5 reading — "only set overrides when necessary", as
`ccmButton` does. `v-bind="$attrs"` is placed **after** `:style`, so a
caller's own `style` wins the merge; the probe asserts that escape hatch by
overriding a primary button's label colour from the call site.

### D15.6 — acceptance substitutes for vitest (residual #86)

The vitest harness on `dev` is broken and pre-existing, and this issue's
acceptance must not depend on it. Following gh#20–gh#23, acceptance is:

* the probe at `src/pages/bf-probe/15-bf-button.vue` — 24 matrix instances
  (3 elements × 2 variants × 4 sizes) plus 3 disabled and 2 `$attrs` probes,
  with a `data-testid="probe-15-verdict"` PASS/FAIL cell; **kept in place**,
  only the final cutover issue removes `bf-probe/`;
* `npx tsx scripts/verify-bf-button.ts`, which runs the spec's five literal
  `test`/`grep` expressions as written and adds the relational checks.

The two metric assertions are deliberately not typed twice: the script parses
the padding and border width back out of the frozen `wireframe.css` and
compares them with what the component declares, and the probe loads
`/css/wireframe.css` read-only to measure a real off-screen wireframe button
against a rendered `bf-button` at the same font size. Drift on either side
fails.

### D15.7 — `@layer components` asserted twice

gh#101 turned off `postcss-preset-env`'s cascade-layers polyfill because it
flattened the wrapper every `bf-*` component ships. That is checked here in
the emitted stylesheet (`verify-bf-button.ts` §4, over
`.output/public/_nuxt/*.css`) **and** in the live CSSOM on the probe, so a
build-config regression fails loudly rather than silently reordering the
cascade.

### D15.8 — the `[data-external]` marker is emitted, not defined

`bfButton` renders `:data-external="external || undefined"` on the `href`
branch, matching `wfChip.vue:13` exactly (absent rather than `"false"` on
internal links). Formalising the marker as a documented style hook, and the
shared `isExternal(href)` helper, is issue 19's job — this issue only emits
the attribute, and ships no style for it.

