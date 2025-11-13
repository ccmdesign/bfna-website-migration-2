<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: Component-First Pages; Layered Styling Discipline; Content as Source of Truth; Testable Delivery; Configuration & Observability
- Added sections: Delivery Standards; Workflow Expectations
- Removed sections: None
- Templates requiring updates: .specify/templates/plan-template.md ✅ updated; .specify/templates/spec-template.md ✅ updated; .specify/templates/tasks-template.md ✅ updated
- Follow-up TODOs: None
-->

# CCM Nuxt Boilerplate 2025 Constitution

## Core Principles

### Component-First Pages
- `src/pages/` files MUST limit themselves to Nuxt orchestration (`definePageMeta`, composable wiring, layout selection) and render UI through reusable `src/components/ccm*.vue` building blocks.
- Every new shared component MUST live under `src/components/` with a PascalCase `ccm` prefix, use `<script setup lang="ts">`, and expose typed props/emit contracts.
- Layout-wide chrome MUST reside in `layouts/` and remain free from feature-specific business logic.
*Rationale: Strict separation keeps route files maintainable and enables reuse across marketing surfaces.*

### Layered Styling Discipline
- Styling changes MUST flow through the existing `@layer` stack in `src/public/css/` (reset → defaults → utils → overrides); component-scoped PostCSS MUST defer to these tokens.
- New design tokens (colors, spacing, typography) MUST be declared in `src/public/css/vars/` and documented in the feature PR.
- Inline styles and ad-hoc global overrides are prohibited unless an incident hotfix is documented and scheduled for remediation within the next release.
*Rationale: Layer enforcement protects the design system and prevents regressions when CSS loads out of order.*

### Content as Source of Truth
- Copy, metadata, and structured data MUST originate from `content/` Markdown/JSON files (with front matter) or documented runtime config; components may not hard-code editable text.
- Data fetching logic MUST be encapsulated in composables under `composables/` or Pinia stores configured in `plugins/`, returning typed results and handling empty/error states.
- Any new slug or collection MUST include a migration note in the feature plan and a preview link verifying the rendered output.
*Rationale: Centralizing content keeps non-developers empowered and avoids divergence between copy and UI.*

### Testable Delivery
- Feature work MUST add or update Vitest specs in `tests/` mirroring the touched directories, targeting ≥80% coverage for new stores/composables and critical components.
- Prior to merge, `npm run build` and `npm run preview` MUST succeed, and PRs MUST note the verification date and any manual QA steps taken.
- Visual or behavioral changes MUST include before/after evidence (screenshots or Loom) unless interacting solely with server-side helpers.
*Rationale: Regressions are caught early when releases are gated by automated tests and documented validation.*

### Configuration & Observability
- Runtime configuration MUST be defined in `nuxt.config.ts` (`runtimeConfig`, `app.config`) with safe defaults; feature flags MUST be namespaced and documented.
- Secrets MUST enter via `.env` files ignored by git, with sanitized examples committed when new variables are introduced.
- Server routes and composables handling external services MUST log structured errors (e.g., `console.error` with context) to support debugging and analytics.
*Rationale: Predictable configuration and observability reduce outage time and keep integrations transparent.*

## Delivery Standards

- All new assets (images, fonts) MUST live under `public/` with responsive variants; remote assets require confirmed CDN availability.
- Introducing third-party libraries MUST include bundle diff evidence (`npm run build --analyze`) and fallback behavior if the dependency fails to load.
- Accessibility checks (keyboard navigation, focus order, color contrast) MUST be recorded for features touching interactive UI.
- Performance work MUST document impact metrics (e.g., Lighthouse LCP, bundle size) and associated measurement commands in the PR.

## Workflow Expectations

- Implementation plans MUST document the directories and content collections touched, referencing the relevant principles in the Constitution Check.
- Feature specs MUST outline how content editors will update copy and what automated tests guarantee stability.
- Task lists MUST group work by user story, call out required Vitest coverage, and ensure each story can ship independently.
- Pull requests MUST link to their plan/spec, summarize testing performed, highlight new env vars, and note any follow-up debt tickets.

## Governance

- This constitution supersedes conflicting guidance in other docs; maintainers MUST verify compliance during plan reviews and PR approvals.
- Amendments require a dedicated PR referencing impacted templates, at least two maintainer approvals, and documentation of migration steps; breaking removals trigger a MAJOR version bump, new principles/enforcements trigger MINOR, clarifications are PATCH.
- Every quarter, maintainers MUST audit a representative feature to confirm adherence to principles, logging findings in the repository notes.
- Any constitution change MUST update dependent templates (`plan-template.md`, `spec-template.md`, `tasks-template.md`) before merge.

**Version**: 1.0.0 | **Ratified**: 2025-10-20 | **Last Amended**: 2025-10-20
