# 19 — bf-skip-link

Componentise the visually-hidden-until-focus skip link as `bfSkipLink`, and
formalise `[data-external]` as a documented, shared marker.

## Context

Depends on 02. Blocks 46 (site-shell layout wires `bfSkipLink` first in
DOM). This is one of the four permitted bundled issues (BRIEF §5.5 —
`bfSkipLink` + the `[data-external]` marker are internal to one concern and
demoed together). Builds from `.wf-skip-link`
(`bfna-website-nuxt/public/css/wireframe.css` lines 148-159) and
`[data-external]` (same file, lines 140-146,
`.wireframe a[data-external]::after { content: " ↗"; }`), already used by
`bfButton` (15) and `bfChip` (16) via their own `external` props. Provenance:
BF-161, BF-162; v2 §2 Level 1 rows 6-7.

## Scope

- New `bfna-website-nuxt/src/components/bf/SkipLink.vue` (`<bfSkipLink>`).
  Props: `target?: string = '#main'`. Slot: `default` (label text, e.g.
  "Skip to content" — same copy as `layouts/wireframe.vue:6`). Renders
  `<a :href="target" class="…">` visually hidden until `:focus`, matching
  `.wf-skip-link`'s behaviour (`left: -999px` unfocused, `left: 0` +
  visible background/padding on `:focus`) but via `--_bf-skip-link-*`
  tokens instead of the wireframe's raw `#222`/`#fff` literals.
- Formalise `[data-external]` as a documented style hook: add a small
  `isExternal(href: string): boolean` helper next to `utils/format.ts`
  (issue 10) — e.g. `bfna-website-nuxt/src/utils/link.ts` — that
  `bfButton`/`bfChip`/`bfCard*` can share instead of each re-implementing
  an ad-hoc "is this URL external" check. Base rule: an absolute URL
  (`^https?://` or protocol-relative) whose host differs from the site's
  own is external; a relative path or `#anchor` is not.
- Add the `::after { content: " ↗" }` marker rule for `[data-external]` in
  the `bf-*` component layer (`@layer components`), token-driven sizing
  instead of the wireframe's `font-size: 0.8em` literal (fine to keep
  `0.8em` if no token exists for "slightly smaller than surrounding text"
  — record that call in Decisions if so).
- Demo page shows `bfSkipLink` as the first focusable element AND at least
  one external anchor carrying the marker, together (BRIEF §5.5 bundling
  rule).

## Out of scope

- An external-link **component** — `[data-external]` stays an attribute
  marker per the inventory finding, not a wrapped component.
- Wiring `bfSkipLink` into the actual site-shell layout — that's issue 46
  ("skip link first in DOM" is 46's acceptance criterion, not this one's).
- Any new colour — the focus-visible background/text-colour pair reuses
  whatever semantic tokens `bfButton`'s primary variant already
  established (issue 15), not a new literal duplicating `#222`/`#fff`.
- Any edit under `pages/wireframes/` or `components/wireframe/`.

## Styling

CSS-variable hooks: `--_bf-skip-link-bg`, `--_bf-skip-link-color` (reuse
the same semantic tokens as `bfButton`'s primary variant — do not
duplicate the literal). `@layer components`. No new colour.

## Acceptance / verification

```bash
cd bfna-website-nuxt
npm run typecheck
npx nuxt generate
test -f src/components/bf/SkipLink.vue   # today: fails
test -f src/utils/link.ts                # today: fails
grep -c "isExternal" src/utils/link.ts   # after: >=1
grep -c "data-external" src/components/bf/SkipLink.vue   # after: >=1 (documents the marker in the same demo)
```
Plus: the skip link is the first focusable element on a probe page,
becomes visible on `:focus`, moves focus to the target on activation, and
an external anchor on the same probe page carries the `↗` marker (per the
issues.md `verify` column — manual/keyboard check).

## Decisions

_Runner appends here._
