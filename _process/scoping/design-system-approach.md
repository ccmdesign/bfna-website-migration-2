# Front 3 — Design System approach (v2, 2026-07-31)

> **Amended 2026-09-02 per `docs/ds-epic/BRIEF.md` D1 — `bf-*` supersedes `ccm*`-first.**
> Prefix amendment only; this remains a 2026-07-31 scoping record, not a current plan.
> Where it conflicts with the BRIEF, **the BRIEF governs** — in particular: no new colour
> literals or `--color-*` tokens (§5.2 / DoD-6), no art direction or rebrand (D5), and
> legacy retirement happens in phase 7 / issues 57–59, not per-tier (D2).

How we build the design system: decisions, workstreams, sequencing. Brownfield: evolve existing BFNA visual identity under the `bf-*` design system, no rebrand. Companion to `fronts/03-design-system.md`.

**The component list lives in `component-inventory.md`** — every component, variant, DS counterpart, and the full legacy retire mapping. This doc doesn't repeat it.

## Decisions (locked with Claudio, 2026-07-31)

1. **Migration order: bottom-up.** Atoms → molecules → organisms → templates, migrating legacy usages across all pages at each tier before moving up.
2. **Token capture: extract from code.** Audit `public/global.css` + the current live site and formalize the BFNA visual language into hsl tokens. No Figma-first reference sheet; the branding already exists in code.
3. **A11y baseline: WCAG 2.1 AA now.** Don't wait for the GGS audit report. Fix the duplicate-h1 bug, wire axe linting into CI. If the full GGS report surfaces, diff it against this baseline.

## Current state (audited)

- 13 `ccm*` components in `src/components/ds/`, quarantined to blog/docs today — historical audit; they are the prior generation and the `bf-*` epic does not touch them; 23 legacy components in `src/components/legacy/` carry ~85–90% of pages. Per-component mapping: see inventory.
- **Tokens** live in `public/global.css`, **hsl** format (`--*-hsl` triplets composed via `hsla()`). Fonts: `trade-gothic-next` for both heading and primary.
- **Token debt found:** unresolved SCSS placeholders shipped as literals — `--colors-default: $black;`, `--colors-orange: $orange;`, `--colors-red: $red;`, `--colors-teal: $teal;`, `--colors-yellow: $yellow;`. These resolve to nothing in CSS. Two parallel naming schemes coexist (`--color-*` hsl-based vs broken `--colors-*`). Cleanup is step 0 of tokenization.

## Workstream 1 — Token foundation (step 0, no dependencies)

1. Checkpoint-commit before touching `global.css` (repo rule).
2. Full inventory of `global.css` custom properties; delete the dead `--colors-*` scheme after grepping for usages.
3. Formalize the BFNA palette as hsl tokens: navy (default/primary text), yellow (accent), green, red, purple, gray ramp (05/10/20/30/70/80), semantic aliases (`--color-primary`, `--color-accent`, `--color-error`, `--color-success`, `--color-warning`).
4. Type scale: base 1rem / 1.62 line-height, trade-gothic-next stack; formalize the heading scale off the live site.
5. Spacing/radius/shadow: extract what the live site actually uses; no invented scale.
6. Verify light AND dark modes render after every token change (repo rule).

**Deliverable:** cleaned `global.css` (or successor token file) that both legacy and `bf-*` components read from — one source of truth before any component migrates.

## Workstream 2 — Bottom-up migration (legacy → bf-*)

Method, per tier: port BFNA styling into the `bf-*` component (variants/props, not forks), swap all legacy usages, delete the legacy file. One tier per PR minimum; checkpoint commits within. Which legacy component maps to which target: see the inventory's counterpart columns and retire list.

- **Tier 1 — atoms.** Smallest possible first PR; proves the pipeline (Logo consolidation).
- **Tier 2 — molecules.** The card-family consolidation is the bulk of it and also yields the new insight card; filters consolidate on current usage, new-UX variants added later as props.
- **Tier 3 — organisms.** Nav and footer; the data-driven nav (one registry fed from content/Directus) replaces the nav hardcoded in 4 legacy components.
- **Tier 4 — templates.** Rebuilt on the new UX templates; last to move under bottom-up.

## Workstream 3 — New components

Inventory delivered from the Front 2 wireframes (2026-07-31) — see `component-inventory.md` for the evolve/rebuild/new/retire breakdown. Principles:

- All built `bf-*`-first — no new legacy components, ever.
- Components must tolerate real-length content (legacy excerpts run 100–980 chars), not lorem.
- **Acceptance test:** each built component drops into its corresponding `/wireframes/*` slot and renders the same content.json data.

## Workstream 4 — Accessibility

- Baseline: **WCAG 2.1 AA**.
- Fix duplicate-h1 bug; enforce one h1 per page and sequential heading levels in templates.
- Keyboard nav (esp. new data-driven nav + OffCanvas replacement), visible focus states, contrast checked against the hsl tokens in both modes, alt text required on content images.
- CI: axe-based linting (e.g. vitest-axe or @nuxtjs/html-validator + axe run against built pages) so regressions fail the build.
- If the full GGS a11y report ever arrives, diff its findings against this baseline; otherwise this baseline IS the source of truth.

## Sequencing

1. Workstream 1 (tokens) — start now, no dependencies.
2. Workstream 2 tiers 1–2 — after tokens; no wireframe dependency (consolidate on current usage; new-UX variants added as props).
3. Workstream 4 CI wiring — parallel with 1–2.
4. Workstream 2 tiers 3–4 + Workstream 3 — unblocked: Front 2 wireframes + inventory landed 2026-07-31.

## PENDING (from Claudio's answers doc)

- **Q14** design authority: assumed CCM; if GGS reviews, insert a review gate before each tier merges.
- **GGS a11y full report**: not blocking (see Workstream 4).

## Conventions (repo rules, restated)

hsl not oklch; test light + dark after theme changes; `checkpoint: pre-<thing>` commit before risky refactors; revert to checkpoint, never fix forward through broken theme state; "inline styles" = Tailwind class soup.
