# Front 3 — Design System

Read `00-shared-context.md` first. **Phase: discuss + specify.** Brownfield — evolve the existing BFNA visual identity, NO rebrand. New components must look like a natural evolution of the old site while serving the new UX from Front 2.

## Scope

- One component library serving all pages, extending the `ccm*` design system with BFNA's existing branding (colors, type, general look of the current site).
- Retire the legacy component stack: ~85–90% of pages sit on it today; `ccm*` components are quarantined to blog/docs. Migration path legacy → ccm* per template.
- Components implied by the new UX: data-driven nav (replaces nav hardcoded in 4 legacy components), program hub blocks, project page blocks (overview / participation path / outcomes / related content), insight cards + unified feed with format facets, archive listing (labeled), CTA patterns, external-link treatment, newsletter signup form.
- Accessibility baked in: heading hierarchy (current duplicate-h1 bug), keyboard nav, contrast, alt text. A11y linting in CI so it stays fixed.

## Constraints & conventions

- Nuxt/ccmdesign repo rules apply: check CSS variable format before writing values (hsl vs oklch), test light AND dark modes after theme changes, commit checkpoints before risky theme refactors, "inline styles" = Tailwind class soup.
- Visual reference is the existing BFNA branding — the old site's look is the baseline to evolve, not to copy structurally.

## Open questions affecting this front

- Q14: is CCM the design authority, or does GGS review designs? (Their contract lapsed; assume CCM.)
- GGS a11y audit: only an exec summary exists; the full report link 404s. Either get the full report from Irene/GGS or budget our own audit — affects the a11y checklist this front works to.
- Copy: no final GGS copy ever arrived; working text is Irene's own (Jul 29 docx). Components should tolerate real-length content, not lorem.

## Issues to resolve at kickoff (logged from Front 2, Jul 31 2026)

- **Color primitive naming: tint/shade vs numeric scale.** Current system: `--color-{name}-tint-XX`/`shade-XX`, auto-generated via `color-mix` from single base hues (~800 vars defined in `tokens/*-shades-and-tints.css`). Alternative: industry-standard `--color-{name}-500` scale. Actual usage today is ~12 distinct tokens / ~30 usages, so migration is trivial either way — decide once at kickoff. Lean: keep tint/shade (one-brand site, auto-ramps earn their keep), prune unused steps.
- **Enforce semantic-only rule.** Components must use semantic tokens (`--color-primary`, `--color-text`, `--color-surface`…) only — never primitives. Current violations: `--color-base-tint-05` et al. used directly in components. This rule makes the primitive-naming decision above a swappable implementation detail.
- **`semantic-colors.css` cleanup**: `--color-neutral` defined twice; `--color-error: var(--color-fail)` is declared before `--color-fail: var(--color-red)` — untangle the chain.
- **`ccmSection` fixes**: `fullWidth` prop has no CSS behind it (no-op); props leak onto the DOM as junk attributes (`image-left`, etc. rendered on `<section>`).

## Dependencies

- Component inventory delivered from Front 2 wireframes: `../component-inventory.md` (Jul 31 2026). Feeds Front 4 (feature UIs use these components).
- Waits on: Claudio's answers doc (mainly Q14 + a11y source of truth).
