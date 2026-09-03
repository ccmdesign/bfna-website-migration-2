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
