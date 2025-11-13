# Demo Verification Workflow

## Purpose
- Ensure generated demos reflect required variants, states, and accessibility behavior.

## Steps
1. Run `npm run docs:demos:generate` to refresh demo SFCs and metadata.
2. Launch the Nuxt dev server (`npm run dev`) and navigate to affected docs pages.
3. Verify each variant/state renders and interacts according to the prompt instructions.
4. Use assistive technology tooling (keyboard navigation, screen readers) to validate accessibility hooks.
5. Capture optional static HTML via manual export or automation into `src/public/component-docs/<slug>.html`.
6. Update `src/content/docs/prompts/migration-map.md` with demo verification status.

## Sign-off Criteria
- No console errors during interaction testing.
- Demo metadata lists all required tokens, variants, and states.
- Accessibility announcements and focus orders match prompt expectations.
- Review checklist items (`review-checklist.md`) satisfied for corresponding component docs.
